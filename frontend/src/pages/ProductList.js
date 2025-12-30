import React, { useState, useEffect } from 'react';
import { productAPI, trackingAPI, recommendationAPI } from '../services';

export default function ProductList({ selectedProduct, onSelectProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [internalSelectedProduct, setInternalSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchPopularProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getProducts();
      // Handle both paginated and direct array responses
      const data = response.data.results || response.data;
      setProducts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      // Handle both paginated and direct array responses
      const data = response.data.results || response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const fetchPopularProducts = async () => {
    try {
      setLoadingRecs(true);
      const response = await recommendationAPI.getPopularProducts(5);
      // Handle both paginated and direct array responses
      const data = response.data.recommendations || response.data.results || response.data;
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load popular products:', err);
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleProductClick = (product) => {
    // Track view when product is clicked
    trackingAPI.trackView(product.id).catch(err => {
      // Silently fail if tracking endpoint doesn't exist
      console.warn('Failed to track view:', err);
    });
    setInternalSelectedProduct(product);
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category?.id === selectedCategory);

  if (internalSelectedProduct) {
    return <ProductDetail product={internalSelectedProduct} onBack={() => setInternalSelectedProduct(null)} />;
  }

  return (
    <div className="product-list-container">
      <div className="product-list-header">
        <h2>Our Products</h2>
        <p>Browse our collection and discover personalized recommendations</p>
      </div>

      {/* Popular/Recommended Products Section */}
      {!loadingRecs && recommendations.length > 0 && (
        <section className="recommendations-section">
          <h3>⭐ Popular Products</h3>
          <div className="products-grid">
            {recommendations.map(product => (
              <div key={product.id} className="product-card featured">
                <div className="product-image">
                  {product.image && <img src={product.image} alt={product.name} />}
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-category">{product.category?.name || 'N/A'}</p>
                  <p className="product-price">${product.price}</p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleProductClick(product)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Category Filter */}
      <div className="filter-section">
        <h3>Filter by Category</h3>
        <div className="category-buttons">
          <button 
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Products
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <h3>{selectedCategory === 'all' ? 'All Products' : selectedCategory}</h3>
        
        {loading && <p className="loading-text">Loading products...</p>}
        {error && <p className="error-text">{error}</p>}
        
        {!loading && filteredProducts.length > 0 && (
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image && <img src={product.image} alt={product.name} />}
                </div>
                <div className="product-info">
                  <h4>{product.name}</h4>
                  <p className="product-category">{product.category?.name || 'N/A'}</p>
                  <p className="product-description">{product.description?.substring(0, 60)}...</p>
                  <div className="product-rating">
                    ⭐ {product.average_rating || 'No ratings'}
                  </div>
                  <p className="product-price">${product.price}</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleProductClick(product)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <p className="no-products">No products found in this category.</p>
        )}
      </div>
    </div>
  );
}

// Product Detail Component
function ProductDetail({ product, onBack }) {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
    fetchRecommendations();
  }, [product.id]);

  const fetchReviews = async () => {
    try {
      const response = await productAPI.getProductReviews(product.id);
      setReviews(response.data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const response = await recommendationAPI.getProductRecommendations(product.id, 5);
      setRecommendations(response.data);
    } catch (err) {
      console.warn('Failed to load recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  const handleAddToCart = async () => {
    try {
      const { cartAPI } = await import('../services');
      await cartAPI.addToCart(product.id, quantity);
      alert('Added to cart!');
      setError(null);
    } catch (err) {
      setError('Failed to add to cart. Please try again.');
      console.error(err);
    }
  };

  const handleSubmitReview = async () => {
    if (!newReview.comment.trim()) {
      setError('Please add a comment');
      return;
    }

    try {
      setSubmittingReview(true);
      const { trackingAPI } = await import('../services');
      await trackingAPI.trackRating(product.id, newReview.rating, newReview.comment);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews();
      setError(null);
      alert('Review submitted successfully!');
    } catch (err) {
      setError('Failed to submit review');
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="product-detail-container">
      <button className="btn-back" onClick={onBack}>← Back to Products</button>

      <div className="product-detail-content">
        <div className="product-detail-image">
          {product.image && <img src={product.image} alt={product.name} />}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-category">{product.category?.name || 'N/A'}</p>
          <div className="product-rating">
            ⭐ Average Rating: {product.average_rating || 'No ratings yet'}
          </div>
          <p className="product-description">{product.description}</p>
          
          <div className="product-price-section">
            <p className="product-price">${product.price}</p>
            <p className="product-stock">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
          </div>

          <div className="quantity-selector">
            <label>Quantity:</label>
            <input 
              type="number" 
              min="1" 
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              disabled={product.stock === 0}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button 
            className="btn btn-primary btn-large"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            🛒 Add to Cart
          </button>
        </div>
      </div>

      {/* Recommended Products */}
      {!loadingRecs && recommendations.length > 0 && (
        <section className="recommendations-section">
          <h3>🎯 You might also like</h3>
          <div className="products-grid">
            {recommendations.map(rec => (
              <div key={rec.id} className="product-card">
                <div className="product-image">
                  {rec.image && <img src={rec.image} alt={rec.name} />}
                </div>
                <div className="product-info">
                  <h4>{rec.name}</h4>
                  <p className="product-price">${rec.price}</p>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => window.location.reload()}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="reviews-section">
        <h3>Customer Reviews</h3>

        <div className="new-review-form">
          <h4>Leave a Review</h4>
          <div className="form-group">
            <label>Rating:</label>
            <select 
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
            >
              <option value="1">⭐ 1 - Poor</option>
              <option value="2">⭐⭐ 2 - Fair</option>
              <option value="3">⭐⭐⭐ 3 - Good</option>
              <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
              <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
            </select>
          </div>

          <div className="form-group">
            <label>Comment:</label>
            <textarea 
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              placeholder="Share your experience with this product"
              rows="4"
            />
          </div>

          <button 
            className="btn btn-primary"
            onClick={handleSubmitReview}
            disabled={submittingReview}
          >
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>

        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.map((review, idx) => (
              <div key={idx} className="review-item">
                <div className="review-header">
                  <strong>{review.user || 'Anonymous'}</strong>
                  <span className="review-rating">⭐ {review.rating}</span>
                </div>
                <p>{review.comment}</p>
                <small>{new Date(review.created_at).toLocaleDateString()}</small>
              </div>
            ))
          ) : (
            <p>No reviews yet. Be the first to review!</p>
          )}
        </div>
      </section>
    </div>
  );
}
