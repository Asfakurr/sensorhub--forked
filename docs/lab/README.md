# Lab: ship a feature with an agent (90 min)

You'll fork SensorHub, make the agent rules your own, build one feature with an AI agent in its
own worktree and Docker stack, and publish it on a public URL with Tailscale Funnel.

**Default harness:** OpenCode on a free model. **Second option:** Antigravity CLI (`agy`).
If you have Claude Code or Codex, you can use those too.

## Timeline

| Time      | Step                                                            | Done when                                    |
| --------- | --------------------------------------------------------------- | -------------------------------------------- |
| 0:00–0:15 | [1. Set up](#1-set-up-15-min)                                   | Dashboard shows live readings on :3000       |
| 0:15–0:30 | [2. Make the rules yours](#2-make-the-rules-yours-15-min)       | The agent refuses something you denied       |
| 0:30–0:40 | [3. Start a feature stack](#3-start-a-feature-stack-10-min)     | Second stack running on :3001 / :4001        |
| 0:40–1:10 | [4. Build it with the agent](#4-build-it-with-the-agent-30-min) | Tests pass, feature visible on :3001         |
| 1:10–1:20 | [5. Merge and publish](#5-merge-and-publish-10-min)             | Your URL works on a classmate's phone        |
| 1:20–1:30 | Show and tell                                                   | 3–4 people share a URL and one agent mistake |

## Lab rules

1. **Read the agent's plan before you let it run.** Say no at least once.
2. **Commit only after tests pass**, and write the commit message yourself.
3. **Write down one mistake the agent made** and how you caught it. You'll share it at the end.
4. Stuck on setup for more than 15 minutes? Pair with a neighbour and keep going.

## 1. Set up (15 min)

```bash
# Fork https://github.com/Shihabulislam1/sensorhub on GitHub first, then:
git clone https://github.com/<you>/sensorhub.git
cd sensorhub
pnpm install
docker compose up -d --build
```

Open http://localhost:3000. You should see five device cards with live charts and a green
**● live** badge. Then run the setup check: `scripts/verify-setup.sh` or `.\scripts\verify-setup.ps1`.

## 2. Make the rules yours (15 min)

Open `AGENTS.md` and `opencode.json` and read them. Then:

1. **Add one rule** of your own to the _Conventions_ section of `AGENTS.md`. Examples:
   "Every API response for a list must be capped at 500 items" or "Use British spelling in UI text".
2. **Add one deny rule** to `opencode.json`. For example, stop the agent from touching the simulator:
   ```json
   { "action": "edit", "resource": "apps/simulator/*", "effect": "deny" }
   ```
   Rules are checked in order and **the last match wins**, so add yours at the end.
3. **Try to break it.** Start `opencode` and ask it to do the thing you just denied
   ("add a comment to apps/simulator/src/index.ts"). It should refuse or be blocked.
4. Ask it something that should follow your new convention and check that it does.

Commit: `git commit -am "chore: my agent rules"`.

## 3. Start a feature stack (10 min)

Pick a feature from the [feature menu](feature-menu.md). Then, from the `sensorhub/` folder:

```bash
scripts/feature.sh battery-alert 1                   # Ubuntu / macOS / WSL
.\scripts\feature.ps1 -Name battery-alert -Slot 1    # Windows
```

This creates `../sh-battery-alert` on branch `feat/battery-alert` and starts a second, separate
stack: dashboard on **http://localhost:3001**, API on **:4001**, its own empty database on **:5433**.
Your main stack on :3000 keeps running untouched.

```bash
git worktree list            # both folders
docker ps                    # two sets of containers
```

## 4. Build it with the agent (30 min)

```bash
cd ../sh-battery-alert
opencode                      # interactive; pick a free model with /models
```

Paste the starter prompt from the feature menu. Then:

- Read the plan. Push back on anything that breaks `AGENTS.md`.
- Let it implement, then make sure it runs the tests (`pnpm test`).
- Rebuild your feature stack and look at it on :3001:
  `docker compose -p sh-battery-alert up -d --build`
- When it works: review `git diff`, then commit with your own message.

**Stretch:** start a second feature in slot 2 with a _different_ harness (`agy` in
`../sh-<other>`), so two agents work at the same time.

Prefer one-shot mode? `opencode run "<prompt>"` or `agy -p "<prompt>"` from inside the worktree.

## 5. Merge and publish (10 min)

```bash
cd ../sensorhub
git merge feat/battery-alert
docker compose up -d --build              # main stack now has your feature
tailscale funnel --bg 3000                # Windows: Administrator terminal; Ubuntu/macOS: maybe sudo
tailscale funnel status                   # copy the https://...ts.net URL
```

Send the URL to a classmate and open it on their phone. Then push to **your fork**:
`git push origin main` (you push, not the agent).

Clean up:

```bash
scripts/feature-rm.sh battery-alert       # or .\scripts\feature-rm.ps1 -Name battery-alert
tailscale funnel reset                    # always, at the end of the session
```

## Notes

- **Free models are rate-limited** and change often. If one stops responding, pick another in
  `/models` (look for `-free`). Two that worked at the time of writing: `opencode/big-pickle`,
  `opencode/deepseek-v4.1-flash-free`.
- **Free models may train on what you send them.** Fine for SensorHub; never use them on company
  or client code.
- The `.env` in your worktree holds ports only. The agent is still forbidden from reading it.
  That's on purpose, so it becomes a habit.
