---
description: Add a new team workspace feature
allowed-tools: Write, Edit, Read, Bash(npm run *), Bash(git *)
argument-hint: <feature-name> <description>
---

# Add Team Feature: $ARGUMENTS

## Current Team Architecture
- Backend team service: @backend/src/services/teamService.ts
- Frontend team context: @frontend/src/contexts/TeamContext.tsx
- Database schema: @backend/src/database/migrations
- API routes: @backend/src/routes/teams.ts

## Your Task
Add a new team workspace feature with the following requirements:

1. **Backend Implementation**:
   - Update team service with new functionality
   - Add necessary API endpoints
   - Create database migration if needed
   - Add comprehensive tests

2. **Frontend Implementation**:
   - Update team context and hooks
   - Create/update UI components
   - Add proper TypeScript types
   - Ensure responsive design

3. **Integration**:
   - Test end-to-end functionality
   - Update documentation
   - Follow existing patterns

Feature to implement: $ARGUMENTS
