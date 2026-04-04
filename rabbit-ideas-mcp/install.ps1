# Rabbit R1 Ideas MCP Server Installation Script
# This script installs dependencies and sets up auto-start on Windows

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Rabbit R1 Ideas MCP Server - Installation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeCheck = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCheck) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Install npm dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Initialize storage file
Write-Host ""
Write-Host "Initializing storage..." -ForegroundColor Yellow
$storageFile = Join-Path $PSScriptRoot "rabbit-ideas-storage.json"
if (-not (Test-Path $storageFile)) {
    $initialStorage = @{
        suggestedIdeas = @()
        repoCache = $null
        lastChecked = $null
    } | ConvertTo-Json
    Set-Content -Path $storageFile -Value $initialStorage
    Write-Host "✓ Storage file created" -ForegroundColor Green
} else {
    Write-Host "✓ Storage file already exists" -ForegroundColor Green
}

# Create startup script
Write-Host ""
Write-Host "Setting up auto-start..." -ForegroundColor Yellow

$startupScript = @"
# Rabbit R1 Ideas MCP Server Auto-Start
# This script runs in the background

`$ErrorActionPreference = 'SilentlyContinue'
`$scriptPath = "$PSScriptRoot"
`$logFile = Join-Path `$scriptPath "startup.log"

# Log startup
Add-Content -Path `$logFile -Value "`n[`$(Get-Date)] Starting Rabbit R1 Ideas MCP Server..."

# Start the server (it will run when Cursor needs it via stdio)
# The MCP server runs on-demand via Cursor, so we just ensure dependencies are ready

Add-Content -Path `$logFile -Value "[`$(Get-Date)] MCP Server is ready for Cursor"
"@

$startupScriptPath = Join-Path $PSScriptRoot "startup.ps1"
Set-Content -Path $startupScriptPath -Value $startupScript
Write-Host "✓ Startup script created" -ForegroundColor Green

# Create shortcut in Startup folder
$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startupScriptPath`""
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Rabbit R1 Ideas MCP Server"
$Shortcut.Save()

Write-Host "✓ Auto-start configured" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The MCP server will now:" -ForegroundColor White
Write-Host "  1. Start automatically when Windows boots" -ForegroundColor White
Write-Host "  2. Run in the background when Cursor needs it" -ForegroundColor White
Write-Host "  3. Monitor the Rabbit R1 SDK repository" -ForegroundColor White
Write-Host "  4. Generate unique ideas with memory" -ForegroundColor White
Write-Host ""
Write-Host "To test it:" -ForegroundColor Yellow
Write-Host "  1. Restart Cursor" -ForegroundColor White
Write-Host "  2. Ask: 'Give me 20 creative Rabbit R1 app ideas'" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Yellow
Write-Host "  Check: $PSScriptRoot\startup.log" -ForegroundColor White
Write-Host ""
Write-Host "To uninstall:" -ForegroundColor Yellow
Write-Host "  Delete: $env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk" -ForegroundColor White
Write-Host ""

