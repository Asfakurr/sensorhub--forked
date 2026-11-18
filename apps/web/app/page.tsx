import type { Device, Reading } from '@sensorhub/shared';
import { DeviceGrid } from '@/components/device-grid';
import { API_URL, apiGet } from '@/lib/api';

// Always render on request: this page shows live data.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Server Component: first paint comes from the API directly...
  let devices: Device[] = [];
  let readings: Reading[] = [];
  let error: string | null = null;
  try {
    [devices, readings] = await Promise.all([
      apiGet<Device[]>('/devices'),
      apiGet<Reading[]>('/readings?limit=500'),
    ]);
  } catch {
    error = `Can't reach the API at ${API_URL}. Live updates will appear once it's up.`;
  }

  // ...then the Client Component keeps it live over server-sent events.
  return (
    <>
      {error && <p className="notice">{error}</p>}
      <DeviceGrid initialDevices={devices} initialReadings={readings} />
    </>
  );
}
