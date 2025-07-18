# PRD Creator - Claude Code Configuration

## Project Overview

PRD Creator is a productivity tool that transforms vague product ideas into clear, professional Product Requirements Documents (PRDs). The application features a glassmorphism UI design and supports both individual and team workflows.

### Core Features

- AI-powered PRD generation using Claude
- Team workspaces with member management
- Real-time collaboration on PRDs
- Template library and customization
- Export functionality (PDF, Markdown, integrations)
- Subscription-based monetization

## Tech Stack

### Backend

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Knex.js migrations
- **Authentication**: JWT tokens
- **Email**: Resend API
- **AI Integration**: Anthropic Claude API
- **Payment Processing**: Stripe
- **Testing**: Jest with Supertest

### Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with glassmorphism design
- **State Management**: React Context + Zustand (for complex state)
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Testing**: Vitest with React Testing Library

### Infrastructure

- **Development**: Docker Compose
- **Database**: PostgreSQL 15
- **File Storage**: Local/S3 (for avatars, exports)
- **Deployment**: Docker containers

## Project Structure

```
prd-creator/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── database/        # Migrations, seeds
│   │   ├── routes/          # API routes
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Environment config
│   └── tests/               # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API clients
│   │   ├── types/           # TypeScript interfaces
│   │   └── utils/           # Helper functions
│   └── tests/               # Frontend tests
└── shared/                  # Shared types between FE/BE
```

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose
- npm or yarn

### Environment Variables

#### Backend (.env)

```env
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prd_creator_dev
DB_USER=postgres
DB_PASSWORD=password

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# External APIs
ANTHROPIC_API_KEY=your-anthropic-api-key
RESEND_API_KEY=your-resend-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# URLs
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=PRD Creator
VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Quick Start Commands

```bash
# Install dependencies
npm run setup

# Start development servers
npm run dev

# Run database migrations
cd backend && npm run db:migrate

# Run tests
npm run test
```

## Current Implementation Status

### ✅ Completed Features

- **Core PRD Generation**: AI-powered PRD creation with Claude integration
- **Glassmorphism UI**: Modern, interactive user interface
- **Team Workspaces**: Basic team creation and member management
- **Authentication**: JWT-based user authentication
- **Database Schema**: Complete schema with migrations for users, teams, PRDs
- **Team PRD Sharing**: Members can share PRDs within team workspace
- **Basic Permissions**: Owner/member role system

### 🚧 In Progress

- **Enhanced Member Management**: Role changes, member removal, invitation management
- **Team Settings**: Team customization and preferences
- **Real-time Features**: Live collaboration and notifications

### 📋 Planned Features

- **Public PRD Gallery**: Showcase and template sharing
- **Advanced Permissions**: Granular role-based access control
- **Stripe Integration**: Subscription billing and plan management
- **Export Features**: PDF generation, Notion/Slack integrations
- **Analytics Dashboard**: Usage metrics and team insights
- **Email Automation**: Onboarding and engagement sequences

## Key Components

### Backend Services

- `teamService.ts`: Team creation, member management, permissions
- `prdService.ts`: PRD CRUD operations, team sharing, AI generation
- `authService.ts`: User authentication and JWT management
- `emailService.ts`: Transactional emails and automation
- `stripeService.ts`: Subscription and billing management

### Frontend Components

- `PRDCreator.tsx`: Main PRD creation interface with AI generation
- `TeamWorkspace.tsx`: Team dashboard and PRD library
- `TeamSwitcher.tsx`: Team selection and creation interface
- `TeamPRDLibrary.tsx`: Team PRD listing with filters and search
- `InviteMembers.tsx`: Team member invitation system

### Database Schema

- **users**: User accounts with authentication and preferences
- **teams**: Team workspaces with settings and ownership
- **team_members**: Many-to-many relationship with roles
- **prds**: Product requirements documents with team sharing
- **templates**: Reusable PRD templates (global and team-specific)

## API Endpoints

### Authentication

- `POST /auth/register`: User registration
- `POST /auth/login`: User login
- `GET /auth/me`: Get current user profile

### Teams

- `POST /teams`: Create new team
- `GET /teams/my-teams`: Get user's teams
- `POST /teams/switch`: Switch current team context
- `POST /teams/:id/invite`: Invite team member
- `GET /teams/:id/members`: Get team members
- `PUT /teams/:id/members/:userId/role`: Update member role
- `DELETE /teams/:id/members/:userId`: Remove team member

### PRDs

- `POST /prds`: Create new PRD
- `GET /prds`: Get user's PRDs
- `GET /teams/:id/prds`: Get team PRDs
- `PUT /prds/:id`: Update PRD
- `POST /prds/:id/share`: Share PRD with team
- `GET /shared/:token`: Get public shared PRD

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow React functional components with hooks
- Use async/await for asynchronous operations
- Implement proper error handling and validation
- Write tests for critical business logic

### Database Operations

- Always use transactions for multi-table operations
- Include proper indexes for query performance
- Use parameterized queries to prevent SQL injection
- Run migrations in separate commits

### Frontend Patterns

- Use React Context for global state (auth, teams)
- Implement loading and error states for all async operations
- Follow Tailwind CSS utility-first approach
- Use Lucide React for consistent iconography

### Security Considerations

- Validate all user inputs server-side
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Sanitize data before database operations
- Implement proper CORS configuration

## Testing Strategy

### Backend Testing

- Unit tests for services and utilities
- Integration tests for API endpoints
- Database transaction testing
- Authentication and authorization testing

### Frontend Testing

- Component unit tests with React Testing Library
- Hook testing for custom hooks
- Integration tests for user workflows
- Accessibility testing

## Deployment Configuration

### Docker Setup

- Multi-stage builds for production optimization
- Separate containers for backend, frontend, database
- Environment-specific configurations
- Health checks and logging

### Production Considerations

- Database connection pooling
- Redis for session management and caching
- File upload handling with cloud storage
- Error monitoring and logging
- Performance monitoring

## Recent Changes and Context

### Latest Sprint (Team Workspace Foundation)

- Implemented basic team creation and member invitation system
- Added team-scoped PRD sharing functionality
- Created team switcher UI component
- Built team PRD library with filtering capabilities
- Established permission system for team operations

### Current Focus

The project is transitioning from individual PRD creation to collaborative team workspaces. The immediate priority is completing member management features and enhancing the team collaboration experience.

### Next Priorities

1. Complete member management (role changes, removal)
2. Team settings and customization
3. Public PRD sharing and template gallery
4. Stripe integration for monetization
5. Real-time collaboration features

## Additional Instructions

First do read the following files and understand the codebase and code snippets
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET.md
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET-WEEKS 1-2.md
/Users/rihan/all-coding-project/prd-creator/docs/PRD-CREATOR.md
then do implement the code snippets in the files as per the instructions given in the files.