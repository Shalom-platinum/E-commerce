import api from './api';

export const productAPI = {
  getProducts: (filters = {}) => 
    api.get('/products/', { params: filters }),
  
  getProductDetail: (id) => 
    api.get(`/products/${id}/`),
  
  getProductReviews: (productId) => 
    api.get(`/products/${productId}/reviews/`),
  
  addReview: (productId, data) => 
    api.post(`/products/${productId}/add_review/`, data),
  
  getCategories: () => 
    api.get('/products/categories/'),
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
};

export const recommendationAPI = {
  getProductRecommendations: (productId, n = 5) => 
    axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/product/${productId}?n=${n}`),
  
  getUserRecommendations: (userId, n = 5) => 
    axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/user/${userId}?n=${n}`),
  
  getPopularProducts: (n = 5) => 
    axios.get(`${process.env.REACT_APP_ML_URL || 'http://localhost:8001'}/api/recommendations/popular?n=${n}`),
};
