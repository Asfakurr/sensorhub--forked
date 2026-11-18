# Feature menu

Pick one. Each comes with a starter prompt you can paste into your agent from inside the feature
worktree. Read the plan it gives you before letting it write code.

| #   | Feature                                     | Touches                     | Level   |
| --- | ------------------------------------------- | --------------------------- | ------- |
| 1   | Battery-low alert (below 20%)               | api, web                    | Easy    |
| 2   | New sensor type: CO₂                        | simulator, shared, api, web | Easy    |
| 3   | Stats endpoint: min / max / avg over 24 h   | api (+ web)                 | Easy    |
| 4   | Rename / tag devices from the dashboard     | web, api, entity change     | Medium  |
| 5   | Alert acknowledgement (ack button + status) | api, web, entity change     | Medium  |
| 6   | Offline badge for devices not seen for 30 s | web (+ api)                 | Medium  |
| 7   | Write a new skill and a hook, then use them | agent config                | Stretch |
| 8   | Orchestrate two harnesses on two features   | agent config, worktrees     | Stretch |

Already built in the demo (look at them for reference): high-temperature alerts
(`apps/api/src/alerts`), CSV export (`apps/api/src/readings/export.controller.ts`) and the device
detail page (`apps/web/app/devices/[id]`).

---

### 1. Battery-low alert · Easy

> Add a second alert rule to the existing alerts module in apps/api/src/alerts: when a reading's
> battery drops below 20% (configurable with BATTERY_ALERT_PCT), create an alert of kind
> 'battery_low', at most once per device per hour. Add the kind to the shared Alert type, show it
> in the dashboard alert feed with an amber style, and add unit tests. Follow AGENTS.md.

Tip: the simulator drains batteries slowly. For testing, POST a reading by hand:
`curl -X POST localhost:4001/api/readings -H 'content-type: application/json' -d '{"deviceId":"dev-001","temperature":22,"humidity":40,"battery":12}'`

### 2. New sensor type: CO₂ · Easy

> Add CO₂ (ppm, 400–2000) to the telemetry. Update the shared Reading and CreateReadingInput
> types, make the simulator generate a realistic random walk for it, store it in the readings
> entity (nullable for old rows), validate it in the DTO, and show the current value plus a
> sparkline on each device card. Add tests for the simulator change and the DTO. Follow AGENTS.md.

### 3. Stats endpoint · Easy

> Add GET /api/devices/:id/stats?hours=24 that returns min, max and average temperature and
> humidity plus the reading count for that window, computed in SQL (not in JavaScript). Return
> 404 for unknown devices. Add unit tests, then show the stats on the device detail page.
> Follow AGENTS.md and use the new-nest-module skill.

### 4. Rename / tag devices · Medium

> Let users rename a device and give it tags from the dashboard. Add a PATCH /api/devices/:id
> endpoint with a validated DTO (name 1–40 chars, up to 5 tags of 1–20 chars), store tags on the
> device entity, update the shared Device type, and add an edit form on the device detail page
> (Client Component). Names set by users must not be overwritten by the simulator. Add tests.
> Follow AGENTS.md.

### 5. Alert acknowledgement · Medium

> Add acknowledgement to alerts: an acknowledgedAt column, POST /api/alerts/:id/ack, and an
> "Ack" button in the dashboard alert feed. Acknowledged alerts are greyed out; publish an
> 'alert_ack' stream event so other open dashboards update live. Add tests. Follow AGENTS.md.

### 6. Offline badge · Medium

> Show an "offline" badge on device cards when a device hasn't reported for 30 seconds, and
> count offline devices in the Devices header. Put the time logic in a pure function in
> apps/web/lib with Vitest tests. Stop one device in the simulator for testing by adding an
> optional OFFLINE_DEVICE env var. Follow AGENTS.md.

### 7. Your own skill and hook · Stretch

Write `.claude/skills/<name>/SKILL.md` (or an OpenCode skill) for a pattern you care about, for
example "add a Vitest test for a lib function", and a hook that enforces something (e.g. block
edits to `docker-compose.yml`). Use them on any feature above and show them firing.

### 8. Two harnesses at once · Stretch

Start two feature stacks (slots 1 and 2), run OpenCode in one and `agy` in the other at the same
time, then review both diffs yourself before merging either.
