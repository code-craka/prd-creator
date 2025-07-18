Perfect! Let's break down the basic team workspace implementation into a detailed 2-week sprint plan with specific tasks, code, and deliverables.

## **Week 1-2 Sprint Plan: Basic Team Workspace**

### **Sprint Goals**
- Users can create teams and invite members
- Team members can share PRDs within the workspace
- Basic permission system (owner/member roles)
- Team PRD library with filtering

### **Day-by-Day Breakdown**

## **Week 1: Foundation & Backend**

### **Day 1-2: Database Schema & Migrations**

**Database Setup:**
```sql
-- Migration 001: Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Migration 002: Create team_members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role ENUM('owner', 'member') NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(team_id, user_id),
  INDEX idx_team_members (team_id),
  INDEX idx_user_teams (user_id)
);

-- Migration 003: Add team_id to existing tables
ALTER TABLE prds ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE prds ADD COLUMN visibility ENUM('private', 'team') DEFAULT 'private';
CREATE INDEX idx_prds_team ON prds(team_id, created_at);

-- Migration 004: Update users table
ALTER TABLE users ADD COLUMN current_team_id UUID REFERENCES teams(id);
```

**Migration Script:**
```typescript
// migrations/001_create_teams.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('teams', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.uuid('owner_id').notNullable().references('id').inTable('users');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('team_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('team_id').notNullable().references('id').inTable('teams').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.enu('role', ['owner', 'member']).notNullable().defaultTo('member');
    table.uuid('invited_by').references('id').inTable('users');
    table.timestamp('joined_at');
    table.timestamps(true, true);
    
    table.unique(['team_id', 'user_id']);
    table.index(['team_id']);
    table.index(['user_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('team_members');
  await knex.schema.dropTable('teams');
}
```

### **Day 3-4: Backend Services & API**

**Team Service:**
```typescript
// services/teamService.ts
import { Team, TeamMember, CreateTeamRequest } from '../types';
import { NotFoundError, ForbiddenError } from '../utils/errors';

class TeamService {
  constructor(private db: Database) {}

  async createTeam(ownerId: string, data: CreateTeamRequest): Promise<Team> {
    const slug = this.generateSlug(data.name);
    
    // Start transaction
    return this.db.transaction(async (trx) => {
      // Create team
      const [team] = await trx('teams').insert({
        name: data.name,
        slug,
        owner_id: ownerId
      }).returning('*');

      // Add owner as team member
      await trx('team_members').insert({
        team_id: team.id,
        user_id: ownerId,
        role: 'owner',
        joined_at: new Date()
      });

      // Update user's current team
      await trx('users').where('id', ownerId).update({
        current_team_id: team.id
      });

      return team;
    });
  }

  async inviteMember(teamId: string, inviterId: string, email: string): Promise<void> {
    // Verify inviter has permission
    await this.verifyTeamMembership(teamId, inviterId);
    
    // Check if user exists
    const invitee = await this.db('users').where('email', email).first();
    
    if (!invitee) {
      // Send invitation email to non-user
      await this.emailService.sendTeamInvitation(email, teamId, inviterId);
      return;
    }

    // Check if already a member
    const existingMember = await this.db('team_members')
      .where({ team_id: teamId, user_id: invitee.id })
      .first();
    
    if (existingMember) {
      throw new Error('User is already a team member');
    }

    // Add as team member
    await this.db('team_members').insert({
      team_id: teamId,
      user_id: invitee.id,
      role: 'member',
      invited_by: inviterId,
      joined_at: new Date()
    });

    // Notify user
    await this.emailService.sendTeamWelcome(invitee.email, teamId);
    
    // Track analytics
    await this.analytics.track(inviterId, 'team_member_invited', { teamId, inviteeId: invitee.id });
  }

  async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    await this.verifyTeamMembership(teamId, userId);
    
    return this.db('team_members')
      .join('users', 'team_members.user_id', 'users.id')
      .where('team_members.team_id', teamId)
      .select([
        'team_members.*',
        'users.name',
        'users.email',
        'users.avatar_url'
      ])
      .orderBy('team_members.created_at', 'asc');
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    return this.db('teams')
      .join('team_members', 'teams.id', 'team_members.team_id')
      .where('team_members.user_id', userId)
      .select([
        'teams.*',
        'team_members.role'
      ])
      .orderBy('teams.created_at', 'desc');
  }

  private async verifyTeamMembership(teamId: string, userId: string): Promise<TeamMember> {
    const member = await this.db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .first();
    
    if (!member) {
      throw new ForbiddenError('Not a team member');
    }
    
    return member;
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
  }
}
```

