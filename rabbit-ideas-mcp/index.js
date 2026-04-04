#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import * as docLib from './documentation-library.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDEAS_STORAGE_FILE = path.join(__dirname, 'rabbit-ideas-storage.json');
const GITHUB_REPO = 'rabbit-hmi-oss/creations-sdk';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
const NPM_R1_CREATE = 'https://registry.npmjs.org/r1-create/latest';
const UNPKG_README = 'https://unpkg.com/r1-create@latest/README.md';
const UNPKG_PKG = 'https://unpkg.com/r1-create@latest/package.json';
const BOONDIT_R1_CREATE_URL = 'https://boondit.site/r1-create';
const NPM_WEB_R1_CREATE = 'https://www.npmjs.com/package/r1-create';
const LIBRARY_REPO_DEFAULT = docLib.DEFAULT_LIBRARY_REPO;
const LIBRARY_MANIFEST_RAW = `https://raw.githubusercontent.com/${LIBRARY_REPO_DEFAULT}/main/library/documentation-sources.json`;

const DEFAULT_SDK_CACHE_TTL_MS = Number(process.env.RABBIT_MCP_SDK_CACHE_TTL_MS || 86_400_000);

function truncate(text, max) {
  if (text == null) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max)}\n\n[…truncated: ${text.length - max} chars omitted; use npm/GitHub or refresh with larger maxReadmeChars]`;
}

function skillPathsHint() {
  const home = os.homedir();
  return {
    officialSkillDir: path.join(home, '.cursor', 'skills', 'rabbit-creations-official'),
    r1CreateSkillDir: path.join(home, '.cursor', 'skills', 'r1-create-community'),
    officialSkillFile: path.join(home, '.cursor', 'skills', 'rabbit-creations-official', 'SKILL.md'),
    r1CreateSkillFile: path.join(home, '.cursor', 'skills', 'r1-create-community', 'SKILL.md'),
  };
}

function mandatorySkillRulesBlock() {
  return `## Mandatory rules (embed in every Rabbit SDK skill you maintain)

- **Source of truth**: Treat the feature list and API notes in *this* SKILL.md as authoritative for that SDK.
- **No web search for API surface**: Do **not** use web search to discover or verify Rabbit SDK options, methods, or capabilities while building. If something is missing here, call the MCP tool \`get_rabbit_sdk_knowledge_index\` once, then **append only the delta** to this file.
- **Prefer MCP over guessing**: Use \`get_rabbit_sdk_knowledge_index\` for a single-shot refresh of **both** SDKs (official creations-sdk GitHub + npm \`r1-create\`).
- **Update discipline**: Update this skill **only** when new facts are required beyond what is already recorded—merge additive sections, do not replace working knowledge without reason.
- **No cross-repo substitution**: Do **not** treat another repository’s Creations code (e.g. meshy-print-r1: \`creationStorage\`, \`CreationVoiceHandler\`, \`sttEnded\`, etc.) as the SDK spec unless the user explicitly asked to follow that project. Official vs r1-create facts come from **this skill + MCP**, not from whatever happens to be open in the workspace.`;
}

function buildRecommendation({ official, r1Create }) {
  const officialHints = (official.readme || '').toLowerCase();
  const r1 = r1Create.packageJson || {};
  const r1Readme = (r1Create.readme || '').toLowerCase();

  const picks = [];

  const needsDeepHardware =
    /accelerometer|scroll|ptt|side\s*button|device\s*controls|microphone|camera/i.test(r1Readme) &&
    !officialHints.includes('plugin-demo');

  const wantsNpmFirstPartyWorkflow = officialHints.includes('qr') || officialHints.includes('plugin');

  if (needsDeepHardware || r1Readme.includes('r1.llm') || r1Readme.includes('createR1App')) {
    picks.push({
      sdk: 'r1-create',
      reason: 'Community npm SDK exposes bundled hardware, LLM/messaging, media, and UI helpers; strong fit for feature-rich device-native plugins.',
    });
  }

  picks.push({
    sdk: 'official_creations_sdk',
    reason: 'Official rabbit-hmi-oss/creations-sdk is the canonical reference for Creations packaging, QR flow, and first-party expectations.',
  });

  if (wantsNpmFirstPartyWorkflow) {
    picks.unshift({
      sdk: 'official_creations_sdk',
      reason: 'Prefer official repo docs when aligning with Creations store / QR submission workflows.',
    });
  }

  const unique = [];
  const seen = new Set();
  for (const p of picks) {
    const k = p.sdk + p.reason;
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(p);
  }

  return {
    summary:
      'Choose **official_creations_sdk** for store/QR alignment and canonical docs. Choose **r1-create** when you need the npm/TS surface (hardware, LLM wrappers, UI kit). You may combine: prototype with r1-create, validate packaging against official docs.',
    ranked: unique.slice(0, 5),
    links: {
      officialRepo: `https://github.com/${GITHUB_REPO}`,
      r1CreateNpm: NPM_WEB_R1_CREATE,
      r1CreateBoondit: BOONDIT_R1_CREATE_URL,
      r1CreateGithub: r1.repository?.url || r1.homepage || 'https://github.com/AidanTheBandit/R1-create.js',
    },
  };
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': 'rabbit-r1-ideas-mcp', ...headers } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'rabbit-r1-ideas-mcp' } });
  if (!res.ok) return null;
  return res.text();
}

