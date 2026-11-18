# Presenter demo script (90 min)

Run the demo on your dev PC **over Tailscale SSH**, with the projector showing your laptop, so the
remote-access story runs through the whole session. Keep two terminals visible: the lead agent,
and `watch docker ps` / `git worktree list`.

Every block ends on a checkpoint branch. If a block runs more than 3 minutes over, jump ahead
and say so out loud:

```bash
git stash -u && git checkout cp-2-skeleton     # or whichever checkpoint is next
```

## 0:00–0:10 · What agentic dev is

- Model vs harness; the agent loop (plan → act → observe → repeat).
- Live: in a scratch folder, one-line prompt to Claude Code. Narrate what it decides, not what it types.

## 0:10–0:20 · Remote access

```bash
ssh you@devbox                 # laptop → dev PC over Tailscale
tmux new -s agents
claude                         # start something long, e.g. "explain this repo in detail"
# Ctrl-b d to detach, then check it from your phone (Termius → ssh you@devbox → tmux attach -t agents)
```

## 0:20–0:35 · Rules, permissions, hooks, skills → `cp-1-config`

```bash
git checkout cp-1-config
```

1. `AGENTS.md`, then `CLAUDE.md` importing it with `@AGENTS.md`.
2. `.claude/settings.json`: allow / ask / deny.
3. **Trigger the guard hook:** ask Claude _"show me what's in .env"_ → blocked by `guard.mjs`
   with the reason. Then _"git push"_ → blocked.
4. Show `format.mjs`: ask for a one-line edit with bad formatting; it comes out formatted.
5. Skills: `.claude/skills/new-nest-module/SKILL.md`. Ask _"what skills do you have?"_.
6. Sub-agents: `.claude/agents/`. Point out that the three `*-worker.md` files differ by one line.

## 0:35–0:50 · Single agent builds the skeleton → `cp-2-skeleton`

Prompt:

> Build the SensorHub skeleton described in AGENTS.md: packages/shared types, a NestJS API with
> devices, readings and an SSE stream, a Next.js dashboard with live device cards, a device
> simulator, a Dockerfile with api/web/simulator targets and a docker-compose.yml with ports
> from .env. Use the new-nest-module and new-dashboard-widget skills. Run the tests at the end.

Show it picking up the skills. When it's done (or when time's up: `git checkout cp-2-skeleton`):

```bash
docker compose up -d --build && open http://localhost:3000
```

## 0:50–1:10 · Parallel features + orchestration → `cp-3/*`

Lead prompt (paste into Claude Code at the repo root):

> Read docs/presenter/demo-features.md. Use the feature-stack skill to create worktrees for
> alerts (slot 1), csv-export (slot 2) and device-page (slot 3). Assign alerts to backend-dev,
> csv-export to codex-worker and device-page to agy-worker, and run them in parallel. Give each
> worker the absolute worktree path and the full feature spec. When all finish, have reviewer
> check each diff, then summarise what is ready to merge.

While it runs:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'     # four stacks
git worktree list
```

Open :3001, :3002, :3003 side by side. Then run OpenCode **by hand** as the fourth worker, the free
path the students will use:

```bash
scripts/feature.sh battery-alert 4
cd ../sh-battery-alert
opencode run --model opencode/big-pickle "Add a battery-low alert rule ... (feature menu #1)"
```

Fallback: the finished branches are `cp-3/alerts`, `cp-3/csv-export`, `cp-3/device-page`.

```bash
git worktree add ../sh-alerts cp-3/alerts   # etc., then docker compose -p sh-alerts up -d --build
```

## 1:10–1:25 · Review, merge, ship → `cp-4-merged`

1. Show the reviewer's verdicts. Ask the lead to fix one "must fix" if there is one.
2. Merge:
   ```bash
   git merge feat/alerts feat/csv-export feat/device-page   # or: git checkout cp-4-merged
   docker compose up -d --build
   ```
3. Publish and show a QR code:
   ```bash
   tailscale funnel --bg 3000
   tailscale funnel status
   ```
   Students open it on their phones. Point out the **● live** badge working over the public URL.

## 1:25–1:30 · Safety + lab handoff

- What never goes to an agent: production credentials, broad permissions, unreviewed merges, `git push`.
- Free models and code privacy.
- Show `docs/lab/README.md` and `docs/lab/feature-menu.md`.

## After the session

```bash
tailscale funnel reset
scripts/feature-rm.sh alerts && scripts/feature-rm.sh csv-export && scripts/feature-rm.sh device-page
```
