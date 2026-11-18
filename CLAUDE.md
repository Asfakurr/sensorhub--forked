@AGENTS.md

# Claude Code notes

Everything above is shared with every other harness. This section is Claude-only.

## What's configured for you

- **Permissions and hooks:** `.claude/settings.json`. `guard.mjs` blocks dangerous commands and
  `.env` access before they run; `format.mjs` runs Prettier + ESLint on every file you edit.
- **Skills** (`.claude/skills/`): `new-nest-module`, `new-dashboard-widget`, `feature-stack`.
  Use them whenever a task matches. They encode the house patterns.
- **Sub-agents** (`.claude/agents/`):
  - `backend-dev`, `frontend-dev`: native workers scoped to `apps/api` or `apps/web`.
  - `reviewer`: read-only. Reviews a diff against AGENTS.md.
  - `codex-worker`, `agy-worker`, `opencode-worker`: dispatchers that hand a task to another
    harness running headless inside a worktree.

## When you are the lead (orchestrator)

1. Plan first: list the features, which slot each gets, which worker gets each. Show the plan.
2. Create each worktree with the `feature-stack` skill (`scripts/feature.sh <name> <slot>`).
3. Dispatch each feature to its worker **in parallel**, passing the absolute worktree path and a
   self-contained task description (the worker can't see this conversation).
4. When all workers return, run `reviewer` on each worktree's diff.
5. Summarise per feature: ready to merge / needs changes, with the reviewer's reasons.
   Do not merge unless the user asks.