async function fetchOfficialSdkBundle() {
  const [repoInfo, commits, structure, readme] = await Promise.all([
    fetchGitHubRepo(),
    fetchRecentCommits(),
    fetchRepoStructure(),
    fetchReadme(),
  ]);
  return { repoInfo, commits, structure, readme };
}

async function fetchR1CreateBundle() {
  let registry = null;
  try {
    registry = await fetchJson(NPM_R1_CREATE);
  } catch (e) {
    registry = { error: e.message };
  }
  const [readme, packageJson] = await Promise.all([fetchText(UNPKG_README), fetchText(UNPKG_PKG)]);
  let pkg = null;
  if (packageJson) {
    try {
      pkg = JSON.parse(packageJson);
    } catch {
      pkg = null;
    }
  }
  return {
    registry,
    readme: readme || '',
    packageJson: pkg,
    version: pkg?.version || registry?.version || null,
  };
}

async function initStorage() {
  try {
    await fs.access(IDEAS_STORAGE_FILE);
  } catch {
    const initialData = {
      suggestedIdeas: [],
      repoCache: null,
      lastChecked: null,
      sdkIndexCache: null,
      documentationLibrary: { sources: [] },
    };
    await fs.writeFile(IDEAS_STORAGE_FILE, JSON.stringify(initialData, null, 2));
  }
}

