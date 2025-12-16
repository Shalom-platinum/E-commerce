import os
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import joblib
from datetime import datetime


class ProductRecommender:
    def __init__(self, model_path='models/recommender_model.pkl'):
        self.model_path = model_path
        self.products_data = None
        self.user_interactions = None
        self.tfidf_vectorizer = None
        self.product_features_matrix = None
        self.model = None
        self.load_or_train()

    def load_or_train(self):
        if os.path.exists(self.model_path):
            self.load_model()
        else:
            os.makedirs('models', exist_ok=True)
            self.generate_dummy_data()
            self.train_model()
            self.save_model()

    def generate_dummy_data(self):
        """Generate dummy training data"""
        np.random.seed(42)

        # Dummy products data
        categories = ['T-Shirts', 'Jeans', 'Jackets', 'Shoes', 'Dresses', 'Sweaters']
        genders = ['M', 'W', 'U']
        colors = ['Black', 'Blue', 'Red', 'White', 'Green', 'Navy']
        materials = ['Cotton', 'Polyester', 'Denim', 'Wool', 'Silk', 'Linen']
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

        products = []
        for i in range(1, 101):
            products.append({
                'product_id': i,
                'category': np.random.choice(categories),
                'gender': np.random.choice(genders),
                'color': np.random.choice(colors),
                'material': np.random.choice(materials),
                'size': np.random.choice(sizes),
                'price': round(np.random.uniform(20, 200), 2),
                'rating': round(np.random.uniform(3.0, 5.0), 1),
            })

        self.products_data = pd.DataFrame(products)

        # Dummy user interactions (purchases, views, ratings)
        interactions = []
        num_users = 200
        for user_id in range(1, num_users + 1):
            # Each user interacts with 2-15 products
            num_interactions = np.random.randint(2, 16)
            product_ids = np.random.choice(self.products_data['product_id'].values, num_interactions, replace=False)

            for product_id in product_ids:
                interactions.append({
                    'user_id': user_id,
                    'product_id': product_id,
                    'interaction_type': np.random.choice(['view', 'purchase', 'rate'], p=[0.5, 0.3, 0.2]),
                    'rating': np.random.randint(1, 6) if np.random.random() > 0.7 else None,
                    'timestamp': datetime.now(),
                })

        self.user_interactions = pd.DataFrame(interactions)

    def train_model(self):
        """Train the recommender model"""
        if self.products_data is None:
            self.generate_dummy_data()

        # Create feature vector from product attributes
        feature_text = []
        for idx, row in self.products_data.iterrows():
            text = f"{row['category']} {row['gender']} {row['color']} {row['material']} {row['size']}"
            feature_text.append(text)

        # TF-IDF vectorization
        self.tfidf_vectorizer = TfidfVectorizer(max_features=50)
        self.product_features_matrix = self.tfidf_vectorizer.fit_transform(feature_text)

        # Additional features: price and rating
        price_normalized = (self.products_data['price'].values - self.products_data['price'].mean()) / self.products_data['price'].std()
        rating_normalized = self.products_data['rating'].values / 5.0

        # Combine features
        self.model = {
            'products': self.products_data.copy(),
            'tfidf_matrix': self.product_features_matrix,
            'price_normalized': price_normalized,
            'rating_normalized': rating_normalized,
            'vectorizer': self.tfidf_vectorizer,
        }

    def get_recommendations(self, product_id, user_preferences=None, n_recommendations=5):
        """Get product recommendations based on content similarity and user preferences"""
        if self.model is None:
            return []

        if product_id not in self.model['products']['product_id'].values:
            return []

        idx = self.model['products'][self.model['products']['product_id'] == product_id].index[0]

        # Content-based similarity
        similarity_scores = cosine_similarity(
            self.model['tfidf_matrix'][idx], 
            self.model['tfidf_matrix']
        ).flatten()

        # Adjust similarity based on price proximity and rating
        price_similarity = 1 - np.abs(
            self.model['price_normalized'] - self.model['price_normalized'][idx]
        ) / 2
        rating_boost = self.model['rating_normalized'] * 0.2

        combined_scores = similarity_scores * 0.7 + price_similarity * 0.2 + rating_boost

        # Apply user preferences if provided
        if user_preferences:
            for key, value in user_preferences.items():
                if key in self.model['products'].columns:
                    match_mask = self.model['products'][key] == value
                    combined_scores = combined_scores * (1 + match_mask * 0.3)

        # Get top recommendations (excluding the input product)
        top_indices = np.argsort(combined_scores)[::-1]
        recommendations = []
        for idx in top_indices:
            if self.model['products'].iloc[idx]['product_id'] != product_id and len(recommendations) < n_recommendations:
                recommendations.append({
                    'product_id': int(self.model['products'].iloc[idx]['product_id']),
                    'category': self.model['products'].iloc[idx]['category'],
                    'gender': self.model['products'].iloc[idx]['gender'],
                    'color': self.model['products'].iloc[idx]['color'],
                    'similarity_score': float(combined_scores[idx]),
                })

        return recommendations

    def get_personalized_recommendations(self, user_id, n_recommendations=5):
        """Get personalized recommendations based on user history"""
        user_history = self.user_interactions[self.user_interactions['user_id'] == user_id]

        if len(user_history) == 0:
            # Return popular products if user has no history
            return self._get_popular_products(n_recommendations)

        # Get products user has interacted with
        interacted_products = user_history['product_id'].unique()

        # Collect recommendations from similar products
        all_recommendations = {}
        for product_id in interacted_products[:5]:  # Limit to first 5 for efficiency
            recs = self.get_recommendations(product_id, n_recommendations=3)
            for rec in recs:
                if rec['product_id'] not in all_recommendations and rec['product_id'] not in interacted_products:
                    all_recommendations[rec['product_id']] = rec['similarity_score']

        # Sort and return top recommendations
        sorted_recs = sorted(all_recommendations.items(), key=lambda x: x[1], reverse=True)
        recommendations = []
        for product_id, score in sorted_recs[:n_recommendations]:
            product = self.model['products'][self.model['products']['product_id'] == product_id].iloc[0]
            recommendations.append({
                'product_id': int(product_id),
                'category': product['category'],
                'gender': product['gender'],
                'color': product['color'],
                'similarity_score': float(score),
            })

        return recommendations

    def _get_popular_products(self, n=5):
        """Get most popular products"""
        top_products = self.model['products'].nlargest(n, 'rating')
        return top_products[['product_id', 'category', 'gender', 'color']].to_dict('records')

    def save_model(self):
        """Save model to disk"""
        joblib.dump(self.model, self.model_path)

    def load_model(self):
        """Load model from disk"""
        self.model = joblib.load(self.model_path)

    def retrain_with_new_data(self, products_df, interactions_df):
        """Retrain model with new data"""
        self.products_data = products_df
        self.user_interactions = interactions_df
        self.train_model()
        self.save_model()
