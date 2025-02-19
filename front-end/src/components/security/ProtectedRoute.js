import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function ProtectedRoute({ children, adminRequired = false }) {
  const { isAuthenticated, isAdmin, isLoading } = useContext(AuthContext);
  const location = useLocation();

  // Wait for authentication check to complete
  if (isLoading) {
    return null; // or a loading spinner
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    // Redirect to login while saving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access if required
  if (adminRequired && !isAdmin) {
    // Redirect non-admin users to a default page
    return <Navigate to="/collections" replace />;
  }

  return children;
}

export default ProtectedRoute;