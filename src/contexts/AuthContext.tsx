import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getCurrentSessionUser,
  loginWithSession,
  logoutSession,
  type AuthUser,
} from '../api/auth';

/**
 * Authentication Context
 * Manages user authentication state and role information
 * Supports role-based routing and access control
 *
 * User Roles:
 * - 'student': Student dashboard access
 * - 'warden': Warden dashboard access
 * - 'security': Security dashboard access
 *
 * Requirements: 12.1
 */

export type UserRole = 'student' | 'warden' | 'security' | 'maintenance' | 'admin';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photoUrl?: string;
  isFirstLogin?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isFirstLogin: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from backend session.
  useEffect(() => {
    const loadUser = async () => {
      try {
        const sessionUser = await getCurrentSessionUser();
        setUser(sessionUser);
        localStorage.setItem('user', JSON.stringify(sessionUser));
      } catch (error) {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<User> => {
    const authenticatedUser: AuthUser = await loginWithSession(
      email,
      password,
      role
    );
    setUser(authenticatedUser);
    localStorage.setItem('user', JSON.stringify(authenticatedUser));
    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await logoutSession();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isFirstLogin: user?.isFirstLogin || false,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to access authentication context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
