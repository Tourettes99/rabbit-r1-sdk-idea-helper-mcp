#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "================================================"
echo "Rabbit R1 Ideas MCP — install (macOS / Linux)"
echo "================================================"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required (>= 18). Install from https://nodejs.org/"
  exit 1
fi

echo "Node: $(node --version)"
echo "Installing dependencies..."
npm install

STORAGE="rabbit-ideas-storage.json"
if [[ ! -f "$STORAGE" ]]; then
  printf '%s\n' '{"suggestedIdeas":[],"repoCache":null,"lastChecked":null,"sdkIndexCache":null}' > "$STORAGE"
  echo "Created $STORAGE"
else
  echo "Storage already exists: $STORAGE"
fi

echo ""
echo "Done. Add this server to Cursor MCP config (~/.cursor/mcp.json), for example:"
echo '  "rabbit-r1-ideas": {'
echo '    "command": "node",'
echo "    \"args\": [\"$PWD/index.js\"]"
echo '  }'
echo ""
echo "Quote paths in JSON if they contain spaces. Cursor launches the process on demand (no Unix Startup shortcut needed)."
