#!/bin/bash

# Update all route files to use BackendAuthenticatedRequest
find backend/src/routes -name "*.ts" -type f -exec sed -i '' 's/AuthenticatedRequest/BackendAuthenticatedRequest/g' {} \;

# Update imports in route files
find backend/src/routes -name "*.ts" -type f -exec sed -i '' 's/import { requireAuth, BackendAuthenticatedRequest } from/import { requireAuth, BackendAuthenticatedRequest } from/g' {} \;
find backend/src/routes -name "*.ts" -type f -exec sed -i '' 's/import { optionalAuth, BackendAuthenticatedRequest } from/import { optionalAuth, BackendAuthenticatedRequest } from/g' {} \;
find backend/src/routes -name "*.ts" -type f -exec sed -i '' 's/import { requireAuth, optionalAuth, BackendAuthenticatedRequest } from/import { requireAuth, optionalAuth, BackendAuthenticatedRequest } from/g' {} \;