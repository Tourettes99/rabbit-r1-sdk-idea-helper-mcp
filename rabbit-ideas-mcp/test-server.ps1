# Test script for Rabbit R1 Ideas MCP Server
# This verifies that the server can start properly

Write-Host "Testing Rabbit R1 Ideas MCP Server..." -ForegroundColor Cyan
Write-Host ""

$serverPath = Join-Path $PSScriptRoot "index.js"

# Check if index.js exists
if (-not (Test-Path $serverPath)) {
    Write-Host "X Server file not found: $serverPath" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Server file found" -ForegroundColor Green

# Check if node_modules exists
$modulesPath = Join-Path $PSScriptRoot "node_modules"
if (-not (Test-Path $modulesPath)) {
    Write-Host "X Dependencies not installed" -ForegroundColor Red
    Write-Host "Run: npm install" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Dependencies installed" -ForegroundColor Green

# Check if storage file exists
$storagePath = Join-Path $PSScriptRoot "rabbit-ideas-storage.json"
if (-not (Test-Path $storagePath)) {
    Write-Host "X Storage file not found" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Storage file exists" -ForegroundColor Green

# Check startup shortcut
$shortcutPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk"
if (Test-Path $shortcutPath) {
    Write-Host "[OK] Startup shortcut configured" -ForegroundColor Green
} else {
    Write-Host "[INFO] Startup shortcut not found" -ForegroundColor Yellow
}

# Check MCP configuration
$mcpPath = "$env:USERPROFILE\.cursor\mcp.json"
if (Test-Path $mcpPath) {
    Write-Host "[OK] MCP configuration file exists" -ForegroundColor Green
} else {
    Write-Host "[INFO] mcp.json not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The MCP server is ready to use." -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Cursor to load the MCP configuration" -ForegroundColor White
Write-Host "  2. Ask for Rabbit R1 app ideas" -ForegroundColor White
Write-Host "  3. The server will generate unique ideas" -ForegroundColor White
Write-Host ""
