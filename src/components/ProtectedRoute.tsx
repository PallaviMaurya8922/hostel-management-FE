import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, type UserRole } from '../contexts';

/**
 * Protected Route Component
 * Ensures only users with the specified role can access the route
 * Redirects non-authorized users to their appropriate dashboard
 *
 * Requirements: 12.1
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Single role (use with most routes). */
  allowedRole?: UserRole;
  /** Any of these roles may access (e.g. shared Profile page). Takes precedence over allowedRole when set. */
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
          <p className="mt-4 text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed =
    allowedRoles && allowedRoles.length > 0
      ? allowedRoles.includes(user.role)
      : allowedRole !== undefined
        ? user.role === allowedRole
        : false;

  if (!isAllowed) {
    const redirectPath = getRoleBasedPath(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  // User has correct role, render the protected content
  return <>{children}</>;
};

/**
 * Get the default dashboard path for a given role
 */
export function getRoleBasedPath(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/';
    case 'warden':
      return '/warden/dashboard';
    case 'security':
      return '/security/dashboard';
    case 'maintenance':
      return '/maintenance/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

export default ProtectedRoute;
