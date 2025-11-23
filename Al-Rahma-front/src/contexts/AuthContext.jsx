import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

const getRoleFromToken = (tokenData) => {
  return tokenData.role || 
         tokenData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
         tokenData.Role || 
         tokenData['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role'] ||
         'User';
};

// Updated session configuration - less aggressive
const SESSION_CONFIG = {
  refreshThreshold: 5 * 60 * 1000, // Refresh 5 minutes before expiry (was 10)
  minRefreshTime: 2 * 60 * 1000, // Min 2 minutes before attempting refresh (was 30 sec)
  maxRefreshTime: 50 * 60 * 1000, // Max refresh time 50 minutes (for 60min tokens)
  retryAttempts: 2, // Reduced retry attempts
  retryDelay: 3000, // Increased retry delay
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return authService.getCurrentUser();
    } catch (error) {
      console.error('Error initializing user state:', error);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTokenRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const retryCountRef = useRef(0);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const refreshToken = useCallback(async (isRetry = false) => {
    try {
      const currentToken = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!currentToken || !refreshToken) {
        throw new Error('No tokens available for refresh');
      }
      
      const newTokenData = await authService.refreshToken();
      const token = newTokenData?.token || newTokenData?.Token;
      
      if (!token) {
        throw new Error('No new token received');
      }

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = tokenData.exp * 1000;
      const role = getRoleFromToken(tokenData);
      
      const updatedUser = { 
        ...user,
        token,
        Role: role,
        expiresAt 
      };
      
      setUser(updatedUser);
      retryCountRef.current = 0;
      
      // Schedule next refresh
      scheduleTokenRefresh(expiresAt);
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      
      // Don't retry on authentication errors
      if (error.message?.includes('401') || error.message?.includes('Unauthorized') || error.message?.includes('Session expired')) {
        console.error('Authentication failed, logging out...');
        setUser(null);
        authService.logout();
        return null;
      }
      
      // Retry logic for network errors
      if (!isRetry && retryCountRef.current < SESSION_CONFIG.retryAttempts) {
        retryCountRef.current += 1;
        
        await new Promise(resolve => setTimeout(resolve, SESSION_CONFIG.retryDelay));
        return refreshToken(true);
      }
      
      // Final failure
      console.error('Final token refresh failure, logging out');
      setUser(null);
      authService.logout();
      return null;
    }
  }, [user]);

  const scheduleTokenRefresh = useCallback((expiresAt) => {
    clearRefreshTimer();
    
    const timeUntilExpiry = expiresAt - Date.now();
    
    if (timeUntilExpiry <= 0) {
      console.warn('Token already expired');
      return;
    }
    
    // Calculate when to refresh - 5 minutes before expiry, but not too soon
    let refreshTime = timeUntilExpiry - SESSION_CONFIG.refreshThreshold;
    
    // Don't refresh if the token expires in less than 2 minutes
    if (timeUntilExpiry < SESSION_CONFIG.minRefreshTime) {
      console.warn('Token expiring too soon, logging out');
      authService.logout();
      setUser(null);
      return;
    }
    
    // Clamp refresh time between min and max
    refreshTime = Math.max(
      Math.min(refreshTime, SESSION_CONFIG.maxRefreshTime),
      SESSION_CONFIG.minRefreshTime
    );
    
    refreshTimerRef.current = setTimeout(() => {
      refreshTokenRef.current();
    }, refreshTime);
  }, [clearRefreshTimer]);

  const updateUser = useCallback((userData) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      
      const updatedUser = { ...prevUser, ...userData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  useEffect(() => {
    refreshTokenRef.current = refreshToken;
  }, [refreshToken]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();
        
        if (!currentUser) {
          if (mounted) setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          throw new Error('Invalid token format');
        }
        
        const tokenData = JSON.parse(atob(tokenParts[1]));
        const expiresAt = tokenData.exp * 1000;
        const currentTime = Date.now();
        
        if (expiresAt < currentTime) {
          console.warn('Token expired on initialization');
          throw new Error('Token expired');
        }
        
        const role = getRoleFromToken(tokenData);
        const timeUntilExpiry = expiresAt - currentTime;
        
        if (mounted) {
          setUser({
            ...currentUser,
            Role: role,
            expiresAt
          });
          
          // Only refresh if token is expiring soon
          if (timeUntilExpiry < SESSION_CONFIG.refreshThreshold) {
            await refreshTokenRef.current();
          } else {
            scheduleTokenRefresh(expiresAt);
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        if (mounted) {
          setError('حدث خطأ أثناء التحقق من صلاحية الجلسة');
          setUser(null);
          authService.logout();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearRefreshTimer();
    };
  }, [scheduleTokenRefresh, clearRefreshTimer]);

  const login = async (email, password) => {
    try {
      setError(null);
      const userData = await authService.login(email, password);
      
      const token = userData?.Token || userData?.token;
      const user = userData?.User || userData?.user;
      
      if (!token || !user) {
        throw new Error('بيانات المستخدم غير صالحة');
      }

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const role = getRoleFromToken(tokenData);
      const expiresAt = tokenData.exp * 1000;
      
      const userState = {
        ...user,
        token,
        Role: role,
        expiresAt
      };
      
      setUser(userState);
      scheduleTokenRefresh(expiresAt);
      
      return userState;
    } catch (error) {
      setError(error.message || 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.');
      throw error;
    }
  };

  const register = async ({ email, password, firstName, lastName, phoneNumber }) => {
    try {
      setError(null);
      setLoading(true);
      
      const userData = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phoneNumber
      });
      
      const token = userData?.Token;
      const user = userData?.User;
      
      if (!token || !user) {
        throw new Error('بيانات المستخدم غير صالحة');
      }

      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const role = getRoleFromToken(tokenData);
      const expiresAt = tokenData.exp * 1000;
      
      const userState = {
        ...user,
        token,
        Role: role,
        expiresAt
      };
      
      setUser(userState);
      scheduleTokenRefresh(expiresAt);
      
      return userData;
    } catch (error) {
      setError(error.Message || 'فشل التسجيل. يرجى المحاولة مرة أخرى.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    clearRefreshTimer();
    retryCountRef.current = 0;
    authService.logout();
    setUser(null);
    setError(null);
  }, [clearRefreshTimer]);

  const isAuthenticated = useCallback(() => {
    if (!user?.token) return false;
    
    try {
      const tokenData = JSON.parse(atob(user.token.split('.')[1]));
      const expiresAt = tokenData.exp * 1000;
      return Date.now() < expiresAt;
    } catch {
      return false;
    }
  }, [user]);

  const hasRole = useCallback((role) => {
    return user?.Role === role;
  }, [user]);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    error,
    clearError: () => setError(null),
    isAuthenticated,
    hasRole,
    refreshToken: refreshTokenRef.current,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};