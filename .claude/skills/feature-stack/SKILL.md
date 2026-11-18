---
name: feature-stack
description: Create an isolated git worktree + Docker Compose stack for a feature so several features (and several agents) can be built and tested at the same time. Use when starting any new feature, or when asked to work on features in parallel.
---

# Feature stack: one worktree + one Docker stack per feature

## Pick a slot

Slot 0 is `main` in `sensorhub/` (ports 3000 / 4000 / 5432). Features use slots 1–9:
web `3000+N`, API `4000+N`, Postgres `5432+N`. Check what's taken first:

```bash
git worktree list
docker ps --format '{{.Names}}\t{{.Ports}}'
```

## Create it

Run from the main checkout (`sensorhub/`). `<name>` is kebab-case, e.g. `alerts`.

```bash
scripts/feature.sh <name> <slot>                     # Ubuntu / macOS / WSL / Git Bash
.\scripts\feature.ps1 -Name <name> -Slot <slot>      # Windows PowerShell
```

This creates `../sh-<name>` on branch `feat/<name>`, writes a ports-only `.env` there,
runs `pnpm install`, and starts the stack as Compose project `sh-<name>`.
It prints the URLs when it's done.

## Work in it

- `cd ../sh-<name>`. All edits, tests and commits for this feature happen there.
- Rebuild after changes: `docker compose -p sh-<name> up -d --build`
- Logs: `docker compose -p sh-<name> logs -f api`
- Each stack has its own empty database, so migrations and test data never collide.

## When you hand a worktree to a worker sub-agent

Pass the **absolute** path (`git worktree list` shows it) and the slot's ports in the task text.

## Clean up after merge

```bash
scripts/feature-rm.sh <name>                         # or .\scripts\feature-rm.ps1 -Name <name>
```

That stops the stack, deletes its volume, removes the worktree and deletes the merged branch.
