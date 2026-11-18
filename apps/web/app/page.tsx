import type { Alert, Device, Reading } from '@sensorhub/shared';
import { AlertFeed } from '@/components/alert-feed';
import { DeviceGrid } from '@/components/device-grid';
import { API_URL, apiGet } from '@/lib/api';

// Always render on request: this page shows live data.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Server Component: first paint comes from the API directly...
  let devices: Device[] = [];
  let readings: Reading[] = [];
  let alerts: Alert[] = [];
  let error: string | null = null;
  try {
    [devices, readings, alerts] = await Promise.all([
      apiGet<Device[]>('/devices'),
      apiGet<Reading[]>('/readings?limit=500'),
      apiGet<Alert[]>('/alerts?limit=20'),
    ]);
  } catch {
    error = `Can't reach the API at ${API_URL}. Live updates will appear once it's up.`;
  }

  // ...then the Client Components keep it live over server-sent events.
  return (
    <>
      {error && <p className="notice">{error}</p>}
      <div className="layout">
        <DeviceGrid initialDevices={devices} initialReadings={readings} />
        <AlertFeed initialAlerts={alerts} />
      </div>
    </>
  );
}
