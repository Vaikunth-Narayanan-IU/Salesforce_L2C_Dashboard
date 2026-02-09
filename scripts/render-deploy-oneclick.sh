#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RENDER_API_KEY:-}" ]]; then
  echo "RENDER_API_KEY is not set. Please export it and try again." >&2
  exit 1
fi

if [[ -z "${RENDER_REPO:-}" ]]; then
  echo "RENDER_REPO is not set. Please set RENDER_REPO to your repository URL, e.g. https://github.com/you/repo" >&2
  exit 1
fi

if [[ -z "${RENDER_OWNER_ID:-}" ]]; then
  echo "RENDER_OWNER_ID is not set. Listing owners to help you choose..." >&2
  node scripts/render-owner.mjs
  echo "\nOnce you have the owner id, run:" >&2
  echo "export RENDER_OWNER_ID=\"<owner id>\"" >&2
  echo "Then re-run: npm run render:oneclick" >&2
  exit 1
fi

echo "Starting Render deploy..."
node scripts/render-deploy.mjs