**API Routes:**
```typescript
// routes/teams.ts
import express from 'express';
import { requireAuth } from '../middleware/auth';
import { TeamService } from '../services/teamService';

const router = express.Router();

// Create team
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const team = await teamService.createTeam(req.user.id, { name });
    res.status(201).json({ team });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's teams
router.get('/my-teams', requireAuth, async (req, res) => {
  const teams = await teamService.getUserTeams(req.user.id);
  res.json({ teams });
});

// Switch current team
router.post('/switch', requireAuth, async (req, res) => {
  const { teamId } = req.body;
  
  // Verify membership
  await teamService.verifyTeamMembership(teamId, req.user.id);
  
  // Update current team
  await db('users').where('id', req.user.id).update({ current_team_id: teamId });
  
  const team = await teamService.getTeam(teamId);
  res.json({ team });
});

// Invite member
router.post('/:teamId/invite', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const { email } = req.body;
  
  await teamService.inviteMember(teamId, req.user.id, email);
  res.json({ success: true });
});

// Get team members
router.get('/:teamId/members', requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const members = await teamService.getTeamMembers(teamId, req.user.id);
  res.json({ members });
});

export default router;
```

### **Day 5: PRD Sharing & Team Context**

**Updated PRD Service:**
```typescript
// services/prdService.ts - Updated for teams
class PRDService {
  async createPRD(userId: string, data: CreatePRDRequest): Promise<PRD> {
    const user = await this.db('users').where('id', userId).first();
    
    const prd = await this.db('prds').insert({
      user_id: userId,
      team_id: data.teamId || user.current_team_id,
      title: data.title,
      content: data.content,
      visibility: data.visibility || 'private',
      metadata: data.metadata
    }).returning('*');

    // Track analytics
    await this.analytics.track(userId, 'prd_created', { 
      teamId: prd[0].team_id,
      visibility: prd[0].visibility 
    });

    return prd[0];
  }

  async getTeamPRDs(teamId: string, userId: string, filters: PRDFilters = {}): Promise<PRD[]> {
    // Verify team membership
    await this.teamService.verifyTeamMembership(teamId, userId);
    
    let query = this.db('prds')
      .join('users', 'prds.user_id', 'users.id')
      .where('prds.team_id', teamId)
      .where('prds.visibility', 'team')
      .select([
        'prds.*',
        'users.name as author_name',
        'users.avatar_url as author_avatar'
      ]);

    // Apply filters
    if (filters.author) {
      query = query.where('users.name', 'ilike', `%${filters.author}%`);
    }
    
    if (filters.dateFrom) {
      query = query.where('prds.created_at', '>=', filters.dateFrom);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .where('prds.title', 'ilike', `%${filters.search}%`)
          .orWhere('prds.content', 'ilike', `%${filters.search}%`);
      });
    }

    return query.orderBy('prds.updated_at', 'desc');
  }

  async sharePRDWithTeam(prdId: string, userId: string): Promise<void> {
    const prd = await this.getPRD(prdId, userId);
    
    if (prd.user_id !== userId) {
      throw new ForbiddenError('Only PRD owner can share with team');
    }

    await this.db('prds').where('id', prdId).update({
      visibility: 'team',
      updated_at: new Date()
    });

    await this.analytics.track(userId, 'prd_shared_with_team', { prdId, teamId: prd.team_id });
  }
}
```

## **Week 2: Frontend Implementation**

### **Day 6-7: Team Context & State Management**

