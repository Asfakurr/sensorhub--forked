#!/usr/bin/env node
// PostToolUse hook: runs AFTER every Edit / Write. Formats the file the agent just
// touched with Prettier and applies safe ESLint fixes, so style never needs a review comment.
// Never blocks (always exits 0); problems are reported back as a note.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  let file;
  try {
    file = JSON.parse(input).tool_input?.file_path;
  } catch {
    process.exit(0);
  }
  if (!file || !existsSync(file) || /node_modules|[\\/]dist[\\/]|\.next/.test(file))
    process.exit(0);

  const run = (args) =>
    spawnSync('pnpm', ['exec', ...args], {
      stdio: 'pipe',
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });

  if (/\.(ts|tsx|js|mjs|cjs|json|md|css|ya?ml)$/.test(file))
    run(['prettier', '--write', '--log-level', 'warn', file]);
  if (/\.(ts|tsx|js|mjs)$/.test(file)) {
    const lint = run(['eslint', '--fix', file]);
    if (lint.status !== 0 && lint.stdout) {
      // Exit 0 + JSON on stdout: Claude sees the remaining lint errors as feedback.
      console.log(
        JSON.stringify({
          systemMessage: `ESLint still reports problems in ${file}:\n${lint.stdout.slice(0, 2000)}`,
        }),
      );
    }
  }
  process.exit(0);
});
