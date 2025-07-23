# Amazon Q MCP Configuration

This directory contains Model Context Protocol (MCP) server configurations for Amazon Q.

## Setup

1. Copy `mcp.json.example` to `mcp.json`
2. Replace placeholder values with your actual credentials:
   - `${GITHUB_PERSONAL_ACCESS_TOKEN}` - Your GitHub Personal Access Token
   - `${SUPABASE_ACCESS_TOKEN}` - Your Supabase Access Token
   - Database connection strings with actual credentials
   - Context7 MCP key and profile

## Security

- Never commit `mcp.json` to version control as it contains sensitive credentials
- The actual `mcp.json` file is ignored in `.gitignore`
- Use environment variables where possible for sensitive values

## MCP Servers Included

- **github**: GitHub repository access
- **sequential-thinking**: Sequential thinking capabilities
- **postgresql**: Database access for both research and PRD creator databases
- **context7-mcp**: Context7 MCP integration
- **playwright**: Browser automation
- **memory**: Persistent memory
- **supabase**: Supabase integration
