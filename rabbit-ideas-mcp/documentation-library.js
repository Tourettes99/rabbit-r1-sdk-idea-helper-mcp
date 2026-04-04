/**
 * Registered documentation URLs, fetch helpers, and GitHub library publishing.
 */

export const DEFAULT_LIBRARY_REPO =
  process.env.RABBIT_MCP_LIBRARY_REPO || 'Tourettes99/rabbit-r1-sdk-idea-helper-mcp';

const MAX_DOC_CHARS = 400_000;
const FETCH_TIMEOUT_MS = 60_000;

export function slugify(name) {
  return String(name || 'doc')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'doc';
}

export function githubToken() {
  return process.env.RABBIT_MCP_GITHUB_TOKEN || process.env.GITHUB_TOKEN || '';
}

export async function fetchDocUrl(url) {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed');
  }
  const res = await fetch(url, {
    headers: { 'User-Agent': 'rabbit-r1-ideas-mcp-doc-library', Accept: 'text/html,text/plain,text/markdown,*/*' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const ct = res.headers.get('content-type') || '';
  let text = await res.text();
  if (text.length > MAX_DOC_CHARS) {
    text = `${text.slice(0, MAX_DOC_CHARS)}\n\n[truncated at ${MAX_DOC_CHARS} chars]`;
  }
  return { text, contentType: ct };
}

export function normalizeFetchedText(text, contentType) {
  const t = text || '';
  if (/html/i.test(contentType) || t.trim().startsWith('<!')) {
    return stripHtmlRough(t);
  }
  return t;
}

function stripHtmlRough(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSkillMarkdownFromDoc({ name, url, skillSlug, bodySnippet }) {
  const safeName = String(name).replace(/</g, '');
  const safeUrl = String(url).replace(/[<>]/g, '');
  return `---
name: ${skillSlug}
description: >-
  Registered documentation: ${safeName}. Source ${safeUrl}. Refresh via rabbit-r1-ideas MCP (get_rabbit_sdk_knowledge_index, register_documentation_source).
---

# ${safeName}

**Source URL:** ${safeUrl}

## Rules

- Treat this file as the local source of truth for this documentation URL once populated.
- Do **not** web-search to replace this content; refresh via MCP \`get_rabbit_sdk_knowledge_index\` (includes registered sources) or re-fetch from the URL through the MCP registration flow.
- Append **Changelog (agent)** entries when the MCP payload shows new material.

## Content snapshot

${bodySnippet}

## Changelog (agent)

- Initialized from rabbit-r1-ideas MCP documentation library.
`;
}

function encodePathForGitHub(p) {
  return encodeURIComponent(String(p).replace(/^\/+/, ''));
}

export async function githubGetFile(token, repo, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodePathForGitHub(path)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rabbit-r1-ideas-mcp',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub GET ${path}: ${res.status} ${err.slice(0, 200)}`);
  }
  return res.json();
}

export async function githubPutFile(token, repo, path, contentUtf8, message) {
  const existing = await githubGetFile(token, repo, path);
  const body = {
    message,
    content: Buffer.from(contentUtf8, 'utf8').toString('base64'),
  };
  if (existing?.sha) body.sha = existing.sha;

  const url = `https://api.github.com/repos/${repo}/contents/${encodePathForGitHub(path)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'rabbit-r1-ideas-mcp',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub PUT ${path}: ${res.status} ${err.slice(0, 300)}`);
  }
  return res.json();
}

export async function publishSourceToGithub(token, repo, source, normalizedText) {
  const slug = source.skillSlug;
  const snippet = normalizedText.slice(0, 120_000);
  const skillMd = buildSkillMarkdownFromDoc({
    name: source.name,
    url: source.url,
    skillSlug: slug,
    bodySnippet: snippet,
  });
  const skillPath = `library/skills/${slug}/SKILL.md`;
  const skillResult = await githubPutFile(
    token,
    repo,
    skillPath,
    skillMd,
    `docs(library): update skill ${slug} from MCP`
  );
  return { skillPath, skillSha: skillResult.content?.sha, url: skillResult.content?.html_url };
}

export async function publishManifestToGithub(token, repo, sources) {
  const manifest = {
    updatedAt: new Date().toISOString(),
    repo,
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      skillSlug: s.skillSlug,
      addedAt: s.addedAt,
    })),
  };
  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  return githubPutFile(token, repo, 'library/documentation-sources.json', json, 'docs(library): sync documentation-sources manifest from MCP');
}
