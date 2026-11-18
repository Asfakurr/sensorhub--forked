# Tailscale: remote access and public deployment

Tailscale does two jobs here:

1. **Private access to your dev PC from anywhere** (laptop, phone), so agents keep running while
   you're away and you can check on them.
2. **Funnel**: publish the dashboard on a public HTTPS URL with no cloud account.

## 1. Join your tailnet

- **Windows / macOS:** install the app from https://tailscale.com/download and sign in.
- **Ubuntu:** `curl -fsSL https://tailscale.com/install.sh | sh` then `sudo tailscale up`.

Check with `tailscale status`. Each machine gets a MagicDNS name such as `devbox`.

## 2. SSH into the dev PC

| Dev PC OS | How to accept SSH                                                                    |
| --------- | ------------------------------------------------------------------------------------ |
| Ubuntu    | `sudo tailscale up --ssh` (Tailscale SSH, no keys to manage)                         |
| macOS     | System Settings → General → Sharing → **Remote Login** on, then use the tailnet name |
| Windows   | Install the **OpenSSH Server** optional feature. Run agents inside WSL so tmux works |

From another device on your tailnet: `ssh you@devbox`.
From a phone: install the Tailscale app plus an SSH client (Termius or similar).

## 3. Keep agents alive with tmux

```bash
tmux new -s agents      # start a session, run your agent inside it
# Ctrl-b then d          # detach; the agent keeps working
tmux attach -t agents   # reattach later, from any device
```

## 4. Publish with Funnel

```bash
tailscale funnel --bg 3000     # Ubuntu/macOS may need sudo; Windows: Administrator terminal
tailscale funnel status        # shows https://<machine>.<tailnet>.ts.net
tailscale funnel reset         # turn it off when you're done
```

The first run opens a consent link to enable HTTPS and Funnel for your tailnet. Funnel only
listens publicly on ports 443, 8443 and 10000 and forwards to your local port 3000.

**Why only port 3000?** The dashboard proxies `/api/*` to NestJS through a Next.js rewrite, so one
funnelled port serves the whole app. The API (4000) and the database (5432) are never exposed.
The agent hooks block funnelling them.

## Safety

- A Funnel URL is on the **public internet**. Anyone with the link can open it.
- Keep data fake (the simulator only makes up numbers).
- Never funnel the database or API ports.
- Run `tailscale funnel reset` at the end of the session.
