---
name: new-dashboard-widget
description: Add a widget or page to the SensorHub Next.js dashboard (apps/web) that reads from the API and optionally the live SSE stream. Use for any UI task, e.g. an alert feed, a device detail page, a chart, a button that calls the API.
---

# New dashboard widget (apps/web)

Reference implementation: `apps/web/components/device-grid.tsx` + `apps/web/app/page.tsx`.

## Decide: server or client?

| Needs                                | Make it a…                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------- |
| Data at first paint, no interaction  | **Server Component** in `app/` using `apiGet()`                             |
| Live updates, state, clicks, effects | **Client Component** in `components/` (`'use client'`)                      |
| Both (usual case)                    | Server page fetches initial data → passes it as props to a Client Component |

## Steps

1. **Data.** Server side: `await apiGet<Type>('/path')` from `@/lib/api` (no `/api` prefix in the
   argument). Client side: `fetch('/api/path')`, which the Next.js rewrite proxies to NestJS.
   Types come from `@sensorhub/shared` with `import type`.
2. **Live updates.** In a Client Component:
   ```tsx
   const onEvent = useCallback((e: StreamEvent) => { if (e.type === 'alert') ... }, []);
   const mode = useStream(onEvent);   // from '@/lib/use-stream'
   ```
   Wrap the handler in `useCallback`. Never open a second `EventSource`.
   `useStream` falls back to polling readings only. If your widget needs other live data, re-fetch
   it every ~10 s when `mode === 'polling'`.
3. **New page.** `app/<route>/page.tsx`. Dynamic params are a Promise in Next 16:
   ```tsx
   export default async function Page({ params }: { params: Promise<{ id: string }> }) {
     const { id } = await params;
   ```
   Add `export const dynamic = 'force-dynamic';` for live data. Use `notFound()` for 404s.
4. **Styling.** Reuse classes in `app/globals.css` (`card`, `grid`, `muted`, `mono`, `notice`,
   `table`). Add new classes there using the CSS variables. No UI libraries, no inline colours.
5. **Charts.** Use `<Sparkline values={...} />` or extend `lib/sparkline.ts`. Don't add chart
   libraries.
6. **Tests.** Put logic (formatting, grouping, maths) in `lib/*.ts` and test it in `lib/*.test.ts`.
7. **Verify.** `pnpm --filter web test && pnpm --filter web build && pnpm lint`, then open
   `http://localhost:${WEB_PORT:-3000}` (rebuild the stack: `docker compose up -d --build web`).
