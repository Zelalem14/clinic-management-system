import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Authenticating session..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the user's primary dashboard
    const defaultRoute =
      user.role === 'admin'
        ? '/admin'
        : user.role === 'doctor'
        ? '/doctor'
        : user.role === 'lab_tech'
        ? '/laboratory'
        : '/reception';

    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;
