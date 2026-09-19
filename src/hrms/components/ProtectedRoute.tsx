import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  fallbackPath = '/login'
}) => {
  const { user } = useAuth();

  // If no permission is required, just render children
  if (!requiredPermission) {
    return <>{children}</>;
  }

  // Superadmins have access to everything
  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  // If user doesn't have the required permission, redirect
  if (!user?.permissions?.includes(requiredPermission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
