# Rabbit R1 Ideas MCP Server - Setup Instructions

## What This Does

This MCP server enhances your AI assistant with the ability to:
- Generate 20 unique Rabbit R1 creation app ideas per request
- Never repeat previously suggested ideas (they're saved to memory)
- Monitor the [Rabbit R1 Creations SDK](https://github.com/rabbit-hmi-oss/creations-sdk.git) for latest features
- Help you iterate and improve on previous ideas
- Retrieve and search through previously suggested ideas

## Installation Steps

### 1. Run the Installer

**Option A: Double-click the batch file**
- Navigate to: `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\`
- Double-click: `install.bat`

**Option B: Run from PowerShell**
```powershell
cd "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp"
.\install.ps1
```

### 2. What the Installer Does

- ✓ Checks for Node.js installation
- ✓ Installs npm dependencies
- ✓ Creates storage file for ideas
- ✓ Sets up auto-start on Windows boot
- ✓ Configures the MCP server

### 3. Restart Cursor

After installation, restart Cursor to load the new MCP configuration.

## How to Use

Once installed, you can ask your AI assistant:

### Generate New Ideas
- "Give me 20 creative Rabbit R1 app ideas"
- "Generate 20 Rabbit R1 creation ideas focused on productivity"
- "Suggest 20 entertainment app ideas for Rabbit R1"

### Retrieve Previous Ideas
- "Show me previous Rabbit R1 ideas"
- "Get the last 10 ideas you suggested"
- "Search previous ideas for 'health' related apps"

### Iterate on Ideas
- "Iterate on idea #5 and expand it"
- "Simplify idea #12"
- "Take idea #3 and pivot it in a new direction"

### Check Repository Status
- "What's new in the Rabbit R1 SDK?"
- "Show me recent changes to the Creations SDK"
- "Get the current status of the Rabbit repository"

## Features

### 🧠 Memory System
- Every idea generated is saved with a unique ID and timestamp
- The system checks against all previous ideas to ensure uniqueness
- You can retrieve and search through all past suggestions

### 🔄 GitHub Integration
- Monitors the official Rabbit R1 Creations SDK repository
- Fetches recent commits, structure, and documentation
- Uses this information to suggest relevant and up-to-date ideas

### 📊 Statistics & Resources
- View total ideas generated
- Check when the repo was last scanned
- Access raw storage data if needed

### ⚡ Auto-Start
- Automatically runs when Windows boots
- Works seamlessly with Cursor
- Runs silently in the background

## File Locations

- **MCP Server**: `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\`
- **Configuration**: `C:\Users\isman\.cursor\mcp.json`
- **Ideas Storage**: `rabbit-ideas-storage.json` (in MCP server directory)
- **Startup Link**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk`
- **Logs**: `startup.log` (in MCP server directory)

## Troubleshooting

### MCP Server Not Working

1. Check if Node.js is installed:
   ```powershell
   node --version
   ```

2. Check logs:
   ```powershell
   Get-Content "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\startup.log"
   ```

3. Restart Cursor completely

4. Check mcp.json configuration at: `C:\Users\isman\.cursor\mcp.json`

### Ideas Are Repeating

This shouldn't happen, but if it does:
1. Check if `rabbit-ideas-storage.json` exists
2. Verify the file has write permissions
3. Check the file contents to see if ideas are being saved

### Want to Clear Idea History

In Cursor, ask:
- "Clear my Rabbit R1 idea history" (the assistant will confirm)

Or manually delete: `rabbit-ideas-storage.json`

## Uninstall

Run the uninstall script:
```powershell
cd "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp"
.\uninstall.ps1
```

Or manually:
1. Delete the startup shortcut from: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`
2. Remove the `rabbit-r1-ideas` entry from `mcp.json`
3. Delete the MCP server folder

## Support

- GitHub Repo: https://github.com/rabbit-hmi-oss/creations-sdk.git
- Rabbit Creations: https://rabbit.tech/creations

## License

MIT License - See LICENSE file for details

