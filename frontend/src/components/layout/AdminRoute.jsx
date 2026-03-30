import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // If not authenticated or not an admin -> redirect to admin login
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  // Check token expiry locally to prevent flashing admin content
  if (token) {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      const payload = JSON.parse(decodedJson);
      
      // eslint-disable-next-line react-hooks/purity
      const isExpired = payload.exp * 1000 < Date.now();
      if (isExpired) {
        logout();
        return <Navigate to="/admin/login" replace />;
      }
    } catch {
      logout();
      return <Navigate to="/admin/login" replace />;
    }
  }

  return children;
};

export default AdminRoute;
