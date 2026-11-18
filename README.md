# SensorHub

A small IoT telemetry platform built by coordinated AI coding agents. It's the hands-on project
for the **Agentic Software Development** training session.

Simulated embedded devices post temperature, humidity and battery readings. A NestJS API stores
them in PostgreSQL and streams them live, and a Next.js dashboard shows them. Everything runs in
local Docker containers and can be published with Tailscale Funnel. No cloud account needed.

```
 simulator ──POST /api/readings──▶ api (NestJS) ──▶ PostgreSQL 16
                                      │
                                      └─ GET /api/stream (SSE) ──▶ web (Next.js) ◀── browser / phone
                                                                     ▲
                                              tailscale funnel 3000 ─┘  (the only public port)
```

## Installation

Install everything **before the session**. Installs over venue Wi-Fi are the biggest risk to the lab.

**Accounts first:** [GitHub](https://github.com/signup),
[Tailscale](https://login.tailscale.com/start) (free personal plan), and a Google account for the
Antigravity CLI. OpenCode's free models need no account.

**What you'll install:** Git, Node.js 22+, pnpm, Docker, Tailscale, OpenCode and the Antigravity
CLI (`agy`). Codex and Claude Code are optional and need a paid plan.

### Windows 10 / 11 (PowerShell)

WSL2 is recommended (it gives you `tmux` and runs the `.sh` scripts), but everything also works
natively in PowerShell with the `.ps1` scripts.

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Docker.DockerDesktop      # enable the WSL 2 backend when asked
winget install tailscale.tailscale
wsl --install                            # optional but recommended, then reboot
# after the reboot, open the Ubuntu (WSL) app once and install tmux inside it:
#   sudo apt update && sudo apt install -y tmux

# open a NEW terminal so the new tools are on PATH, then:
npm install -g pnpm opencode-ai
irm https://antigravity.google/cli/install.ps1 | iex

# optional, only with a paid plan:
npm install -g @openai/codex
irm https://claude.ai/install.ps1 | iex

# allow the repo's .ps1 scripts to run (once):
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Start **Docker Desktop** once after installing, and sign in to the **Tailscale** app from the tray.

### Ubuntu 22.04 / 24.04

```bash
sudo apt update && sudo apt install -y git curl tmux

# Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt install -y nodejs

# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER   # then log out and back in

# Tailscale
curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up

# pnpm + agent CLIs
sudo npm install -g pnpm opencode-ai
curl -fsSL https://antigravity.google/cli/install.sh | bash

# optional, only with a paid plan:
sudo npm install -g @openai/codex
curl -fsSL https://claude.ai/install.sh | bash
```

### macOS (Homebrew)

No Homebrew yet? Install it from [brew.sh](https://brew.sh) first.

```bash
brew install git node pnpm tmux
brew install --cask docker               # then open Docker Desktop once
brew install --cask tailscale-app        # then open Tailscale and sign in
brew install anomalyco/tap/opencode      # or: npm install -g opencode-ai
curl -fsSL https://antigravity.google/cli/install.sh | bash

# optional, only with a paid plan:
brew install --cask codex
curl -fsSL https://claude.ai/install.sh | bash
```

### Phone (optional, for checking on agents remotely)

Nothing to install from the repo. Get two apps from the App Store or Google Play:

- **Tailscale**, signed in to the same account as your PC
- An SSH client such as **Termius**

Then connect with `ssh you@devbox` and run `tmux attach -t agents` to see the agent running on
your PC. tmux runs on the PC; the phone is only a window into it. Details in
[docs/tailscale.md](docs/tailscale.md).

### Every OS, after installing

```bash
# 1. Sign in to the agent CLIs once, interactively
agy                       # sign in with Google; agy -p reuses the cached login
opencode                  # type /models and check at least one free model is listed

# 2. Pre-pull the Docker images so the lab doesn't wait on Wi-Fi
docker pull postgres:16-alpine
docker pull node:24-alpine

# 3. Check your versions
git --version             # any recent version
node --version            # v22 or newer
pnpm --version
docker compose version
tailscale version
```

Then follow the quick start below and finish with the setup check. Post a screenshot of it going
green in the session chat. Troubleshooting tips are in [docs/install.md](docs/install.md#troubleshooting).

## Quick start

```bash
# 1. Fork this repo on GitHub, then clone your fork
git clone https://github.com/<you>/sensorhub.git
cd sensorhub

# 2. Install (also builds the shared types)
pnpm install

# 3. Check your machine
scripts/verify-setup.sh          # Ubuntu / macOS / WSL
.\scripts\verify-setup.ps1       # Windows PowerShell

# 4. Run the whole stack
docker compose up -d --build
```

Open **http://localhost:3000**. Device cards appear within a few seconds and update live.

| Service   | URL                                      |
| --------- | ---------------------------------------- |
| Dashboard | http://localhost:3000                    |
| API       | http://localhost:4000/api/health         |
| Postgres  | `localhost:5432` (sensorhub / sensorhub) |

Stop it with `docker compose down` (add `-v` to wipe the database).

### Run the apps outside Docker (optional)

```bash
docker compose up -d db     # just Postgres
pnpm dev                    # api :4000, web :3000, simulator, all with hot reload
```

## Start agentic development with Claude Code

Run everything from the repo root. Claude Code reads `CLAUDE.md` (which imports `AGENTS.md`) and
loads the skills, sub-agents, permissions and hooks in `.claude/` automatically.

### 1. Open the agent

```bash
cd sensorhub
claude                              # interactive; trust the folder when asked
claude --permission-mode plan       # same, but it must show a plan before editing anything
```

Inside Claude Code, check what it picked up: `/agents` (sub-agents), `/hooks`, `/permissions`.
**Shift+Tab** switches between normal, auto-accept edits and plan mode.

### 2. Warm up: let it read the rules

> Read AGENTS.md and CLAUDE.md. In five bullet points, tell me what this project is, which
> skills and sub-agents you have, and the hard rules you must never break.

### 3. Watch the guardrails fire

> Show me what's in the .env file.

> Push the current branch to GitHub.

Both are blocked by `.claude/hooks/guard.mjs` and the deny rules, and the agent is told why.

### 4. One agent builds the skeleton

Start from the config-only checkpoint:

```bash
git switch -c demo-skeleton cp-1-config
claude
```

> Build the SensorHub skeleton described in AGENTS.md: packages/shared types, a NestJS API with
> devices, readings and an SSE stream, a Next.js dashboard with live device cards, a device
> simulator, a Dockerfile with api/web/simulator targets and a docker-compose.yml with ports from
> .env. Use the new-nest-module and new-dashboard-widget skills. Plan first, then build, then run
> the tests.

Then `docker compose up -d --build` and open http://localhost:3000.
Stuck or out of time? `git switch -c demo-skeleton-2 cp-2-skeleton` and carry on.

### 5. One lead agent, several harnesses, in parallel

Start from the working skeleton so the features have something to build on:

```bash
git switch -c demo cp-2-skeleton
claude
```

> Read docs/presenter/demo-features.md. Use the feature-stack skill to create worktrees for
> alerts (slot 1), csv-export (slot 2) and device-page (slot 3). Assign alerts to backend-dev,
> csv-export to codex-worker and device-page to agy-worker, and run them in parallel. Give each
> worker the absolute worktree path and the full feature spec. When all finish, have reviewer
> check each diff, then summarise what is ready to merge.

No Codex or Antigravity? Use `opencode-worker` for those two instead; it runs on a free model.
Watch it in a second terminal: `git worktree list` and `docker ps`.

### 6. Review and merge

> Show me the reviewer's verdict for each feature. Fix anything marked "must fix" in its own
> worktree and re-run the reviewer.

> Merge feat/alerts, feat/csv-export and feat/device-page into this branch one at a time, resolve
> any conflicts, then run pnpm test and pnpm build.

Finished versions to compare with: `cp-3/alerts`, `cp-3/csv-export`, `cp-3/device-page`, and
`cp-4-merged`.

### 7. One-shot (headless) mode

Every harness has one, which is what lets the lead drive the others:

```bash
claude -p "Run the API tests and summarise any failures"
codex exec -C ../sh-csv-export --sandbox workspace-write "<task>"
agy -p "<task>"
opencode run --model opencode/big-pickle "<task>"
```

### 8. Keep it running while you're away

```bash
tmux new -s agents     # then run claude inside it and start a long task
# Ctrl-b then d to detach; later, from any device over Tailscale SSH:
tmux attach -t agents
```

The full minute-by-minute script is in [docs/presenter/demo-script.md](docs/presenter/demo-script.md).

## Repo layout

```
sensorhub/
├── AGENTS.md                  # one rulebook, read by every agent
├── CLAUDE.md                  # imports AGENTS.md + Claude-only notes
├── .claude/
│   ├── settings.json          # permissions (allow / ask / deny) + hooks
│   ├── hooks/                 # guard.mjs, format.mjs, test-on-stop.mjs (optional)
│   ├── skills/                # new-nest-module, new-dashboard-widget, feature-stack
│   └── agents/                # backend-dev, frontend-dev, reviewer, codex/agy/opencode-worker
├── .codex/config.toml         # Codex sandbox + approval settings
├── .agents/skills/            # same skills, for Codex (pnpm sync-skills)
├── opencode.json              # OpenCode permissions
├── .opencode/agents/          # OpenCode sub-agent (reviewer)
├── apps/
│   ├── api/                   # NestJS 11 + TypeORM
│   ├── web/                   # Next.js 16 App Router
│   └── simulator/             # fake devices
├── packages/shared/           # types shared by all apps
├── docker-compose.yml         # db, api, web, simulator; ports from .env
├── Dockerfile                 # one file, three targets
├── scripts/
│   ├── feature.sh / .ps1      # new worktree + isolated Docker stack
│   ├── feature-rm.sh / .ps1   # tear it down after merge
│   └── verify-setup.sh / .ps1 # pre-session tool check
└── docs/
    ├── install.md             # per-OS install checklist
    ├── tailscale.md           # remote access + Funnel
    ├── lab/                   # student lab handout + feature menu
    └── presenter/             # demo script for the session
```

## How the agents are set up

The rules live in one place, `AGENTS.md`, and every harness reads them. Each tool's own config
adds permissions, hooks and skills on top.

| Concern     | Claude Code                | Codex                | OpenCode                   | Antigravity (`agy`) |
| ----------- | -------------------------- | -------------------- | -------------------------- | ------------------- |
| Rules       | `CLAUDE.md` → `@AGENTS.md` | `AGENTS.md`          | `AGENTS.md`                | `AGENTS.md`         |
| Permissions | `.claude/settings.json`    | `.codex/config.toml` | `opencode.json`            | CLI flags / prompts |
| Hooks       | `.claude/hooks/*.mjs`      | –                    | plugins                    | –                   |
| Skills      | `.claude/skills/`          | `.agents/skills/`    | `.claude/skills/` (compat) | –                   |
| Sub-agents  | `.claude/agents/`          | –                    | `.opencode/agents/`        | built-in            |
| Headless    | `claude -p`                | `codex exec`         | `opencode run`             | `agy -p`            |

Agent CLIs change quickly. Check flags with `--help` on your installed version.

## Parallel features: worktrees + isolated stacks

Each feature gets its own folder (git worktree), branch, and Docker Compose project with its own
ports and empty database. Several agents can build and test at the same time without colliding.

```bash
scripts/feature.sh alerts 1                 # Ubuntu / macOS / WSL
.\scripts\feature.ps1 -Name alerts -Slot 1  # Windows
```

| Slot     | Folder         | Branch        | Web    | API    | Postgres |
| -------- | -------------- | ------------- | ------ | ------ | -------- |
| 0 (main) | `sensorhub/`   | `main`        | 3000   | 4000   | 5432     |
| 1        | `../sh-<name>` | `feat/<name>` | 3001   | 4001   | 5433     |
| 2        | `../sh-<name>` | `feat/<name>` | 3002   | 4002   | 5434     |
| N        | `../sh-<name>` | `feat/<name>` | 3000+N | 4000+N | 5432+N   |

The `.env` that the script writes holds **ports only**, never secrets. Clean up after merging with
`scripts/feature-rm.sh alerts` (or `.\scripts\feature-rm.ps1 -Name alerts`).

## Checkpoint branches

The live demo builds this repo up step by step. If an agent goes off track on stage, check out
the next checkpoint and keep going.

| Branch             | State                                                   |
| ------------------ | ------------------------------------------------------- |
| `cp-0-empty`       | Empty repo                                              |
| `cp-1-config`      | Agent config, scripts and docs, but no app code         |
| `cp-2-skeleton`    | Working app: devices, readings, live stream, dashboard  |
| `cp-3/alerts`      | + high-temperature alerts (API module + dashboard feed) |
| `cp-3/csv-export`  | + CSV export endpoint                                   |
| `cp-3/device-page` | + device detail page with 24 h history                  |
| `cp-4-merged`      | All three merged. Same as `main`                        |

## Publish it with Tailscale Funnel

```bash
tailscale funnel --bg 3000     # public HTTPS URL for the dashboard
tailscale funnel status
tailscale funnel reset         # turn it off when you're done
```

Only port 3000 is ever funnelled. The dashboard proxies `/api/*` to NestJS, so the API and the
database are never exposed on their own. Details, including SSH from your phone: [docs/tailscale.md](docs/tailscale.md).

## API

| Method | Path                                     | What                                           |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| GET    | `/api/health`                            | Liveness                                       |
| GET    | `/api/devices`                           | All devices                                    |
| GET    | `/api/devices/:id`                       | One device (404 if unknown)                    |
| POST   | `/api/readings`                          | New reading (used by the simulator)            |
| GET    | `/api/readings?deviceId=&since=&limit=`  | Recent readings, newest first                  |
| GET    | `/api/stream`                            | Server-sent events: `reading`, `alert`, `ping` |
| GET    | `/api/alerts?deviceId=&limit=`           | Recent alerts (from `cp-3/alerts`)             |
| GET    | `/api/devices/:id/readings.csv?hours=24` | CSV export (from `cp-3/csv-export`)            |

## Student lab

Start at [docs/lab/README.md](docs/lab/README.md).
