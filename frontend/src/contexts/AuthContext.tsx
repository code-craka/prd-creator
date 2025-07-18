import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/authService';

interface AuthContextType {
  // Auth context doesn't need to expose methods since we use the store directly
  // This is mainly for triggering the initial auth check
}

const AuthContext = createContext<AuthContextType>({});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { token, setAuth, logout, setLoading } = useAuthStore();

  // Check authentication status on app load
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!token, // Only run if we have a token
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (userData && token) {
      setAuth(userData, token);
    }
  }, [userData, token, setAuth]);

  useEffect(() => {
    if (error && token) {
      // Token is invalid, logout
      logout();
    }
  }, [error, token, logout]);

  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
};