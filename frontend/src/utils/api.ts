/**
 * API utility for making HTTP requests to the backend
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API methods
export const authAPI = {
  register: (data: { email: string; password: string; full_name: string; role?: string }) =>
    api.post('/api/auth/register', data),
  
  login: (data: { username: string; password: string }) =>
    api.post('/api/auth/login', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
};

export const productsAPI = {
  list: (params?: { category?: string; skip?: number; limit?: number }) =>
    api.get('/api/products', { params }),
  
  get: (id: string) => api.get(`/api/products/${id}`),
  
  create: (data: any) => api.post('/api/products', data),
  
  update: (id: string, data: any) => api.put(`/api/products/${id}`, data),
  
  delete: (id: string) => api.delete(`/api/products/${id}`),
};

export const ordersAPI = {
  list: (params?: { skip?: number; limit?: number }) =>
    api.get('/api/orders', { params }),
  
  get: (id: string) => api.get(`/api/orders/${id}`),
  
  create: (data: any) => api.post('/api/orders', data),
  
  update: (id: string, data: any) => api.put(`/api/orders/${id}`, data),
};

export const paymentsAPI = {
  create: (data: { order_id: string; amount: number; currency?: string }) =>
    api.post('/api/payments/create', data),
  
  verify: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => api.post('/api/payments/verify', data),
  
  getForOrder: (orderId: string) => api.get(`/api/payments/order/${orderId}`),
};

export default api;
