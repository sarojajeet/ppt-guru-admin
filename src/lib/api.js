import axios from 'axios';

const api = axios.create({
  // baseURL: 'https://api.yourdashboard.com/v1',
  baseURL: 'http://localhost:5000/api',
});

// Request Interceptor: Attach tokens automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login or refresh token
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;