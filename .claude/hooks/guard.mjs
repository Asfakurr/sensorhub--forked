#!/usr/bin/env node
// PreToolUse hook: runs BEFORE every Bash / Read / Edit / Write the agent attempts.
// Claude Code sends the tool call as JSON on stdin. Exit code 2 = block the call,
// and whatever we print to stderr is shown to the agent as the reason.
// Written in Node (not bash) so it works the same on Windows, macOS and Linux.

const RULES = [
  {
    // .env, .env.local, apps/api/.env ... but not .env.example
    test: (s) =>
      [...s.matchAll(/(?<![\w-])\.env(\.[\w.-]+)?(?![\w-])/g)].some((m) => m[1] !== '.example'),
    why: 'Reading or changing .env files is not allowed (AGENTS.md hard rule 1). Use .env.example for documentation.',
  },
  {
    test: (s) => /\bdrop\s+(database|schema|table)\b/i.test(s),
    why: 'Destructive SQL (DROP ...) is blocked.',
  },
  { test: (s) => /(^|\s)--force(-with-lease)?\b/.test(s), why: '--force flags are blocked.' },
  {
    test: (s) => /\bgit\s+push\b/.test(s),
    why: 'git push is blocked. The human pushes after review (AGENTS.md hard rule 2).',
  },
  {
    test: (s) => /\brm\s+-[a-z]*r[a-z]*f|\brm\s+-[a-z]*f[a-z]*r/i.test(s),
    why: 'rm -rf is blocked. Delete specific files instead.',
  },
  { test: (s) => /\bgit\s+reset\s+--hard\b/.test(s), why: 'git reset --hard is blocked.' },
  {
    test: (s) => /\bdocker\s+(system|volume)\s+prune\b/.test(s),
    why: 'docker prune commands are blocked.',
  },
  {
    test: (s) => /\btailscale\s+funnel\b.*\b(4\d{3}|54\d{2})\b/.test(s),
    why: 'Only the dashboard (port 3000) may be funnelled, never the API or the database.',
  },
];

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let call;
  try {
    call = JSON.parse(input);
  } catch {
    process.exit(0); // not our business if the payload is odd
  }
  const tool = call.tool_name ?? '';
  const args = call.tool_input ?? {};
  // What to inspect: the shell command for Bash, the path for file tools.
  const subject =
    tool === 'Bash' ? String(args.command ?? '') : String(args.file_path ?? args.path ?? '');

  for (const rule of RULES) {
    if (rule.test(subject)) {
      console.error(`Blocked by .claude/hooks/guard.mjs: ${rule.why}\n  ${tool}: ${subject}`);
      process.exit(2);
    }
  }
  process.exit(0);
});
