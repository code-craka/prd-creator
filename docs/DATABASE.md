# Database Schema Documentation

This document describes the database schema for the PRD Creator application.

## 🏗 Database Overview

### Technology Stack

- **Database**: PostgreSQL 14.0+
- **Query Builder**: Knex.js
- **Migrations**: Knex migration system
- **Connection Pooling**: Built-in PostgreSQL connection pooling

### Design Principles

- **Normalized Design**: Reduces data redundancy
- **UUID Primary Keys**: Better for distributed systems
- **Timestamps**: All tables have `created_at` and `updated_at`
- **Soft Deletes**: Important data is never physically deleted
- **Foreign Key Constraints**: Ensures data integrity
- **Indexes**: Optimized for common query patterns

## 📊 Entity Relationship Diagram

``` markdown
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    Users    │       │    Teams    │       │    PRDs     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ email       │       │ name        │       │ user_id (FK)│
│ name        │       │ slug        │       │ team_id (FK)│
│ password    │       │ owner_id(FK)│       │ title       │
│ avatar_url  │       │ description │       │ content     │
│ created_at  │       │ avatar_url  │       │ visibility  │
│ updated_at  │       │ created_at  │       │ share_token │
└─────────────┘       │ updated_at  │       │ template_id │
       │               └─────────────┘       │ view_count  │
       │                      │              │ created_at  │
       │                      │              │ updated_at  │
       └──────────────────────┼──────────────┴─────────────┘
                              │
                    ┌─────────────┐
                    │TeamMembers  │
                    ├─────────────┤
                    │ id (PK)     │
                    │ team_id (FK)│
                    │ user_id (FK)│
                    │ role        │
                    │ invited_by  │
                    │ joined_at   │
                    │ created_at  │
                    └─────────────┘
```

## 📋 Table Definitions

### Users Table

Stores user account information and authentication data.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    current_team_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_current_team_id ON users(current_team_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `email`: Unique email address for authentication
- `name`: User's display name
- `password`: Bcrypt hashed password
- `avatar_url`: Optional profile picture URL
- `current_team_id`: Currently selected team workspace
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp

### Teams Table

Stores team workspace information and settings.

```sql
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_id UUID NOT NULL,
    description TEXT,
    avatar_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_at ON teams(created_at);

-- Triggers
CREATE TRIGGER update_teams_updated_at 
    BEFORE UPDATE ON teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `name`: Team display name
- `slug`: URL-friendly team identifier
- `owner_id`: Foreign key to users table (team owner)
- `description`: Optional team description
- `avatar_url`: Optional team logo/avatar
- `settings`: JSON settings and preferences
- `created_at`: Team creation timestamp
- `updated_at`: Last team update timestamp

### Team Members Table

Manages team membership and roles.

```sql
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    invited_by UUID,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
```

**Fields:**

- `id`: UUID primary key
- `team_id`: Foreign key to teams table
- `user_id`: Foreign key to users table
- `role`: Member role (owner, admin, member)
- `invited_by`: User who invited this member
- `joined_at`: When the user joined the team
- `created_at`: Invitation creation timestamp

**Role Hierarchy:**

- `owner`: Full team control, can delete team
- `admin`: Can manage members and settings
- `member`: Can view and edit team PRDs

### PRDs Table

Stores Product Requirements Documents and metadata.

```sql
CREATE TABLE prds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    team_id UUID,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('private', 'team', 'public')),
    share_token VARCHAR(255) UNIQUE,
    template_id UUID,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prds_user_id ON prds(user_id);
CREATE INDEX idx_prds_team_id ON prds(team_id);
CREATE INDEX idx_prds_visibility ON prds(visibility);
CREATE INDEX idx_prds_share_token ON prds(share_token);
CREATE INDEX idx_prds_created_at ON prds(created_at);
CREATE INDEX idx_prds_title ON prds USING gin(to_tsvector('english', title));
CREATE INDEX idx_prds_content ON prds USING gin(to_tsvector('english', content));

