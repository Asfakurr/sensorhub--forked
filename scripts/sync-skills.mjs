#!/usr/bin/env node
// Skills are written once in .claude/skills (read by Claude Code and OpenCode) and
// copied to .agents/skills (read by Codex). Symlinks would break on Windows, so we copy.
// Run after editing a skill: pnpm sync-skills
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs';

const src = '.claude/skills';
const dest = '.agents/skills';
if (existsSync(dest)) rmSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied ${readdirSync(src).length} skills from ${src} to ${dest}`);
