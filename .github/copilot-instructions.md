# GitHub Copilot Instructions for PRD Creator

## 🎯 Project Overview

**PRD Creator** is a modern, AI-powered SaaS application that helps product managers, entrepreneurs, and development teams transform vague product ideas into professional Product Requirements Documents (PRDs). The application features sophisticated team collaboration, AI integration with Claude and OpenAI, comprehensive analytics, viral growth engine, and marketplace features.

### Tech Stack
- **Backend**: Node.js, Express, TypeScript, PostgreSQL (41 tables), Knex.js migrations
- **Frontend**: React 18.2+, TypeScript, Vite, TailwindCSS with glassmorphism design
- **Shared**: TypeScript package with unified validation schemas (Joi ↔ Zod)
- **AI Integration**: Anthropic Claude API, OpenAI GPT API with fallback patterns
- **Real-time**: Socket.IO for collaborative editing
- **Database**: PostgreSQL with extensive analytics, onboarding, and marketplace schemas

## 🏗 Critical Architecture Patterns

### Validation System (RECENTLY CONSOLIDATED)
The project uses a **unified validation approach** with shared schemas between frontend and backend:

```typescript
// Backend: Joi schemas in centralized location
import { validationSchemas } from '../schemas/validationSchemas';
import { validateBody, validateQuery } from '../middleware/validation';

router.post('/teams', 
  requireAuth,
  validateBody(validationSchemas.team.create),
  asyncWrapper(handler)
);

// Frontend: Matching Zod schemas from shared package
import { authSchemas } from 'prd-creator-shared';
const { register, handleSubmit } = useForm({
  resolver: zodResolver(authSchemas.registerWithConfirm)
});
```

**Critical**: Always use centralized validation schemas from `/backend/src/schemas/validationSchemas.ts` - never create inline validation in routes.

### Service Layer Architecture
All business logic is encapsulated in services with consistent patterns:

```typescript
// Services use static methods for pure business logic
export class MarketplaceService {
  async downloadTemplate(request: TemplateDownloadRequest): Promise<DownloadResult> {
    // Parameter objects reduce primitive obsession
    const marketplaceTemplate = await db('marketplace_templates')
      .where('template_id', request.templateId.value)
      .first();
  }
}

// AI Service uses method extraction for complexity reduction
export class AIService {
  private static buildPrompt(request: AIGenerationRequest): string {
    const typeTemplate = this.getTypeTemplate(request.prdType);
    return this.assemblePrompt({ typeTemplate, ...request });
  }
}
```

### Database Migration Pattern
The project has 41+ tables with careful migration management:

```typescript
// Always create migrations for schema changes
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('analytics_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('event_type').notNullable();
    table.jsonb('event_data').defaultTo('{}');
    table.timestamps(true, true);
    
    // Always include proper indexes
    table.index(['user_id', 'event_type']);
    table.index(['event_category', 'created_at']);
  });
}
```

### Error Handling & Type Safety
Strict TypeScript with comprehensive error handling:

```typescript
// Use specific error types from middleware
import { ValidationError, UnauthorizedError, ConflictError } from '../middleware/errorHandler';

// All async operations wrapped with asyncWrapper
router.post('/endpoint',
  requireAuth,
  validateBody(schema),
  asyncWrapper(async (req: AuthenticatedRequest, res: express.Response) => {
    // Business logic here
  })
);
```

## 🤖 AI Integration Specifics

### Multi-Provider Architecture
The AI service supports both Anthropic Claude and OpenAI with sophisticated prompt engineering:

```typescript
// AI Service uses extracted helper methods for maintainability
private static async callAnthropicSimple(prompt: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    messages: [{ role: 'user', content: prompt }]
  });
  return (response.content[0] as any).text;
}

// Type casting required for AI provider responses
const response = await this.callProvider(prompt);
const parsedContent = (response as ChatCompletion).choices?.[0]?.message?.content;
```

## 🗄 Database Architecture Insights

### Complex Schema Relationships
The database features sophisticated relationships across 41 tables:

```sql
-- Core entity relationships
teams ←→ team_members ←→ users
teams ←→ prds ←→ prd_collaborators
users ←→ user_onboarding ←→ tutorial_progress

-- Analytics and growth tracking
analytics_events → users/teams/prds
viral_tracking → user_referrals → referral_rewards
marketplace_templates → template_purchases → template_reviews
```

### Indexing Strategy
Critical indexes for performance:

```typescript
// Always include indexes for query patterns
table.index(['user_id', 'created_at']);
table.index(['team_id', 'status']);
table.index(['event_type', 'event_category']);
```

