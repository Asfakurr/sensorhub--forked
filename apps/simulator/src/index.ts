import { createDevices, isDevicePaused, nextReading, pauseDevice } from './device';
import { startControlServer } from './control';

const API_URL = process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? 4000}`;
const DEVICE_COUNT = Number(process.env.DEVICE_COUNT ?? 5);
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 3000);
const CONTROL_PORT = Number(process.env.SIMULATOR_CONTROL_PORT ?? 5001);

const devices = createDevices(DEVICE_COUNT);
let failures = 0;

// Apply initial paused devices from environment (e.g. STOP_DEVICE=dev-001 or PAUSED_DEVICES=dev-001,dev-002)
function applyInitialPausedDevices() {
  const toPause = new Set<string>();
  if (process.env.STOP_DEVICE) {
    for (const id of process.env.STOP_DEVICE.split(',')) {
      const trimmed = id.trim();
      if (trimmed) toPause.add(trimmed);
    }
  }
  if (process.env.PAUSED_DEVICES) {
    for (const id of process.env.PAUSED_DEVICES.split(',')) {
      const trimmed = id.trim();
      if (trimmed) toPause.add(trimmed);
    }
  }
  for (const id of toPause) {
    pauseDevice(id, devices);
    console.log(`[simulator] Paused device: ${id} (configured via env)`);
  }
}

applyInitialPausedDevices();

let controlServer: ReturnType<typeof startControlServer> | undefined;
if (CONTROL_PORT > 0) {
  controlServer = startControlServer(devices, CONTROL_PORT);
}

async function tick() {
  const results = await Promise.allSettled(
    devices.map(async (device, i) => {
      if (isDevicePaused(device)) {
        return;
      }
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
const intervalHandle = setInterval(() => void tick(), INTERVAL_MS);
void tick();

function shutdown() {
  clearInterval(intervalHandle);
  if (controlServer) {
    controlServer.close();
  }
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
