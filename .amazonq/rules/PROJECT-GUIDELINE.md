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

### ✅ Completed Features (v1.1.0)

#### 🤖 AI Integration Framework

- **Dual AI Support**: OpenAI GPT-4 and Anthropic Claude integration ready
- **AI Service Architecture**: Flexible AI provider system for PRD generation
- **Context-Aware Generation**: AI understands user and team context

#### 🏗 Complete Full-Stack Architecture

- **Backend API**: Node.js + Express + TypeScript with comprehensive routes
- **Frontend Application**: React 18.2+ + Vite + TypeScript with modern UI
- **Database System**: PostgreSQL with Knex.js migrations and relationships
- **Shared Types**: TypeScript interfaces across frontend and backend

#### 🔐 Authentication & Security

- **JWT Authentication**: Complete user registration, login, and session management
- **Password Security**: bcrypt hashing with 12 rounds
- **Role-Based Access Control**: Owner, Admin, Member permissions
- **Input Validation**: Comprehensive server-side validation and sanitization

#### 👥 Advanced Team Collaboration System

- **Team Workspaces**: Create and manage multiple team environments
- **Comprehensive Member Management**: Complete invitation system with pending/expired states
- **Role-Based Permissions**: Granular access control with Owner, Admin, and Member roles
- **Activity Tracking**: Full audit trail of team activities and member analytics
- **Team Settings**: Complete team customization and administration interface
- **Member Analytics**: Track individual contributions, PRD activity, and engagement
- **Invitation System**: Send invitations with custom roles and personal messages
- **Permission Management**: Fine-grained control over team operations and data access

#### 🛡️ Team Administration Features

- **Team Settings Page**: Comprehensive team customization interface
- **Ownership Transfer**: Secure ownership transfer with confirmation flow
- **Team Deletion**: Multi-step deletion process with data protection
- **Member Role Management**: Dynamic role changes with audit trail
- **Activity Monitoring**: Real-time tracking of team member activities
- **Invitation Management**: Pending, resend, and cancel invitation workflows

#### 📊 PRD Management

- **CRUD Operations**: Complete PRD creation, editing, and deletion
- **Sharing System**: Private, Team, and Public visibility levels
- **Public Links**: Shareable token-based public PRD access
- **View Tracking**: Analytics for PRD engagement and popularity

#### 🎨 Modern UI/UX

- **Glassmorphism Design**: Beautiful glass-like effects with dark theme
- **Responsive Layout**: Mobile-friendly design across all devices
- **Interactive Components**: Dashboard, navigation, and form components
- **Animated Gradients**: Dynamic background effects and transitions

#### 📚 Development Infrastructure

- **Monorepo Structure**: Organized workspace with shared types
- **Database Migrations**: Version-controlled schema management
- **API Documentation**: Complete API reference with examples
- **Environment Configs**: Development, staging, and production setups

#### 🔄 DevOps & Automation

- **CI/CD Pipeline**: Automated testing and deployment workflows
- **GitHub Integration**: Issue templates, PR templates, and workflows
- **Dependabot**: Automated dependency updates and security patches
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode

#### 📖 Comprehensive Documentation

- **Setup Guides**: Complete installation and configuration instructions
- **API Reference**: Detailed endpoint documentation with examples
- **Database Schema**: Complete table relationships and design documentation
- **Development Guide**: Detailed development setup and guidelines
- **Contributing Guide**: Community contribution standards and workflows

### 🚧 Currently Available (Ready for Enhancement)

- **AI PRD Generation**: Framework ready, needs prompt engineering
- **Real-time Features**: WebSocket infrastructure planned
- **Advanced Analytics**: Event tracking system foundation in place
- **Email Integration**: Resend API configuration ready
- **Export Features**: PDF and integration framework planned

### 📋 Next Development Priorities

- **AI Prompt Engineering**: Enhance AI PRD generation with better prompts
- **Real-time Collaboration**: Live editing and notifications
- **Advanced Analytics**: Team productivity metrics and insights
- **Mobile App**: React Native application
- **Enterprise Features**: SSO, advanced security, and white-label options

