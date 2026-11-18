#!/usr/bin/env bash
# Tear down a feature stack after its branch is merged (or abandoned).
# usage: scripts/feature-rm.sh <name> [--keep-branch]
set -euo pipefail
NAME=${1:?usage: scripts/feature-rm.sh <name> [--keep-branch]}
ROOT=$(git rev-parse --show-toplevel)
DIR="$(dirname "$ROOT")/sh-$NAME"

if [[ -d "$DIR" ]]; then
  (cd "$DIR" && docker compose -p "sh-$NAME" down -v) || true
  git -C "$ROOT" worktree remove "$DIR"
fi
if [[ "${2:-}" != "--keep-branch" ]]; then
  # -d (not -D): refuses to delete a branch that isn't merged yet.
  git -C "$ROOT" branch -d "feat/$NAME" || echo "Branch feat/$NAME not deleted (not merged?). Keep it, or delete it yourself."
fi
echo "Removed sh-$NAME."
