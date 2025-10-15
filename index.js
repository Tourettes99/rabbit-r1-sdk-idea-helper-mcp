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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage file for ideas
const IDEAS_STORAGE_FILE = path.join(__dirname, 'rabbit-ideas-storage.json');
const GITHUB_REPO = 'rabbit-hmi-oss/creations-sdk';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;

// Initialize storage
async function initStorage() {
  try {
    await fs.access(IDEAS_STORAGE_FILE);
  } catch {
    const initialData = {
      suggestedIdeas: [],
      repoCache: null,
      lastChecked: null
    };
    await fs.writeFile(IDEAS_STORAGE_FILE, JSON.stringify(initialData, null, 2));
  }
}

// Load storage
async function loadStorage() {
  try {
    const data = await fs.readFile(IDEAS_STORAGE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {
      suggestedIdeas: [],
      repoCache: null,
      lastChecked: null
    };
  }
}

// Save storage
async function saveStorage(data) {
  await fs.writeFile(IDEAS_STORAGE_FILE, JSON.stringify(data, null, 2));
}

// Fetch GitHub repo information
async function fetchGitHubRepo() {
  try {
    const response = await fetch(GITHUB_API_URL);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching GitHub repo:', error.message);
    return null;
  }
}

// Fetch recent commits
async function fetchRecentCommits() {
  try {
    const response = await fetch(`${GITHUB_API_URL}/commits?per_page=10`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    return [];
  }
}

// Fetch repository structure
async function fetchRepoStructure() {
  try {
    const response = await fetch(`${GITHUB_API_URL}/git/trees/main?recursive=1`);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching repo structure:', error.message);
    return null;
  }
}

// Fetch README content
async function fetchReadme() {
  try {
    const response = await fetch(`${GITHUB_API_URL}/readme`, {
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      }
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

// Create MCP server
const server = new Server(
  {
    name: 'rabbit-r1-ideas-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'generate_rabbit_creation_ideas',
        description: 'Prepares context for generating 20 creative and unique Rabbit R1 creation app ideas based on the current SDK structure and features. After generating ideas, you MUST call save_generated_ideas to store them in memory.',
        inputSchema: {
          type: 'object',
          properties: {
            focusArea: {
              type: 'string',
              description: 'Optional focus area for ideas (e.g., "productivity", "entertainment", "utilities", "health"). Leave empty for diverse ideas.',
            },
          },
        },
      },
      {
        name: 'get_previous_ideas',
        description: 'Retrieves previously suggested Rabbit R1 creation app ideas. Useful for revisiting old ideas or iterating on them.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of ideas to retrieve (default: all)',
            },
            search: {
              type: 'string',
              description: 'Optional search term to filter ideas by keyword',
            },
          },
        },
      },
      {
        name: 'iterate_on_idea',
        description: 'Takes a previous idea and generates variations or improvements based on it.',
        inputSchema: {
          type: 'object',
          properties: {
            ideaIndex: {
              type: 'number',
              description: 'The index number of the idea from previous suggestions to iterate on',
            },
            iterationDirection: {
              type: 'string',
              description: 'How to iterate: "expand" (add features), "simplify" (make simpler), "combine" (merge with other concepts), "pivot" (change direction)',
            },
          },
          required: ['ideaIndex'],
        },
      },
      {
        name: 'get_repo_status',
        description: 'Fetches the current status of the Rabbit R1 Creations SDK GitHub repository including structure, recent changes, and features.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'save_generated_ideas',
        description: 'Saves newly generated Rabbit R1 creation ideas to persistent storage. MUST be called after generating ideas to ensure they are remembered and not repeated.',
        inputSchema: {
          type: 'object',
          properties: {
            ideas: {
              type: 'array',
              description: 'Array of idea objects to save. Each should have: name, description, features, category',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Name of the app idea',
                  },
                  description: {
                    type: 'string',
                    description: 'Detailed description of the app',
                  },
                  features: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Key features of the app',
                  },
                  category: {
                    type: 'string',
                    description: 'Category (e.g., productivity, entertainment, utility)',
                  },
                },
                required: ['name', 'description'],
              },
            },
          },
          required: ['ideas'],
        },
      },
      {
        name: 'clear_idea_history',
        description: 'Clears all previously suggested ideas from memory. Use with caution!',
        inputSchema: {
          type: 'object',
          properties: {
            confirm: {
              type: 'boolean',
              description: 'Must be true to confirm clearing history',
            },
          },
          required: ['confirm'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'generate_rabbit_creation_ideas') {
      const storage = await loadStorage();
      const focusArea = args.focusArea || 'diverse';

      // Fetch latest repo information
      const repoInfo = await fetchGitHubRepo();
      const commits = await fetchRecentCommits();
      const structure = await fetchRepoStructure();
      const readme = await fetchReadme();

      // Update repo cache
      storage.repoCache = {
        repoInfo,
        commits,
        structure,
        readme,
        updated: new Date().toISOString(),
      };
      storage.lastChecked = new Date().toISOString();

      // Prepare context for the LLM
      const context = {
        repoDescription: repoInfo?.description || 'Rabbit R1 creations docs for devs',
        recentCommits: commits.slice(0, 5).map(c => c.commit.message),
        fileStructure: structure?.tree?.map(t => t.path) || [],
        readmeContent: readme || '',
        alreadySuggested: storage.suggestedIdeas.length,
        focusArea: focusArea,
      };

      const response = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Ready to generate 20 unique Rabbit R1 creation app ideas',
              context: context,
              instructions: [
                'Generate exactly 20 creative, unique app ideas for Rabbit R1 creations',
                'Each idea should include: name, description, features (array), category',
                `Focus area: ${focusArea}`,
                'Consider the current SDK structure and available features',
                'Avoid repeating any of the previously suggested ideas',
                `Total ideas already suggested: ${storage.suggestedIdeas.length}`,
                'Make ideas innovative, practical, and aligned with Rabbit R1 capabilities',
                'Consider the device\'s unique form factor, voice interface, and portability',
                '**IMPORTANT**: After generating ideas, you MUST call save_generated_ideas tool with the ideas array to save them to memory',
                'Format each idea as: { name: string, description: string, features: string[], category: string }',
              ],
              repoStructure: {
                mainFolders: ['plugin-demo', 'qr'],
                recentChanges: context.recentCommits,
                totalFiles: structure?.tree?.length || 0,
              },
              previousIdeasCount: storage.suggestedIdeas.length,
            }, null, 2),
          },
        ],
      };

      return response;
    }

    if (name === 'get_previous_ideas') {
      const storage = await loadStorage();
      const limit = args.limit || storage.suggestedIdeas.length;
      const search = args.search?.toLowerCase() || '';

      let ideas = storage.suggestedIdeas;

      if (search) {
        ideas = ideas.filter(idea => 
          JSON.stringify(idea).toLowerCase().includes(search)
        );
      }

      const limitedIdeas = ideas.slice(-limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              totalIdeas: storage.suggestedIdeas.length,
              filteredIdeas: ideas.length,
              returnedIdeas: limitedIdeas.length,
              ideas: limitedIdeas.map((idea, idx) => ({
                index: storage.suggestedIdeas.indexOf(idea),
                ...idea,
              })),
            }, null, 2),
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
            text: JSON.stringify({
              message: `Ready to iterate on idea #${ideaIndex}`,
              originalIdea: originalIdea,
              iterationDirection: direction,
              instructions: [
                `Take the original idea and ${direction} it`,
                'Generate 3-5 variations based on the iteration direction',
                'Maintain the core concept while exploring new possibilities',
                'Consider how the SDK features could enable these variations',
              ],
            }, null, 2),
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
            text: JSON.stringify({
              repository: {
                name: repoInfo?.name || 'creations-sdk',
                description: repoInfo?.description || 'Rabbit R1 creations docs for devs',
                stars: repoInfo?.stargazers_count || 0,
                forks: repoInfo?.forks_count || 0,
                lastUpdated: repoInfo?.updated_at || 'Unknown',
                language: repoInfo?.language || 'Unknown',
              },
              recentCommits: commits.slice(0, 10).map(c => ({
                message: c.commit.message,
                author: c.commit.author.name,
                date: c.commit.author.date,
              })),
              structure: {
                totalFiles: structure?.tree?.length || 0,
                files: structure?.tree?.map(t => ({
                  path: t.path,
                  type: t.type,
                })) || [],
              },
              readme: readme || 'No README available',
            }, null, 2),
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
      
      // Add metadata to each idea
      const ideasWithMetadata = ideas.map((idea, index) => ({
        ...idea,
        id: `idea_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: timestamp,
      }));

      // Add to storage
      storage.suggestedIdeas.push(...ideasWithMetadata);
      await saveStorage(storage);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Ideas saved successfully',
              savedCount: ideas.length,
              totalIdeas: storage.suggestedIdeas.length,
              timestamp: timestamp,
            }, null, 2),
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
            text: JSON.stringify({
              message: 'Idea history cleared successfully',
              clearedCount: clearedCount,
            }, null, 2),
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
          text: JSON.stringify({
            error: error.message,
          }),
        },
      ],
      isError: true,
    };
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'rabbit://ideas/storage',
        name: 'Ideas Storage',
        description: 'Current storage of all suggested ideas and repo cache',
        mimeType: 'application/json',
      },
      {
        uri: 'rabbit://ideas/stats',
        name: 'Ideas Statistics',
        description: 'Statistics about generated ideas',
        mimeType: 'application/json',
      },
    ],
  };
});

// Handle resource reads
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
      lastChecked: storage.lastChecked,
      repoLastUpdated: storage.repoCache?.updated || 'Never',
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

  throw new Error(`Unknown resource: ${uri}`);
});

// Start server
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

