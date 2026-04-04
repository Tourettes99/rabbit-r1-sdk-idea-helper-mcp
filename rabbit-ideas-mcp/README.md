# Rabbit R1 Ideas MCP Server

MCP server for **Rabbit R1 Creations** brainstorming with memory, a **unified SDK knowledge index** (official GitHub + npm `r1-create` + **registered documentation URLs**) in **one** tool call, and optional **GitHub library** sync to [Tourettes99/rabbit-r1-sdk-idea-helper-mcp](https://github.com/Tourettes99/rabbit-r1-sdk-idea-helper-mcp).

## SDKs covered

1. **Official**: [rabbit-hmi-oss/creations-sdk](https://github.com/rabbit-hmi-oss/creations-sdk) (GitHub API: README, tree, commits).
2. **Community**: [`r1-create`](https://www.npmjs.com/package/r1-create) — README via unpkg, metadata via registry. Docs hub: [boondit.site/r1-create](https://boondit.site/r1-create).
3. **Your library**: any http(s) URLs registered with **`register_documentation_source`** (fetched alongside the above).

## Tools

See the full table in the parent [README](../README.md). Highlights:

- **`get_rabbit_sdk_knowledge_index`** — parallel fetch of official + `r1-create` + all registered doc URLs → `registeredDocumentation`.
- **`register_documentation_source`** / **`list_documentation_sources`** / **`remove_documentation_source`**
- **`discover_missing_local_skills`** / **`ensure_local_skill_for_registered_source`**
- **`publish_documentation_library_to_github`** / **`pull_documentation_library_from_github`** (needs **`RABBIT_MCP_GITHUB_TOKEN`** or **`GITHUB_TOKEN`** for publish)

### `get_rabbit_sdk_knowledge_index` (use first for SDK work)

Returns truncated READMEs, **`registeredDocumentation`**, keyword index (including **`registeredDocKeywords`**), **`recommendation`**, **`skillGuidance`** (incl. documentation library notes). Parameters: `refreshCache`, `maxReadmeChars`.

### `generate_rabbit_creation_ideas`

Optional **`sdkTarget`**: `auto` | `official_creations_sdk` | `r1_create` | `both`.

### Other tools

`get_previous_ideas`, `iterate_on_idea`, `get_repo_status`, `save_generated_ideas`, `clear_idea_history`.

## Resources

- `rabbit://ideas/storage` — full storage JSON.
- `rabbit://ideas/stats` — stats + SDK cache timestamps + documentation source count.
- `rabbit://sdk/knowledge-index` — last unified index payload.
- `rabbit://documentation/library` — registered sources + default library repo URLs.

## Install

- **macOS/Linux**: `./install.sh` from this directory.
- **Windows**: `npm install` (or `install.ps1` for optional startup logging).

**Node ≥ 18**.

## Personal skills (not committed here)

- `rabbit-creations-official/SKILL.md`, `r1-create-community/SKILL.md` — **`npm run bootstrap-skills`** or agent-created from MCP.
- **`~/.cursor/skills/{skillSlug}/SKILL.md`** — one per registered documentation source; use **`ensure_local_skill_for_registered_source`**.

## License

MIT
