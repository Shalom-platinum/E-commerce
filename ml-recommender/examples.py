"""
Example: Using the ML Recommender with Real Database Data

This script demonstrates how to:
1. Initialize the recommender to fetch real data from your Django backend
2. Train the model on actual product and interaction data
3. Get recommendations for products and users
4. Trigger retraining manually
"""

from recommender import ProductRecommender
import requests
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def example_1_basic_initialization():
    """Example 1: Initialize recommender with backend URL"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Initialize Recommender with Backend URL")
    print("="*60)
    
    # Initialize recommender pointing to your Django backend
    recommender = ProductRecommender(
        model_path='models/recommender_model.pkl',
        backend_url='http://localhost:8000'  # Update with your backend URL
    )
    
    # On first run, it will:
    # 1. Try to fetch data from /api/products/training_data/
    # 2. If that fails, fall back to dummy data
    # 3. Train the model
    # 4. Save to disk
    
    info = recommender.get_model_info()
    print(f"\nModel Status: {info}")


def example_2_product_recommendations():
    """Example 2: Get recommendations for a specific product"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Product-Based Recommendations")
    print("="*60)
    
    recommender = ProductRecommender(backend_url='http://localhost:8000')
    
    # Get 5 products similar to product #1
    product_id = 1
    recommendations = recommender.get_recommendations(
        product_id=product_id,
        n_recommendations=5
    )
    
    print(f"\nUsers who viewed product {product_id} might also like:")
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec['name']} - ${rec['price']:.2f} (similarity: {rec['similarity_score']:.3f})")


def example_3_personalized_recommendations():
    """Example 3: Get personalized recommendations for a user"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Personalized User Recommendations")
    print("="*60)
    
    recommender = ProductRecommender(backend_url='http://localhost:8000')
    
    # Get 5 products recommended for user #5 based on their history
    user_id = 5
    recommendations = recommender.get_personalized_recommendations(
        user_id=user_id,
        n_recommendations=5
    )
    
    print(f"\nPersonalized recommendations for user {user_id}:")
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec['name']} - ${rec['price']:.2f}")


def example_4_filtered_recommendations():
    """Example 4: Get recommendations with user preferences"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Recommendations with User Preferences")
    print("="*60)
    
    recommender = ProductRecommender(backend_url='http://localhost:8000')
    
    # Get recommendations for women's clothing in black color
    product_id = 3
    user_preferences = {
        'gender': 'W',
        'color': 'Black'
    }
    
    recommendations = recommender.get_recommendations(
        product_id=product_id,
        user_preferences=user_preferences,
        n_recommendations=5
    )
    
    print(f"\nRecommendations similar to product {product_id} (filtered for women's black items):")
    for i, rec in enumerate(recommendations, 1):
        print(f"  {i}. {rec['name']} - ${rec['price']:.2f}")


def example_5_manual_retraining():
    """Example 5: Manually trigger model retraining"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Manual Model Retraining")
    print("="*60)
    
    recommender = ProductRecommender(backend_url='http://localhost:8000')
    
    # Retrain model with last 30 days of data
    logger.info("Starting manual retraining...")
    success = recommender.retrain_model(days=30)
    
    if success:
        print("✓ Model retraining completed successfully!")
        info = recommender.get_model_info()
        print(f"  Updated model: {info}")
    else:
        print("✗ Model retraining failed - check logs")


def example_6_via_api():
    """Example 6: Trigger retraining via API"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Trigger Retraining via HTTP API")
    print("="*60)
    
    # Your ML service should be running on port 8001
    ml_service_url = 'http://localhost:8001'
    
    try:
        # Trigger retraining (runs asynchronously)
        response = requests.post(f'{ml_service_url}/api/retrain?days=30')
        
        if response.status_code == 202:
            print("✓ Retraining initiated successfully!")
            print(f"  Response: {response.json()}")
        else:
            print(f"✗ Failed with status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to ML service at", ml_service_url)
        print("  Make sure the ML recommender is running!")


def example_7_check_model_info():
    """Example 7: Check model information via API"""
    print("\n" + "="*60)
    print("EXAMPLE 7: Check Model Information via API")
    print("="*60)
    
    ml_service_url = 'http://localhost:8001'
    
    try:
        response = requests.get(f'{ml_service_url}/api/model/info')
        info = response.json()
        
        print(f"\nModel Information:")
        print(f"  Status: {info['status']}")
        print(f"  Products: {info.get('num_products', 'N/A')}")
        print(f"  Features: {info.get('num_features', 'N/A')}")
        print(f"  Model Path: {info.get('model_path', 'N/A')}")
        
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to ML service")


def example_8_understand_data_flow():
    """Example 8: Understand the data flow"""
    print("\n" + "="*60)
    print("EXAMPLE 8: Understanding the Data Flow")
    print("="*60)
    
    print("""
DATA FLOW:
═══════════════════════════════════════════════════════════════

1. USER INTERACTIONS (Django Backend Database)
   ├─ ProductInteraction: Views, ratings, cart additions
   ├─ ProductReview: 5-star ratings with comments
   ├─ OrderItem: Purchase history
   └─ Product: Catalog with prices, sizes, colors, etc.

2. EXPORT ENDPOINT (Django)
   GET /api/products/training_data/?days=90
   └─ Returns JSON with products + interactions from last 90 days

3. ML RECOMMENDER SERVICE
   ├─ fetch_data_from_database(): Calls the export endpoint
   ├─ train_model(): Processes data for training
   │  ├─ TF-IDF vectorization on text features
   │  ├─ Z-score normalization on price/rating
   │  └─ Weighted combination (70% text, 20% price, 10% rating)
   └─ save_model(): Persists to disk

4. SERVING RECOMMENDATIONS
   ├─ GET /api/recommendations/product/<id>: Similar products
   ├─ GET /api/recommendations/user/<id>: Personalized
   └─ GET /api/recommendations/popular: Top-rated

5. CONTINUOUS IMPROVEMENT
   ├─ Automatic daily retraining at 2 AM
   └─ Manual retraining via POST /api/retrain
   
BONUS: All user interactions are logged, so model learns
       from real user behavior over time!
═══════════════════════════════════════════════════════════════
    """)


if __name__ == '__main__':
    print("\n" + "█"*60)
    print("█  ML RECOMMENDER - REAL DATA TRAINING EXAMPLES")
    print("█"*60)
    
    # Run examples
    try:
        example_1_basic_initialization()
    except Exception as e:
        logger.error(f"Example 1 failed: {e}")
    
    try:
        example_2_product_recommendations()
    except Exception as e:
        logger.error(f"Example 2 failed: {e}")
    
    try:
        example_3_personalized_recommendations()
    except Exception as e:
        logger.error(f"Example 3 failed: {e}")
    
    try:
        example_4_filtered_recommendations()
    except Exception as e:
        logger.error(f"Example 4 failed: {e}")
    
    try:
        example_5_manual_retraining()
    except Exception as e:
        logger.error(f"Example 5 failed: {e}")
    
    try:
        example_6_via_api()
    except Exception as e:
        logger.error(f"Example 6 failed: {e}")
    
    try:
        example_7_check_model_info()
    except Exception as e:
        logger.error(f"Example 7 failed: {e}")
    
    example_8_understand_data_flow()
    
    print("\n" + "█"*60)
    print("█  Examples complete! Check logs above for results")
    print("█"*60 + "\n")
