# Rabbit R1 Ideas MCP

[MCP](https://modelcontextprotocol.io) server that:

- Generates and remembers **Rabbit R1 Creations** app ideas (backed by the official [creations-sdk](https://github.com/rabbit-hmi-oss/creations-sdk) repo on GitHub).
- Pulls a **single-shot knowledge index** of **two** SDK paths in one tool call: official Creations SDK + community **[r1-create](https://www.npmjs.com/package/r1-create)** (README from [unpkg](https://unpkg.com/r1-create@latest/README.md), metadata from the npm registry). Community overview: [Boondit R1 Create SDK](https://boondit.site/r1-create).

**Node.js 18+** required (global `fetch`).

## Personal skills bootstrap (recommended once per machine)

So agents never treat “missing skill paths” as a reason to copy **other** repos (e.g. meshy-print-r1), either:

- **Run the stub generator** (same result on every clone):

```bash
cd rabbit-ideas-mcp
npm run bootstrap-skills
```

Use `npm run bootstrap-skills -- --force` to overwrite stubs. Then let the agent merge MCP index deltas into each `SKILL.md`.

- **Or skip bootstrap** and rely on the agent: after **`get_rabbit_sdk_knowledge_index`**, the agent can **create** `~/.cursor/skills/rabbit-creations-official/SKILL.md` and `r1-create-community/SKILL.md` from the MCP payload (`officialCreationsSdk`, `r1Create`, `skillGuidance`). The MCP response tells it to do that when files are missing.

## Install

### macOS / Linux

```bash
cd rabbit-ideas-mcp
chmod +x install.sh
./install.sh
```

### Windows (PowerShell)

```powershell
cd rabbit-ideas-mcp
npm install
```

Optional: use `install.ps1` if you rely on the Windows startup shortcut workflow (Cursor still spawns the server via `mcp.json`).

## Cursor MCP configuration

Add to `~/.cursor/mcp.json` (macOS/Linux) or `%USERPROFILE%\.cursor\mcp.json` (Windows). Use the **absolute path** to `index.js` on your machine:

```json
{
  "mcpServers": {
    "rabbit-r1-ideas": {
      "command": "node",
      "args": ["/absolute/path/to/rabbit-ideas-mcp/index.js"]
    }
  }
}
```

## Tools

| Tool | Purpose |
|------|---------|
| **`get_rabbit_sdk_knowledge_index`** | **Call this first** when you need both SDKs. Parallel fetch: official GitHub repo (README, tree, commits) + `r1-create` (npm + README). Returns comparison hints, keyword index, links, and **where to store personal Cursor skills** (`~/.cursor/skills/...`). Optional: `refreshCache`, `maxReadmeChars`. |
| `generate_rabbit_creation_ideas` | Context for 20 ideas; optional `sdkTarget`: `auto` \| `official_creations_sdk` \| `r1_create` \| `both`. |
| `get_previous_ideas` | List / search stored ideas. |
| `iterate_on_idea` | Iterate on a stored idea by index. |
| `get_repo_status` | Official GitHub repo snapshot only. |
| `save_generated_ideas` | Persist generated ideas. |
| `clear_idea_history` | Reset stored ideas (`confirm: true`). |

## Personal skills (not in this repo)

SDK knowledge should live in **personal** Cursor skills so it is not committed to application codebases:

- `~/.cursor/skills/rabbit-creations-official/SKILL.md` — official Creations SDK / GitHub workflow.
- `~/.cursor/skills/r1-create-community/SKILL.md` — npm `r1-create` APIs and patterns.

**Creating those files:** use **`npm run bootstrap-skills`** once, **or** rely on the agent to create them from the **`get_rabbit_sdk_knowledge_index`** payload when they do not exist yet.

After calling `get_rabbit_sdk_knowledge_index`, the agent should **merge only new facts** into those files (append / dated changelog). Each skill should state explicitly: **do not web-search** for SDK API details when the skill + MCP already cover them; refresh via this tool instead.

See Cursor’s skill layout in [Creating Skills in Cursor](https://cursor.com/docs) (personal vs project skills).

## Environment

| Variable | Meaning |
|----------|---------|
| `RABBIT_MCP_SDK_CACHE_TTL_MS` | TTL for cached unified index in `rabbit-ideas-storage.json` (default `86400000` ms). |

## Resources

- `rabbit://ideas/storage` — full JSON storage.
- `rabbit://ideas/stats` — counts and cache timestamps.
- `rabbit://sdk/knowledge-index` — last cached unified index (if any).

## License

MIT — see [LICENSE](LICENSE).

`r1-create` is a separate project (Apache-2.0 on npm); this MCP only fetches public metadata and README text.
