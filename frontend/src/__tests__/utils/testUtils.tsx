import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: undefined,
  current_team_id: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock auth store
export const mockAuthStore = {
  user: mockUser,
  currentTeam: null,
  token: 'mock-token',
  isLoading: false,
  isAuthenticated: true,
  setAuth: vi.fn(),
  setCurrentTeam: vi.fn(),
  updateUser: vi.fn(),
  logout: vi.fn(),
  setLoading: vi.fn(),
};

// Mock the auth store module
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// Mock AuthProvider
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: MockAuthProvider,
  useAuth: () => ({
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
  }),
}));

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  user?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <MockAuthProvider>
            {children}
          </MockAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}

// Mock API responses
export const mockApiResponse = (data: any) => ({
  success: true,
  data,
});

export const mockApiError = (message: string, status = 400) => ({
  success: false,
  error: message,
  status,
});

// Common test data
export const mockPRD = {
  id: 'test-prd-id',
  user_id: 'test-user-id',
  team_id: null,
  title: 'Test PRD',
  content: 'Test PRD content',
  metadata: {},
  visibility: 'private' as const,
  share_token: null,
  template_id: null,
  view_count: 0,
  created_at: new Date(),
  updated_at: new Date(),
};

export const mockTeam = {
  id: 'test-team-id',
  name: 'Test Team',
  slug: 'test-team',
  owner_id: 'test-user-id',
  description: 'Test team description',
  avatar_url: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';