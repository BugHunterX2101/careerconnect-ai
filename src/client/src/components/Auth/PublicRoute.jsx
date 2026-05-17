import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    const destination = user.role === 'employer' ? '/employer/dashboard' : '/employee/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default PublicRoute;
