# Rabbit R1 Ideas MCP Server

MCP server for **Rabbit R1 Creations** brainstorming with memory, plus a **unified SDK knowledge index** (official GitHub + npm `r1-create`) in **one tool call**.

## SDKs covered

1. **Official**: [rabbit-hmi-oss/creations-sdk](https://github.com/rabbit-hmi-oss/creations-sdk) (GitHub API: README, tree, commits).
2. **Community**: [`r1-create`](https://www.npmjs.com/package/r1-create) — README via unpkg, metadata via registry. Docs hub: [boondit.site/r1-create](https://boondit.site/r1-create).

## Tools

### `get_rabbit_sdk_knowledge_index` (use first for SDK work)

Fetches **both** sources in parallel. Returns:

- Truncated READMEs (configurable `maxReadmeChars`, default 14000 each).
- File list + recent commits (official).
- Version, keywords, description (`r1-create`).
- **Keyword index** for quick scanning.
- **`recommendation`** — hints for when to lean official vs `r1-create`.
- **`skillGuidance`** — paths under `~/.cursor/skills/` for **personal** skills; includes mandatory “no web search for SDK APIs” rules to paste into each `SKILL.md`. If those files are missing, the agent should **create** them from this response (or you can run **`npm run bootstrap-skills`** in this folder instead).

Parameters: `refreshCache` (boolean), `maxReadmeChars` (number).

Cached in `rabbit-ideas-storage.json` under `sdkIndexCache` (TTL from env `RABBIT_MCP_SDK_CACHE_TTL_MS`, default 24h).

### `generate_rabbit_creation_ideas`

Same as before, plus optional **`sdkTarget`**: `auto` | `official_creations_sdk` | `r1_create` | `both`.

### Other tools

- `get_previous_ideas`, `iterate_on_idea`, `get_repo_status`, `save_generated_ideas`, `clear_idea_history` — unchanged behavior (see parent [README](../README.md)).

## Resources

- `rabbit://ideas/storage` — full storage JSON.
- `rabbit://ideas/stats` — stats + SDK cache timestamps.
- `rabbit://sdk/knowledge-index` — last unified index payload.

## Install

- **macOS/Linux**: `./install.sh` from this directory.
- **Windows**: `npm install` (or `install.ps1` for optional startup logging).

**Node ≥ 18**.

## Personal skills (not committed here)

Maintain two skills in **`~/.cursor/skills/`** only:

- `rabbit-creations-official/SKILL.md`
- `r1-create-community/SKILL.md`

**How they appear:** run **`npm run bootstrap-skills`** once per machine, **or** have the agent create them after **`get_rabbit_sdk_knowledge_index`** using the payload (see `skillGuidance` + readme fields).

Update them **only** when the MCP index shows new facts; append deltas, do not replace blindly.

## License

MIT