-- Triggers
CREATE TRIGGER update_prds_updated_at 
    BEFORE UPDATE ON prds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Foreign key to users table (author)
- `team_id`: Optional foreign key to teams table
- `title`: PRD title
- `content`: Full PRD content (markdown/text)
- `metadata`: JSON metadata (AI prompts, generation data)
- `visibility`: Privacy setting (private, team, public)
- `share_token`: Unique token for public sharing
- `template_id`: Optional template used for generation
- `view_count`: Number of times PRD has been viewed
- `created_at`: PRD creation timestamp
- `updated_at`: Last PRD update timestamp

**Visibility Levels:**

- `private`: Only visible to the author
- `team`: Visible to team members
- `public`: Visible to everyone with share link

### Templates Table

Stores reusable PRD templates and structures.

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    structure JSONB NOT NULL,
    industry VARCHAR(100),
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_templates_team_id ON templates(team_id);
CREATE INDEX idx_templates_created_by ON templates(created_by);
CREATE INDEX idx_templates_industry ON templates(industry);
CREATE INDEX idx_templates_is_public ON templates(is_public);
CREATE INDEX idx_templates_usage_count ON templates(usage_count);

-- Triggers
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Fields:**

- `id`: UUID primary key
- `team_id`: Optional team ownership
- `name`: Template name
- `description`: Template description
- `structure`: JSON structure with questions and sections
- `industry`: Industry category
- `is_public`: Whether template is publicly available
- `usage_count`: Number of times template has been used
- `created_by`: Foreign key to users table (creator)
- `created_at`: Template creation timestamp
- `updated_at`: Last template update timestamp

### Analytics Events Table

Tracks user actions and system events for analytics.

```sql
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    team_id UUID,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_team_id ON analytics_events(team_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_created_at ON analytics_events(created_at);
```

**Fields:**

- `id`: UUID primary key
- `user_id`: Optional user who performed the action
- `team_id`: Optional team context
- `event_type`: Type of event (prd_created, team_joined, etc.)
- `event_data`: JSON data specific to the event
- `ip_address`: User's IP address
- `user_agent`: Browser/client information
- `created_at`: Event timestamp

## 🔗 Foreign-Key-Constraints

### Users-Table

```sql
-- Users can have a current team
ALTER TABLE users ADD CONSTRAINT fk_users_current_team_id 
    FOREIGN KEY (current_team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

### Teams-Table

```sql
-- Teams must have an owner
ALTER TABLE teams ADD CONSTRAINT fk_teams_owner_id 
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
```

### Team-Members Table

```sql
-- Team members must reference valid team and user
ALTER TABLE team_members ADD CONSTRAINT fk_team_members_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

ALTER TABLE team_members ADD CONSTRAINT fk_team_members_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE team_members ADD CONSTRAINT fk_team_members_invited_by 
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;
```

### PRDs-Table

```sql
-- PRDs must have an author
ALTER TABLE prds ADD CONSTRAINT fk_prds_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- PRDs can belong to a team
ALTER TABLE prds ADD CONSTRAINT fk_prds_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- PRDs can be created from templates
ALTER TABLE prds ADD CONSTRAINT fk_prds_template_id 
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL;
```

### Templates-Table

```sql
-- Templates must have a creator
ALTER TABLE templates ADD CONSTRAINT fk_templates_created_by 
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Templates can belong to a team
ALTER TABLE templates ADD CONSTRAINT fk_templates_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
```

### Analytics-Events-Table

```sql
-- Analytics events can reference users and teams
ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_team_id 
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
```

## 🔍 Indexes and Performance

### Primary Indexes

- All tables have UUID primary keys with automatic indexes
- Unique constraints on email, slug, and share_token create indexes

### Query Optimization Indexes

- `idx_users_email`: Fast user lookup during authentication
- `idx_prds_user_id`: Fast PRD retrieval by author
- `idx_prds_team_id`: Fast team PRD queries
- `idx_team_members_team_id`: Fast team member queries
- `idx_prds_created_at`: Time-based PRD queries

### Full-Text Search Indexes

- `idx_prds_title`: Search PRDs by title
- `idx_prds_content`: Search PRDs by content
- Uses PostgreSQL's built-in GIN indexes for text search

### Composite Indexes (Future)

```sql
-- For complex queries combining multiple conditions
CREATE INDEX idx_prds_team_visibility ON prds(team_id, visibility);
CREATE INDEX idx_prds_user_created ON prds(user_id, created_at);
```

## 🔄 Data Migration Strategy

### Migration Files

Located in `backend/src/database/migrations/`

1. `001_create_users.ts` - User accounts and authentication
2. `002_create_teams.ts` - Team workspaces
3. `003_create_team_members.ts` - Team membership
4. `004_create_templates.ts` - PRD templates
5. `005_create_prds.ts` - Product requirements documents
6. `006_add_foreign_key_constraints.ts` - Referential integrity

### Migration Commands

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:rollback

# Create new migration
npm run db:migrate:make migration_name

# Check migration status
npm run db:migrate:status
```

