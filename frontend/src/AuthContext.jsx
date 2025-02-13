// AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/auth/user', { withCredentials: true });
      setUser(response.data);
    } catch (err) {
      console.error('Auth check failed:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = () => {
    // Store the current path for redirect after login
    const currentPath = window.location.pathname;
    localStorage.setItem('loginRedirect', currentPath === '/login' ? '/dashboard' : currentPath);
    
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      await axios.get('/api/auth/logout');
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      setError('Logout failed');
      console.error('Logout failed:', err);
    }
  };

  // Role checking methods
  const isAdmin = () => user?.role === 'admin';
  const isCoAdmin = () => user?.role === 'co_admin';
  const isModel = () => user?.role === 'model';
  const isBrand = () => user?.role === 'brand';
  const hasRole = (roles) => roles.includes(user?.role);

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAdmin,
    isCoAdmin,
    isModel,
    isBrand,
    hasRole,
    isAuthenticated: !!user,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {error && (
        <div className="alert-error fixed top-4 right-4 z-50">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
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

export default AuthContext;