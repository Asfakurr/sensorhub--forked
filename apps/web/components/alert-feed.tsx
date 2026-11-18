'use client';

import type { Alert, StreamEvent } from '@sensorhub/shared';
import { useCallback, useEffect, useState } from 'react';
import { timeAgo } from '@/lib/sparkline';
import { useStream } from '@/lib/use-stream';

const MAX = 20;

export function AlertFeed({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [, setNow] = useState(0);

  const add = useCallback((incoming: Alert[]) => {
    setAlerts((prev) => {
      const seen = new Set(prev.map((a) => a.id));
      return [...incoming.filter((a) => !seen.has(a.id)), ...prev].slice(0, MAX);
    });
  }, []);

  const onEvent = useCallback((e: StreamEvent) => e.type === 'alert' && add([e.data]), [add]);
  const mode = useStream(onEvent);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 5000);
    // The polling fallback only carries readings, so refresh alerts ourselves.
    const poll =
      mode === 'polling'
        ? setInterval(async () => {
            const res = await fetch(`/api/alerts?limit=${MAX}`).catch(() => null);
            if (res?.ok) add((await res.json()) as Alert[]);
          }, 10_000)
        : null;
    return () => {
      clearInterval(tick);
      if (poll) clearInterval(poll);
    };
  }, [mode, add]);

  return (
    <aside className="alerts">
      <div className="section-head">
        <h2>Alerts</h2>
        <span className="muted">{alerts.length ? `${alerts.length} recent` : ''}</span>
      </div>
      {alerts.length === 0 ? (
        <p className="empty">No alerts. Temperature spikes above the limit show up here.</p>
      ) : (
        <ul className="alert-list">
          {alerts.map((a) => (
            <li key={a.id} className={`alert alert-${a.kind}`}>
              <span className="alert-msg">{a.message}</span>
              <span className="muted">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
