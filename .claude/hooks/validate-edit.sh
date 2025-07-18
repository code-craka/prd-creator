#!/bin/bash

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Check for critical files
if [[ "$file_path" == "package-lock.json" ]] || [[ "$file_path" == "yarn.lock" ]]; then
    echo "⚠️  Editing lock files detected: $file_path" >&2
    echo "Consider running npm install or yarn install after changes" >&2
fi

if [[ "$file_path" == *"migration"* ]]; then
    echo "⚠️  Editing migration file: $file_path" >&2
    echo "Make sure to test migration rollback functionality" >&2
fi

echo "✅ File edit validated: $file_path"
exit 0
