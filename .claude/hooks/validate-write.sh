#!/bin/bash

input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Read JSON input from stdin
input=$(cat)

# Extract file path from JSON
file_path=$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // ""')

# Validate file path
if [[ "$file_path" == *".env"* ]]; then
    echo "❌ Cannot write to environment files for security" >&2
    exit 2
fi

if [[ "$file_path" == *"node_modules"* ]]; then
    echo "❌ Cannot write to node_modules directory" >&2
    exit 2
fi

if [[ "$file_path" == *"dist/"* ]] || [[ "$file_path" == *"build/"* ]]; then
    echo "❌ Cannot write to build directories" >&2
    exit 2
fi

echo "✅ File write validated: $file_path"
exit 0
# Allow the operation
echo "✅ File write validated: $file_path"
exit 0
