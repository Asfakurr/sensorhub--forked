#!/usr/bin/env node
// Pre-session check. Run: pnpm verify-setup  (or scripts/verify-setup.sh / .ps1)
// Post a screenshot of the result in the session chat before the training day.
import { spawnSync } from 'node:child_process';
import net from 'node:net';

const isWin = process.platform === 'win32';
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: isWin, timeout: 20000 });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null;
}

const checks = [
  { name: 'git', cmd: ['git', ['--version']], required: true },
  {
    name: 'node >= 22',
    cmd: ['node', ['--version']],
    required: true,
    ok: (v) => Number(v.replace('v', '').split('.')[0]) >= 22,
  },
  { name: 'pnpm', cmd: ['pnpm', ['--version']], required: true },
  { name: 'docker', cmd: ['docker', ['--version']], required: true },
  { name: 'docker compose', cmd: ['docker', ['compose', 'version']], required: true },
  {
    name: 'docker daemon running',
    cmd: ['docker', ['info', '--format', '{{.ServerVersion}}']],
    required: true,
  },
  { name: 'tailscale', cmd: ['tailscale', ['version']], required: true },
  { name: 'opencode', cmd: ['opencode', ['--version']], required: true },
  { name: 'agy (Antigravity CLI)', cmd: ['agy', ['--version']], required: false },
  { name: 'codex (optional, paid)', cmd: ['codex', ['--version']], required: false },
  { name: 'claude (optional, paid)', cmd: ['claude', ['--version']], required: false },
  { name: 'tmux (optional, Ubuntu/macOS/WSL)', cmd: ['tmux', ['-V']], required: false },
];

let failed = 0;
console.log('\nSensorHub setup check\n');
for (const c of checks) {
  const out = run(...c.cmd);
  const pass = out !== null && (!c.ok || c.ok(out));
  if (pass) console.log(`  ${green('✔')} ${c.name.padEnd(36)} ${out}`);
  else if (c.required) {
    failed++;
    console.log(`  ${red('✘')} ${c.name.padEnd(36)} ${out ?? 'not found'}`);
  } else console.log(`  ${yellow('–')} ${c.name.padEnd(36)} ${out ?? 'not installed (optional)'}`);
}

const ports = [
  3000, 3001, 3002, 3003, 3004, 4000, 4001, 4002, 4003, 4004, 5432, 5433, 5434, 5435, 5436,
];
const isFree = (port) =>
  new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    srv.listen(port, '0.0.0.0');
  });
const busy = [];
for (const p of ports) if (!(await isFree(p))) busy.push(p);
if (busy.length) {
  console.log(
    `  ${yellow('!')} ${'ports 3000-3004, 4000-4004, 5432-5436'.padEnd(36)} in use: ${busy.join(', ')}`,
  );
  console.log(
    '      (fine if that is your own SensorHub stack; otherwise stop whatever uses them, e.g. a local Postgres)',
  );
} else {
  console.log(`  ${green('✔')} ${'ports 3000-3004, 4000-4004, 5432-5436'.padEnd(36)} free`);
}

console.log(
  failed
    ? `\n${red(`${failed} required check(s) failed.`)} Fix them using the install checklist, then run this again.\n`
    : `\n${green('All required checks passed.')} Screenshot this and post it in the session chat.\n`,
);
process.exit(failed ? 1 : 0);
