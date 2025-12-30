import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import ProductRecommender
import logging
from threading import Thread
from apscheduler.schedulers.background import BackgroundScheduler
import redis

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Redis for caching
try:
    redis_host = os.getenv('REDIS_HOST', 'localhost')
    redis_port = int(os.getenv('REDIS_PORT', 6379))
    redis_db = int(os.getenv('REDIS_DB', 0))
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        db=redis_db,
        decode_responses=True,
        socket_connect_timeout=5,
        socket_keepalive=True
    )
    # Test connection
    redis_client.ping()
    logger.info(f"Connected to Redis at {redis_host}:{redis_port}")
    REDIS_AVAILABLE = True
except Exception as e:
    logger.warning(f"Redis not available: {e}. Caching disabled.")
    redis_client = None
    REDIS_AVAILABLE = False

# Initialize recommender with backend URL from environment
backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
recommender = ProductRecommender(backend_url=backend_url)

# Initialize background scheduler for periodic retraining
scheduler = BackgroundScheduler()
scheduler_started = False

# Cache configuration
CACHE_TTL = 3600  # 1 hour
POPULAR_CACHE_TTL = 1800  # 30 minutes
USER_CACHE_TTL = 600  # 10 minutes


def get_cache(key):
    """Get value from Redis cache"""
    if not REDIS_AVAILABLE or redis_client is None:
        return None
    try:
        return redis_client.get(key)
    except Exception as e:
        logger.warning(f"Cache get error: {e}")
        return None


def set_cache(key, value, ttl=CACHE_TTL):
    """Set value in Redis cache with TTL"""
    if not REDIS_AVAILABLE or redis_client is None:
        return
    try:
        redis_client.setex(key, ttl, value)
    except Exception as e:
        logger.warning(f"Cache set error: {e}")


def clear_cache_pattern(pattern):
    """Clear cache keys matching pattern"""
    if not REDIS_AVAILABLE or redis_client is None:
        return
    try:
        keys = redis_client.keys(pattern)
        if keys:
            redis_client.delete(*keys)
            logger.info(f"Cleared {len(keys)} cache entries matching {pattern}")
    except Exception as e:
        logger.warning(f"Cache clear error: {e}")


def scheduled_retrain():
    """Run model retraining periodically"""
    logger.info("Starting scheduled model retraining...")
    success = recommender.retrain_model(days=30)
    if success:
        logger.info("Scheduled retraining completed successfully")
        # Clear all recommendation caches when model is retrained
        clear_cache_pattern("rec:product:*")
        clear_cache_pattern("rec:user:*")
        clear_cache_pattern("rec:popular:*")
    else:
        logger.error("Scheduled retraining failed")


def start_scheduler():
    """Start background scheduler for periodic retraining"""
    global scheduler_started
    if not scheduler_started and not scheduler.running:
        # Retrain daily at 2 AM
        scheduler.add_job(
            func=scheduled_retrain,
            trigger='cron',
            hour=2,
            minute=0,
            id='daily_retrain',
            name='Daily model retraining'
        )
        scheduler.start()
        scheduler_started = True
        logger.info("Background scheduler started for daily model retraining")


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    # Start scheduler on first request if not already started
    start_scheduler()
    model_info = recommender.get_model_info()
    
    return jsonify({
        'status': 'healthy',
        'service': 'ml-recommender',
        'model': model_info,
        'cache': {
            'enabled': REDIS_AVAILABLE,
            'host': os.getenv('REDIS_HOST', 'localhost'),
            'port': os.getenv('REDIS_PORT', '6379')
        }
    }), 200


