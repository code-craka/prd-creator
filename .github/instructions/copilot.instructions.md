# GitHub Copilot Instructions for PRD Creator

## 🎯 Project Overview

**PRD Creator** is a modern, AI-powered SaaS application that helps product managers, entrepreneurs, and development teams transform vague product ideas into professional Product Requirements Documents (PRDs). The application features team collaboration, AI integration with Claude and OpenAI, comprehensive analytics, and a sophisticated user onboarding system.

### Tech Stack
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Knex.js
- **Frontend**: React 18.2+, TypeScript, Vite, TailwindCSS, React Query
- **AI Integration**: Anthropic Claude API, OpenAI GPT API
- **Real-time**: Socket.IO for collaboration
- **Authentication**: JWT with role-based permissions
- **Styling**: TailwindCSS with glassmorphism design system

## 📁 Project Structure

```
prd-creator/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── config/       # Database and environment configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Authentication, validation, error handling
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic (AI, analytics, teams, etc.)
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helper functions
│   └── database/
│       ├── migrations/   # Database schema migrations
│       └── seeds/        # Test data
├── frontend/             # React + TypeScript SPA
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API clients
│   │   ├── stores/       # Zustand state management
│   │   ├── contexts/     # React context providers
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helper functions
└── shared/               # Shared TypeScript types and validation
    └── src/
        ├── types/        # Common interfaces
        └── validation.ts # Zod validation schemas
```

## 🏗 Core Architecture Patterns

### Backend Patterns

#### Service Layer Architecture
- All business logic lives in services (`src/services/`)
- Controllers are thin and handle request/response
- Services are testable and reusable

```typescript
// Example service structure
export class TeamService {
  static async createTeam(data: CreateTeamRequest): Promise<Team> {
    // Business logic here
  }
  
  static async inviteMember(teamId: string, email: string): Promise<void> {
    // Email invitation logic
  }
}
```

#### Database Patterns
- Use Knex.js query builder with TypeScript
- Always use transactions for multi-table operations
- UUID primary keys for better distribution

```typescript
// Database operation example
await db.transaction(async (trx) => {
  const team = await trx('teams').insert(teamData).returning('*');
  await trx('team_members').insert({ team_id: team.id, user_id, role: 'owner' });
});
```

#### API Response Pattern
```typescript
// Consistent API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
}
```

### Frontend Patterns

#### Component Factory Pattern
Use the component factory for consistent page layouts:

```typescript
import { createPage } from '../utils/componentFactory';

const MyContent = () => (
  <>
    <h1>Page Title</h1>
    <p>Content here...</p>
  </>
);

export const MyPage = createPage(MyContent, {
  variant: 'glass',
  displayName: 'MyPage'
});
```

#### Hooks Pattern
- Custom hooks for complex state logic
- React Query for server state
- Zustand for global client state

```typescript
// Example custom hook
export const useAnalytics = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.getDashboardData
  });
  
  return { data, isLoading };
};
```

#### State Management
- **Zustand**: Global app state (auth, current team)
- **React Query**: Server state and caching
- **Local State**: Component-specific state with useState

## 🤖 AI Integration Patterns

### AI Service Usage
```typescript
// AI PRD generation
const response = await aiService.generatePRD({
  prompt: "A mobile app for photo sharing",
  prdType: "mobile",
  style: "detailed",
  context: {
    company: "PhotoShare Inc",
    industry: "Social Media"
  }
});
```

### Multi-Provider Support
- Support both Anthropic Claude and OpenAI
- Graceful fallback between providers
- User can choose preferred provider

## 🎨 UI/UX Guidelines

### Design System
- **Glassmorphism**: Use `glass-card`, `glass-button-primary` classes
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Dark Theme**: Primary theme with purple/blue gradients
- **Accessibility**: Semantic HTML, proper ARIA labels

### Component Styling
```typescript
// Consistent button styling
<button className="glass-button-primary py-3 px-6">
  Primary Action
</button>

// Card containers
<div className="glass-card p-6">
  Content here
</div>
```

### Animation Guidelines
- Use Tailwind transition classes
- Hover states for interactive elements
- Loading states with proper skeletons

## 📊 Analytics & Tracking

### Event Tracking Pattern
```typescript
// Track user events
const { trackEvent } = useAnalytics();

await trackEvent({
  type: 'prd_created',
  data: { prd_id: newPrd.id, template_used: template.name }
});
```

### Analytics Hook Usage
```typescript
const {
  dashboardData,
  loading,
  loadDashboardData
} = useAnalytics();
```

## 🔐 Authentication & Security

### Protected Routes
```typescript
// Route protection
function ProtectedRoute() {
  const { user, isLoading } = useAuthStore();
  
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  
  return <Layout />;
}
```

### API Security
- JWT tokens in Authorization header
- Role-based access control (Owner, Admin, Member)
- Input validation with Joi/Zod schemas

## 🏢 Team Management

