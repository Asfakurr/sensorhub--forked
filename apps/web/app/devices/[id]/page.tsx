import type { Device, Reading } from '@sensorhub/shared';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AutoRefresh } from '@/components/auto-refresh';
import { Sparkline } from '@/components/sparkline';
import { apiGet, apiGetOrNull } from '@/lib/api';
import { timeAgo } from '@/lib/sparkline';
import { downsample, summarize, type Summary } from '@/lib/stats';

export const dynamic = 'force-dynamic';

const LIMIT = 5000;

function Metric({
  label,
  unit,
  summary,
  values,
}: {
  label: string;
  unit: string;
  summary: Summary | null;
  values: number[];
}) {
  return (
    <article className="card">
      <header>
        <h3>{label}</h3>
        {summary && (
          <span className="muted">
            min {summary.min.toFixed(1)} · max {summary.max.toFixed(1)}
          </span>
        )}
      </header>
      <div>
        <span className="value">{summary ? summary.latest.toFixed(1) : '–'}</span>
        <span className="unit">{unit}</span>
      </div>
      <Sparkline values={downsample(values, 200)} width={600} height={120} />
    </article>
  );
}

export default async function DevicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const device = await apiGetOrNull<Device>(`/devices/${encodeURIComponent(id)}`);
  if (!device) notFound();

  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const newestFirst = await apiGet<Reading[]>(
    `/readings?deviceId=${encodeURIComponent(id)}&since=${encodeURIComponent(since)}&limit=${LIMIT}`,
  );
  const readings = [...newestFirst].reverse(); // oldest → newest for charts
  const temps = readings.map((r) => r.temperature);
  const hums = readings.map((r) => r.humidity);

  return (
    <>
      <AutoRefresh seconds={10} />
      <div className="section-head">
        <div>
          <Link href="/" className="muted">
            ← All devices
          </Link>
          <h2>
            {device.name} <span className="muted mono">{device.id}</span>
          </h2>
        </div>
        <span className="muted">
          battery {device.battery?.toFixed(0) ?? '–'}% · last seen {timeAgo(device.lastSeen)}
        </span>
      </div>

      <p className="muted">
        Last 24 h · {readings.length.toLocaleString()} readings
        {readings.length === LIMIT ? ` (newest ${LIMIT.toLocaleString()} shown)` : ''}
        {' · '}
        <a href={`/api/devices/${encodeURIComponent(device.id)}/readings.csv?hours=24`}>
          Download CSV
        </a>
      </p>

      <div className="grid grid-2">
        <Metric label="Temperature" unit="°C" summary={summarize(temps)} values={temps} />
        <Metric label="Humidity" unit="% RH" summary={summarize(hums)} values={hums} />
      </div>

      <section>
        <h2>Recent readings</h2>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Temperature</th>
              <th>Humidity</th>
              <th>Battery</th>
            </tr>
          </thead>
          <tbody>
            {newestFirst.slice(0, 20).map((r) => (
              <tr key={r.id}>
                <td className="mono">{new Date(r.recordedAt).toLocaleTimeString('en-GB')}</td>
                <td>{r.temperature.toFixed(1)} °C</td>
                <td>{r.humidity.toFixed(0)}%</td>
                <td>{r.battery.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
