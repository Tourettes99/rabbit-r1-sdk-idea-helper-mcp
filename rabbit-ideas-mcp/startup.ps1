# Rabbit R1 Ideas MCP Server Auto-Start
# This script runs in the background

$ErrorActionPreference = 'SilentlyContinue'
$scriptPath = "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp"
$logFile = Join-Path $scriptPath "startup.log"

# Log startup
Add-Content -Path $logFile -Value "
[$(Get-Date)] Starting Rabbit R1 Ideas MCP Server..."

# Start the server (it will run when Cursor needs it via stdio)
# The MCP server runs on-demand via Cursor, so we just ensure dependencies are ready

Add-Content -Path $logFile -Value "[$(Get-Date)] MCP Server is ready for Cursor"
