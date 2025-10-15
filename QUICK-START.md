# Rabbit R1 Ideas MCP Server - Quick Start Guide

## 🎉 Installation Complete!

Your Rabbit R1 Ideas MCP Server has been successfully installed and configured!

## ✅ What Was Set Up

1. **MCP Server**: Installed at `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\`
2. **Dependencies**: All npm packages installed
3. **Storage**: Ideas database created at `rabbit-ideas-storage.json`
4. **Auto-Start**: Configured to run on Windows startup
5. **Cursor Integration**: Added to your `mcp.json` configuration

## 🚀 How to Use

### Restart Cursor First!
**Important**: Restart Cursor completely to load the new MCP configuration.

### Basic Commands

Once Cursor is restarted, you can ask:

#### Generate New Ideas
```
"Give me 20 creative Rabbit R1 app ideas"
"Generate 20 productivity app ideas for Rabbit R1"
"Suggest 20 entertainment apps for Rabbit R1"
"Give me Rabbit R1 creation ideas focused on health"
```

#### View Previous Ideas
```
"Show me previous Rabbit R1 ideas"
"Get the last 10 ideas you suggested"
"Search previous ideas for 'productivity'"
"What ideas have you suggested so far?"
```

#### Iterate on Ideas
```
"Iterate on idea #5 and expand it"
"Simplify idea #12"
"Take idea #3 and pivot it"
"Combine idea #7 with new features"
```

#### Check Repository Status
```
"What's new in the Rabbit R1 SDK?"
"Show me recent changes to the Creations SDK"
"Get the current Rabbit repository status"
```

## 🧠 How It Works

1. **Monitors GitHub**: The server tracks the [Rabbit R1 Creations SDK](https://github.com/rabbit-hmi-oss/creations-sdk.git) repository
2. **Analyzes Structure**: Reviews the current SDK features, file structure, and recent commits
3. **Generates Ideas**: Creates 20 unique app ideas based on current capabilities
4. **Saves to Memory**: Every idea is stored with a unique ID to prevent repetition
5. **Smart Retrieval**: You can search and iterate on previous suggestions

## 📊 Key Features

### Memory System
- Never repeats ideas
- Saves all suggestions with timestamps
- Searchable history
- Unique ID for each idea

### GitHub Integration
- Real-time repository monitoring
- Tracks recent commits
- Analyzes file structure
- Uses latest documentation

### Idea Iteration
- Expand existing ideas
- Simplify complex concepts
- Pivot in new directions
- Combine multiple concepts

## 🔧 Advanced Features

### View Statistics
The MCP provides resources you can access:
- `rabbit://ideas/storage` - View all stored ideas
- `rabbit://ideas/stats` - View generation statistics

### Clear History
If you want to start fresh:
```
"Clear my Rabbit R1 idea history"
```

## 📁 File Locations

- **Server**: `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\`
- **Config**: `C:\Users\isman\.cursor\mcp.json`
- **Storage**: `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\rabbit-ideas-storage.json`
- **Startup**: `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\RabbitR1Ideas.lnk`
- **Logs**: `C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\startup.log`

## 🧪 Test the Installation

Run the test script:
```powershell
cd "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp"
.\test-server.ps1
```

All checks should show `[OK]`

## 🛠️ Troubleshooting

### Ideas Not Generating?
1. Restart Cursor completely
2. Check that Node.js is installed: `node --version`
3. Verify npm dependencies: `cd "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp" && npm install`

### Server Not Starting?
1. Check logs: `Get-Content "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\startup.log"`
2. Verify mcp.json configuration
3. Try running manually: `node "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp\index.js"`

### Ideas Repeating?
This shouldn't happen, but if it does:
1. Check `rabbit-ideas-storage.json` exists
2. Verify file permissions
3. Try clearing and regenerating: Ask "Clear my Rabbit R1 idea history"

## 🗑️ Uninstall

Run the uninstall script:
```powershell
cd "C:\Users\isman\Documents\rabbit r1 sdk mcp\rabbit-ideas-mcp"
.\uninstall.ps1
```

Or manually remove:
1. Startup shortcut from Windows Startup folder
2. `rabbit-r1-ideas` entry from `mcp.json`
3. The entire `rabbit-ideas-mcp` folder

## 📚 Documentation

For detailed documentation, see:
- `SETUP-INSTRUCTIONS.md` - Full setup guide
- `rabbit-ideas-mcp/README.md` - MCP server details

## 🌟 Example Workflow

1. **Start fresh in Cursor**
   ```
   "Give me 20 creative Rabbit R1 app ideas"
   ```

2. **Review and select**
   The AI will generate 20 unique ideas. Pick ones you like!

3. **Iterate on favorites**
   ```
   "Iterate on idea #7 and expand it with more features"
   ```

4. **Check what you've explored**
   ```
   "Show me all the ideas we've discussed"
   ```

5. **Generate more targeted ideas**
   ```
   "Give me 20 more Rabbit R1 ideas focused on gaming"
   ```

## 💡 Tips

- The server generates exactly 20 ideas per request (as specified)
- Ideas are never repeated across sessions
- Each generation considers the latest SDK features
- You can iterate on any previous idea by its index number
- The system remembers everything - even across Cursor restarts

## 🔗 Resources

- **Rabbit Creations SDK**: https://github.com/rabbit-hmi-oss/creations-sdk.git
- **Rabbit Website**: https://rabbit.tech/creations
- **MCP Protocol**: https://modelcontextprotocol.io

## ✨ Enjoy Creating!

Your AI assistant is now equipped to help you brainstorm unlimited creative Rabbit R1 app ideas. Each suggestion is unique, relevant, and based on the latest SDK capabilities.

**Next Step**: Restart Cursor and ask for your first batch of ideas! 🚀

