import { createDevices, nextReading } from './device';

const API_URL = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`;
const DEVICE_COUNT = Number(process.env.DEVICE_COUNT ?? 5);
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 3000);

const devices = createDevices(DEVICE_COUNT);
let failures = 0;

async function tick() {
  const results = await Promise.allSettled(
    devices.map(async (device, i) => {
      const { state, reading } = nextReading(device);
      devices[i] = state;
      const res = await fetch(`${API_URL}/api/readings`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(reading),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }),
  );
  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    failures++;
    // Quiet while the API is still starting up; loud if it keeps failing.
    if (failures === 1 || failures % 10 === 0) {
      console.warn(
        `[simulator] ${failed.length}/${devices.length} posts failed:`,
        (failed[0] as PromiseRejectedResult).reason?.message,
      );
    }
  } else if (failures) {
    console.log('[simulator] API reachable again');
    failures = 0;
  }
}

console.log(`[simulator] ${DEVICE_COUNT} devices → ${API_URL} every ${INTERVAL_MS} ms`);
setInterval(() => void tick(), INTERVAL_MS);
void tick();

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
