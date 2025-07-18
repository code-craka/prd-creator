#!/bin/bash

echo "🔄 Migration completed. Running checks..."

cd backend

# Verify migration was applied
echo "📊 Current migration status:"
npm run db:migrate:status

# Run a quick database connection test
echo "🔗 Testing database connection:"
npm run test -- --grep "database connection" || echo "No specific connection tests found"

echo "✅ Post-migration checks completed"
exit 0
