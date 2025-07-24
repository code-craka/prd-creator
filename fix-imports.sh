#!/bin/bash

# Fix the double Backend prefix in imports
find backend/src/routes -name "*.ts" -type f -exec sed -i '' 's/BackendBackendAuthenticatedRequest/BackendAuthenticatedRequest/g' {} \;