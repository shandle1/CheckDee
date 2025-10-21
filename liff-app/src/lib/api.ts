import axios from 'axios';
import { getAccessToken } from './liff';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add LIFF access token
api.interceptors.request.use(
  (config) => {
    const liffToken = getAccessToken();
    if (liffToken) {
      config.headers.Authorization = `Bearer ${liffToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed, please login again');
    }
    return Promise.reject(error);
  }
);

export default api;
