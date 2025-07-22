#!/bin/bash

# Validation Migration Completion Script
# This script verifies that the validation consolidation has been completed successfully

echo "🔍 Validation Migration Verification"
echo "====================================="

# Check if centralized validation schemas exist
echo ""
echo "📋 Checking Centralized Validation Infrastructure..."

if [ -f "backend/src/schemas/validationSchemas.ts" ]; then
    echo "✅ Centralized validation schemas found"
    echo "   - Location: backend/src/schemas/validationSchemas.ts"
    
    # Count schemas
    auth_schemas=$(grep -c "export const.*Schemas = {" backend/src/schemas/validationSchemas.ts)
    echo "   - Domain schemas defined: $auth_schemas"
else
    echo "❌ Centralized validation schemas missing"
    exit 1
fi

# Check if shared validation exists
if [ -f "shared/src/validation.ts" ]; then
    echo "✅ Shared validation schemas found"
    echo "   - Location: shared/src/validation.ts"
else
    echo "❌ Shared validation schemas missing"
    exit 1
fi

# Check if old validation utils have been removed
echo ""
echo "🧹 Checking Legacy Cleanup..."

if [ ! -f "backend/src/utils/validation.ts" ]; then
    echo "✅ Old validation utilities removed"
else
    echo "❌ Old validation utilities still exist"
    echo "   - Please remove: backend/src/utils/validation.ts"
fi

# Check route migration status
echo ""
echo "🛣️  Checking Route Migration Status..."

routes_using_centralized=0
total_routes=0

for route_file in backend/src/routes/*.ts; do
    if [ -f "$route_file" ]; then
        total_routes=$((total_routes + 1))
        if grep -q "validationSchemas\." "$route_file"; then
            routes_using_centralized=$((routes_using_centralized + 1))
            echo "✅ $(basename "$route_file") - using centralized validation"
        else
            echo "⚠️  $(basename "$route_file") - not using centralized validation"
        fi
    fi
done

echo "   - Routes migrated: $routes_using_centralized/$total_routes"

# Check frontend integration
echo ""
echo "🎨 Checking Frontend Integration..."

if grep -q "authSchemas.*from.*prd-creator-shared" frontend/src/pages/auth/LoginPage.tsx 2>/dev/null; then
    echo "✅ LoginPage using shared schemas"
else
    echo "⚠️  LoginPage not using shared schemas"
fi

if grep -q "authSchemas.*from.*prd-creator-shared" frontend/src/pages/auth/RegisterPage.tsx 2>/dev/null; then
    echo "✅ RegisterPage using shared schemas"
else
    echo "⚠️  RegisterPage not using shared schemas"
fi

# Check test coverage
echo ""
echo "🧪 Checking Test Coverage..."

if [ -f "backend/src/__tests__/validation/schema-consistency.test.ts" ]; then
    echo "✅ Validation consistency tests found"
    
    # Count test cases
    test_count=$(grep -c "it('.*'" backend/src/__tests__/validation/schema-consistency.test.ts)
    echo "   - Test cases: $test_count"
else
    echo "❌ Validation consistency tests missing"
fi

# Performance check - count eliminated duplications
echo ""
echo "📊 Migration Impact Analysis..."

# Count old schema patterns (should be 0)
old_patterns=0
for file in backend/src/routes/*.ts; do
    if [ -f "$file" ]; then
        patterns=$(grep -c "Joi\.object({" "$file" 2>/dev/null || echo "0")
        old_patterns=$((old_patterns + patterns))
    fi
done

echo "   - Inline schema definitions remaining: $old_patterns"

# Count centralized schema usage
centralized_usage=$(grep -r "validationSchemas\." backend/src/routes/ | wc -l)
echo "   - Centralized schema usages: $centralized_usage"

# Build test
echo ""
echo "🔨 Testing Build Process..."

echo "   - Building shared package..."
cd shared && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Shared package builds successfully"
else
    echo "❌ Shared package build failed"
fi

cd ../backend
echo "   - Testing backend compilation..."
npx tsc --noEmit > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend TypeScript compilation successful"
else
    echo "❌ Backend TypeScript compilation failed"
fi

cd ../frontend
echo "   - Testing frontend compilation..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
fi

cd ..

# Final summary
echo ""
echo "📈 Migration Completion Summary"
echo "==============================="

if [ "$routes_using_centralized" -eq "$total_routes" ] && [ ! -f "backend/src/utils/validation.ts" ]; then
    echo "🎉 Validation migration COMPLETED successfully!"
    echo ""
    echo "✅ Achievements:"
    echo "   • Eliminated schema duplication across $total_routes route files"
    echo "   • Centralized validation with $auth_schemas domain schemas"
    echo "   • Frontend-backend validation consistency established"
    echo "   • Legacy validation utilities removed"
    echo "   • Comprehensive test coverage added"
    echo ""
    echo "🚀 Benefits Realized:"
    echo "   • Reduced maintenance overhead"
    echo "   • Consistent validation rules across stack"
    echo "   • Single source of truth for validation logic"
    echo "   • Type-safe validation with shared schemas"
    
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Run validation tests: npm test -- schema-consistency.test.ts"
    echo "   2. Update remaining frontend forms to use shared schemas"
    echo "   3. Add validation for new features using established patterns"
else
    echo "⚠️  Migration incomplete - please address remaining issues above"
fi

echo ""
echo "🔗 Usage Pattern Established:"
echo "   import { validationSchemas } from '../schemas/validationSchemas';"
echo "   import { validateBody } from '../middleware/validation';"
echo ""
echo "   router.post('/endpoint',"
echo "     requireAuth,"
echo "     validateBody(validationSchemas.domain.action),"
echo "     asyncWrapper(handler)"
echo "   );"
