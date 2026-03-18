import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/appConfig';
import { emitUserError, reportClientEvent } from '../utils/observability';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            reportClientEvent('auth_initialized', { authenticated: true });
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setToken(null);
            reportClientEvent('auth_initialized', { authenticated: false, reason: 'invalid_token' });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          setToken(null);
          reportClientEvent('auth_initialized', { authenticated: false, reason: 'network_error' });
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // Handle non-JSON responses (like rate limit messages)
        if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment and try again.' };
        }
        return { success: false, error: 'Server error. Please try again.' };
      }

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        reportClientEvent('auth_login_success', { email });
        return { success: true };
      } else {
        reportClientEvent('auth_login_failed', { email, reason: data.error || 'login_failed' });
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      emitUserError('Unable to login. Please check your connection and try again.', 'auth');
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // Handle non-JSON responses (like rate limit messages)
        if (response.status === 429) {
          return { success: false, error: 'Too many requests. Please wait a moment and try again.' };
        }
        return { success: false, error: 'Server error. Please try again.' };
      }

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        reportClientEvent('auth_register_success', { email: userData.email });
        return { success: true };
      } else {
        reportClientEvent('auth_register_failed', { email: userData.email, reason: data.error || 'register_failed' });
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      emitUserError('Registration failed due to a network error.', 'auth');
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const loginWithToken = async (authToken) => {
    try {
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
      // Verify token and get user data
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
        reportClientEvent('auth_oauth_token_success', { provider: userData.user?.provider || 'oauth' });
        return { success: true };
      } else {
        localStorage.removeItem('token');
        setToken(null);
        reportClientEvent('auth_oauth_token_failed', { reason: 'token_invalid' });
        return { success: false, error: 'Invalid token' };
      }
    } catch (error) {
      console.error('Token login error:', error);
      localStorage.removeItem('token');
      setToken(null);
      emitUserError('OAuth sign-in could not be completed.', 'oauth');
      return { success: false, error: 'Authentication failed' };
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithToken,
    updateUser,
    token,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
