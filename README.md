# Rabbit R1 Ideas MCP

[MCP](https://modelcontextprotocol.io) server that:

- Generates and remembers **Rabbit R1 Creations** app ideas (backed by the official [creations-sdk](https://github.com/rabbit-hmi-oss/creations-sdk) repo on GitHub).
- Pulls a **single-shot knowledge index** in one tool call: official Creations SDK + community **[r1-create](https://www.npmjs.com/package/r1-create)** **plus any URLs you register** in the local documentation library (merged into the same payload).
- Optionally **publishes** per-source `SKILL.md` stubs and a shared manifest to **[Tourettes99/rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp)** under `library/` (requires a GitHub PAT with repo write).

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
| **`get_rabbit_sdk_knowledge_index`** | **Call this first** for SDK + docs context. Parallel fetch: official GitHub + `r1-create` + **every registered documentation URL**. Returns `registeredDocumentation`, comparison, keyword index, `skillGuidance`. Optional: `refreshCache`, `maxReadmeChars`. |
| `register_documentation_source` | Add `name` + `url` (http(s)). Optional `skillSlug`; optional `autoPublishToGithub` (needs token). Stored in `rabbit-ideas-storage.json`; included in the next index fetch. |
| `list_documentation_sources` | List registered library entries. |
| `remove_documentation_source` | Remove by `id` (`confirm: true`). |
| `discover_missing_local_skills` | Compares library to `~/.cursor/skills/{skillSlug}/SKILL.md`. |
| `ensure_local_skill_for_registered_source` | Fetch URL and write/update local `SKILL.md` for one `sourceId`. |
| `publish_documentation_library_to_github` | Push `library/skills/{slug}/SKILL.md` for each (or one `sourceId`) + `library/documentation-sources.json` to the [library repo](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp). Requires **`RABBIT_MCP_GITHUB_TOKEN`** or **`GITHUB_TOKEN`**. |
| `pull_documentation_library_from_github` | Merge new entries from the repo manifest into local storage (does not delete local-only sources). |
| `generate_rabbit_creation_ideas` | Context for 20 ideas; optional `sdkTarget`: `auto` \| `official_creations_sdk` \| `r1_create` \| `both`. |
| `get_previous_ideas` | List / search stored ideas. |
| `iterate_on_idea` | Iterate on a stored idea by index. |
| `get_repo_status` | Official GitHub repo snapshot only. |
| `save_generated_ideas` | Persist generated ideas. |
| `clear_idea_history` | Reset stored ideas (`confirm: true`). |

### Documentation library flow

1. **`register_documentation_source`** (or **`pull_documentation_library_from_github`** after someone else published).
2. **`get_rabbit_sdk_knowledge_index`** — one payload includes official SDK, `r1-create`, and all registered URLs.
3. **`discover_missing_local_skills`** → **`ensure_local_skill_for_registered_source`** for each new `skillSlug` so Cursor loads a personal skill.
4. Optionally **`publish_documentation_library_to_github`** to sync `library/` on [rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp) for others to **`pull`**.

## Personal skills (not in this repo)

SDK knowledge should live in **personal** Cursor skills so it is not committed to application codebases:

- `~/.cursor/skills/rabbit-creations-official/SKILL.md` — official Creations SDK / GitHub workflow.
- `~/.cursor/skills/r1-create-community/SKILL.md` — npm `r1-create` APIs and patterns.
- `~/.cursor/skills/{skillSlug}/SKILL.md` — one folder per **`register_documentation_source`** entry (slug from name or `skillSlug`).

**Creating those files:** use **`npm run bootstrap-skills`** once, **or** rely on the agent to create them from the **`get_rabbit_sdk_knowledge_index`** payload when they do not exist yet.

After calling `get_rabbit_sdk_knowledge_index`, the agent should **merge only new facts** into those files (append / dated changelog). Each skill should state explicitly: **do not web-search** for SDK API details when the skill + MCP already cover them; refresh via this tool instead.

See Cursor’s skill layout in [Creating Skills in Cursor](https://cursor.com/docs) (personal vs project skills).

## Environment

| Variable | Meaning |
|----------|---------|
| `RABBIT_MCP_SDK_CACHE_TTL_MS` | TTL for cached unified index in `rabbit-ideas-storage.json` (default `86400000` ms). |
| `RABBIT_MCP_GITHUB_TOKEN` or `GITHUB_TOKEN` | **Fine-grained or classic PAT** with **Contents: Read and write** on [Tourettes99/rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp) (or your override repo). Used for `publish_*` and `autoPublishToGithub`. Never commit the token. |
| `RABBIT_MCP_LIBRARY_REPO` | Optional `owner/repo` override for publishes (default `Tourettes99/rabbit-r1-sdk-idea-helper-mcp`). |

## Resources

- `rabbit://ideas/storage` — full JSON storage.
- `rabbit://ideas/stats` — counts and cache timestamps.
- `rabbit://sdk/knowledge-index` — last cached unified index (if any).
- `rabbit://documentation/library` — registered documentation sources + default library repo URLs.

## FAQ

### What does this MCP do?

It runs as a **stdio** MCP server in Cursor (and similar clients). It (1) helps generate and **remember** Rabbit R1 **Creations** app ideas using live context from the **official** [creations-sdk](https://github.com/rabbit-hmi-oss/creations-sdk) repo, and (2) exposes **`get_rabbit_sdk_knowledge_index`**, which pulls **official GitHub + npm `r1-create` + registered doc URLs** in **one** call so the agent does not need many separate lookups. Optional tools publish a growing **`library/`** on [rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp).

### What are the requirements?

**Node.js 18+** (for global `fetch`). No API keys are required for this server; it only calls public GitHub and npm/unpkg endpoints.

### How do I add it to Cursor?

Put an entry in **`~/.cursor/mcp.json`** (macOS/Linux) or **`%USERPROFILE%\.cursor\mcp.json`** (Windows) with `"command": "node"` and **`args`** set to the **absolute path** to `rabbit-ideas-mcp/index.js`. Paths with spaces are fine inside the JSON string. **Restart Cursor** (or reload MCP) after changing `mcp.json`.

### Will it work for other people if I put the repo on GitHub?

Yes. They clone, run **`npm install`** in `rabbit-ideas-mcp`, and point **their** `mcp.json` at **their** machine’s path to `index.js`. **`mcp.json`**, **`rabbit-ideas-storage.json`**, and **`~/.cursor/skills/...`** are per user and are not shared by the repo alone (storage is gitignored).

### Why two SDKs (official vs `r1-create`)?

**Official** `creations-sdk` is the canonical GitHub repo (plugin-demo, QR flow, short README). **`r1-create`** is a **community** npm package with a richer TS/API surface (hardware, LLM helpers, UI, etc.). The index tool returns **both** plus **`recommendation`** hints; the agent still follows **your** task and skills.

### Which tool should the agent call first for SDK work?

**`get_rabbit_sdk_knowledge_index`**. Use **`refreshCache: true`** when you want to bypass the server-side cache and refetch everything. Use **`maxReadmeChars`** if you need longer or shorter README excerpts in the payload.

### Where is data stored?

Next to the server: **`rabbit-ideas-mcp/rabbit-ideas-storage.json`** — suggested ideas, optional repo snapshot, and **`sdkIndexCache`** for the unified index. That file is **gitignored** so personal ideas and cache are not pushed to GitHub.

### How long is the SDK index cached?

Default **24 hours** (`86400000` ms). Override with env **`RABBIT_MCP_SDK_CACHE_TTL_MS`** (milliseconds).

### Why bootstrap personal skills (`npm run bootstrap-skills`)?

So **`~/.cursor/skills/rabbit-creations-official/SKILL.md`** and **`r1-create-community/SKILL.md`** exist before the first run. That avoids agents inventing patterns from **unrelated** open projects (e.g. another Creations app in the workspace). **`npm run bootstrap-skills -- --force`** overwrites those stubs; re-merge anything you need from a fresh MCP index afterward.

### Can I skip bootstrap?

Yes. After **`get_rabbit_sdk_knowledge_index`**, the agent can **create** the two skill files from the payload (`skillGuidance`, README fields). Bootstrap is just the repeatable, clone-friendly shortcut.

### Do SDK skills live in this git repo?

**No.** Keep them under **`~/.cursor/skills/`** (personal skills). This repo only ships **`bootstrap-skills.mjs`** to generate the same stubs locally.

### Why must ideas be saved with `save_generated_ideas`?

So the server can enforce **non-repetition** across sessions. After the model generates ideas, it should call **`save_generated_ideas`** with the array. **`clear_idea_history`** with **`confirm: true`** resets the list.

### What is `sdkTarget` on `generate_rabbit_creation_ideas`?

**`auto`** (default), **`official_creations_sdk`**, **`r1_create`**, or **`both`** — steers the **hint text** in the context the tool returns; it does not switch which remote servers are called for that tool alone (full dual-SDK pull is **`get_rabbit_sdk_knowledge_index`**).

### The MCP tools do not show up in Cursor

Confirm **`mcp.json`** syntax, that **`node`** runs in a terminal, and the **`index.js`** path is correct. **Restart Cursor** fully. On Windows, use the full path to **`node.exe`** in `"command"` only if Cursor’s environment does not see `node` on `PATH`.

### GitHub returns little or no README text

The official **creations-sdk** README can be **short** by design; the server still returns **file tree** and **commits**. For long API docs use **`r1-create`**’s README in the same index payload. Unauthenticated GitHub can hit **rate limits**; if that happens, try again later or reduce parallel traffic from the same IP.

### Is `r1-create` official Rabbit?

**No.** It is a **community** npm package ([npm](https://www.npmjs.com/package/r1-create), [Boondit overview](https://boondit.site/r1-create)). This MCP only **reads public** package metadata and README text; it does not endorse or bundle that SDK.

### What about `npm audit` reporting vulnerabilities?

They usually come from **`@modelcontextprotocol/sdk`** or transitive dependencies. Fixing may require a major SDK bump; treat as normal Node dependency hygiene, not specific to Rabbit product logic.

### How does the documentation library + GitHub sync work?

You **register** http(s) URLs with **`register_documentation_source`**. They are stored locally and **fetched in parallel** with the two SDKs when you call **`get_rabbit_sdk_knowledge_index`**. To create Cursor skills, use **`discover_missing_local_skills`** and **`ensure_local_skill_for_registered_source`**.

To update **[Tourettes99/rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp)**, set **`RABBIT_MCP_GITHUB_TOKEN`** (or **`GITHUB_TOKEN`**) with permission to push to that repo, then use **`publish_documentation_library_to_github`** or **`autoPublishToGithub: true`** on register. The MCP writes **`library/skills/{skillSlug}/SKILL.md`** and **`library/documentation-sources.json`**. Others can run **`pull_documentation_library_from_github`** to import new manifest entries.

HTML pages are turned into plain text with a simple strip (not a full browser); prefer raw Markdown or plain text URLs when possible.

### Why did my GitHub publish fail?

Common causes: missing or expired token, token without **repo contents** scope, pushing to a repo you do not own (fork without permissions), or branch not **`main`** for the raw manifest URL. The server uses **`main`** for **`pull_documentation_library_from_github`**.

## License

MIT — see [LICENSE](LICENSE).

`r1-create` is a separate project (Apache-2.0 on npm); this MCP only fetches public metadata and README text.
