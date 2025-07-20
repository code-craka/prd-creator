import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, AuthProvider } from '../../contexts/AuthContext';

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: undefined,
  current_team_id: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  }
}));

// Mock the auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    currentTeam: null,
    token: null,
    isLoading: false,
    isAuthenticated: false,
    setAuth: vi.fn(),
    setCurrentTeam: vi.fn(),
    updateUser: vi.fn(),
    logout: vi.fn(),
    setLoading: vi.fn(),
  }))
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide auth context', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    // The useAuth hook from AuthContext just returns an empty object
    // The real auth functionality is in the authStore
    expect(result.current).toEqual({});
  });

  it('should render AuthProvider without errors', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    expect(result.current).toBeDefined();
  });

  it('should initialize auth check when token exists', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    const { authService } = await import('../../services/authService');
    
    // Mock store with token
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      currentTeam: null,
      token: 'test-token',
      isLoading: false,
      isAuthenticated: false,
      setAuth: vi.fn(),
      setCurrentTeam: vi.fn(),
      updateUser: vi.fn(),
      logout: vi.fn(),
      setLoading: vi.fn(),
    });

    vi.mocked(authService.getCurrentUser).mockResolvedValue(mockUser);

    renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    // The AuthProvider should trigger the auth check
    expect(authService.getCurrentUser).toHaveBeenCalled();
  });

  it('should not initialize auth check when no token', async () => {
    const { useAuthStore } = await import('../../stores/authStore');
    const { authService } = await import('../../services/authService');
    
    // Mock store without token
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      currentTeam: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      setAuth: vi.fn(),
      setCurrentTeam: vi.fn(),
      updateUser: vi.fn(),
      logout: vi.fn(),
      setLoading: vi.fn(),
    });

    renderHook(() => useAuth(), {
      wrapper: TestWrapper
    });

    // Should not call getCurrentUser when no token
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });
});