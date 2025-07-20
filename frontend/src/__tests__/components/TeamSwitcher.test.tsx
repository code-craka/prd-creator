import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TeamSwitcher } from '../../components/team/TeamSwitcher';

const mockTeam = {
  id: 'test-team-id',
  name: 'Test Team',
  slug: 'test-team',
  owner_id: 'test-user-id',
  description: 'Test team description',
  avatar_url: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatar_url: undefined,
  current_team_id: undefined,
  created_at: new Date(),
  updated_at: new Date(),
};

// Mock the team service
vi.mock('../../services/teamService', () => ({
  teamService: {
    getUserTeams: vi.fn(),
    switchTeam: vi.fn(),
    createTeam: vi.fn(),
    getTeam: vi.fn(),
    updateTeam: vi.fn(),
    deleteTeam: vi.fn(),
    inviteMember: vi.fn(),
    getTeamMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
  }
}));

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: mockUser,
    currentTeam: null,
    setCurrentTeam: vi.fn(),
  }))
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
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

describe('TeamSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no teams available', async () => {
    const { teamService } = await import('../../services/teamService');
    vi.mocked(teamService.getUserTeams).mockResolvedValue([]);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should show team name when user has teams', async () => {
    const { teamService } = await import('../../services/teamService');
    vi.mocked(teamService.getUserTeams).mockResolvedValue([{ ...mockTeam, role: 'admin' }]);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup();
    const { teamService } = await import('../../services/teamService');
    vi.mocked(teamService.getUserTeams).mockResolvedValue([{ ...mockTeam, role: 'admin' }]);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    // Wait for the main button to appear, then click it
    const mainButton = await screen.findByRole('button');
    await user.click(mainButton);
    
    // Check that dropdown content appears by looking for the workspace description
    expect(screen.getByText('Your private workspace')).toBeInTheDocument();
  });

  it('should display available teams in dropdown', async () => {
    const user = userEvent.setup();
    const { teamService } = await import('../../services/teamService');
    const teams = [
      { ...mockTeam, role: 'admin' },
      { ...mockTeam, id: 'team-2', name: 'Team 2', slug: 'team-2', role: 'member' }
    ];
    
    vi.mocked(teamService.getUserTeams).mockResolvedValue(teams);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    await waitFor(async () => {
      const button = screen.getByRole('button');
      await user.click(button);
      expect(screen.getByText('Test Team')).toBeInTheDocument();
      expect(screen.getByText('Team 2')).toBeInTheDocument();
    });
  });

  it('should show create team option', async () => {
    const user = userEvent.setup();
    const { teamService } = await import('../../services/teamService');
    vi.mocked(teamService.getUserTeams).mockResolvedValue([{ ...mockTeam, role: 'admin' }]);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    await waitFor(async () => {
      const button = screen.getByRole('button');
      await user.click(button);
      expect(screen.getByText('Create Team')).toBeInTheDocument();
    });
  });

  it('should call switch team service when team is selected', async () => {
    const user = userEvent.setup();
    const { teamService } = await import('../../services/teamService');
    vi.mocked(teamService.getUserTeams).mockResolvedValue([{ ...mockTeam, role: 'admin' }]);
    vi.mocked(teamService.switchTeam).mockResolvedValue(mockTeam);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    await waitFor(async () => {
      const button = screen.getByRole('button');
      await user.click(button);
      const teamOption = screen.getByText('Test Team');
      await user.click(teamOption);
      expect(teamService.switchTeam).toHaveBeenCalledWith(mockTeam.id);
    });
  });

  it('should display team member role', async () => {
    const user = userEvent.setup();
    const { teamService } = await import('../../services/teamService');
    const teamWithRole = { ...mockTeam, role: 'admin' };
    vi.mocked(teamService.getUserTeams).mockResolvedValue([teamWithRole]);

    render(
      <TestWrapper>
        <TeamSwitcher />
      </TestWrapper>
    );

    await waitFor(async () => {
      const button = screen.getByRole('button');
      await user.click(button);
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });
});