# Install checklist

Do this **before the session**. Installs over venue Wi-Fi are the biggest threat to the lab.
When you're done, run the setup check and post a screenshot of it going green in the session chat.

## 1. Accounts

- **GitHub**, to fork the repo.
- **Tailscale**, free personal plan: https://login.tailscale.com/start
- **Google account**, for the Antigravity CLI (`agy`).
- OpenCode's free models need no account.

## 2. Tools

### Windows 11 (PowerShell)

WSL2 is recommended (it gives you `tmux` and runs the `.sh` scripts), but everything also works
natively in PowerShell with the `.ps1` scripts.

```powershell
winget install Git.Git
winget install OpenJS.NodeJS.LTS
winget install Docker.DockerDesktop      # enable the WSL 2 backend when asked
winget install tailscale.tailscale
wsl --install                            # optional but recommended, then reboot
# open a NEW terminal, then:
npm install -g pnpm opencode-ai
irm https://antigravity.google/cli/install.ps1 | iex
# optional, only with a paid plan:
npm install -g @openai/codex
irm https://claude.ai/install.ps1 | iex
```

If PowerShell refuses to run the scripts in `scripts\`, allow local scripts once:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

### Ubuntu 22.04 / 24.04

```bash
sudo apt update && sudo apt install -y git curl tmux
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt install -y nodejs
curl -fsSL https://get.docker.com | sh && sudo usermod -aG docker $USER   # log out and back in
curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up
sudo npm install -g pnpm opencode-ai
curl -fsSL https://antigravity.google/cli/install.sh | bash
# optional, only with a paid plan:
sudo npm install -g @openai/codex
curl -fsSL https://claude.ai/install.sh | bash
```

### macOS (Homebrew)

```bash
brew install git node pnpm tmux
brew install --cask docker               # then open Docker Desktop once
# Tailscale: install the app from https://tailscale.com/download and sign in
brew install anomalyco/tap/opencode      # or: npm install -g opencode-ai
curl -fsSL https://antigravity.google/cli/install.sh | bash
# optional, only with a paid plan:
brew install --cask codex
curl -fsSL https://claude.ai/install.sh | bash
```

## 3. Every OS, after installing

1. Run `agy` once interactively and sign in. Headless mode (`agy -p`) reuses the cached login.
2. Run `opencode`, type `/models`, and check that at least one free model is listed.
3. Pre-pull the images so the lab doesn't wait on Wi-Fi:
   ```bash
   docker pull postgres:16-alpine
   docker pull node:24-alpine
   ```
4. Fork https://github.com/Shihabulislam1/sensorhub, clone **your fork**, then `pnpm install`.
5. Build the stack once: `docker compose up -d --build`, open http://localhost:3000, then
   `docker compose down`.
6. Run the setup check and screenshot it:
   ```bash
   scripts/verify-setup.sh          # Ubuntu / macOS / WSL
   .\scripts\verify-setup.ps1       # Windows
   ```
   It checks git, node ≥ 22, pnpm, docker, docker compose, tailscale, opencode and agy, and that
   ports 3000–3004, 4000–4004 and 5432–5436 are free.

## Troubleshooting

| Problem                              | Fix                                                                   |
| ------------------------------------ | --------------------------------------------------------------------- |
| Port 5432 in use                     | A local Postgres is running. Stop it, or set `DB_PORT=5440` in `.env` |
| `docker: permission denied` (Ubuntu) | You skipped the log out / log in after `usermod -aG docker`           |
| `pnpm: command not found` (Windows)  | Open a new terminal after `npm install -g pnpm`                       |
| Dashboard says "polling every 2 s"   | Something is buffering the live stream. It still works, just slower   |
| `.ps1 cannot be loaded`              | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`                 |