## Key Components

### Backend Services

- `teamService.ts`: Team creation, settings management, ownership transfer, permissions
- `memberService.ts`: Advanced member management, invitations, activity tracking
- `prdService.ts`: PRD CRUD operations, team sharing, AI generation
- `authService.ts`: User authentication and JWT management
- `emailService.ts`: Transactional emails and automation
- `stripeService.ts`: Subscription and billing management

### Frontend Components

- `PRDCreator.tsx`: Main PRD creation interface with AI generation
- `TeamWorkspace.tsx`: Team dashboard and PRD library
- `TeamSwitcher.tsx`: Team selection and creation interface
- `TeamPRDLibrary.tsx`: Team PRD listing with filters and search
- `TeamMembersManager.tsx`: Complete member management interface
- `MemberCard.tsx`: Individual member display with actions
- `InviteMemberModal.tsx`: Advanced invitation creation with roles
- `InvitationsManager.tsx`: Pending invitation management
- `ActivityFeed.tsx`: Team activity tracking and analytics
- `TeamSettings.tsx`: Complete team administration interface
- `TransferOwnershipModal.tsx`: Secure ownership transfer workflow
- `DeleteTeamModal.tsx`: Multi-step team deletion with confirmation

### Database Schema

- **users**: User accounts with authentication and preferences
- **teams**: Team workspaces with settings and ownership
- **team_members**: Many-to-many relationship with roles and activity tracking
- **team_invitations**: Pending invitations with status and expiration management
- **member_activity_logs**: Comprehensive audit trail of team activities
- **role_change_history**: Track role changes with reasons and timestamps
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
- `GET /teams/:id/settings`: Get team settings and configuration
- `PUT /teams/:id`: Update team information (name, description, avatar)
- `POST /teams/:id/transfer-ownership`: Transfer team ownership
- `DELETE /teams/:id`: Delete team with confirmation
- `GET /teams/:id/members`: Get team members with activity data
- `PUT /teams/:id/members/:userId/role`: Update member role with audit trail
- `DELETE /teams/:id/members/:userId`: Remove team member

### Member Management

- `POST /teams/:id/invitations`: Create invitation with role and message
- `GET /teams/:id/invitations`: List pending invitations
- `POST /teams/:id/invitations/:inviteId/resend`: Resend invitation
- `DELETE /teams/:id/invitations/:inviteId`: Cancel invitation
- `POST /invitations/accept/:token`: Accept invitation via token

### Activity & Analytics

- `GET /teams/:id/activity`: Get team activity logs
- `GET /teams/:id/role-history`: Get role change history

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

### Latest Sprint (Team Administration & Settings)

- ✅ **Complete Team Settings Interface** with customization options
- ✅ **Ownership Transfer System** with secure confirmation flow
- ✅ **Team Deletion Workflow** with multi-step confirmation and data protection
- ✅ **Enhanced Team Management** with comprehensive administrative controls
- ✅ **Member Management System** with invitation, role, and activity tracking
- ✅ **Activity Analytics** with comprehensive audit trail and member insights
- ✅ **Database Optimization** with triggers, indexes, and automated logging
- ✅ **Professional UI Components** with glassmorphism design and real-time updates

### Current Focus

The project has successfully completed comprehensive team administration and settings management. All team collaboration features are now production-ready with professional-grade UI and robust security. The focus is now on enhancing the AI-powered PRD generation and adding real-time collaboration features.

### Next Priorities

1. ✅ ~~Complete member management (role changes, removal)~~ **COMPLETED**
2. ✅ ~~Team settings and customization dashboard~~ **COMPLETED**
3. AI prompt engineering and enhanced PRD generation
4. Real-time collaboration features (live editing, notifications)
5. Public PRD sharing and template gallery
6. Stripe integration for monetization
7. Advanced analytics and team productivity metrics

## Additional Instructions

First do read the following files and understand the codebase and code snippets
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET.md
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET-WEEKS 1-2.md
/Users/rihan/all-coding-project/prd-creator/docs/PRD-CREATOR.md
then do implement the code snippets in the files as per the instructions given in the files.