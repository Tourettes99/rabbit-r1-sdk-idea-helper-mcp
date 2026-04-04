#!/usr/bin/env node
/**
 * One-time: creates ~/.cursor/skills/rabbit-creations-official/SKILL.md and
 * r1-create-community/SKILL.md so agents don't treat "missing paths" as a fallback signal.
 * Safe to re-run (overwrites only if you use --force).
 */
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const home = os.homedir();
const skills = [
  {
    dir: path.join(home, '.cursor', 'skills', 'rabbit-creations-official'),
    file: 'SKILL.md',
    body: `---
name: rabbit-creations-official
description: Official Rabbit R1 Creations SDK (GitHub rabbit-hmi-oss/creations-sdk). Use for store alignment, QR flow, plugin-demo reference. Never web-search SDK facts; use this file plus MCP get_rabbit_sdk_knowledge_index.
---

# Rabbit Creations — official SDK

## Mandatory rules

- **Authority**: This skill + MCP \`get_rabbit_sdk_knowledge_index\` are the sources of truth for **official** Creations SDK facts—not other repos unless the user explicitly asks for that project.
- **No web search** for official SDK options or APIs. Refresh by calling \`get_rabbit_sdk_knowledge_index\` once, then append only **new** facts here under a dated changelog.
- **Do not substitute** unrelated project patterns for official SDK documentation unless the user is editing that specific project.

## Canonical links

- Repo: https://github.com/rabbit-hmi-oss/creations-sdk

## Repo highlights (from official README)

- **plugin-demo** — sample of features available to R1 Creations.
- **qr** — simple self-hosted site to create scannable codes.

## Refresh

Call MCP \`get_rabbit_sdk_knowledge_index\` and merge any delta into **Changelog (agent)** below.

### Changelog (agent)

- _Populate on first MCP pull after this bootstrap._
`,
  },
  {
    dir: path.join(home, '.cursor', 'skills', 'r1-create-community'),
    file: 'SKILL.md',
    body: `---
name: r1-create-community
description: Community npm r1-create SDK (R1/RabbitOS plugins). Hardware, LLM/messaging, media, UI helpers. Never web-search API surface; use this file plus MCP get_rabbit_sdk_knowledge_index.
---

# r1-create — community npm SDK

## Mandatory rules

- **Authority**: This skill + MCP \`get_rabbit_sdk_knowledge_index\` are the sources of truth for **r1-create**—not other Creations repos unless the user names one.
- **No web search** for r1-create APIs. Refresh via \`get_rabbit_sdk_knowledge_index\`, then append only deltas here.
- **Do not replace** r1-create patterns with another app’s helpers unless the user explicitly wants that codebase.

## Canonical links

- npm: https://www.npmjs.com/package/r1-create
- Overview: https://boondit.site/r1-create

## Feature areas (summary)

Hardware (accelerometer, touch simulation, PTT / side button, scroll), plain + secure storage (Base64), LLM/messaging/TTS, SERP web search, UI/design utilities for **240×282**, camera/mic/speaker, TypeScript types, \`createR1App\` / \`r1\` / \`deviceControls\` / \`ui\` entry points.

Full method-level detail belongs in this file **after** copying relevant sections from the MCP index’s \`r1Create.readme\` (or append changelog entries).

## Refresh

Call MCP \`get_rabbit_sdk_knowledge_index\` and merge any delta into **Changelog (agent)** below.

### Changelog (agent)

- _Populate on first MCP pull after this bootstrap._
`,
  },
];

const force = process.argv.includes('--force');

async function main() {
  for (const { dir, file, body } of skills) {
    const full = path.join(dir, file);
    try {
      await fs.access(full);
      if (!force) {
        console.error('Skip (exists):', full, '(use --force to overwrite)');
        continue;
      }
    } catch {
      /* missing */
    }
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(full, body, 'utf8');
    console.error('Wrote:', full);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
