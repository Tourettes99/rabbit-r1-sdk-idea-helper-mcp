@echo off
REM Rabbit R1 Ideas MCP Server - Installation Launcher
REM This batch file launches the PowerShell installation script

echo.
echo ================================================
echo Rabbit R1 Ideas MCP Server - Installer
echo ================================================
echo.
echo This will install and configure the MCP server...
echo.

REM Run PowerShell script with admin privileges
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0install.ps1'"

echo.
echo Press any key to exit...
pause >nul

