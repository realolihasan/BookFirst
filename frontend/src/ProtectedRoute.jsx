// Path: frontend/src/ProtectedRoute.jsx

import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoading(true);
      }
    }, 300); // Only show spinner if loading takes longer than 300ms

    return () => clearTimeout(timer);
  }, [loading]);

  // Reset showLoading when loading completes
  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
    }
  }, [loading]);

  if (showLoading) {
    return (
      <div className="page-container flex-center">
        <div className="spinner-lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  // Check if children is a function (render prop)
  if (typeof children === 'function') {
    return children({ user });
  }

  // If not a function, return as normal
  return children;
};

export default ProtectedRoute;