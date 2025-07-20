import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DashboardPage } from '../../pages/DashboardPage';

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: undefined,
  current_team_id: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockPRD = {
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

// Mock the PRD service
vi.mock('../../services/prdService', () => ({
  prdService: {
    getUserPRDs: vi.fn(),
    createPRD: vi.fn(),
    getPRD: vi.fn(),
    updatePRD: vi.fn(),
    deletePRD: vi.fn(),
    getPublicPRDs: vi.fn(),
    sharePRDWithTeam: vi.fn(),
    createPublicShareLink: vi.fn(),
    getSharedPRD: vi.fn(),
    getTeamPRDs: vi.fn(),
  }
}));

// Mock auth store
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    currentTeam: null,
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
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render welcome message with user name', async () => {
    const { prdService } = await import('../../services/prdService');
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText(/Welcome back, Test User!/)).toBeInTheDocument();
  });

  it('should display total PRDs count', async () => {
    const { prdService } = await import('../../services/prdService');
    const mockPRDs = [mockPRD, { ...mockPRD, id: 'prd-2' }];
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: mockPRDs,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('should show quick action buttons', async () => {
    const { prdService } = await import('../../services/prdService');
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    expect(screen.getByText('Create New PRD')).toBeInTheDocument();
    expect(screen.getByText('Browse Templates')).toBeInTheDocument();
  });

  it('should display recent PRDs when available', async () => {
    const { prdService } = await import('../../services/prdService');
    const mockPRDs = [
      { ...mockPRD, title: 'Recent PRD 1' },
      { ...mockPRD, id: 'prd-2', title: 'Recent PRD 2' }
    ];
    
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: mockPRDs,
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Recent PRD 1')).toBeInTheDocument();
      expect(screen.getByText('Recent PRD 2')).toBeInTheDocument();
    });
  });

  it('should show empty state when no PRDs exist', async () => {
    const { prdService } = await import('../../services/prdService');
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No PRDs yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first PRD')).toBeInTheDocument();
    });
  });

  it('should display loading state initially', async () => {
    const { prdService } = await import('../../services/prdService');
    vi.mocked(prdService.getUserPRDs).mockImplementation(() => new Promise(() => {}));

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    // Should show loading skeletons
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('should show correct PRD visibility badges', async () => {
    const { prdService } = await import('../../services/prdService');
    const mockPRDs = [
      { ...mockPRD, visibility: 'private' as const },
      { ...mockPRD, id: 'prd-2', visibility: 'public' as const },
      { ...mockPRD, id: 'prd-3', visibility: 'team' as const }
    ];
    
    vi.mocked(prdService.getUserPRDs).mockResolvedValue({
      data: mockPRDs,
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1, hasNext: false, hasPrev: false }
    });

    render(
      <TestWrapper>
        <DashboardPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('private')).toBeInTheDocument();
      expect(screen.getByText('public')).toBeInTheDocument();
      expect(screen.getByText('team')).toBeInTheDocument();
    });
  });
});