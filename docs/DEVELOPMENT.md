# Development Guide

This guide provides detailed instructions for setting up and developing the PRD Creator application.

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18.0+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14.0+ ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))
- **npm** (comes with Node.js)

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/code-craka/prd-creator.git
   cd prd-creator
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**

   ```bash
   # Create database
   createdb prd_creator_dev
   
   # Create test database
   createdb prd_creator_test
   ```

4. **Configure environment variables**

   ```bash
   # Copy example files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit backend/.env with your database credentials
   # Edit frontend/.env with your API URL
   ```

5. **Run database migrations**

   ```bash
   cd backend
   npm run db:migrate
   ```

6. **Start development servers**

   ```bash
   # Return to root directory
   cd ..
   
   # Start both frontend and backend
   npm run dev
   ```

## 🏗 Project Structure

```markdown
prd-creator/
├── backend/                    # Node.js API server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── database/          # Migrations and seeds
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── stores/          # State management
│   │   ├── styles/          # CSS and styling
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── shared/                    # Shared TypeScript types
│   ├── src/types/
│   └── package.json
└── docs/                     # Documentation
```

## 🛠 Development Commands

### Root Level Commands

```bash
# Start all development servers
npm run dev

# Build all packages
npm run build

# Run tests for all packages
npm run test

# Lint all packages
npm run lint

# Setup all packages
npm run setup
```

### Backend Commands

```bash
cd backend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Database migrations
npm run db:migrate
npm run db:migrate:rollback
npm run db:migrate:latest

# Database seeding
npm run db:seed
npm run db:seed:rollback

# Create new migration
npm run db:migrate:make migration_name

# Create new seed
npm run db:seed:make seed_name

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Linting
npm run lint

# Type checking
npm run type-check
```

### Shared Package Commands

```bash
cd shared

# Build types
npm run build

# Watch mode for development
npm run dev
```

## 🗄 Database Development

### Schema Design

The database follows a normalized design with these main entities:

- **Users**: Authentication and profile data
- **Teams**: Team workspaces and settings
- **Team Members**: Role-based team membership
- **PRDs**: Product Requirements Documents
- **Templates**: Reusable PRD templates
- **Analytics**: Usage tracking and metrics

### Migration Best Practices

1. **Always create migrations for schema changes**

   ```bash
   npm run db:migrate:make descriptive_migration_name
   ```

2. **Test migrations thoroughly**

   ```bash
   # Run migration
   npm run db:migrate
   
   # Test rollback
   npm run db:migrate:rollback
   
   # Run migration again
   npm run db:migrate
   ```

3. **Include proper indexes**

   ```typescript
   // Example migration with index
   exports.up = function(knex) {
     return knex.schema.createTable('prds', function(table) {
       table.uuid('id').primary();
       table.string('title').notNullable();
       table.text('content').notNullable();
       table.timestamps(true, true);
       
       // Add indexes
       table.index('title');
       table.index('created_at');
     });
   };
   ```

### Seeding Data

1. **Create seeds for development**

   ```bash
   npm run db:seed:make sample_users
   ```

2. **Run seeds**

   ```bash
   npm run db:seed
   ```

## 🎨 Frontend Development

### Component Structure

```markdown
components/
├── common/          # Reusable UI components
├── layout/          # Layout components
├── prd/            # PRD-specific components
├── team/           # Team-related components
└── ui/             # Base UI components
```

### State Management

- **Zustand** for global application state
- **React Query** for server state and caching
- **React Context** for authentication state

### Styling Guidelines

- Use **Tailwind CSS** for styling
- Follow the **glassmorphism** design system
- Ensure **responsive design** for all components
- Use **semantic HTML** elements

### Code Style

```typescript
// Component example
import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'glass-button',
        variant === 'primary' && 'glass-button-primary',
        variant === 'secondary' && 'glass-button-secondary',
        size === 'sm' && 'px-3 py-1 text-sm',
        size === 'md' && 'px-4 py-2',
        size === 'lg' && 'px-6 py-3 text-lg',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
};
```

## 🔧 Backend Development

### API Design

- Follow **RESTful** conventions
- Use **HTTP status codes** appropriately
- Implement **consistent error handling**
- Include **proper validation**

### Service Layer Pattern

```typescript
// Example service
export class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validate input
    if (!userData.email || !userData.password) {
      throw new ValidationError('Email and password are required');
    }

    // Business logic
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Database operation
    const [user] = await db('users').insert({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
    }).returning('*');

    // Transform response
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
    };
  }
}
```

### Error Handling

```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Error middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
    });
  }

  // Handle other errors...
};
```

## 🧪 Testing

### Backend Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Testing

```bash
# Run component tests
npm run test

# Run E2E tests
npm run test:e2e
```

### Writing Tests

```typescript
// Example test
describe('UserService', () => {
  it('should create a user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    };

    const user = await userService.createUser(userData);

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
    expect(user.name).toBe(userData.name);
  });
});
```

## 🚀 Deployment

### Environment Setup

1. **Production environment variables**

   ```bash
   # Backend
   NODE_ENV=production
   DATABASE_URL=postgresql://user:pass@host:5432/db
   JWT_SECRET=your-secure-secret
   
   # Frontend
   VITE_API_URL=https://api.yourdomain.com
   ```

2. **Database setup**

   ```bash
   # Run migrations in production
   npm run db:migrate
   ```

### Build Process

```bash
# Build all packages
npm run build

# Test production build
npm run preview
```

## 📋 Code Quality

### Linting Rules

- **ESLint** for JavaScript/TypeScript
- **Prettier** for code formatting
- **TypeScript** strict mode enabled

### Pre-commit Hooks

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hooks
npx husky add .husky/pre-commit "npm run lint"
npx husky add .husky/pre-commit "npm run type-check"
```

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Error handling is implemented
- [ ] TypeScript types are defined
- [ ] Security considerations addressed

## 🐛 Debugging

### Backend Debugging

```bash
# Enable debug logging
DEBUG=prd-creator:* npm run dev

# Database query logging
DEBUG=knex:query npm run dev
```

### Frontend Debugging

```bash
# Enable React DevTools
# Install browser extension

# Enable Redux DevTools
# For Zustand state inspection
```

## 🔄 Common Development Tasks

### Adding a New API Endpoint

1. **Create the route handler**

   ```typescript
   // src/routes/example.ts
   router.get('/example', async (req, res) => {
     // Implementation
   });
   ```

2. **Add to main router**

   ```typescript
   // src/app.ts
   app.use('/api/example', exampleRouter);
   ```

3. **Add validation**

   ```typescript
   // src/utils/validation.ts
   export const exampleSchema = z.object({
     name: z.string().min(1),
   });
   ```

### Adding a New React Component

1. **Create the component**

   ```typescript
   // src/components/Example.tsx
   export const Example: React.FC = () => {
     return <div>Example</div>;
   };
   ```

2. **Add to index**

   ```typescript
   // src/components/index.ts
   export { Example } from './Example';
   ```

3. **Use in pages**

   ```typescript
   import { Example } from '@/components';
   ```

## 📞 Getting Help

### Documentation

- [API Reference](./API.md)
- [Database Schema](./DATABASE.md)
- [Contributing Guide](../CONTRIBUTING.md)

### Community

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and share ideas
- **Email**: <codecraka@gmail.com>

### Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://reactjs.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

---

Happy coding! 🚀
