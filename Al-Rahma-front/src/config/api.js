// src/config/api.js
import axios from 'axios';

const getApiBaseUrl = () => {
  // Use environment variable if set
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Auto-detect in production
  if (window.location.hostname.includes('onrender.com')) {
    return 'https://alrahma-backend.onrender.com';
  }
  
  // Default to localhost for development
  return 'http://localhost:5273';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Track if we're currently refreshing to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Skip auth for specific endpoints or if flag is set
    if (config.skipAuthRefresh || config.method?.toUpperCase() === 'OPTIONS') {
      return config;
    }
    
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with improved refresh logic
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Don't attempt refresh for these endpoints
    const skipRefreshUrls = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh-token',
      '/auth/forgot-password',
      '/auth/reset-password'
    ];
    
    const shouldSkipRefresh = skipRefreshUrls.some(url => 
      originalRequest.url?.includes(url)
    );
    
    // Handle 401 errors on protected routes
    if (error.response?.status === 401 && !shouldSkipRefresh && !originalRequest._retry) {
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      const currentToken = localStorage.getItem('token');
      
      if (!refreshToken || !currentToken) {
        isRefreshing = false;
        processQueue(new Error('No refresh token'), null);
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint directly without interceptor
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {
            token: currentToken,
            refreshToken: refreshToken
          },
          {
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        const newToken = response.data?.Token || response.data?.token;
        const newRefreshToken = response.data?.RefreshToken || response.data?.refreshToken;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          // Update user data
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const tokenData = JSON.parse(atob(newToken.split('.')[1]));
          localStorage.setItem('user', JSON.stringify({
            ...user,
            expiresAt: tokenData.exp * 1000
          }));
          
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return apiClient(originalRequest);
        }
        
        throw new Error('No token received');
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.clear();
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export { apiClient };