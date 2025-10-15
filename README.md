# Rabbit R1 Ideas MCP Server

An MCP (Model Context Protocol) server that helps generate creative and unique Rabbit R1 creation app ideas while maintaining memory of previously suggested ideas to avoid repetition.

## Features

- **Intelligent Idea Generation**: Generates 20 unique app ideas per request based on the current Rabbit R1 Creations SDK
- **Memory System**: Remembers all previously suggested ideas to ensure no repetition
- **GitHub Integration**: Monitors the [creations-sdk repository](https://github.com/rabbit-hmi-oss/creations-sdk) for latest features and changes
- **Idea Retrieval**: Access previously suggested ideas for review and iteration
- **Idea Iteration**: Take existing ideas and create variations or improvements
- **Repository Status**: Get real-time information about the SDK structure and recent updates

## Tools Available

### 1. `generate_rabbit_creation_ideas`
Generates 20 creative and unique Rabbit R1 creation app ideas.

**Parameters:**
- `focusArea` (optional): Focus on specific category like "productivity", "entertainment", "utilities", etc.

### 2. `get_previous_ideas`
Retrieves previously suggested ideas.

**Parameters:**
- `limit` (optional): Number of ideas to retrieve
- `search` (optional): Search term to filter ideas

### 3. `iterate_on_idea`
Creates variations or improvements on a previous idea.

**Parameters:**
- `ideaIndex` (required): Index number of the idea to iterate on
- `iterationDirection` (optional): "expand", "simplify", "combine", or "pivot"

### 4. `get_repo_status`
Fetches current status of the Rabbit R1 Creations SDK repository.

### 5. `save_generated_ideas`
Saves newly generated ideas to persistent storage. **MUST** be called after generating ideas.

**Parameters:**
- `ideas` (required): Array of idea objects with name, description, features, category

### 6. `clear_idea_history`
Clears all previously suggested ideas (use with caution).

**Parameters:**
- `confirm` (required): Must be `true` to confirm

## Resources

- `rabbit://ideas/storage` - View all stored ideas and cache
- `rabbit://ideas/stats` - View statistics about generated ideas

## Installation

See the parent directory for installation and startup scripts.

## Storage

Ideas are stored in `rabbit-ideas-storage.json` which maintains:
- All suggested ideas with timestamps and unique IDs
- GitHub repository cache
- Last check timestamps

## How It Works

1. When you ask for ideas, the server fetches the latest information from the Rabbit R1 Creations SDK GitHub repo
2. It analyzes the current structure, features, and recent changes
3. The LLM generates 20 unique ideas that haven't been suggested before
4. The LLM calls `save_generated_ideas` to save them to persistent storage
5. Future requests check against stored ideas to ensure uniqueness

## Example Usage

In Cursor with MCP:
- "Give me 20 creative Rabbit R1 app ideas"
- "Show me previous ideas related to health"
- "Iterate on idea #5 and expand it"
- "What's the current status of the Rabbit SDK?"

## License

MIT