### Team Context
```typescript
const { currentTeam, switchTeam } = useAuthStore();

// Team-scoped operations
await teamService.getTeamPRDs(currentTeam.id);
```

### Permission Checks
```typescript
// Check user permissions
const canManageTeam = user.role === 'owner' || user.role === 'admin';
```

## 📝 Database Schema Key Tables

### Core Tables
- **users**: User accounts and profiles
- **teams**: Team workspaces
- **team_members**: Team membership with roles
- **prds**: Product Requirements Documents
- **prd_collaborators**: PRD-level permissions

### Analytics Tables
- **analytics_events**: User interaction tracking
- **team_productivity_metrics**: Team performance data
- **user_engagement_insights**: User behavior data

### Onboarding Tables
- **user_onboarding**: Onboarding progress tracking
- **onboarding_tutorial_progress**: Tutorial completion status
- **template_recommendations**: Personalized suggestions

## 🧪 Testing Guidelines

### Backend Testing
```typescript
// Service testing pattern
describe('TeamService', () => {
  it('should create team with owner', async () => {
    const team = await TeamService.createTeam({
      name: 'Test Team',
      ownerId: user.id
    });
    
    expect(team.name).toBe('Test Team');
  });
});
```

### Frontend Testing
```typescript
// Component testing with React Testing Library
test('renders dashboard page', () => {
  render(<DashboardPage />);
  expect(screen.getByText('Welcome back')).toBeInTheDocument();
});
```

## 🚀 Development Workflow

### File Naming Conventions
- **Components**: PascalCase (`TeamMembersManager.tsx`)
- **Hooks**: camelCase starting with 'use' (`useAnalytics.ts`)
- **Services**: camelCase (`analyticsService.ts`)
- **Types**: PascalCase interfaces (`TeamMember`, `AnalyticsData`)

### Import Organization
```typescript
// External imports first
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal imports
import { analyticsService } from '../services/analyticsService';
import { useAuthStore } from '../stores/authStore';
import { AnalyticsData } from '../types/analytics';
```

### Error Handling
```typescript
// API calls with proper error handling
try {
  const data = await apiCall();
  return data;
} catch (error) {
  console.error('Operation failed:', error);
  toast.error('Something went wrong');
  throw error;
}
```

## 📋 Code Patterns to Follow

### 1. Consistent API Patterns
- Use async/await consistently
- Proper error handling with try/catch
- Return typed responses

### 2. Component Composition
- Small, focused components
- Use composition over inheritance
- Props drilling avoided with proper state management

### 3. Type Safety
- Strict TypeScript configuration
- Shared types between frontend/backend
- Zod validation for runtime type checking

### 4. Performance
- React Query for efficient data fetching
- Proper memoization with useMemo/useCallback
- Lazy loading for heavy components

## 🔧 Environment Configuration

### Backend Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/prd_creator

# AI Integration
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key

# Authentication
JWT_SECRET=your-jwt-secret

# Email
RESEND_API_KEY=your-resend-key
```

### Frontend Environment Variables
```env
REACT_APP_API_URL=http://localhost:3001
```

## 📚 Key Features Implementation

### 1. AI PRD Generation
- Multi-provider AI support (Claude, OpenAI)
- Context-aware generation
- Section-by-section improvements
- Template recommendations

### 2. Real-time Collaboration
- Socket.IO for live editing
- User presence indicators
- Collaborative commenting
- Document conflict resolution

### 3. Analytics Dashboard
- Team productivity metrics
- User engagement tracking
- Template usage analytics
- Real-time data visualization

### 4. User Onboarding
- Progressive disclosure
- Industry-specific personalization
- Interactive tutorials
- Template recommendations

## 🎯 Best Practices

### 1. Code Quality
- Follow ESLint and TypeScript strict rules
- Write descriptive commit messages
- Add JSDoc comments for complex functions
- Keep functions small and focused

### 2. Performance
- Optimize bundle sizes
- Use React Query for caching
- Implement proper loading states
- Avoid unnecessary re-renders

### 3. User Experience
- Consistent loading states
- Proper error messages
- Responsive design
- Accessibility compliance

### 4. Security
- Validate all inputs
- Use parameterized queries
- Implement proper CORS
- Secure JWT token handling

## 📖 Documentation References

- **Full API Documentation**: `/docs/API.md`
- **Database Schema**: `/docs/DATABASE.md`
- **Analytics System**: `/docs/ANALYTICS-DASHBOARD.md`
- **AI Integration**: `/docs/AI-COLLABORATION-FEATURES.md`
- **User Onboarding**: `/docs/USER-ONBOARDING-SYSTEM.md`
- **Growth Engine**: `/docs/GROWTH-ENGINE-SYSTEM.md`
- **Development Setup**: `/docs/DEVELOPMENT.md`

---

*This project follows modern full-stack development practices with a focus on TypeScript, clean architecture, and user experience. When working on this codebase, prioritize type safety, consistent patterns, and comprehensive error handling.*
