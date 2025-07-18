#!/bin/bash

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Only format TypeScript/JavaScript files
if [[ "$file_path" =~ \.(ts|tsx|js|jsx)$ ]]; then
    # Check if we're in the right directory
    if [[ "$file_path" == backend/* ]]; then
        cd backend && npm run lint:fix "$file_path" 2>/dev/null
        echo "🎨 Formatted TypeScript file: $file_path"
    elif [[ "$file_path" == frontend/* ]]; then
        cd frontend && npm run lint:fix "$file_path" 2>/dev/null
        echo "🎨 Formatted TypeScript file: $file_path"
    fi
fi

exit 0
