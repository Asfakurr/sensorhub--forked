#!/usr/bin/env bash
# Create an isolated worktree + Docker stack for one feature.
# usage: scripts/feature.sh <name> <slot>      e.g.  scripts/feature.sh alerts 1
#   -> ../sh-alerts on branch feat/alerts, web :3001, api :4001, postgres :5433
# Add --no-docker to skip starting the stack (e.g. to work with `pnpm dev` instead).
set -euo pipefail

NAME=${1:-}; SLOT=${2:-}; DOCKER=1
[[ "${3:-}" == "--no-docker" ]] && DOCKER=0
if [[ ! "$NAME" =~ ^[a-z0-9][a-z0-9-]*$ || ! "$SLOT" =~ ^[1-9]$ ]]; then
  echo "usage: scripts/feature.sh <name> <slot 1-9> [--no-docker]   (name: lowercase-with-dashes)" >&2
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel)
DIR="$(dirname "$ROOT")/sh-$NAME"
BRANCH="feat/$NAME"
WEB_PORT=$((3000 + SLOT)); API_PORT=$((4000 + SLOT)); DB_PORT=$((5432 + SLOT))

if [[ -e "$DIR" ]]; then echo "$DIR already exists. Pick another name or run scripts/feature-rm.sh $NAME" >&2; exit 1; fi

if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
  git -C "$ROOT" worktree add "$DIR" "$BRANCH"
else
  git -C "$ROOT" worktree add "$DIR" -b "$BRANCH"
fi
cd "$DIR"

# Ports only. No secrets. docker compose reads this file automatically.
cat > .env <<ENV
WEB_PORT=$WEB_PORT
API_PORT=$API_PORT
DB_PORT=$DB_PORT
ENV

pnpm install

if [[ $DOCKER == 1 ]]; then
  docker compose -p "sh-$NAME" up -d --build
fi

cat <<DONE

Feature stack "sh-$NAME" (slot $SLOT) is ready.
  folder     $DIR
  branch     $BRANCH
  dashboard  http://localhost:$WEB_PORT
  api        http://localhost:$API_PORT/api/health
  postgres   localhost:$DB_PORT
Next: cd "$DIR" and start your agent there.
DONE
