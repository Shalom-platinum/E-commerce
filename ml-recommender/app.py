import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from recommender import ProductRecommender
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize recommender
recommender = ProductRecommender()


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'ml-recommender'}), 200


@app.route('/api/recommendations/product/<int:product_id>', methods=['GET'])
def get_product_recommendations(product_id):
    """Get recommendations based on product similarity"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)
        gender = request.args.get('gender', None)
        size = request.args.get('size', None)

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

        return jsonify({
            'product_id': product_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        }), 200

    except Exception as e:
        logger.error(f"Error getting recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/user/<int:user_id>', methods=['GET'])
def get_user_recommendations(user_id):
    """Get personalized recommendations for a user"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)

        recommendations = recommender.get_personalized_recommendations(
            user_id=user_id,
            n_recommendations=n_recommendations
        )

        return jsonify({
            'user_id': user_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        }), 200

    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/recommendations/popular', methods=['GET'])
def get_popular_products():
    """Get popular products"""
    try:
        n_recommendations = request.args.get('n', 5, type=int)
        popular = recommender._get_popular_products(n=n_recommendations)
        return jsonify({
            'recommendations': popular,
            'count': len(popular)
        }), 200

    except Exception as e:
        logger.error(f"Error getting popular products: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """Retrain model with new data from backend"""
    try:
        data = request.json
        logger.info("Retraining model with new data...")
        # In production, this would receive actual data from the backend
        logger.info("Model retraining initiated")
        return jsonify({'message': 'Model retraining initiated'}), 202

    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=False)
