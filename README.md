# 🚀 PRD Creator

> **Transform vague ideas into professional Product Requirements Documents with AI assistance**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.0+-blue.svg)](https://www.postgresql.org/)

[![CodeScene Average Code Health](https://codescene.io/projects/69377/status-badges/average-code-health)](https://codescene.io/projects/69377)
[![CodeScene Hotspot Code Health](https://codescene.io/projects/69377/status-badges/hotspot-code-health)](https://codescene.io/projects/69377)
[![CodeScene Missed Goals](https://codescene.io/projects/69377/status-badges/missed-goals)](https://codescene.io/projects/69377)
[![CodeScene System Mastery](https://codescene.io/projects/69377/status-badges/system-mastery)](https://codescene.io/projects/69377)
[![CodeScene general](https://codescene.io/images/analyzed-by-codescene-badge.svg)](https://codescene.io/projects/69377)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## 🎯 Overview

**PRD Creator** is a modern, AI-powered productivity tool designed to help product managers, entrepreneurs, and development teams transform vague product ideas into clear, professional Product Requirements Documents (PRDs).

With team collaboration features, beautiful glassmorphism design, and AI integration, PRD Creator streamlines the product planning process from ideation to execution.

## ✨ Features

### 🤖 AI-Powered PRD Generation

- **OpenAI & Anthropic Claude Integration**: Generate comprehensive PRDs from simple ideas
- **Smart Template System**: Industry-specific templates for different product types
- **Iterative Refinement**: Continuously improve PRDs with AI suggestions

### 👥 Advanced Team Collaboration

- **Multi-Team Workspaces**: Organize PRDs by teams and projects
- **Comprehensive Member Management**: Complete invitation system with pending/expired states
- **Role-Based Permissions**: Granular access control with Owner, Admin, and Member roles
- **Activity Tracking**: Full audit trail of team activities with member analytics
- **Real-time Collaboration**: Share and edit PRDs with team members
- **Advanced Invitations**: Send invitations with custom roles and personal messages
- **Member Analytics**: Track individual contributions, PRD activity, and engagement

### 🛡️ Team Administration

- **Team Settings Page**: Complete team customization and configuration interface
- **Ownership Transfer**: Secure ownership transfer with multi-step confirmation
- **Team Deletion**: Protected team deletion with comprehensive data cleanup
- **Member Role Management**: Dynamic role changes with full audit trail
- **Activity Monitoring**: Real-time tracking of all team member activities
- **Permission Controls**: Fine-grained access control for all team operations

### 🎨 Beautiful User Experience

- **Glassmorphism Design**: Modern, elegant interface with glass-like effects
- **Responsive Layout**: Works seamlessly across desktop and mobile devices
- **Dark Theme**: Easy on the eyes with animated gradients
- **Intuitive Navigation**: Clean, organized interface for productivity

### 🔐 Security & Privacy

- **JWT Authentication**: Secure user authentication and session management
- **Privacy Controls**: Private, Team, and Public visibility options
- **Data Protection**: Secure API endpoints with proper validation
- **Environment-based Configuration**: Separate dev/staging/prod environments

### 📊 Comprehensive Analytics Dashboard

- **Team Productivity Metrics**: Real-time tracking of PRD creation, collaboration sessions, and team performance
- **User Engagement Insights**: Detailed analytics on user activity, retention rates, and session patterns
- **PRD Creation Trends**: Visual trends showing daily, weekly, and monthly PRD creation patterns
- **Template Usage Analytics**: Popular templates, usage growth, and team preference insights
- **Top Contributors**: Leaderboard of most active team members with achievement tracking
- **Performance Optimization**: Data-driven insights for workflow improvement and resource planning
- **Interactive Visualizations**: Beautiful charts and graphs with real-time data updates
- **Export & Reporting**: Comprehensive analytics reports for stakeholders and leadership
- **Usage Analytics**: Track PRD views, engagement, and team activity
- **Performance Metrics**: Monitor team productivity and collaboration
- **Public Gallery**: Showcase PRDs in a community gallery
- **Export Options**: Multiple export formats for different use cases

## 🛠 Tech Stack

### Backend

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with async/await patterns
- **Database**: PostgreSQL with Knex.js migrations
- **Authentication**: JWT tokens with bcrypt password hashing
- **API Documentation**: RESTful API with comprehensive error handling

### Frontend

- **Framework**: React 18.2+ with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: Zustand for global state + React Query for server state
- **Styling**: Tailwind CSS with custom glassmorphism components
- **Routing**: React Router v6 with protected routes
- **Forms**: React Hook Form with Zod validation

### AI & External Services

- **AI Providers**: OpenAI GPT-4 & Anthropic Claude
- **Email**: Planned integration with Resend for team invitations
- **File Storage**: Planned integration for document attachments
- **Analytics**: Planned integration for usage tracking

### DevOps & Tools

- **Monorepo**: Organized workspace with shared TypeScript types
- **Development**: Concurrent development servers with hot reload
- **Testing**: Jest (planned) for unit and integration tests
- **Deployment**: Docker-ready with environment configurations

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL 14.0 or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/code-craka/prd-creator.git
   cd prd-creator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   # Create PostgreSQL database
   createdb prd_creator_dev
   
   # Run migrations
   cd backend
   npm run db:migrate
   ```

4. **Configure environment variables**

   ```bash
   # Backend (.env)
   DATABASE_URL=postgresql://username:password@localhost:5432/prd_creator_dev
   JWT_SECRET=your-secure-jwt-secret
   OPENAI_API_KEY=your-openai-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   
   # Frontend (.env)
   VITE_API_URL=http://localhost:3001
   ```

5. **Start the development servers**

   ```bash
   npm run dev
   ```

   This will start:

   - Backend API server on `http://localhost:3001`
   - Frontend React app on `http://localhost:3000`

6. **Access the application**
   - Open your browser to `http://localhost:3000`
   - Create an account or log in
   - Start creating PRDs!

## 🏗 Architecture

```
prd-creator/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── database/       # Migrations and seeds
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Helper functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── services/       # API client and services
│   │   ├── stores/         # Zustand state management
│   │   ├── styles/         # Global styles and themes
│   │   └── utils/          # Frontend utilities
│   ├── package.json
│   └── vite.config.ts
├── shared/                 # Shared TypeScript types
│   ├── src/types/
│   └── package.json
└── docs/                   # Documentation
```

### Key Design Principles

1. **Separation of Concerns**: Clear separation between API, business logic, and UI
2. **Type Safety**: End-to-end TypeScript for better developer experience
3. **Scalability**: Modular architecture that can grow with your needs
4. **Security**: Proper authentication, authorization, and input validation
5. **Performance**: Optimized queries, caching, and efficient state management

## 🛠 Development

### Available Scripts

```bash
# Root level commands
npm run dev                 # Start all development servers
npm run build              # Build all packages for production
npm run test               # Run all tests
npm run lint               # Lint all packages

# Backend specific
cd backend
npm run dev                # Start backend development server
npm run build              # Build backend for production
npm run db:migrate         # Run database migrations
npm run db:seed            # Seed database with sample data

# Frontend specific
cd frontend
npm run dev                # Start frontend development server
npm run build              # Build frontend for production
npm run preview            # Preview production build
```

### Database Migrations

```bash
# Create a new migration
cd backend
npm run db:migrate:make migration_name

# Run migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback
```

### Code Style & Standards

- **TypeScript**: Strict mode enabled for better type safety
- **ESLint**: Configured for React and Node.js best practices
- **Prettier**: Code formatting with consistent style
- **Git Hooks**: Pre-commit hooks for linting and formatting

## 🌐 Deployment

### Environment Setup

1. **Production Database**

   ```bash
   # Set up PostgreSQL in production
   DATABASE_URL=postgresql://user:pass@host:5432/prd_creator_prod
   ```

2. **API Keys**

   ```bash
   # Add your AI service API keys
   OPENAI_API_KEY=sk-...
   ANTHROPIC_API_KEY=sk-ant-...
   ```

3. **Security**

   ```bash
   # Generate secure JWT secret
   JWT_SECRET=your-super-secure-secret-key
   ```

### Build & Deploy

```bash
# Build all packages
npm run build

# Deploy backend (example with PM2)
pm2 start backend/dist/app.js --name prd-creator-api

# Deploy frontend (example with nginx)
# Copy frontend/dist to your web server
```

## 📚 Documentation

- [API Documentation](./docs/API.md) - Complete API reference
- [Database Schema](./docs/DATABASE.md) - Database design and relationships
- [Frontend Components](./docs/COMPONENTS.md) - UI component library
- [Development Setup](./docs/DEVELOPMENT.md) - Detailed development guide
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

**Sayem Abdullah Rihan**

- GitHub: [@code-craka](https://github.com/code-craka)
- Email: <codecraka@gmail.com>
- GitHub: [@code-craka](https://github.com/code-craka)
- Email: <codecraka@gmail.com>

- LinkedIn: [Connect with me](https://linkedin.com/in/sayem-rihan)

---

## 🙏 Acknowledgments

- OpenAI and Anthropic for AI capabilities
- The React and Node.js communities
- All contributors and users of PRD Creator

## 📈 Roadmap

- [ ] Advanced AI prompt engineering
- [ ] Real-time collaborative editing
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API webhooks and integrations
- [ ] Enterprise SSO support

---

<div align="center">
  <strong>Built with ❤️ by Sayem Abdullah Rihan</strong>
</div>
</div>
