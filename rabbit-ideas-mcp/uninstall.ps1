# Rabbit R1 Ideas MCP Server Uninstallation Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Rabbit R1 Ideas MCP Server - Uninstall" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Remove startup shortcut
$startupShortcut = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk"
if (Test-Path $startupShortcut) {
    Remove-Item $startupShortcut -Force
    Write-Host "✓ Removed auto-start shortcut" -ForegroundColor Green
} else {
    Write-Host "○ No auto-start shortcut found" -ForegroundColor Yellow
}

# Ask if user wants to keep ideas storage
Write-Host ""
$keepStorage = Read-Host "Do you want to keep your saved ideas? (Y/N)"
if ($keepStorage -notmatch '^[Yy]') {
    $storageFile = Join-Path $PSScriptRoot "rabbit-ideas-storage.json"
    if (Test-Path $storageFile) {
        Remove-Item $storageFile -Force
        Write-Host "✓ Removed storage file" -ForegroundColor Green
    }
} else {
    Write-Host "✓ Kept storage file" -ForegroundColor Green
}

# Remove node_modules
Write-Host ""
$removeModules = Read-Host "Do you want to remove npm dependencies? (Y/N)"
if ($removeModules -match '^[Yy]') {
    $modulesPath = Join-Path $PSScriptRoot "node_modules"
    if (Test-Path $modulesPath) {
        Remove-Item $modulesPath -Recurse -Force
        Write-Host "✓ Removed node_modules" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Uninstallation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: To fully remove, you may also want to:" -ForegroundColor Yellow
Write-Host "  1. Remove the MCP entry from your Cursor mcp.json" -ForegroundColor White
Write-Host "  2. Delete this folder: $PSScriptRoot" -ForegroundColor White
Write-Host ""

