'use client';

import type { Device, Reading, StreamEvent } from '@sensorhub/shared';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { timeAgo } from '@/lib/sparkline';
import { useStream } from '@/lib/use-stream';
import { Sparkline } from './sparkline';

const HISTORY = 40;

interface Row {
  device: Device;
  history: Reading[]; // oldest → newest
}

function buildRows(devices: Device[], readings: Reading[]): Record<string, Row> {
  const rows: Record<string, Row> = {};
  for (const d of devices) rows[d.id] = { device: d, history: [] };
  // readings arrive newest first from the API
  for (const r of [...readings].reverse()) {
    const row = rows[r.deviceId];
    if (row) row.history = [...row.history, r].slice(-HISTORY);
  }
  return rows;
}

export function DeviceGrid({
  initialDevices,
  initialReadings,
}: {
  initialDevices: Device[];
  initialReadings: Reading[];
}) {
  const [rows, setRows] = useState(() => buildRows(initialDevices, initialReadings));
  const [, setNow] = useState(0);

  // Re-render every 5 s so "last seen" stays fresh.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(t);
  }, []);

  const onEvent = useCallback((event: StreamEvent) => {
    if (event.type !== 'reading') return;
    const r = event.data;
    setRows((prev) => {
      const row = prev[r.deviceId] ?? {
        device: {
          id: r.deviceId,
          name: r.deviceId,
          type: 'env-sensor',
          battery: r.battery,
          firstSeen: r.recordedAt,
          lastSeen: r.recordedAt,
        },
        history: [],
      };
      return {
        ...prev,
        [r.deviceId]: {
          device: { ...row.device, battery: r.battery, lastSeen: r.recordedAt },
          history: [...row.history, r].slice(-HISTORY),
        },
      };
    });
  }, []);

  const mode = useStream(onEvent);
  const list = Object.values(rows).sort((a, b) => a.device.id.localeCompare(b.device.id));

  return (
    <section>
      <div className="section-head">
        <h2>Devices</h2>
        <span className={`mode mode-${mode}`}>
          {mode === 'live' ? '● live' : mode === 'polling' ? '◌ polling every 2 s' : '… connecting'}
        </span>
      </div>
      {list.length === 0 ? (
        <p className="empty">
          No devices yet. Is the simulator running? (<code>docker compose ps</code>)
        </p>
      ) : (
        <div className="grid">
          {list.map(({ device, history }) => {
            const last = history.at(-1);
            return (
              <article key={device.id} className="card">
                <header>
                  <h3>
                    <Link href={`/devices/${encodeURIComponent(device.id)}`}>{device.name}</Link>
                  </h3>
                  <span className="muted mono">{device.id}</span>
                </header>
                <div className="metrics">
                  <div>
                    <span className="value">{last ? last.temperature.toFixed(1) : '–'}</span>
                    <span className="unit">°C</span>
                  </div>
                  <div className="muted">{last ? `${last.humidity.toFixed(0)}% RH` : ''}</div>
                </div>
                <Sparkline values={history.map((h) => h.temperature)} />
                <footer>
                  <span className="battery" title="Battery">
                    <span className="battery-fill" style={{ width: `${device.battery ?? 0}%` }} />
                  </span>
                  <span className="muted">{device.battery?.toFixed(0) ?? '–'}%</span>
                  <span className="muted right">{timeAgo(device.lastSeen)}</span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
