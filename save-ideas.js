#!/usr/bin/env node

/**
 * Helper script for the LLM to save generated ideas to storage
 * This ensures ideas are persisted and won't be repeated
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDEAS_STORAGE_FILE = path.join(__dirname, 'rabbit-ideas-storage.json');

async function saveIdeas(newIdeas) {
  try {
    // Load existing storage
    let storage;
    try {
      const data = await fs.readFile(IDEAS_STORAGE_FILE, 'utf-8');
      storage = JSON.parse(data);
    } catch {
      storage = {
        suggestedIdeas: [],
        repoCache: null,
        lastChecked: null
      };
    }

    // Add new ideas with metadata
    const timestamp = new Date().toISOString();
    const ideasWithMetadata = newIdeas.map(idea => ({
      ...idea,
      generatedAt: timestamp,
      id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    storage.suggestedIdeas.push(...ideasWithMetadata);

    // Save back to storage
    await fs.writeFile(IDEAS_STORAGE_FILE, JSON.stringify(storage, null, 2));

    console.log(`Successfully saved ${newIdeas.length} ideas. Total ideas: ${storage.suggestedIdeas.length}`);
    return {
      success: true,
      savedCount: newIdeas.length,
      totalCount: storage.suggestedIdeas.length,
    };
  } catch (error) {
    console.error('Error saving ideas:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// If run directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ideasJson = process.argv[2];
  if (!ideasJson) {
    console.error('Usage: node save-ideas.js \'[{"name": "...", "description": "..."}]\'');
    process.exit(1);
  }

  try {
    const ideas = JSON.parse(ideasJson);
    await saveIdeas(ideas);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

export { saveIdeas };