@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get current model information"""
    info = recommender.get_model_info()
    return jsonify(info), 200


@app.route('/api/recommendations/product/<int:product_id>', methods=['GET'])
def get_product_recommendations(product_id):
    """Get recommendations based on product similarity with caching"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)
        gender = request.args.get('gender', None)
        size = request.args.get('size', None)

        # Create cache key
        cache_key = f"rec:product:{product_id}:n{n_recommendations}"
        if gender:
            cache_key += f":g{gender}"
        if size:
            cache_key += f":s{size}"

        # Check cache first
        cached_result = get_cache(cache_key)
        if cached_result:
            logger.info(f"Cache hit for product {product_id} recommendations")
            return json.loads(cached_result), 200

        # Not in cache, compute recommendations
        user_preferences = {}
        if gender:
            user_preferences['gender'] = gender
        if size:
            user_preferences['size'] = size

        recommendations = recommender.get_recommendations(
            product_id=product_id,
            user_preferences=user_preferences,
            n_recommendations=n_recommendations
        )

        result = {
            'product_id': product_id,
            'recommendations': recommendations,
            'count': len(recommendations),
            'cached': False
        }

        # Store in cache
        set_cache(cache_key, json.dumps(result), CACHE_TTL)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/user/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    """Get personalized recommendations for a user with caching"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)

        # Create cache key
        cache_key = f"rec:user:{user_id}:n{n_recommendations}"

        # Check cache first
        cached_result = get_cache(cache_key)
        if cached_result:
            logger.info(f"Cache hit for user {user_id} recommendations")
            return json.loads(cached_result), 200

        # Not in cache, compute recommendations
        recommendations = recommender.get_personalized_recommendations(
            user_id=user_id,
            n_recommendations=n_recommendations
        )

        result = {
            'user_id': user_id,
            'recommendations': recommendations,
            'count': len(recommendations),
            'cached': False
        }

        # Store in cache with shorter TTL for user-specific data
        set_cache(cache_key, json.dumps(result), USER_CACHE_TTL)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/popular', methods=['GET'])
def get_popular_products():
    """Get highest-rated products with caching"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)

        # Create cache key
        cache_key = f"rec:popular:n{n_recommendations}"

        # Check cache first
        cached_result = get_cache(cache_key)
        if cached_result:
            logger.info(f"Cache hit for popular products")
            return json.loads(cached_result), 200

        # Get top products by rating
        if recommender.model is None:
            return jsonify({'error': 'Model not trained'}), 503

        product_col = 'id' if 'id' in recommender.model['products'].columns else 'product_id'
        top_products = recommender.model['products'].nlargest(n_recommendations, 'avg_rating')
        popular = top_products[[product_col, 'name', 'category', 'price', 'avg_rating']].to_dict('records')

        result = {
            'recommendations': popular,
            'count': len(popular),
            'cached': False
        }

        # Store in cache with shorter TTL for popular products
        set_cache(cache_key, json.dumps(result), POPULAR_CACHE_TTL)

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Error getting popular products: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear all recommendation caches (admin endpoint)"""
    try:
        clear_cache_pattern("rec:*")
        return jsonify({
            'message': 'Cache cleared successfully',
            'patterns': ['rec:*']
        }), 200
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    if not REDIS_AVAILABLE or redis_client is None:
        return jsonify({'cache_enabled': False}), 200

    try:
        info = redis_client.info()
        keys = redis_client.keys("rec:*")
        return jsonify({
            'cache_enabled': True,
            'used_memory': f"{info.get('used_memory_human', 'N/A')}",
            'total_keys': len(keys),
            'recommendation_cache_keys': len(keys),
            'connected': True
        }), 200
    except Exception as e:
        return jsonify({
            'cache_enabled': False,
            'error': str(e),
            'connected': False
        }), 200


@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """
    Manually trigger model retraining with data from backend database.
    
    Query params:
    - days: Number of days of recent data to use (default: 90)
    
    Returns: 202 Accepted (runs asynchronously)
    """
    try:
        days = request.args.get('days', 90, type=int)
        logger.info(f"Retraining model with {days} days of data from backend...")

        # Run retraining in background thread
        thread = Thread(target=recommender.retrain_model, args=(days,))
        thread.daemon = True
        thread.start()

        return jsonify({
            'message': 'Model retraining initiated',
            'days': days,
            'status': 'in_progress'
        }), 202

    except Exception as e:
        logger.error(f"Error initiating model retraining: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=False)