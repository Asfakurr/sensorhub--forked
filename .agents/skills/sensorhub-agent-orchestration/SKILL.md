---
name: sensorhub-agent-orchestration
description: >-
  Orchestrates SensorHub feature development through Antigravity's master agent
  and specialized backend, frontend, simulator, and reviewer subagents. Use for
  multi-package features or any task that should follow plan-delegate-review-verify.
---

# SensorHub Agent Orchestration

Use this skill when a requirement spans multiple packages, requires specialized workers,
or needs independent review before integration.

## Standard lifecycle

1. **Inspect**
   - Read `AGENTS.md`.
   - Inspect existing implementation and relevant skills.
   - Identify the smallest affected scope.

2. **Plan**
   - Define acceptance criteria.
   - Build a dependency graph.
   - Assign one owner per write scope.
   - Choose a feature worktree/slot.

3. **Delegate**
   - Backend contract first when API changes are required.
   - Simulator work may run in parallel if independent.
   - Frontend starts after the API contract is known.
   - Reviewer runs strictly after ALL implementation workers have explicitly completed and reported their handoffs.
   - Never assign overlapping write scopes to concurrent workers.

4. **Review**
   - **Pre-condition**: Invoke `reviewer-agent` ONLY after every assigned implementation worker has finished and returned its completion report. Never invoke the reviewer while an implementation worker is active or pending.
   - Use `reviewer-agent` as a read-only gate.
   - If it returns NEEDS CHANGES, send only the concrete corrections back to the
     responsible worker.
   - Re-review only after the responsible worker reports correction completion.

5. **Verify**
   - Run the required package tests, lint, and builds.
   - For cross-package changes, run `pnpm test`, `pnpm lint`, and `pnpm build`
     when practical.
   - Exercise the actual API/UI behavior when the feature changes runtime behavior.

6. **Report**
   - Summarize workers, files, verification, review verdict, and remaining work.
   - Never claim success without evidence.

## Current SensorHub worker map

| Agent | Scope | Responsibility |
|---|---|---|
| `backend-agent` | `apps/api/**`, necessary shared types | API/domain implementation |
| `frontend-agent` | `apps/web/**` | Dashboard/UI implementation |
| `simulator-agent` | `apps/simulator/**` | Demo/failure-mode behavior |
| `reviewer-agent` | read-only | Review and verification |

## Worktree rule

Use the repository's `feature-stack` skill for feature worktrees. Do not make implementation
changes directly on `main`.

## Handoff rule

Every worker must return:
- changed files
- behavior/API contract
- commands actually run
- test/build/lint results
- known limitations

The master agent owns the final integration decision.
