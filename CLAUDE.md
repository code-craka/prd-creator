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

```markdown
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

### ✅ Completed Features (v1.2.0)

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
- **Multi-Layer Validation**: Client-side, server-side, and database constraints
- **Joi Validation Schemas**: Comprehensive validation for all team operations

#### 👥 Advanced Team Collaboration System

- **Team Workspaces**: Create and manage multiple team environments
- **Comprehensive Member Management**: Complete invitation system with pending/expired states
- **Role-Based Permissions**: Granular access control with Owner, Admin, and Member roles
- **Activity Tracking**: Full audit trail of team activities and member analytics
- **Team Settings**: Complete team customization and administration interface
- **Member Analytics**: Track individual contributions, PRD activity, and engagement
- **Invitation System**: Send invitations with custom roles and personal messages
- **Permission Management**: Fine-grained control over team operations and data access

#### 🛠 Enhanced Member Role Management

- **Dynamic Role Changes**: Real-time role updates with immediate UI feedback
- **Permission Validation**: Server-side validation for all role operations
- **Audit Trail**: Complete tracking of who changed what and when
- **Bulk Operations**: Efficient handling of multiple member operations
- **Security Controls**: Prevention of self-role changes and unauthorized actions
- **Role Hierarchy**: Owner → Admin → Member with proper permission inheritance

#### 🛡️ Team Administration Features

- **Team Settings Page**: Comprehensive team customization interface with live preview
- **Ownership Transfer**: Secure ownership transfer with multi-step confirmation flow
- **Team Deletion**: Multi-step deletion process with name verification and data protection
- **Member Role Management**: Dynamic role changes with comprehensive audit trail
- **Activity Monitoring**: Real-time tracking of team member activities and contributions
- **Invitation Management**: Pending, resend, and cancel invitation workflows
- **Danger Zone**: Protected destructive actions with multiple confirmation steps

#### ⚙️ Complete Team Settings & Customization

- **Team Information Management**: Edit name, description, and avatar with live preview
- **Visual Customization**: Custom avatars with automatic fallback generation
- **Team Analytics**: Member count, creation date, and ownership information
- **Administrative Controls**: Owner-only actions with proper permission validation
- **Audit Logging**: Complete tracking of all administrative actions and changes
- **Data Integrity**: Comprehensive validation and transaction safety for all operations

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
- **Progressive Disclosure**: Organized information hierarchy with collapsible sections
- **Smart Loading States**: Smooth loading indicators and optimistic updates
- **Permission-Based UI**: Dynamic interface rendering based on user permissions

#### 📚 Development Infrastructure

- **Monorepo Structure**: Organized workspace with shared types
- **Database Migrations**: Version-controlled schema management
- **API Documentation**: Complete API reference with examples
- **Environment Configs**: Development, staging, and production setups
- **Enhanced Error Handling**: Comprehensive error handling with meaningful messages
- **Code Quality**: Fixed linting and compilation issues across the codebase

#### 🔄 DevOps & Automation

- **CI/CD Pipeline**: Automated testing and deployment workflows
- **GitHub Integration**: Issue templates, PR templates, and workflows
- **Dependabot**: Automated dependency updates and security patches
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode
- **Build Optimization**: Resolved all linting errors and router import issues

#### 📖 Comprehensive Documentation

- **Setup Guides**: Complete installation and configuration instructions
- **API Reference**: Detailed endpoint documentation with examples
- **Database Schema**: Complete table relationships and design documentation
- **Development Guide**: Detailed development setup and guidelines
- **Contributing Guide**: Community contribution standards and workflows
- **Feature Documentation**: Detailed documentation for member management and team settings
- **Implementation Guides**: Complete technical documentation for all major features

### ✅ Advanced AI & Collaboration Features (v2.0.0)

#### 🤖 AI-Powered PRD Generation

- **Multi-Provider Support**: Anthropic Claude and OpenAI GPT integration
- **Intelligent Prompt Engineering**: Context-aware PRD generation with industry-specific templates
- **PRD Type Specialization**: Feature, Product, API, Mobile, Web, Enhancement, and Custom types
- **Writing Style Options**: Technical, Business, Executive, Detailed, and Concise styles
- **AI Generation Wizard**: Step-by-step guided PRD creation with smart suggestions
- **Section-Specific AI**: Real-time AI suggestions and content improvement for individual sections

#### 🔄 Real-time Collaboration System

- **Live Document Editing**: Multi-user simultaneous editing with operational transformation
- **Presence Indicators**: Real-time user awareness with cursor tracking and typing indicators
- **Collaborative Commenting**: Section-specific comments with threaded discussions and resolution
- **WebSocket Infrastructure**: Low-latency real-time communication using Socket.IO
- **Conflict Resolution**: Intelligent handling of simultaneous document edits
- **User Activity Tracking**: Comprehensive collaboration analytics and engagement metrics

#### 🎯 Advanced Features

- **Smart Suggestions**: AI-powered content recommendations based on document context
- **Version History**: Complete document revision tracking with rollback capabilities
- **Real-time Notifications**: Instant alerts for comments, user activity, and document changes
- **Permission-Based UI**: Dynamic interface rendering based on user roles and permissions
- **Cross-Platform Support**: Seamless collaboration across web and future mobile platforms

### 🚧 Currently Available (Ready for Enhancement)

- **Advanced Analytics**: Event tracking system foundation in place
- **Email Integration**: Resend API configuration ready
- **Export Features**: PDF and integration framework planned
- **Mobile Application**: React Native development planned
- **Enterprise Features**: SSO and white-label customization framework ready

### 📋 Next Development Priorities

- **Public PRD Gallery**: Community template sharing and discovery
- **Advanced Export Features**: PDF generation, Confluence/Notion integration
- **Team Analytics Dashboard**: Productivity metrics and collaboration insights
- **Mobile Application**: React Native app with offline support
- **Enterprise Features**: SSO, advanced security, and white-label options
- **API Documentation Tools**: Auto-generate API docs from PRDs
- **Integration Ecosystem**: Jira, Slack, Microsoft Teams, and other tool integrations

## Key Components

### Backend Services

- `teamService.ts`: Team creation, settings management, ownership transfer, deletion with comprehensive validation
- `memberService.ts`: Advanced member management, invitations, activity tracking, and role management
- `prdService.ts`: PRD CRUD operations, team sharing, AI generation
- `aiService.ts`: Multi-provider AI integration, prompt engineering, content generation and improvement
- `collaborationService.ts`: Real-time collaboration, WebSocket management, document synchronization
- `authService.ts`: User authentication and JWT management
- `emailService.ts`: Transactional emails and automation
- `stripeService.ts`: Subscription and billing management
- `validationService.ts`: Comprehensive Joi validation schemas for all operations

### Frontend Components

#### Core PRD Components

- `PRDCreator.tsx`: Main PRD creation interface with AI generation
- `CollaborativePRDEditor.tsx`: Real-time collaborative editor with presence indicators and AI suggestions
- `AIGenerationWizard.tsx`: Step-by-step AI-powered PRD generation wizard

#### Collaboration Components  

- `PresenceIndicators.tsx`: Real-time user awareness and cursor tracking
- `CommentSystem.tsx`: Collaborative commenting with threaded discussions
- `ActivityFeed.tsx`: Team activity tracking and analytics
- `NotificationCenter.tsx`: Real-time notifications for collaboration events

#### Team Management Components

- `TeamWorkspace.tsx`: Team dashboard and PRD library
- `TeamSwitcher.tsx`: Team selection and creation interface
- `TeamPRDLibrary.tsx`: Team PRD listing with filters and search
- `TeamMembersManager.tsx`: Complete member management interface
- `MemberCard.tsx`: Individual member display with actions
- `InviteMemberModal.tsx`: Advanced invitation creation with roles
- `InvitationsManager.tsx`: Pending invitation management
- `TeamSettings.tsx`: Complete team administration interface with live preview
- `TransferOwnershipModal.tsx`: Secure ownership transfer workflow with member selection
- `DeleteTeamModal.tsx`: Multi-step team deletion with name verification and impact preview

#### AI & Utility Components

- `AIProviderSettings.tsx`: AI provider configuration and API key management
- `VersionHistory.tsx`: Document version tracking and rollback interface
- `ExportOptions.tsx`: Advanced export functionality for multiple formats

### Database Schema

#### Core Tables

- **users**: User accounts with authentication and preferences
- **teams**: Team workspaces with settings and ownership
- **team_members**: Many-to-many relationship with roles and activity tracking
- **prds**: Product requirements documents with team sharing and AI metadata

#### Collaboration Tables

- **prd_comments**: Section-specific collaborative comments with threading support
- **prd_versions**: Complete version history with rollback capabilities
- **team_invitations**: Pending invitations with status and expiration management
- **member_activity_logs**: Comprehensive audit trail of team activities
- **role_change_history**: Track role changes with reasons and timestamps

#### Content & Templates

- **templates**: Reusable PRD templates (global and team-specific)
- **ai_generation_logs**: Track AI usage and generation metadata for analytics

## API Endpoints

### Authentication

- `POST /auth/register`: User registration
- `POST /auth/login`: User login
- `GET /auth/me`: Get current user profile

### Teams

- `POST /teams`: Create new team with validation
- `GET /teams/my-teams`: Get user's teams with role information
- `POST /teams/switch`: Switch current team context
- `GET /teams/:id/settings`: Get enhanced team settings with member count and analytics
- `PUT /teams/:id`: Update team information (name, description, avatar) with validation
- `POST /teams/:id/transfer-ownership`: Transfer team ownership with confirmation and audit trail
- `DELETE /teams/:id`: Delete team with name confirmation and comprehensive cleanup
- `GET /teams/:id/members`: Get team members with activity data and analytics
- `PUT /teams/:id/members/:userId/role`: Update member role with validation and audit trail
- `DELETE /teams/:id/members/:userId`: Remove team member with reason tracking

### Enhanced Member Management

- `POST /teams/:id/invitations`: Create invitation with role and custom message
- `GET /teams/:id/invitations`: List pending invitations with status tracking
- `POST /teams/:id/invitations/:inviteId/resend`: Resend invitation with updated expiration
- `DELETE /teams/:id/invitations/:inviteId`: Cancel invitation with audit logging
- `POST /invitations/accept/:token`: Accept invitation via secure token

### Activity & Analytics

- `GET /teams/:id/activity`: Get comprehensive team activity logs with filtering
- `GET /teams/:id/role-history`: Get detailed role change history with reasons and timestamps

### AI-Powered Generation

- `POST /ai/generate-prd`: Generate comprehensive PRD using AI with customizable parameters
- `POST /ai/suggestions`: Get AI-powered suggestions for specific PRD sections
- `POST /ai/improve-section`: Improve PRD sections based on feedback using AI
- `POST /ai/create-prd`: Create new PRD from AI-generated content
- `GET /ai/templates`: Get available AI generation templates and configurations
- `GET /ai/validate-keys`: Validate configured AI provider API keys

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

- Validate all user inputs server-side with Joi schemas
- Implement comprehensive permission validation for all operations
- Use multi-step confirmation for destructive actions
- Implement rate limiting on API endpoints
- Use HTTPS in production
- Sanitize data before database operations
- Implement proper CORS configuration
- Use database transactions for data integrity
- Implement comprehensive audit logging for all administrative actions

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

### Latest Sprint (AI-Powered Generation & Real-time Collaboration)

- ✅ **AI-Powered PRD Generation** with multi-provider support (Anthropic Claude, OpenAI GPT)
- ✅ **Intelligent Prompt Engineering System** with context-aware generation and multiple PRD types
- ✅ **Real-time Collaborative Editing** with WebSocket infrastructure and operational transformation
- ✅ **Live Presence Indicators** with user awareness, cursor tracking, and typing indicators
- ✅ **Collaborative Commenting System** with section-specific comments and threaded discussions
- ✅ **AI-Powered Suggestions** with real-time content improvement and section enhancement
- ✅ **Professional Collaboration UI** with glassmorphism design and real-time updates
- ✅ **Enhanced Member Role Management** with dynamic role changes and comprehensive validation
- ✅ **Complete Team Settings Interface** with live preview and customization options  
- ✅ **Comprehensive Security Implementation** with multi-layer validation and audit logging

### Current Implementation & Status

The PRD Creator application now features a complete team management system with AI-powered PRD generation and real-time collaboration capabilities. All features are production-ready with:

- **Complete Member Management**: Role changes, member removal, invitation system
- **Advanced Team Settings**: Customization, ownership transfer, secure deletion
- **AI-Powered PRD Generation**: Multi-provider AI support with intelligent prompt engineering
- **Real-time Collaboration**: Live editing, presence indicators, and collaborative commenting
- **Comprehensive Security**: Multi-layer validation, audit trails, permission controls
- **Professional UI/UX**: Glassmorphism design with progressive disclosure and smart loading states

### Next Priorities

1. ✅ ~~Enhanced member role management with validation~~ **COMPLETED**
2. ✅ ~~Complete team settings page with customization options~~ **COMPLETED**  
3. ✅ ~~Danger zone implementation with multi-step confirmation~~ **COMPLETED**
4. ✅ ~~AI prompt engineering and enhanced PRD generation capabilities~~ **COMPLETED**
5. ✅ ~~Real-time collaboration features (live editing, notifications, presence indicators)~~ **COMPLETED**
6. Public PRD sharing and community template gallery
7. Stripe integration for subscription-based monetization  
8. Advanced analytics and team productivity metrics dashboard
9. Mobile application development
10. Enterprise features (SSO, white-label options)

## Additional Instructions

First do read the following files and understand the codebase and code snippets
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET.md
/Users/rihan/all-coding-project/prd-creator/docs/TOTAL-PROJECT-CODESNIPPET-WEEKS 1-2.md
/Users/rihan/all-coding-project/prd-creator/docs/PRD-CREATOR.md
then do implement the code snippets in the files as per the instructions given in the files
