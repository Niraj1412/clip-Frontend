import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Protected Route component that redirects to login page if user is not authenticated
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();
  const location = useLocation();
  
  useEffect(() => {
    // If not authenticated, save the current path for redirect after login
    if (!isAuthenticated) {
      // Don't save login/signup pages as redirects
      const isAuthPage = location.pathname.includes('/signin') || 
                         location.pathname.includes('/signup');
                         
      if (!isAuthPage) {
        localStorage.setItem('redirectAfterLogin', location.pathname);
      }
    }
  }, [isAuthenticated, location]);
  
  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/signin" replace />;
  }
  
  // Render children if authenticated
  return children;
};

export default ProtectedRoute; 