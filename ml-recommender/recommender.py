import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import joblib
from datetime import datetime
import requests
from typing import Optional, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ProductRecommender:
    def __init__(self, model_path='models/recommender_model.pkl', backend_url='http://localhost:8000'):
        """
        Initialize the recommender.
        
        Args:
            model_path: Path to save/load trained model
            backend_url: Django backend API URL for fetching training data
        """
        self.model_path = model_path
        self.backend_url = backend_url
        self.products_data = None
        self.user_interactions = None
        self.tfidf_vectorizer = None
        self.product_features_matrix = None
        self.model = None
        self.load_or_train()

    def load_or_train(self):
        """Load existing model or train from database"""
        if os.path.exists(self.model_path):
            self.load_model()
        else:
            os.makedirs('models', exist_ok=True)
            try:
                self.fetch_data_from_database()
                self.train_model()
                self.save_model()
                logger.info("Model trained successfully from database")
            except Exception as e:
                logger.warning(f"Could not fetch from database ({e}), using dummy data instead")
                self.generate_dummy_data()
                self.train_model()
                self.save_model()

    def fetch_data_from_database(self, days=90):
        """
        Fetch training data from Django backend API.
        
        The backend should expose: GET /api/products/training_data/?days=90
        Returns JSON with products and interactions for training.
        """
        try:
            response = requests.get(
                f"{self.backend_url}/api/products/training_data/",
                params={'days': days, 'format': 'json'},
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Fetched {len(data['products'])} products and {len(data['interactions'])} interactions")
            
            # Convert products to DataFrame
            self.products_data = pd.DataFrame(data['products'])
            
            # Handle missing ratings
            self.products_data['avg_rating'] = self.products_data.get(
                'avg_rating', 
                3.5
            ).fillna(3.5)
            
            # Rename category column if needed
            if 'category__name' in self.products_data.columns:
                self.products_data.rename(columns={'category__name': 'category'}, inplace=True)
            
            # Convert interactions to DataFrame
            self.user_interactions = pd.DataFrame(data['interactions'])
            
            logger.info(f"Successfully loaded {len(self.products_data)} products from database")
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch from backend: {e}")
            raise

    def generate_dummy_data(self):
        """Generate dummy training data (fallback if database unavailable)"""
        logger.info("Generating dummy training data...")
        np.random.seed(42)

        categories = ['T-Shirts', 'Jeans', 'Jackets', 'Shoes', 'Dresses', 'Sweaters']
        genders = ['M', 'W', 'U']
        colors = ['Black', 'Blue', 'Red', 'White', 'Green', 'Navy']
        materials = ['Cotton', 'Polyester', 'Denim', 'Wool', 'Silk', 'Linen']
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

        products = []
        for i in range(1, 101):
            products.append({
                'id': i,
                'name': f"Product {i}",
                'description': f"A nice {np.random.choice(categories).lower()} item",
                'category': np.random.choice(categories),
                'gender': np.random.choice(genders),
                'color': np.random.choice(colors),
                'material': np.random.choice(materials),
                'size': np.random.choice(sizes),
                'price': round(np.random.uniform(20, 200), 2),
                'avg_rating': round(np.random.uniform(3.0, 5.0), 1),
                'stock': np.random.randint(0, 100),
            })

        self.products_data = pd.DataFrame(products)

        interactions = []
        num_users = 200
        for user_id in range(1, num_users + 1):
            num_interactions = np.random.randint(2, 16)
            product_ids = np.random.choice(self.products_data['id'].values, num_interactions, replace=False)

            for product_id in product_ids:
                interactions.append({
                    'user_id': user_id,
                    'product_id': product_id,
                    'interaction_type': np.random.choice(['view', 'add_to_cart', 'purchase'], p=[0.5, 0.2, 0.3]),
                    'rating': np.random.randint(1, 6) if np.random.random() > 0.7 else None,
                    'created_at': datetime.now(),
                })

        self.user_interactions = pd.DataFrame(interactions)
        logger.info(f"Generated {len(self.products_data)} dummy products and {len(interactions)} interactions")

    def train_model(self):
        """Train the recommender model on product features"""
        if self.products_data is None:
            self.generate_dummy_data()

        feature_text = []
        for idx, row in self.products_data.iterrows():
            text_parts = [
                str(row.get('category', '')),
                str(row.get('gender', '')),
                str(row.get('color', '')),
                str(row.get('material', '')),
                str(row.get('size', '')),
            ]
            text = ' '.join([p for p in text_parts if p])
            feature_text.append(text if text else 'generic product')

        self.tfidf_vectorizer = TfidfVectorizer(max_features=50, stop_words='english')
        self.product_features_matrix = self.tfidf_vectorizer.fit_transform(feature_text)

        price_values = self.products_data['price'].values
        price_normalized = (price_values - np.mean(price_values)) / (np.std(price_values) + 1e-8)
        rating_normalized = self.products_data['avg_rating'].values / 5.0

        self.model = {
            'products': self.products_data.copy(),
            'tfidf_matrix': self.product_features_matrix,
            'price_normalized': price_normalized,
            'rating_normalized': rating_normalized,
            'vectorizer': self.tfidf_vectorizer,
        }
        
        logger.info(f"Model trained with {len(self.model['products'])} products")

    def get_recommendations(self, product_id: int, user_preferences: Optional[Dict] = None, n_recommendations: int = 5) -> List[Dict]:
        """Get product recommendations based on content similarity"""
        if self.model is None:
            logger.warning("Model not trained yet")
            return []

        product_col = 'id' if 'id' in self.model['products'].columns else 'product_id'
        matching_products = self.model['products'][self.model['products'][product_col] == product_id]
        
        if matching_products.empty:
            logger.warning(f"Product {product_id} not found in database")
            return []

        idx = matching_products.index[0]

        similarity_scores = cosine_similarity(
            self.model['tfidf_matrix'][idx], 
            self.model['tfidf_matrix']
        ).flatten()

        price_similarity = 1 - np.abs(
            self.model['price_normalized'] - self.model['price_normalized'][idx]
        ) / 2
        price_similarity = np.clip(price_similarity, 0, 1)
        
        rating_boost = self.model['rating_normalized'] * 0.2

        combined_scores = similarity_scores * 0.7 + price_similarity * 0.2 + rating_boost

        if user_preferences:
            for key, value in user_preferences.items():
                if key in self.model['products'].columns:
                    match_mask = (self.model['products'][key] == value).values
                    combined_scores = combined_scores * (1 + match_mask * 0.3)

        top_indices = np.argsort(combined_scores)[::-1]
        recommendations = []
        
        for idx in top_indices:
            prod_id = int(self.model['products'].iloc[idx][product_col])
            if prod_id != product_id and len(recommendations) < n_recommendations:
                recommendations.append({
                    'product_id': prod_id,
                    'name': str(self.model['products'].iloc[idx].get('name', f'Product {prod_id}')),
                    'category': str(self.model['products'].iloc[idx].get('category', 'Unknown')),
                    'gender': str(self.model['products'].iloc[idx].get('gender', 'U')),
                    'color': str(self.model['products'].iloc[idx].get('color', 'Unknown')),
                    'price': float(self.model['products'].iloc[idx]['price']),
                    'rating': float(self.model['products'].iloc[idx].get('avg_rating', 3.5)),
                    'similarity_score': float(combined_scores[idx]),
                })

        return recommendations

    def get_personalized_recommendations(self, user_id: int, n_recommendations: int = 5) -> List[Dict]:
        """Get personalized recommendations based on user history"""
        if self.user_interactions is None or self.model is None:
            logger.warning("Model or interactions not loaded")
            return []

        user_history = self.user_interactions[self.user_interactions['user_id'] == user_id]
        
        if user_history.empty:
            logger.info(f"No history found for user {user_id}, returning popular products")
            product_col = 'id' if 'id' in self.model['products'].columns else 'product_id'
            popular = self.model['products'].nlargest(n_recommendations, 'avg_rating')
            return popular[[product_col, 'name', 'category', 'price', 'avg_rating']].to_dict('records')

        user_prefs = {}
        if 'gender' in self.model['products'].columns:
            gender_counts = user_history.merge(
                self.model['products'],
                left_on='product_id',
                right_on='id' if 'id' in self.model['products'].columns else 'product_id'
            )['gender'].value_counts()
            if not gender_counts.empty:
                user_prefs['gender'] = gender_counts.idxmax()

        recommendations = []
        for _, interaction in user_history.iterrows():
            product_id = int(interaction['product_id'])
            recs = self.get_recommendations(product_id, user_prefs, n_recommendations * 2)
            recommendations.extend(recs)

        seen_ids = set(user_history['product_id'].values)
        unique_recs = []
        for rec in sorted(recommendations, key=lambda x: x['similarity_score'], reverse=True):
            if rec['product_id'] not in seen_ids and len(unique_recs) < n_recommendations:
                unique_recs.append(rec)
                seen_ids.add(rec['product_id'])

        return unique_recs

    def retrain_model(self, days: int = 90) -> bool:
        """Retrain the model with fresh data from the backend database"""
        logger.info(f"Starting model retraining with {days} days of data...")
        try:
            self.fetch_data_from_database(days=days)
            self.train_model()
            self.save_model()
            logger.info("Model retraining completed successfully")
            return True
        except Exception as e:
            logger.error(f"Model retraining failed: {e}")
            return False

    def save_model(self):
        """Save trained model to disk"""
        if self.model is None:
            logger.warning("No model to save")
            return

        os.makedirs(os.path.dirname(self.model_path) or '.', exist_ok=True)
        joblib.dump(self.model, self.model_path)
        logger.info(f"Model saved to {self.model_path}")

    def load_model(self):
        """Load trained model from disk"""
        try:
            self.model = joblib.load(self.model_path)
            logger.info(f"Model loaded from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.model = None

    def get_model_info(self) -> Dict:
        """Get information about the current model"""
        if self.model is None:
            return {'status': 'not_trained'}

        return {
            'status': 'trained',
            'num_products': len(self.model['products']),
            'num_features': self.model['tfidf_matrix'].shape[1],
            'model_path': self.model_path,
        }
