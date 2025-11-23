// src/services/authService.js
import { apiClient } from '../config/api';

// Helper function to extract role from token data
const getRoleFromToken = (tokenData) => {
  return tokenData.role || 
         tokenData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
         'User';
};

const debugToken = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));

    return payload;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
};

const authService = {
  async login(email, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        Email: email,
        Password: password
      });

      const token = response.data?.Token || response.data?.token;
      const user = response.data?.User || response.data?.user;
      const refreshToken = response.data?.RefreshToken || response.data?.refreshToken;
      
      if (!token) {
        throw new Error(response.data?.Message || response.data?.message || 'Authentication failed');
      }

      const tokenData = debugToken(token);
      const expiresAt = tokenData.exp * 1000;
      const role = getRoleFromToken(tokenData);

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify({ 
        ...user, 
        Role: role,
        expiresAt
      }));
      
      return { 
        Token: token,
        User: user,
        RefreshToken: refreshToken
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        errorMessage = 
          error.response.data?.Message || 
          error.response.data?.message || 
          error.response.data?.error ||
          error.response.data?.error_description;
        
        if (!errorMessage) {
          if (error.response.status === 401) {
            errorMessage = 'Invalid credentials';
          } else if (error.response.status === 403) {
            errorMessage = 'Account disabled';
          } else {
            errorMessage = `Login failed (${error.response.status})`;
          }
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      throw new Error(errorMessage);
    }
  },

  async register(userData) {
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      const token = response.data?.Token;
      const user = response.data?.User;
      const refreshToken = response.data?.RefreshToken || response.data?.refreshToken;

      if (!token || !user) {
        throw new Error(response.data?.Message || 'Registration failed');
      }

      const tokenData = debugToken(token);
      const role = getRoleFromToken(tokenData);

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        Role: role,
        expiresAt: tokenData.exp * 1000
      }));

      return response.data;
    } catch (error) {
      console.error('❌ Register error:', error.response?.data || error);
      throw new Error(error.response?.data?.Message || 'Registration failed');
    }
  },

  async validateToken() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const tokenData = debugToken(token);
      if (Date.now() >= tokenData.exp * 1000) {
        console.warn('❌ Token expired locally');
        this.logout();
        return false;
      }

      const response = await apiClient.get('/auth/validate-token');
      return response.data?.Success === true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userStr || !token) {
        return null;
      }

      const user = JSON.parse(userStr);
      const tokenData = debugToken(token);
      
      if (Date.now() >= tokenData.exp * 1000) {
        this.logout();
        return null;
      }

      return { ...user, token };
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      this.logout();
      return null;
    }
  },

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!user;
  },

  async refreshToken() {
    try {
      
      const currentToken = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!currentToken || !refreshToken) {
        throw new Error('No tokens found for refresh');
      }

      
      // Use axios directly to avoid interceptor loops
      const response = await apiClient.post('/auth/refresh-token', {
        token: currentToken,
        refreshToken: refreshToken
      }, {
        skipAuthRefresh: true // Custom flag to skip interceptor
      });

      const newToken = response.data?.Token || response.data?.token;
      const newRefreshToken = response.data?.RefreshToken || response.data?.refreshToken;
      
      if (!newToken) {
        throw new Error('No new token received from server');
      }

      const tokenData = debugToken(newToken);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('refreshToken', newRefreshToken);
      localStorage.setItem('user', JSON.stringify({ 
        ...user, 
        Role: getRoleFromToken(tokenData),
        expiresAt: tokenData.exp * 1000 
      }));

      
      return { 
        token: newToken,
        refreshToken: newRefreshToken 
      };
    } catch (error) {
      console.error('❌ authService: Token refresh failed:', error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(error.response?.data?.Message || 'Token refresh failed');
    }
  },

  getTokenStatus() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return { valid: false, reason: 'No token' };

      const tokenData = debugToken(token);
      const expiresAt = tokenData.exp * 1000;
      const timeUntilExpiry = expiresAt - Date.now();
      
      return {
        valid: timeUntilExpiry > 0,
        expiresAt: new Date(expiresAt),
        timeUntilExpiry: Math.round(timeUntilExpiry / 1000 / 60),
        role: getRoleFromToken(tokenData)
      };
    } catch (error) {
      return { valid: false, reason: 'Invalid token' };
    }
  }
};

export default authService;