async function loadStorage() {
  try {
    const data = await fs.readFile(IDEAS_STORAGE_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (parsed.sdkIndexCache === undefined) parsed.sdkIndexCache = null;
    if (!parsed.documentationLibrary || !Array.isArray(parsed.documentationLibrary.sources)) {
      parsed.documentationLibrary = { sources: [] };
    }
    const srcLen = parsed.documentationLibrary.sources.length;
    if (
      srcLen > 0 &&
      parsed.sdkIndexCache?.payload &&
      !Array.isArray(parsed.sdkIndexCache.payload.registeredDocumentation)
    ) {
      parsed.sdkIndexCache = null;
    }
    return parsed;
  } catch {
    return {
      suggestedIdeas: [],
      repoCache: null,
      lastChecked: null,
      sdkIndexCache: null,
      documentationLibrary: { sources: [] },
    };
  }
}

async function saveStorage(data) {
  await fs.writeFile(IDEAS_STORAGE_FILE, JSON.stringify(data, null, 2));
}

async function fetchGitHubRepo() {
  try {
    return await fetchJson(GITHUB_API_URL);
  } catch (error) {
    console.error('Error fetching GitHub repo:', error.message);
    return null;
  }
}

async function fetchRecentCommits() {
  try {
    return await fetchJson(`${GITHUB_API_URL}/commits?per_page=10`);
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    return [];
  }
}

async function fetchRepoStructure() {
  try {
    return await fetchJson(`${GITHUB_API_URL}/git/trees/main?recursive=1`);
  } catch (error) {
    console.error('Error fetching repo structure:', error.message);
    return null;
  }
}

async function fetchRegisteredDocumentation(sources, maxReadmeChars) {
  if (!sources?.length) return [];
  return Promise.all(
    sources.map(async (src) => {
      try {
        const { text, contentType } = await docLib.fetchDocUrl(src.url);
        const normalized = docLib.normalizeFetchedText(text, contentType);
        return {
          id: src.id,
          name: src.name,
          url: src.url,
          skillSlug: src.skillSlug,
          content: truncate(normalized, maxReadmeChars),
          textLength: normalized.length,
          error: null,
        };
      } catch (e) {
        return {
          id: src.id,
          name: src.name,
          url: src.url,
          skillSlug: src.skillSlug,
          content: '',
          textLength: 0,
          error: e.message,
        };
      }
    })
  );
}

async function discoverMissingLocalSkills(storage) {
  const skillsRoot = path.join(os.homedir(), '.cursor', 'skills');
  const missing = [];
  const present = [];
  for (const src of storage.documentationLibrary?.sources || []) {
    const skillFile = path.join(skillsRoot, src.skillSlug, 'SKILL.md');
    try {
      await fs.access(skillFile);
      present.push({ skillSlug: src.skillSlug, sourceId: src.id, name: src.name });
    } catch {
      missing.push({ skillSlug: src.skillSlug, sourceId: src.id, name: src.name, url: src.url });
    }
  }
  return { missing, present, skillsRoot };
}

async function writeLocalSkillForSource(source, normalizedText) {
  const snippet = normalizedText.slice(0, 120_000);
  const body = docLib.buildSkillMarkdownFromDoc({
    name: source.name,
    url: source.url,
    skillSlug: source.skillSlug,
    bodySnippet: snippet,
  });
  const dir = path.join(os.homedir(), '.cursor', 'skills', source.skillSlug);
  await fs.mkdir(dir, { recursive: true });
  const skillFile = path.join(dir, 'SKILL.md');
  await fs.writeFile(skillFile, body, 'utf8');
  return skillFile;
}

async function fetchReadme() {
  try {
    const response = await fetch(`${GITHUB_API_URL}/readme`, {
      headers: {
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'rabbit-r1-ideas-mcp',
      },
    });
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching README:', error.message);
    return null;
  }
}

async function buildUnifiedKnowledgeIndex({ maxReadmeChars, documentationSources = [] }) {
  const [officialRaw, r1CreateRaw, registeredDocumentation] = await Promise.all([
    fetchOfficialSdkBundle(),
    fetchR1CreateBundle(),
    fetchRegisteredDocumentation(documentationSources, maxReadmeChars),
  ]);

  const officialReadme = officialRaw.readme || '';
  const r1Readme = r1CreateRaw.readme || '';

  const official = {
    source: 'github',
    repository: GITHUB_REPO,
    description: officialRaw.repoInfo?.description || null,
    stars: officialRaw.repoInfo?.stargazers_count ?? null,
    pushedAt: officialRaw.repoInfo?.pushed_at || null,
    readme: truncate(officialReadme, maxReadmeChars),
    readmeLength: officialReadme.length,
    recentCommits: (officialRaw.commits || []).slice(0, 10).map((c) => ({
      message: c.commit?.message,
      author: c.commit?.author?.name,
      date: c.commit?.author?.date,
    })),
    filePaths: (officialRaw.structure?.tree || []).map((t) => t.path).filter(Boolean),
    fileCount: officialRaw.structure?.tree?.length ?? 0,
  };

  const r1Create = {
    source: 'npm',
    name: 'r1-create',
    version: r1CreateRaw.version,
    description: r1CreateRaw.packageJson?.description || r1CreateRaw.registry?.description || null,
    license: r1CreateRaw.packageJson?.license || null,
    homepage: r1CreateRaw.packageJson?.homepage || BOONDIT_R1_CREATE_URL,
    repository: r1CreateRaw.packageJson?.repository || r1CreateRaw.registry?.repository || null,
    readme: truncate(r1Readme, maxReadmeChars),
    readmeLength: r1Readme.length,
    registryError: r1CreateRaw.registry?.error || null,
    keywords: r1CreateRaw.packageJson?.keywords || r1CreateRaw.registry?.keywords || [],
  };

  const featureIndex = {
    officialKeywords: extractKeywords(official.readme + official.filePaths.join('\n')),
    r1CreateKeywords: extractKeywords(r1Create.readme + (r1Create.keywords || []).join(' ')),
    registeredDocKeywords: extractKeywords(registeredDocumentation.map((d) => d.content).join('\n')),
    note: 'Keyword buckets are shallow token hints for quick scanning; rely on readme bodies for accuracy.',
  };

  const recommendation = buildRecommendation({
    official: { readme: officialReadme },
    r1Create: { readme: r1Readme, packageJson: r1CreateRaw.packageJson },
  });

  const skillGuidance = {
    storage: 'Personal skills only — do not commit SDK skills into app repositories.',
    paths: skillPathsHint(),
    mandatoryRulesMarkdown: mandatorySkillRulesBlock(),
    firstRunBehavior: [
      'It is normal if ~/.cursor/skills/rabbit-creations-official/SKILL.md or r1-create-community/SKILL.md did not exist before: create those directories and files immediately using this response (copy officialCreationsSdk.readme + r1Create.readme excerpts into the right skill).',
      'Do NOT say you are "following meshy-print-r1" or any other open project as a substitute for these SDKs unless the user named that project.',
      'Repo ships bootstrap-skills.mjs: run `node rabbit-ideas-mcp/bootstrap-skills.mjs` once per machine to create the two SKILL.md stubs.',
    ],
    howToUpdate:
      'When npm or GitHub adds new APIs, call get_rabbit_sdk_knowledge_index(refreshCache:true), diff against your SKILL.md, append a dated "Changelog (agent)" section with only new facts.',
    suggestedSkillNames: {
      official: 'rabbit-creations-official',
      r1Create: 'r1-create-community',
    },
    documentationLibrary: {
      note:
        'Registered doc URLs are merged into this index as registeredDocumentation. Each source uses skillSlug under ~/.cursor/skills/{skillSlug}/. Use discover_missing_local_skills, ensure_local_skill_for_registered_source, register_documentation_source, publish_documentation_library_to_github, pull_documentation_library_from_github.',
      defaultGithubLibraryRepo: LIBRARY_REPO_DEFAULT,
      manifestRawUrl: LIBRARY_MANIFEST_RAW,
      tokenEnv: 'Set RABBIT_MCP_GITHUB_TOKEN or GITHUB_TOKEN (repo contents write) to publish to the library repo.',
    },
  };

  return {
    fetchedAt: new Date().toISOString(),
    officialCreationsSdk: official,
    r1Create,
    registeredDocumentation,
    documentationLibrarySummary: {
      sourceCount: documentationSources.length,
      defaultGithubLibraryRepo: LIBRARY_REPO_DEFAULT,
      manifestRawUrl: LIBRARY_MANIFEST_RAW,
    },
    unifiedFeatureIndex: featureIndex,
    recommendation,
    skillGuidance,
    referenceLinks: {
      officialRepo: `https://github.com/${GITHUB_REPO}`,
      r1CreateNpm: NPM_WEB_R1_CREATE,
      r1CreateDocsSite: BOONDIT_R1_CREATE_URL,
      libraryRepo: `https://github.com/${LIBRARY_REPO_DEFAULT}`,
    },
  };
}

function extractKeywords(text) {
  const raw = (text || '').toLowerCase();
  const tokens = raw.match(/[a-z][a-z0-9_+-]{2,}/g) || [];
  const freq = new Map();
  for (const t of tokens) {
    if (t.length < 3) continue;
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([w]) => w);
}

function sdkCacheValid(cache) {
  if (!cache || !cache.expiresAt) return false;
  return Date.parse(cache.expiresAt) > Date.now();
}

const server = new Server(
  {
    name: 'rabbit-r1-ideas-mcp',
    version: '2.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_rabbit_sdk_knowledge_index',
        description:
          '**Single-shot knowledge pull (use this first).** Fetches in parallel: official Creations SDK GitHub, npm r1-create, **and every URL in the local documentation library** (see register_documentation_source). Returns registeredDocumentation, comparison, keyword index, skillGuidance. Personal skills: bootstrap or create from payload; registered sources use ~/.cursor/skills/{skillSlug}/. Do not fall back to unrelated repos as SDK authority. Optional: refreshCache, maxReadmeChars.',
        inputSchema: {
          type: 'object',
          properties: {
            refreshCache: {
              type: 'boolean',
              description: 'If true, bypass server-side cache and re-fetch all sources.',
            },
            maxReadmeChars: {
              type: 'number',
              description: 'Max characters per README included in the payload (default 14000).',
            },
          },
        },
      },
      {
        name: 'register_documentation_source',
        description:
          'Add a documentation URL (http(s)) to the library. It is included in get_rabbit_sdk_knowledge_index on the next fetch. skillSlug defaults from name. Clears SDK index cache. If autoPublishToGithub true, pushes SKILL.md + manifest to Tourettes99/rabbit-r1-sdk-idea-helper-mcp (needs RABBIT_MCP_GITHUB_TOKEN or GITHUB_TOKEN with repo write).',
        inputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Human-readable label' },
            url: { type: 'string', description: 'http(s) URL to fetch (HTML or text/markdown)' },
            skillSlug: { type: 'string', description: 'Optional Cursor skill folder name; slugified if omitted' },
            autoPublishToGithub: {
              type: 'boolean',
              description: 'If true, publish this source + updated manifest to the library GitHub repo',
            },
          },
          required: ['name', 'url'],
        },
      },
      {
        name: 'list_documentation_sources',
        description: 'Lists registered documentation library entries (id, name, url, skillSlug, addedAt).',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'remove_documentation_source',
        description: 'Removes a library entry by id. confirm must be true.',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            confirm: { type: 'boolean' },
          },
          required: ['id', 'confirm'],
        },
      },
      {
        name: 'discover_missing_local_skills',
        description:
          'Compares registered documentation sources to ~/.cursor/skills/{skillSlug}/SKILL.md. Returns missing vs present so the agent can call ensure_local_skill_for_registered_source.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'ensure_local_skill_for_registered_source',
        description:
          'Fetches the source URL, writes ~/.cursor/skills/{skillSlug}/SKILL.md (creates dir). Use for each missing slug after discover_missing_local_skills.',
        inputSchema: {
          type: 'object',
          properties: {
            sourceId: { type: 'string', description: 'id from register_documentation_source or manifest' },
          },
          required: ['sourceId'],
        },
      },
      {
        name: 'publish_documentation_library_to_github',
        description:
          `Publishes SKILL.md per source under library/skills/{slug}/ and library/documentation-sources.json to ${LIBRARY_REPO_DEFAULT}. Requires RABBIT_MCP_GITHUB_TOKEN or GITHUB_TOKEN. Optional sourceId to publish one entry only (still rewrites full manifest).`,
        inputSchema: {
          type: 'object',
          properties: {
            sourceId: { type: 'string', description: 'If set, only this source is re-fetched and pushed (manifest still lists all)' },
          },
        },
      },
      {
        name: 'pull_documentation_library_from_github',
        description:
          `Merges new entries from raw manifest on main: ${LIBRARY_MANIFEST_RAW}. Does not remove local-only sources. Clears SDK cache.`,
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'generate_rabbit_creation_ideas',
        description:
          'Prepares context for generating 20 creative Rabbit R1 creation app ideas. Uses official Creations SDK repo; optional sdkTarget selects emphasis. After generating ideas, call save_generated_ideas.',
        inputSchema: {
          type: 'object',
          properties: {
            focusArea: {
              type: 'string',
              description:
                'Optional focus area (e.g. productivity, entertainment). Leave empty for diverse ideas.',
            },
            sdkTarget: {
              type: 'string',
              enum: ['auto', 'official_creations_sdk', 'r1_create', 'both'],
              description:
                'Which SDK to emphasize: auto (balanced), official_creations_sdk (GitHub Creations), r1_create (npm community SDK), or both.',
            },
          },
        },
      },
      {
        name: 'get_previous_ideas',
        description: 'Retrieves previously suggested Rabbit R1 creation app ideas.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of ideas to retrieve (default: all)' },
            search: { type: 'string', description: 'Filter ideas by keyword' },
          },
        },
      },
      {
        name: 'iterate_on_idea',
        description: 'Variations or improvements on a previous idea.',
        inputSchema: {
          type: 'object',
          properties: {
            ideaIndex: { type: 'number', description: 'Index of the idea to iterate on' },
            iterationDirection: {
              type: 'string',
              description: 'expand | simplify | combine | pivot',
            },
          },
          required: ['ideaIndex'],
        },
      },
      {
        name: 'get_repo_status',
        description: 'Status of the official Rabbit R1 Creations SDK GitHub repository.',
        inputSchema: { type: 'object', properties: {} },
      },
      {
        name: 'save_generated_ideas',
        description: 'Saves generated ideas to persistent storage. Call after generating ideas.',
        inputSchema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              description: 'Each idea: name, description, features[], category',
              items: { type: 'object' },
            },
          },
          required: ['ideas'],
        },
      },
      {
        name: 'clear_idea_history',
        description: 'Clears all previously suggested ideas.',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: { type: 'boolean', description: 'Must be true' },
          },
          required: ['confirm'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_rabbit_sdk_knowledge_index') {
      const maxReadmeChars = args.maxReadmeChars ?? 14_000;
      const refreshCache = args.refreshCache === true;
      const storage = await loadStorage();

      if (!refreshCache && sdkCacheValid(storage.sdkIndexCache)) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  ...storage.sdkIndexCache.payload,
                  servedFromCache: true,
                  cacheExpiresAt: storage.sdkIndexCache.expiresAt,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const payload = await buildUnifiedKnowledgeIndex({
        maxReadmeChars,
        documentationSources: storage.documentationLibrary?.sources || [],
      });
      storage.sdkIndexCache = {
        payload,
        cachedAt: payload.fetchedAt,
        expiresAt: new Date(Date.now() + DEFAULT_SDK_CACHE_TTL_MS).toISOString(),
      };
      await saveStorage(storage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ...payload, servedFromCache: false }, null, 2),
          },
        ],
      };
    }

    if (name === 'generate_rabbit_creation_ideas') {
      const storage = await loadStorage();
      const focusArea = args.focusArea || 'diverse';
      const sdkTarget = args.sdkTarget || 'auto';

      const repoInfo = await fetchGitHubRepo();
      const commits = await fetchRecentCommits();
      const structure = await fetchRepoStructure();
      const readme = await fetchReadme();

      storage.repoCache = {
        repoInfo,
        commits,
        structure,
        readme,
        updated: new Date().toISOString(),
      };
      storage.lastChecked = new Date().toISOString();

      let sdkHint = '';
      if (sdkTarget === 'official_creations_sdk') {
        sdkHint = 'Prioritize official Creations SDK patterns (GitHub repo, QR/plugin-demo flow).';
      } else if (sdkTarget === 'r1_create') {
        sdkHint =
          'Prioritize r1-create npm capabilities (hardware, LLM/messaging, media, UI helpers). Call get_rabbit_sdk_knowledge_index if you need the full r1-create README in one shot.';
      } else if (sdkTarget === 'both') {
        sdkHint = 'Blend official Creations packaging expectations with r1-create feature depth.';
      } else {
        sdkHint =
          'Use get_rabbit_sdk_knowledge_index once if you need both SDKs summarized; then pick official vs r1-create per recommendation.';
      }

      const context = {
        repoDescription: repoInfo?.description || 'Rabbit R1 creations docs for devs',
        recentCommits: commits.slice(0, 5).map((c) => c.commit.message),
        fileStructure: structure?.tree?.map((t) => t.path) || [],
        readmeContent: readme || '',
        alreadySuggested: storage.suggestedIdeas.length,
        focusArea,
        sdkTarget,
        sdkHint,
      };

      await saveStorage(storage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Ready to generate 20 unique Rabbit R1 creation app ideas',
                context,
                instructions: [
                  'Generate exactly 20 creative, unique app ideas for Rabbit R1 creations',
                  'Each idea: name, description, features (array), category',
                  `Focus area: ${focusArea}`,
                  sdkHint,
                  `Total ideas already suggested: ${storage.suggestedIdeas.length}`,
                  '**IMPORTANT**: After generating, call save_generated_ideas with the ideas array',
                ],
                previousIdeasCount: storage.suggestedIdeas.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_previous_ideas') {
      const storage = await loadStorage();
      const limit = args.limit || storage.suggestedIdeas.length;
      const search = args.search?.toLowerCase() || '';

      let ideas = storage.suggestedIdeas;

      if (search) {
        ideas = ideas.filter((idea) => JSON.stringify(idea).toLowerCase().includes(search));
      }

      const limitedIdeas = ideas.slice(-limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                totalIdeas: storage.suggestedIdeas.length,
                filteredIdeas: ideas.length,
                returnedIdeas: limitedIdeas.length,
                ideas: limitedIdeas.map((idea) => ({
                  index: storage.suggestedIdeas.indexOf(idea),
                  ...idea,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'iterate_on_idea') {
      const storage = await loadStorage();
      const ideaIndex = args.ideaIndex;
      const direction = args.iterationDirection || 'expand';

      if (ideaIndex < 0 || ideaIndex >= storage.suggestedIdeas.length) {
        throw new Error(`Invalid idea index. Must be between 0 and ${storage.suggestedIdeas.length - 1}`);
      }

      const originalIdea = storage.suggestedIdeas[ideaIndex];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: `Ready to iterate on idea #${ideaIndex}`,
                originalIdea,
                iterationDirection: direction,
                instructions: [
                  `Take the original idea and ${direction} it`,
                  'Generate 3-5 variations',
                  'Consider get_rabbit_sdk_knowledge_index for up-to-date SDK features',
                ],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_repo_status') {
      const repoInfo = await fetchGitHubRepo();
      const commits = await fetchRecentCommits();
      const structure = await fetchRepoStructure();
      const readme = await fetchReadme();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                repository: {
                  name: repoInfo?.name || 'creations-sdk',
                  description: repoInfo?.description || 'Rabbit R1 creations docs for devs',
                  stars: repoInfo?.stargazers_count || 0,
                  forks: repoInfo?.forks_count || 0,
                  lastUpdated: repoInfo?.updated_at || 'Unknown',
                  language: repoInfo?.language || 'Unknown',
                },
                recentCommits: commits.slice(0, 10).map((c) => ({
                  message: c.commit.message,
                  author: c.commit.author.name,
                  date: c.commit.author.date,
                })),
                structure: {
                  totalFiles: structure?.tree?.length || 0,
                  files: structure?.tree?.map((t) => ({ path: t.path, type: t.type })) || [],
                },
                readme: readme || 'No README available',
                note: 'For r1-create npm SDK status, call get_rabbit_sdk_knowledge_index.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'save_generated_ideas') {
      const ideas = args.ideas;

      if (!Array.isArray(ideas) || ideas.length === 0) {
        throw new Error('Ideas must be a non-empty array');
      }

      const storage = await loadStorage();
      const timestamp = new Date().toISOString();

      const ideasWithMetadata = ideas.map((idea, index) => ({
        ...idea,
        id: `idea_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: timestamp,
      }));

      storage.suggestedIdeas.push(...ideasWithMetadata);
      await saveStorage(storage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Ideas saved successfully',
                savedCount: ideas.length,
                totalIdeas: storage.suggestedIdeas.length,
                timestamp,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'clear_idea_history') {
      if (args.confirm !== true) {
        throw new Error('Must set confirm=true to clear idea history');
      }

      const storage = await loadStorage();
      const clearedCount = storage.suggestedIdeas.length;
      storage.suggestedIdeas = [];
      await saveStorage(storage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: 'Idea history cleared successfully',
                clearedCount,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'register_documentation_source') {
      const storage = await loadStorage();
      let parsedUrl;
      try {
        parsedUrl = new URL(String(args.url));
      } catch {
        throw new Error('Invalid url (must be absolute http(s))');
      }
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Only http(s) URLs are allowed');
      }
      const slug = args.skillSlug ? docLib.slugify(args.skillSlug) : docLib.slugify(args.name);
      const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const entry = {
        id,
        name: String(args.name).slice(0, 200),
        url: parsedUrl.href,
        skillSlug: slug,
        addedAt: new Date().toISOString(),
      };
      storage.documentationLibrary.sources.push(entry);
      storage.sdkIndexCache = null;
      await saveStorage(storage);

      let github = null;
      if (args.autoPublishToGithub === true) {
        const token = docLib.githubToken();
        if (!token) {
          github = { skipped: true, reason: 'No RABBIT_MCP_GITHUB_TOKEN or GITHUB_TOKEN' };
        } else {
          try {
            const { text, contentType } = await docLib.fetchDocUrl(entry.url);
            const normalized = docLib.normalizeFetchedText(text, contentType);
            const pub = await docLib.publishSourceToGithub(
              token,
              docLib.DEFAULT_LIBRARY_REPO,
              entry,
              normalized
            );
            await docLib.publishManifestToGithub(
              token,
              docLib.DEFAULT_LIBRARY_REPO,
              storage.documentationLibrary.sources
            );
            github = { ok: true, ...pub };
          } catch (e) {
            github = { error: e.message };
          }
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                registered: entry,
                hint: 'Call get_rabbit_sdk_knowledge_index(refreshCache:true) or discover_missing_local_skills / ensure_local_skill_for_registered_source',
                github,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'list_documentation_sources') {
      const storage = await loadStorage();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              { count: storage.documentationLibrary.sources.length, sources: storage.documentationLibrary.sources },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'remove_documentation_source') {
      if (args.confirm !== true) {
        throw new Error('Must set confirm=true');
      }
      const storage = await loadStorage();
      const before = storage.documentationLibrary.sources.length;
      storage.documentationLibrary.sources = storage.documentationLibrary.sources.filter((s) => s.id !== args.id);
      if (storage.documentationLibrary.sources.length === before) {
        throw new Error(`No source with id ${args.id}`);
      }
      storage.sdkIndexCache = null;
      await saveStorage(storage);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ removed: args.id, remaining: storage.documentationLibrary.sources.length }, null, 2),
          },
        ],
      };
    }

    if (name === 'discover_missing_local_skills') {
      const storage = await loadStorage();
      const d = await discoverMissingLocalSkills(storage);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ...d,
                nextStep:
                  d.missing.length > 0
                    ? 'Call ensure_local_skill_for_registered_source for each sourceId in missing[].'
                    : 'All registered sources have a local SKILL.md.',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'ensure_local_skill_for_registered_source') {
      const storage = await loadStorage();
      const source = storage.documentationLibrary.sources.find((s) => s.id === args.sourceId);
      if (!source) {
        throw new Error(`No documentation source with id ${args.sourceId}`);
      }
      const { text, contentType } = await docLib.fetchDocUrl(source.url);
      const normalized = docLib.normalizeFetchedText(text, contentType);
      const skillPath = await writeLocalSkillForSource(source, normalized);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ wrote: skillPath, skillSlug: source.skillSlug }, null, 2),
          },
        ],
      };
    }

    if (name === 'publish_documentation_library_to_github') {
      const storage = await loadStorage();
      const token = docLib.githubToken();
      if (!token) {
        throw new Error('Set RABBIT_MCP_GITHUB_TOKEN or GITHUB_TOKEN with repo scope for the library repo');
      }
      const repo = docLib.DEFAULT_LIBRARY_REPO;
      const all = storage.documentationLibrary.sources;
      if (!all.length) {
        throw new Error('No documentation sources registered locally');
      }
      const toPublish = args.sourceId ? all.filter((s) => s.id === args.sourceId) : all;
      if (args.sourceId && toPublish.length === 0) {
        throw new Error(`sourceId not found: ${args.sourceId}`);
      }
      const results = [];
      for (const source of toPublish) {
        const { text, contentType } = await docLib.fetchDocUrl(source.url);
        const normalized = docLib.normalizeFetchedText(text, contentType);
        const pub = await docLib.publishSourceToGithub(token, repo, source, normalized);
        results.push({ sourceId: source.id, skillSlug: source.skillSlug, ...pub });
      }
      const manifestResult = await docLib.publishManifestToGithub(token, repo, all);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                repo,
                publishedFiles: results.length,
                results,
                manifest: manifestResult?.content?.path || 'library/documentation-sources.json',
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'pull_documentation_library_from_github') {
      const storage = await loadStorage();
      const res = await fetch(LIBRARY_MANIFEST_RAW, {
        headers: { 'User-Agent': 'rabbit-r1-ideas-mcp' },
      });
      if (!res.ok) {
        throw new Error(
          `Could not fetch manifest (${res.status}). If the repo has no manifest yet, publish once with publish_documentation_library_to_github.`
        );
      }
      const data = await res.json();
      if (!data || !Array.isArray(data.sources)) {
        throw new Error('Invalid manifest JSON: expected { sources: [...] }');
      }
      const local = storage.documentationLibrary.sources;
      const ids = new Set(local.map((s) => s.id));
      let added = 0;
      for (const row of data.sources) {
        if (row?.id && row?.url && row?.name && row?.skillSlug && !ids.has(row.id)) {
          local.push({
            id: row.id,
            name: row.name,
            url: row.url,
            skillSlug: row.skillSlug,
            addedAt: row.addedAt || new Date().toISOString(),
            importedFromGithubManifest: true,
          });
          ids.add(row.id);
          added++;
        }
      }
      storage.sdkIndexCache = null;
      await saveStorage(storage);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                added,
                totalSources: local.length,
                manifestUrl: LIBRARY_MANIFEST_RAW,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }),
        },
      ],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'rabbit://ideas/storage',
        name: 'Ideas Storage',
        description: 'Stored ideas and repo cache',
        mimeType: 'application/json',
      },
      {
        uri: 'rabbit://ideas/stats',
        name: 'Ideas Statistics',
        mimeType: 'application/json',
      },
      {
        uri: 'rabbit://sdk/knowledge-index',
        name: 'Unified Rabbit SDK knowledge index',
        description: 'Cached unified index (official GitHub + r1-create npm); may be empty until first tool call',
        mimeType: 'application/json',
      },
      {
        uri: 'rabbit://documentation/library',
        name: 'Documentation library sources',
        description: 'Registered URLs merged into get_rabbit_sdk_knowledge_index',
        mimeType: 'application/json',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'rabbit://ideas/storage') {
    const storage = await loadStorage();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(storage, null, 2),
        },
      ],
    };
  }

  if (uri === 'rabbit://ideas/stats') {
    const storage = await loadStorage();
    const stats = {
      totalIdeasGenerated: storage.suggestedIdeas.length,
      documentationSourcesRegistered: storage.documentationLibrary?.sources?.length ?? 0,
      lastChecked: storage.lastChecked,
      repoLastUpdated: storage.repoCache?.updated || 'Never',
      sdkIndexCachedAt: storage.sdkIndexCache?.cachedAt || null,
      sdkIndexExpiresAt: storage.sdkIndexCache?.expiresAt || null,
    };
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  if (uri === 'rabbit://sdk/knowledge-index') {
    const storage = await loadStorage();
    const body = storage.sdkIndexCache?.payload || {
      message: 'No index cached yet. Call tool get_rabbit_sdk_knowledge_index once.',
    };
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(body, null, 2),
        },
      ],
    };
  }

  if (uri === 'rabbit://documentation/library') {
    const storage = await loadStorage();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              defaultGithubLibraryRepo: LIBRARY_REPO_DEFAULT,
              manifestRawUrl: LIBRARY_MANIFEST_RAW,
              sources: storage.documentationLibrary?.sources || [],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});

async function main() {
  await initStorage();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rabbit R1 Ideas MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
