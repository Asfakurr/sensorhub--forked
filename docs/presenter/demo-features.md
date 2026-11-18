# Demo features (built live in Part 1)

These are the three features the lead agent hands to three different harnesses during the
orchestration demo. Finished versions are on `cp-3/alerts`, `cp-3/csv-export` and
`cp-3/device-page`; all three merged are `cp-4-merged` / `main`.

## alerts → backend-dev (Claude), slot 1

High-temperature alerts.

- New NestJS module `apps/api/src/alerts` (use the `new-nest-module` skill).
- Entity `alerts`: id (uuid), deviceId, kind (`'temperature_high'`), message, value, createdAt.
- Rule: when a reading's temperature is above `TEMP_ALERT_C` (env, default 35 °C), create an
  alert. At most one alert per device per 60 s, so a spike doesn't flood the feed.
- React to readings by subscribing to `StreamService.events$`. Don't edit `ReadingsService`.
- Publish each new alert on the stream as `{ type: 'alert', data: Alert }` and add `Alert` plus
  the new `StreamEvent` variant to `packages/shared`.
- `GET /api/alerts?deviceId=&limit=` returns recent alerts, newest first (default 20).
- Dashboard: an alert feed next to the device grid that loads recent alerts and adds new ones
  live (use `useStream`).
- Unit tests for the rule, including the 60 s de-duplication.

## csv-export → codex-worker (Codex), slot 2

- `GET /api/devices/:id/readings.csv?hours=24` returns the device's readings for the last N
  hours (1–168, default 24), oldest first, as CSV with header
  `recordedAt,temperature,humidity,battery`.
- `Content-Type: text/csv` and `Content-Disposition: attachment; filename="<id>-readings.csv"`.
- 404 for an unknown device.
- Put CSV formatting in a pure function with unit tests (including values that need escaping).
- API only, no dashboard changes.

## device-page → agy-worker (Antigravity), slot 3

- New page `apps/web/app/devices/[id]/page.tsx` (use the `new-dashboard-widget` skill).
- Server Component loads the device and its last 24 h of readings via `apiGet`; `notFound()` for
  unknown devices.
- Shows name, id, battery and last seen, and a temperature and humidity chart for 24 h
  (reuse `Sparkline`), plus min / max / latest values.
- A small table of the 20 most recent readings.
- Device cards on the home page link to their detail page.
- Unit test for any new pure helper in `lib/`.