**Team Context Setup:**
```typescript
// contexts/TeamContext.tsx
interface TeamContextType {
  currentTeam: Team | null;
  userTeams: Team[];
  userRole: string | null;
  isLoading: boolean;
  createTeam: (name: string) => Promise<Team>;
  switchTeam: (teamId: string) => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  refreshTeams: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>(null!);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user's teams on mount
  useEffect(() => {
    loadUserTeams();
  }, []);

  const loadUserTeams = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/teams/my-teams');
      const teams = response.data.teams;
      
      setUserTeams(teams);
      
      // Set current team (first team or previously selected)
      const savedTeamId = localStorage.getItem('currentTeamId');
      const defaultTeam = teams.find(t => t.id === savedTeamId) || teams[0];
      
      if (defaultTeam) {
        await switchTeam(defaultTeam.id);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTeam = async (name: string): Promise<Team> => {
    const response = await api.post('/teams', { name });
    const newTeam = response.data.team;
    
    setUserTeams(prev => [newTeam, ...prev]);
    await switchTeam(newTeam.id);
    
    return newTeam;
  };

  const switchTeam = async (teamId: string): Promise<void> => {
    try {
      const response = await api.post('/teams/switch', { teamId });
      const team = response.data.team;
      
      setCurrentTeam(team);
      setUserRole(team.role);
      
      // Save to localStorage
      localStorage.setItem('currentTeamId', teamId);
      
      // Update API default header for future requests
      api.defaults.headers['X-Team-ID'] = teamId;
    } catch (error) {
      console.error('Failed to switch team:', error);
      throw error;
    }
  };

  const inviteMember = async (email: string): Promise<void> => {
    if (!currentTeam) throw new Error('No current team');
    
    await api.post(`/teams/${currentTeam.id}/invite`, { email });
    
    // Refresh team members would go here
    // For now, we'll handle this in the component
  };

  const refreshTeams = async (): Promise<void> => {
    await loadUserTeams();
  };

  return (
    <TeamContext.Provider value={{
      currentTeam,
      userTeams,
      userRole,
      isLoading,
      createTeam,
      switchTeam,
      inviteMember,
      refreshTeams
    }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeam must be used within TeamProvider');
  }
  return context;
};
```

### **Day 8-9: Team Workspace UI Components**

