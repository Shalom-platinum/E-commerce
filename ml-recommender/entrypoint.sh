#!/bin/bash
# Initialize models directory
mkdir -p models

# Train initial model if it doesn't exist
python -c "from recommender import ProductRecommender; ProductRecommender()"

# Start Flask app with Gunicorn
gunicorn --bind 0.0.0.0:8001 --workers 2 --timeout 120 app:app