## 🌱 Seed Data

### Development Seeds

Located in `backend/src/database/seeds/`

- `001_sample_data.ts` - Sample users, teams, and PRDs for development

### Seed Commands

```bash
# Run all seeds
npm run db:seed

# Rollback seeds
npm run db:seed:rollback

# Create new seed
npm run db:seed:make seed_name
```

## 🔒 Security Considerations

### Password Security

- Passwords are hashed using bcrypt with 12 rounds
- No plaintext passwords stored in database
- Password reset tokens have expiration times

### Data Privacy

- Personal data is encrypted at rest
- Sensitive fields are excluded from API responses
- User data can be fully deleted (GDPR compliance)

### Access Control

- Role-based access through team membership
- Row-level security through user/team ownership
- API endpoints validate permissions before data access

## 📊 Analytics and Reporting

### Event Tracking

- User actions tracked in analytics_events table
- Team-level analytics for workspace insights
- PRD engagement metrics (views, shares, etc.)

### Common Queries

```sql
-- Most active users
SELECT u.name, COUNT(ae.id) as event_count
FROM users u
JOIN analytics_events ae ON u.id = ae.user_id
WHERE ae.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY event_count DESC;

-- Popular PRDs
SELECT p.title, p.view_count, u.name as author
FROM prds p
JOIN users u ON p.user_id = u.id
WHERE p.visibility = 'public'
ORDER BY p.view_count DESC;

-- Team activity
SELECT t.name, COUNT(p.id) as prd_count
FROM teams t
LEFT JOIN prds p ON t.id = p.team_id
GROUP BY t.id, t.name
ORDER BY prd_count DESC;
```

## 🛠 Maintenance Tasks

### Regular Maintenance

```sql
-- Clean up old analytics events (older than 1 year)
DELETE FROM analytics_events 
WHERE created_at < NOW() - INTERVAL '1 year';

-- Update PRD view counts
UPDATE prds SET view_count = view_count + 1 
WHERE id = $1;

-- Vacuum and analyze tables
VACUUM ANALYZE;
```

### Backup Strategy

- Daily automated backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Cross-region backup replication

## 🔧 Development Tools

### Database Connection

```typescript
// Knex configuration
const config = {
  client: 'postgresql',
  connection: {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/database/migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
};
```

### Query Examples

```typescript
// User with teams
const userWithTeams = await db('users')
  .select('users.*', 'teams.name as team_name')
  .leftJoin('team_members', 'users.id', 'team_members.user_id')
  .leftJoin('teams', 'team_members.team_id', 'teams.id')
  .where('users.id', userId);

// PRDs with full-text search
const searchResults = await db('prds')
  .select('*')
  .whereRaw("to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ?)", [searchTerm]);
```

## 📚 Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Knex.js Documentation](https://knexjs.org/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-best-practices.html)
- [PostgreSQL Performance Tips](https://www.postgresql.org/docs/current/performance-tips.html)

---

This database schema provides a solid foundation for the PRD Creator application with room for future scalability and features.