**Team Switcher Component:**
```typescript
// components/TeamSwitcher.tsx
const TeamSwitcher = () => {
  const { currentTeam, userTeams, switchTeam, createTeam } = useTeam();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setIsCreating(true);
    try {
      await createTeam(newTeamName);
      setNewTeamName('');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg hover:bg-white transition-colors"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <span className="text-sm font-semibold text-indigo-600">
              {currentTeam?.name[0].toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-gray-900">{currentTeam?.name}</span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-1">
            {userTeams.map(team => (
              <button
                key={team.id}
                onClick={() => {
                  switchTeam(team.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-gray-50 ${
                  team.id === currentTeam?.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                }`}
              >
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-semibold">{team.name[0].toUpperCase()}</span>
                </div>
                {team.name}
                {team.role === 'owner' && (
                  <Crown className="w-3 h-3 ml-auto text-yellow-500" />
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-3">
            <form onSubmit={handleCreateTeam} className="space-y-2">
              <input
                type="text"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isCreating || !newTeamName.trim()}
                className="w-full py-2 px-3 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center"
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    Create Team
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
```

**Team PRD Library:**
```typescript
// components/TeamPRDLibrary.tsx
const TeamPRDLibrary = () => {
  const { currentTeam } = useTeam();
  const [prds, setPRDs] = useState<PRD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    author: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    if (currentTeam) {
      loadTeamPRDs();
    }
  }, [currentTeam, filters]);

  const loadTeamPRDs = async () => {
    if (!currentTeam) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/teams/${currentTeam.id}/prds`, {
        params: filters
      });
      setPRDs(response.data.prds);
    } catch (error) {
      console.error('Failed to load team PRDs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No team selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team PRDs</h2>
          <p className="text-gray-600">Shared PRDs in {currentTeam.name}</p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create PRD
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search PRDs..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
            <input
              type="text"
              placeholder="Filter by author..."
              value={filters.author}
              onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', author: '', dateFrom: '', dateTo: '' })}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* PRD Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : prds.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No PRDs found</p>
          <p className="text-sm text-gray-400">Create your first team PRD to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prds.map(prd => (
            <PRDCard key={prd.id} prd={prd} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### **Day 10: Team Invitation & Member Management**

**Invite Members Component:**
```typescript
// components/InviteMembers.tsx
const InviteMembers = () => {
  const { currentTeam, inviteMember } = useTeam();
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !currentTeam) return;

    setIsInviting(true);
    setMessage(null);

    try {
      await inviteMember(email);
      setEmail('');
      setMessage({ type: 'success', text: 'Invitation sent successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to send invitation' });
    } finally {
      setIsInviting(false);
    }
  };

  if (!currentTeam) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg p-4 mt-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Invite Team Members</h3>
      
      <form onSubmit={handleInvite} className="space-y-3">
        <input
          type="email"
          placeholder="colleague@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
        
        <button
          type="submit"
          disabled={isInviting || !email.trim()}
          className="w-full py-2 px-3 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:bg-gray-300 flex items-center justify-center"
        >
          {isInviting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="w-4 h-4 mr-1" />
              Send Invite
            </>
          )}
        </button>
      </form>

      {message && (
        <div className={`mt-3 p-2 rounded text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};
```

## **Sprint Deliverables & Testing**

### **Deliverables Checklist**

**Backend (Week 1):**
- ✅ Database schema with migrations
- ✅ Team creation and management API
- ✅ Member invitation system
- ✅ Team-scoped PRD sharing
- ✅ Basic permission checks

**Frontend (Week 2):**
- ✅ Team context and state management
- ✅ Team switcher UI component
- ✅ Team PRD library with filtering
- ✅ Member invitation interface
- ✅ Updated PRD creation to include team sharing

### **Testing Strategy**

**API Testing:**
```typescript
// tests/teams.test.ts
describe('Team Management', () => {
  test('should create team and add owner as member', async () => {
    const user = await createTestUser();
    const team = await teamService.createTeam(user.id, { name: 'Test Team' });
    
    expect(team.name).toBe('Test Team');
    expect(team.owner_id).toBe(user.id);
    
    const members = await teamService.getTeamMembers(team.id, user.id);
    expect(members).toHaveLength(1);
    expect(members[0].role).toBe('owner');
  });

  test('should invite member and send email', async () => {
    const owner = await createTestUser();
    const team = await teamService.createTeam(owner.id, { name: 'Test Team' });
    
    const inviteeEmail = 'test@example.com';
    await teamService.inviteMember(team.id, owner.id, inviteeEmail);
    
    // Verify email was sent
    expect(mockEmailService.sendTeamInvitation).toHaveBeenCalledWith(
      inviteeEmail, team.id, owner.id
    );
  });
});
```

**Frontend Testing:**
`## **Continuing Frontend Testing**

```typescript
// tests/TeamSwitcher.test.tsx
describe('TeamSwitcher', () => {
  test('should display current team and allow switching', async () => {
    const mockTeams = [
      { id: '1', name: 'Team A', role: 'owner' },
      { id: '2', name: 'Team B', role: 'member' }
    ];

    render(
      <TeamProvider value={{ currentTeam: mockTeams[0], userTeams: mockTeams }}>
        <TeamSwitcher />
      </TeamProvider>
    );

    expect(screen.getByText('Team A')).toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(screen.getByText('Team A'));
    
    // Should see both teams
    expect(screen.getByText('Team B')).toBeInTheDocument();
    
    // Switch team
    fireEvent.click(screen.getByText('Team B'));
    expect(mockSwitchTeam).toHaveBeenCalledWith('2');
  });

  test('should allow creating new team', async () => {
    render(<TeamSwitcher />);
    
    fireEvent.click(screen.getByText('Team A'));
    fireEvent.change(screen.getByPlaceholderText('New team name'), {
      target: { value: 'New Team' }
    });
    fireEvent.click(screen.getByText('Create Team'));
    
    expect(mockCreateTeam).toHaveBeenCalledWith('New Team');
  });
});
```

### **Integration Testing**

```typescript
// tests/integration/teamWorkflow.test.ts
describe('Team Workflow Integration', () => {
  test('complete team creation and PRD sharing workflow', async () => {
    // 1. Create user and team
    const user = await createTestUser();
    const team = await teamService.createTeam(user.id, { name: 'Product Team' });
    
    // 2. Invite member
    const memberEmail = 'member@test.com';
    const member = await createTestUser({ email: memberEmail });
    await teamService.inviteMember(team.id, user.id, memberEmail);
    
    // 3. Create PRD as owner
    const prd = await prdService.createPRD(user.id, {
      title: 'Mobile App PRD',
      content: '# Mobile App PRD\n\nContent...',
      teamId: team.id,
      visibility: 'team'
    });
    
    // 4. Verify member can see PRD
    const teamPRDs = await prdService.getTeamPRDs(team.id, member.id);
    expect(teamPRDs).toHaveLength(1);
    expect(teamPRDs[0].id).toBe(prd.id);
    
    // 5. Verify member can view but not delete
    const viewedPRD = await prdService.getPRD(prd.id, member.id);
    expect(viewedPRD).toBeDefined();
    
    await expect(
      prdService.deletePRD(prd.id, member.id)
    ).rejects.toThrow('Only PRD owner can delete');
  });
});
```

### **Performance Considerations**

```typescript
// Add database indexes for performance
CREATE INDEX CONCURRENTLY idx_prds_team_visibility 
ON prds(team_id, visibility, updated_at DESC) 
WHERE visibility = 'team';

CREATE INDEX CONCURRENTLY idx_team_members_active 
ON team_members(team_id, user_id) 
WHERE status = 'active';

// Add query optimization
class PRDService {
  async getTeamPRDs(teamId: string, userId: string, pagination: { page: number, limit: number }) {
    const offset = (pagination.page - 1) * pagination.limit;
    
    // Use efficient query with joins
    return this.db('prds')
      .join('users', 'prds.user_id', 'users.id')
      .join('team_members', function() {
        this.on('team_members.team_id', '=', 'prds.team_id')
            .andOn('team_members.user_id', '=', userId);
      })
      .where('prds.team_id', teamId)
      .where('prds.visibility', 'team')
      .select([
        'prds.id', 'prds.title', 'prds.created_at', 'prds.updated_at',
        'users.name as author_name', 'users.avatar_url as author_avatar'
      ])
      .orderBy('prds.updated_at', 'desc')
      .limit(pagination.limit)
      .offset(offset);
  }
}
```

---

## **Complete Project Boilerplate Structure**

Here's the full project structure with all the code we've built:

```
prd-creator/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.ts
│   │   │   ├── teams.ts
│   │   │   ├── prds.ts
│   │   │   └── users.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── cors.ts
│   │   │   └── validation.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Team.ts
│   │   │   ├── PRD.ts
│   │   │   └── TeamMember.ts
│   │   ├── services/
│   │   │   ├── teamService.ts
│   │   │   ├── prdService.ts
│   │   │   ├── authService.ts
│   │   │   ├── emailService.ts
│   │   │   └── analyticsService.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── teams.ts
│   │   │   ├── prds.ts
│   │   │   └── index.ts
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users.ts
│   │   │   │   ├── 002_create_teams.ts
│   │   │   │   ├── 003_create_team_members.ts
│   │   │   │   ├── 004_create_prds.ts
│   │   │   │   └── 005_add_team_features.ts
│   │   │   ├── seeds/
│   │   │   │   └── sample_data.ts
│   │   │   └── connection.ts
│   │   ├── utils/
│   │   │   ├── errors.ts
│   │   │   ├── validation.ts
│   │   │   └── helpers.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── team.ts
│   │   │   ├── prd.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   ├── email.ts
│   │   │   └── env.ts
│   │   └── app.ts
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   └── controllers/
│   │   ├── integration/
│   │   │   └── teamWorkflow.test.ts
│   │   └── setup.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── knexfile.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   └── Card.tsx
│   │   │   ├── team/
│   │   │   │   ├── TeamSwitcher.tsx
│   │   │   │   ├── TeamPRDLibrary.tsx
│   │   │   │   ├── InviteMembers.tsx
│   │   │   │   ├── TeamMembers.tsx
│   │   │   │   └── TeamSettings.tsx
│   │   │   ├── prd/
│   │   │   │   ├── PRDCreator.tsx
│   │   │   │   ├── PRDCard.tsx
│   │   │   │   ├── PRDViewer.tsx
│   │   │   │   └── PRDFilters.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Layout.tsx
│   │   │   └── common/
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── NotificationToast.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── TeamContext.tsx
│   │   │   └── PRDContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useTeam.ts
│   │   │   ├── usePRD.ts
│   │   │   └── useApi.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── teams.ts
│   │   │   └── prds.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── TeamWorkspace.tsx
│   │   │   ├── CreatePRD.tsx
│   │   │   ├── ViewPRD.tsx
│   │   │   ├── Login.tsx
│   │   │   └── Signup.tsx
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── team.ts
│   │   │   ├── prd.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── constants.ts
│   │   │   ├── helpers.ts
│   │   │   └── markdown.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   └── components.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.html
│   ├── tests/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── setup.ts
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── .env.example
├── shared/
│   ├── types/
│   │   ├── auth.ts
│   │   ├── team.ts
│   │   ├── prd.ts
│   │   └── api.ts
│   └── package.json
├── docs/
│   ├── api/
│   │   ├── authentication.md
│   │   ├── teams.md
│   │   └── prds.md
│   ├── deployment/
│   │   ├── production.md
│   │   └── development.md
│   └── README.md
├── docker-compose.yml
├── .gitignore
├── README.md
└── package.json
```

## **Setup Commands & Build Process**

### **1. Initial Project Setup**

```bash
# Clone or create project directory
mkdir prd-creator && cd prd-creator

# Initialize monorepo
npm init -y
npm install -D concurrently nodemon

# Backend setup
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install knex pg @types/pg dotenv cors helmet bcryptjs jsonwebtoken
npm install -D @types/cors @types/helmet @types/bcryptjs @types/jsonwebtoken
npm install -D jest @types/jest supertest @types/supertest ts-jest

# Frontend setup
cd ../
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install lucide-react tailwindcss postcss autoprefixer
npm install axios react-router-dom @types/react-router-dom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Shared types
mkdir shared && cd shared
npm init -y
npm install typescript
```

### **2. Backend Configuration Files**

**backend/package.json:**
```json
{
  "name": "prd-creator-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "db:migrate": "knex migrate:latest",
    "db:rollback": "knex migrate:rollback",
    "db:seed": "knex seed:run"
  },
  "dependencies": {
    "express": "^4.18.2",
    "knex": "^3.0.1",
    "pg": "^8.11.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "@types/node": "^20.8.0",
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.14",
    "@types/helmet": "^4.0.0",
    "@types/bcryptjs": "^2.4.4",
    "@types/jsonwebtoken": "^9.0.3",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.5",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.12",
    "nodemon": "^3.0.1"
  }
}
```

**backend/tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**backend/knexfile.ts:**
```typescript
import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'prd_creator_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },
  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME_TEST || 'prd_creator_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    migrations: {
      directory: './src/database/migrations'
    }
  },
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/database/migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

