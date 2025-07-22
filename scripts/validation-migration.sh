#!/bin/bash

# Validation Migration Helper Script
# This script helps complete the validation schema consolidation

echo "🚀 PRD Creator Validation Migration Helper"
echo "=========================================="

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📁 Project structure verified ✅"

# Function to backup files before migration
backup_file() {
    local file_path="$1"
    if [ -f "$file_path" ]; then
        cp "$file_path" "${file_path}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "📋 Backed up: $file_path"
    fi
}

# Function to check file syntax
check_typescript_syntax() {
    local file_path="$1"
    cd backend
    if npx tsc --noEmit "$file_path" 2>/dev/null; then
        echo "✅ Syntax OK: $file_path"
        return 0
    else
        echo "❌ Syntax Error: $file_path"
        return 1
    fi
    cd ..
}

echo
echo "🔍 Phase 1: Analyzing current validation state"
echo "============================================="

# Check which route files need migration
routes_to_migrate=(
    "backend/src/routes/analytics.ts"
    "backend/src/routes/prds.ts" 
    "backend/src/routes/auth.ts"
    "backend/src/routes/onboarding.ts"
    "backend/src/routes/publicGallery.ts"
)

echo
echo "📊 Route migration status:"
for route in "${routes_to_migrate[@]}"; do
    if [ -f "$route" ]; then
        # Check if file uses old validation patterns
        if grep -q "validateBody\|validateQuery" "$route" && ! grep -q "validationSchemas" "$route"; then
            echo "🔄 Needs migration: $route"
        elif grep -q "validationSchemas" "$route"; then
            echo "✅ Already migrated: $route"
        else
            echo "❓ No validation found: $route"
        fi
    else
        echo "❌ File not found: $route"
    fi
done

echo
echo "🛠️  Phase 2: Validation infrastructure check"
echo "==========================================="

# Check if centralized schemas exist
if [ -f "backend/src/schemas/validationSchemas.ts" ]; then
    echo "✅ Centralized schemas: backend/src/schemas/validationSchemas.ts"
else
    echo "❌ Missing: backend/src/schemas/validationSchemas.ts"
fi

if [ -f "backend/src/middleware/validation.ts" ]; then
    echo "✅ Enhanced middleware: backend/src/middleware/validation.ts"
else
    echo "❌ Missing: backend/src/middleware/validation.ts"
fi

if [ -f "shared/src/validation.ts" ]; then
    echo "✅ Shared schemas: shared/src/validation.ts"
else
    echo "❌ Missing: shared/src/validation.ts"
fi

echo
echo "🔧 Phase 3: Safe migration recommendations"
echo "========================================"

echo "To complete the validation migration safely:"
echo
echo "1. 📋 Backup corrupted files:"
echo "   cp backend/src/routes/analytics.ts backend/src/routes/analytics.ts.corrupted"
echo "   cp backend/src/routes/prds.ts backend/src/routes/prds.ts.corrupted"
echo
echo "2. 🔄 Restore or recreate corrupted files:"
echo "   # Option A: Restore from git"
echo "   git checkout HEAD -- backend/src/routes/analytics.ts"
echo "   git checkout HEAD -- backend/src/routes/prds.ts"
echo
echo "   # Option B: Recreate manually using centralized schemas"
echo
echo "3. 📝 Update routes to use centralized validation:"
echo "   # Replace old validation imports with:"
echo "   import { validationSchemas } from '../schemas/validationSchemas';"
echo "   import { validateBody, validateQuery, validateMultiple } from '../middleware/validation';"
echo
echo "4. 🧪 Test each route after migration:"
echo "   cd backend && npm run build"
echo "   cd backend && npm run test"
echo
echo "5. 🔍 Update frontend to use shared schemas:"
echo "   cd frontend && npm install ../shared"
echo "   # Update forms to import from '@prd-creator/shared'"

echo
echo "📚 Phase 4: Documentation and cleanup"
echo "====================================="

echo "After migration:"
echo "- 📖 Review: docs/VALIDATION-MIGRATION-GUIDE.md"
echo "- 🧹 Remove legacy validation utilities"
echo "- 📝 Update API documentation"
echo "- ✅ Add validation consistency tests"

echo
echo "🎯 Priority fixes needed:"
echo "1. Fix analytics.ts syntax errors"
echo "2. Fix prds.ts import conflicts"  
echo "3. Complete remaining route migrations"
echo "4. Update frontend forms"

echo
echo "Migration helper completed! 🚀"
echo "See docs/VALIDATION-MIGRATION-GUIDE.md for detailed instructions."
