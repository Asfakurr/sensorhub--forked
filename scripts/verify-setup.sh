#!/usr/bin/env bash
# Pre-session check for Ubuntu / macOS / WSL. The real work is in verify-setup.mjs.
if ! command -v node >/dev/null 2>&1; then
  echo "✘ node not found. Install Node.js 22 or newer first (see the install checklist)." >&2
  exit 1
fi
exec node "$(dirname "$0")/verify-setup.mjs"