export default config;
```

### **3. Frontend Configuration Files**

**frontend/package.json scripts section:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

**frontend/tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        blob: 'blob 7s infinite',
      },
      keyframes: {
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        }
      }
    },
  },
  plugins: [],
}
```

### **4. Root Package.json (Monorepo)**

```json
{
  "name": "prd-creator",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "setup": "npm run setup:backend && npm run setup:frontend",
    "setup:backend": "cd backend && npm install",
    "setup:frontend": "cd frontend && npm install"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

### **5. Docker Setup**

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: prd_creator_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: prd_creator_dev
      DB_USER: postgres
      DB_PASSWORD: password
      JWT_SECRET: your-jwt-secret
    depends_on:
      - postgres
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
```

### **6. Environment Files**

**backend/.env.example:**
```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prd_creator_dev
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Email (using Resend)
RESEND_API_KEY=your-resend-api-key

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Claude AI
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**frontend/.env.example:**
```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=PRD Creator
```

## **Build & Development Commands**

### **Complete Setup (First Time)**

```bash
# 1. Clone/create project
git clone <your-repo> prd-creator
cd prd-creator

# 2. Install all dependencies
npm run setup

# 3. Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your values

# 4. Start database
docker-compose up postgres -d

# 5. Run database migrations
cd backend
npm run db:migrate
npm run db:seed  # Optional: add sample data

