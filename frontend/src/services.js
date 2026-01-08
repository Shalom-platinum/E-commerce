import api from './api';
import axios from 'axios';

export const productAPI = {
  getProducts: (filters = {}) => 
    api.get('/products/products/', { params: filters }),
  
  getProductDetail: (id) => 
    api.get(`/products/products/${id}/`),
  
  getProductReviews: (productId) => 
    api.get(`/products/products/${productId}/reviews/`),
  
  addReview: (productId, data) => 
    api.post(`/products/products/${productId}/add_review/`, data),
  
  getCategories: () => 
    api.get('/products/categories/'),
  
  // Admin methods
  createProduct: (data) => {
    const config = {};
    // If FormData, let axios set the Content-Type header automatically
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    return api.post('/products/products/', data, config);
  },
  
  updateProduct: (id, data) => {
    const config = {};
    // If FormData, let axios set the Content-Type header automatically
    if (data instanceof FormData) {
      config.headers = { 'Content-Type': 'multipart/form-data' };
    }
    return api.put(`/products/products/${id}/`, data, config);
  },
  
  deleteProduct: (id) => 
    api.delete(`/products/products/${id}/`),
  
  createCategory: (data) => 
    api.post('/products/categories/', data),
  
  updateCategory: (id, data) => 
    api.put(`/products/categories/${id}/`, data),
  
  deleteCategory: (id) => 
    api.delete(`/products/categories/${id}/`),
};

export const cartAPI = {
  getCart: () => 
    api.get('/carts/'),
  
  addToCart: (productId, quantity = 1) => 
    api.post('/carts/add_item/', { product_id: productId, quantity }),
  
  removeFromCart: (productId) => 
    api.post('/carts/remove_item/', { product_id: productId }),
  
  clearCart: () => 
    api.post('/carts/clear/'),
};

export const orderAPI = {
  getOrders: () => 
    api.get('/orders/'),
  
  getOrderDetail: (id) => 
    api.get(`/orders/${id}/`),
  
  createOrderFromCart: (shippingAddress, billingAddress) => 
    api.post('/orders/create_from_cart/', { 
      shipping_address: shippingAddress, 
      billing_address: billingAddress 
    }),
  
  cancelOrder: (id) => 
    api.post(`/orders/${id}/cancel/`),
  
  // Admin methods
  getAdminOrders: () => 
    api.get('/orders/'),
  
  updateOrderStatus: (id, status) => 
    api.patch(`/orders/${id}/`, { status }),
};

export const userAPI = {
  register: (data) => 
    api.post('/accounts/users/register/', data),
  
  getProfile: () => 
    api.get('/accounts/users/me/'),
  
  updateProfile: (data) => 
    api.put('/accounts/users/update_profile/', data),
  
  getAddresses: () => 
    api.get('/accounts/addresses/'),
  
  createAddress: (data) => 
    api.post('/accounts/addresses/', data),
  
  updateAddress: (id, data) => 
    api.put(`/accounts/addresses/${id}/`, data),
  
  deleteAddress: (id) => 
    api.delete(`/accounts/addresses/${id}/`),
  
  login: (username, password) => 
    api.post('/accounts/users/login/', { username, password }),
  
  logout: () => 
    api.post('/accounts/users/logout/'),
  
  // Admin methods
  getAdminUsers: () => 
    api.get('/accounts/users/'),
  
  updateUserRole: (id, data) => 
    api.patch(`/accounts/users/${id}/`, data),
};

export const recommendationAPI = {
  getProductRecommendations: (productId, n = 5) => 
    //axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/product/${productId}?n=${n}`),
    api.get(`/ml/recommendations/product/${productId}?n=${n}`),
  
  getUserRecommendations: (userId, n = 5) => 
    //axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/user/${userId}?n=${n}`),
    api.get(`/ml/recommendations/user/${userId}?n=${n}`),
  
  getPopularProducts: (n = 5) => 
    //axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/popular?n=${n}`),
    api.get(`/ml/recommendations/popular?n=${n}`),
};

// Admin APIs for payment management and analytics
export const adminAPI = {
  // Payment Dashboard
  getDashboardStats: () => 
    api.get('/orders/admin/dashboard/stats/'),
  
  // Pending Orders
  getPendingOrders: (page = 1, pageSize = 20, status = null) => {
    const params = { page, page_size: pageSize };
    if (status) params.status = status;
    return api.get('/orders/admin/pending/', { params });
  },
  
  // Order Details with full payment history
  getOrderDetails: (orderId) => 
    api.get(`/orders/admin/order/${orderId}/`),
  
  // Payment Analytics
  getPaymentAnalytics: () => 
    api.get('/orders/admin/analytics/'),
  
  // Update Order Payment Status
  updatePaymentStatus: (orderId, paymentStatus) => 
    api.post(`/orders/${orderId}/update_payment_status/`, { 
      payment_status: paymentStatus 
    }),
};

// Interaction Tracking API
export const trackingAPI = {
  // Track view - calls product detail endpoint
  trackView: (productId) => {
    return productAPI.getProductDetail(productId)
      .catch(error => {
        console.warn('Failed to retrieve product:', error);
        return Promise.resolve();
      });
  },
  
  // Track rating (already in product API but explicitly available)
  trackRating: (productId, rating, comment = '') => 
    api.post(`/products/${productId}/add_review/`, { rating, comment }),
  
  // Get interaction data (admin endpoint)
  getInteractionStats: () => 
    api.get('/products/interaction_stats/'),
};