## 📊 Analytics & Growth Engine

### Event Tracking Architecture
Comprehensive analytics system with viral tracking:

```typescript
// Use ViralTrackingService for all user actions
await ViralTrackingService.trackAction(userId, 'clone', 'template', templateId, {
  marketplace: true,
  price: marketplaceTemplate.price
});

// Analytics service tracks complex metrics
const metrics = await analyticsService.getTeamProductivityMetrics(teamId, '30d');
```

### Growth Features Implementation
- **Viral Tracking**: K-factor calculation, referral tracking
- **Public Gallery**: Social sharing with SEO optimization
- **Marketplace**: Creator monetization with reviews and ratings
- **Blog System**: Content marketing with SEO
- **Email Marketing**: Behavioral triggers and automation

## 🎨 Frontend Patterns

### Component Factory Pattern
Consistent glassmorphism design with reusable patterns:

```typescript
// Use glass-card classes for consistent styling
<div className="glass-card p-6">
  <h2 className="text-xl font-semibold text-white mb-4">Card Title</h2>
  <button className="glass-button-primary py-3 px-6">Action</button>
</div>

// Component factory for page layouts
export const MyPage = createPage(MyContent, {
  variant: 'glass',
  displayName: 'MyPage'
});
```

### State Management Strategy
- **Zustand**: Global app state (auth, currentTeam)
- **React Query**: Server state with sophisticated caching
- **React Hook Form**: Form state with Zod validation

## 🔒 Security & Permission Architecture

### Role-Based Access Control
Three-tier permission system:

```typescript
// Team roles: owner > admin > member
interface TeamMember {
  role: 'owner' | 'admin' | 'member';
}

// Permission checking patterns
const canManageTeam = user.role === 'owner' || user.role === 'admin';
const canTransferOwnership = user.role === 'owner';
```

### Authentication Flow
JWT-based with comprehensive validation:

```typescript
// Auth middleware with proper typing
export interface AuthenticatedRequest extends Request {
  user: { id: string; email: string; name: string };
}

// Route protection
router.post('/protected', requireAuth, asyncWrapper(handler));
```

## 📋 Development Workflow Specifics

### Build & Test Commands
```bash
# Backend development
cd backend && npm run dev        # Development server
cd backend && npm run build      # TypeScript compilation
cd backend && npm run test       # Jest test suite
cd backend && npm run db:migrate # Run migrations

# Frontend development  
cd frontend && npm run dev       # Vite dev server
cd frontend && npm run build     # Production build

# Shared package
cd shared && npm run build       # Build shared types/validation
```

### Code Quality Enforcement
The project uses strict TypeScript and comprehensive error checking:

```typescript
// Always use type-safe patterns
interface CreateTeamRequest {
  name: string;
  description?: string;
}

// Avoid any types - use proper interfaces
const handleTeamData = (data: CreateTeamRequest): Promise<Team> => {
  // Implementation
};
```

## 🎯 Specific Implementation Patterns

### Marketplace Value Objects (Recent Refactor)
To reduce primitive obsession, use value objects:

```typescript
export class TemplateId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Template ID cannot be empty');
    }
  }
}

export class TemplateSubmissionData {
  constructor(
    public readonly userId: UserId,
    public readonly templateId: TemplateId,
    public readonly licenseType: 'free' | 'commercial' | 'premium'
  ) {}
}
```

### Complexity Reduction Patterns
Methods are refactored to reduce cyclomatic complexity:

```typescript
// Break large methods into focused helpers
private static getTypeTemplate(prdType: string): string {
  const typeTemplates = {
    feature: 'a new feature for an existing product',
    product: 'a completely new product'
  };
  return typeTemplates[prdType];
}
```

## 🚀 Key Integration Points

### AI ↔ Templates ↔ Marketplace Flow
```typescript
// AI generates PRD → Template system → Marketplace submission
const prd = await aiService.generatePRD(prompt);
const template = await templateService.createFromPRD(prd);
const marketplaceItem = await marketplaceService.submitTemplate(submissionData);
```

### Analytics ↔ Viral Tracking Integration
```typescript
// User actions feed both analytics and viral metrics
await Promise.all([
  analyticsService.trackEvent({ type: 'prd_created', userId }),
  ViralTrackingService.trackAction(userId, 'create', 'prd', prdId)
]);
```

This codebase prioritizes type safety, clean architecture, and maintainable patterns. When adding features, follow the established service layer architecture, use centralized validation, and maintain the sophisticated analytics tracking.
