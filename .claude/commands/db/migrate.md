---
description: Create and run database migration
allowed-tools: Write, Bash(cd backend && npm run *), Read
---

# Database Migration: $ARGUMENTS

## Current Schema

- Existing migrations: !`ls backend/src/database/migrations/`
- Current schema state: @backend/src/database/migrations

## Your Task

1. Create a new migration for: $ARGUMENTS
2. Follow existing naming conventions
3. Include proper rollback functionality
4. Test migration up and down
5. Update TypeScript types if needed

## Commands to run after creation:

```bash
cd backend
npm run db:migrate
npm run test