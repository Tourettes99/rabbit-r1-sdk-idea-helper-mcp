#!/usr/bin/env bash
# Git credential helper: supplies GitHub HTTPS credentials from Cursor MCP config.
#
# Uses ~/.cursor/mcp.json → mcpServers["rabbit-r1-ideas"].env.RABBIT_MCP_GITHUB_TOKEN
# (same value the rabbit-r1-ideas MCP uses for publish_documentation_library_to_github).
#
# One-time setup:
#   chmod +x scripts/git-credential-from-mcp-json.sh
#   git config --global credential.helper '!'"$(pwd)"'/scripts/git-credential-from-mcp-json.sh'
#   # or with absolute path:
#   git config --global credential.helper '!/absolute/path/to/rabbit-r1-sdk-idea-helper-mcp/scripts/git-credential-from-mcp-json.sh'
#
# Optional (recommended): who GitHub expects as HTTPS username:
#   git config --global github.user Tourettes99
#
# Requires: jq
# Override JSON path: export CURSOR_MCP_JSON=/path/to/mcp.json

set -euo pipefail

op="${1:-}"
if [ "$op" != "get" ]; then
  # We don't store or erase; Git can use other helpers for that.
  exit 0
fi

MCP_JSON="${CURSOR_MCP_JSON:-$HOME/.cursor/mcp.json}"
if [ ! -f "$MCP_JSON" ]; then
  exit 0
fi
if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

host="" protocol=""
while IFS= read -r line || [ -n "$line" ]; do
  if [ -z "$line" ]; then
    break
  fi
  case "$line" in
    host=*) host="${line#host=}" ;;
    protocol=*) protocol="${line#protocol=}" ;;
  esac
done

if [ "$protocol" != "https" ] || [ "$host" != "github.com" ]; then
  exit 0
fi

TOKEN="$(jq -r '.mcpServers["rabbit-r1-ideas"].env.RABBIT_MCP_GITHUB_TOKEN // empty' "$MCP_JSON")"
if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  exit 0
fi

GH_USER="$(git config --get github.user 2>/dev/null || true)"
if [ -z "$GH_USER" ]; then
  GH_USER="$(git config --get user.name 2>/dev/null || true)"
fi
if [ -z "$GH_USER" ]; then
  GH_USER="git"
fi

printf 'username=%s\n' "$GH_USER"
printf 'password=%s\n' "$TOKEN"
