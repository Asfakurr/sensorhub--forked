#!/usr/bin/env node
// OPTIONAL Stop hook: when the agent says it's finished, run the tests for the apps
// it changed. If they fail, exit 2 so the agent is told to keep going.
// Not enabled by default (it slows every turn). To enable, add to .claude/settings.json:
//   "Stop": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/test-on-stop.mjs" }] }]
import { spawnSync } from 'node:child_process';

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    if (JSON.parse(input).stop_hook_active) process.exit(0); // avoid loops
  } catch {
    /* ignore */
  }
  const sh = { encoding: 'utf8', shell: process.platform === 'win32' };
  const diff = spawnSync('git', ['diff', '--name-only', 'HEAD'], sh).stdout ?? '';
  const apps = [
    ...new Set(
      diff
        .split('\n')
        .map((f) => f.match(/^apps\/([^/]+)\//)?.[1])
        .filter(Boolean),
    ),
  ];
  for (const app of apps) {
    const res = spawnSync('pnpm', ['--filter', app, 'test'], sh);
    if (res.status !== 0) {
      console.error(
        `Tests failed in apps/${app}. Fix them before finishing:\n${(res.stdout + res.stderr).slice(-3000)}`,
      );
      process.exit(2);
    }
  }
  process.exit(0);
});