# 6. Start development servers
cd ..
npm run dev
```

### **Daily Development Commands**

```bash
# Start everything (backend + frontend + db)
npm run dev

# Backend only
npm run dev:backend

# Frontend only  
npm run dev:frontend

# Run tests
npm run test

# Database operations
cd backend
npm run db:migrate        # Run new migrations
npm run db:rollback      # Rollback last migration
npm run db:seed          # Seed sample data

# Build for production
npm run build
```

### **Production Build**

```bash
# Build both backend and frontend
npm run build

# Backend build creates dist/ folder
# Frontend build creates dist/ folder

# Start production server
cd backend && npm start
```

Great question! Now that we have the basic team workspace foundation, let's prioritize what to build next based on impact and user value. Here are the logical next steps:

## **Immediate Next Steps (Next 2-3 weeks)**

### **Option A: Complete Team Features (Recommended)**
**Why this first:** Finish the team experience before adding complexity

**Week 3 Tasks:**
- **Team member management UI** - Remove members, change roles, pending invitations
- **Team settings page** - Team name, avatar, preferences
- **Permission refinements** - Who can invite, delete PRDs, etc.
- **Team onboarding flow** - Guided setup for new teams

**Week 4 Tasks:**
- **Real-time notifications** - New PRDs, mentions, invites
- **Team activity feed** - "John created a PRD", "Sarah joined team"
- **Improved team PRD discovery** - Tags, categories, search
- **Team analytics dashboard** - PRD creation trends, member activity

### **Option B: Launch-Ready Features (Public Growth)**
**Why this:** Get to market faster, start building user base

**Week 3 Tasks:**
- **Enhanced sharing system** - Public PRD gallery, social previews
- **SEO optimization** - Meta tags, sitemap, structured data
- **Landing page redesign** - Showcase features, testimonials
- **Email automation** - Welcome series, activation emails

**Week 4 Tasks:**
- **User onboarding flow** - Interactive tutorial, progress tracking
- **More industry templates** - 10+ professional templates
- **Export improvements** - Better PDF, Notion integration
- **Analytics dashboard** - User metrics, popular templates

### **Option C: Monetization Foundation (Revenue)**
**Why this:** Start generating revenue early

**Week 3 Tasks:**
- **Stripe integration** - Subscription management, billing
- **Plan limits enforcement** - PRD quotas, feature gating
- **Upgrade prompts** - Contextual upsells, usage warnings
- **Basic admin dashboard** - User management, revenue tracking

**Week 4 Tasks:**
- **Team billing** - Seat management, team plans
- **Usage analytics** - Track plan utilization
- **Customer support tools** - Help desk integration
- **Pricing page optimization** - A/B test pricing tiers

## **My Recommendation: Option A + Key Elements from B**

Here's why and the specific roadmap:

### **Week 3: Complete Team Experience**

**Priority 1: Member Management (Days 1-3)**
```typescript
// Features to build:
- Remove team members
- Change member roles (owner → admin → member)
- View pending invitations
- Resend/cancel invitations
- Member activity tracking
```

**Priority 2: Team Settings (Days 4-5)**
```typescript
// Features to build:
- Edit team name and description
- Team avatar/logo upload
- Team preferences (default PRD visibility, etc.)
- Danger zone (delete team, leave team)
```

### **Week 4: Public Launch Prep**

**Priority 1: Enhanced Sharing (Days 1-3)**
```typescript
// Features to build:
- Public PRD gallery (curated examples)
- Social media preview cards
- "Use this template" functionality
- Share analytics (views, clicks)
```

**Priority 2: Onboarding & Templates (Days 4-5)**
```typescript
// Features to build:
- Interactive onboarding tour
- 5 new industry templates
- Template preview mode
- Progress tracking
```

## **Detailed Implementation Plan**

### **Week 3, Day 1-3: Member Management System**

**Backend API Extensions:**
```typescript
// New endpoints to add
PUT  /teams/:teamId/members/:userId/role    // Change member role
DELETE /teams/:teamId/members/:userId       // Remove member
GET  /teams/:teamId/invitations            // List pending invites
DELETE /teams/:teamId/invitations/:id      // Cancel invitation
POST /teams/:teamId/invitations/:id/resend // Resend invitation
```

**Frontend Components:**
```typescript
// Components to build:
- TeamMembersList.tsx
- MemberRoleSelector.tsx
- PendingInvitationsList.tsx
- RemoveMemberModal.tsx
- TeamMemberCard.tsx
```

### **Key Features to Focus On:**

1. **Member Management UI**
   - Role-based permissions (owner > admin > member)
   - Bulk member actions
   - Member activity history

2. **Enhanced PRD Sharing**
   - Team PRD templates library
   - External sharing with analytics
   - PRD commenting system

3. **Onboarding & Growth**
   - Guided team setup
   - Template marketplace
   - Social sharing optimization

## **Success Metrics to Track**

**Week 3 Goals:**
- Teams can manage members effectively
- 90% of teams have >1 member
- Team PRD creation increases 2x

**Week 4 Goals:**
- Public PRD shares increase 5x
- Template usage increases 3x
- User activation rate >60%

## **Questions for You:**

1. **Primary Goal:** Are you more focused on building a solid product (Option A) or getting to market quickly (Option B)?

2. **Team Size:** How many developers are working on this? This affects what we can realistically build.

3. **Timeline:** Do you have a specific launch date in mind?

4. **User Feedback:** Have you tested the current version with any users? Their feedback could guide priorities.

5. **Revenue Timeline:** How quickly do you need to start generating revenue?

**My strong recommendation:** Start with **Week 3** member management and **Week 4** public sharing. This gives you a complete, shareable product that teams will love and that can go viral.

