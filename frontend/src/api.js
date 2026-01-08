import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
