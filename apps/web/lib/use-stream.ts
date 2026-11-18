'use client';

import type { Reading, StreamEvent } from '@sensorhub/shared';
import { useEffect, useRef, useSyncExternalStore } from 'react';

export type StreamMode = 'connecting' | 'live' | 'polling';

/*
 * One shared connection to GET /api/stream (server-sent events) for the whole page,
 * however many components subscribe. If the stream can't be opened or keeps
 * dropping (some proxies buffer SSE), fall back to polling /api/readings every 2 s
 * and synthesise the same `reading` events.
 */

type Listener = (event: StreamEvent) => void;
const listeners = new Set<Listener>();
const modeListeners = new Set<() => void>();
let mode: StreamMode = 'connecting';
let stop: (() => void) | null = null;

function setMode(next: StreamMode) {
  mode = next;
  modeListeners.forEach((l) => l());
}

function emit(event: StreamEvent) {
  listeners.forEach((l) => l(event));
}

function connect(): () => void {
  let source: EventSource | null = new EventSource('/api/stream');
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let errors = 0;
  let since = new Date().toISOString();
  const seen = new Set<string>();

  const startPolling = () => {
    source?.close();
    source = null;
    setMode('polling');
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/readings?since=${encodeURIComponent(since)}&limit=200`);
        if (!res.ok) return;
        const readings = ((await res.json()) as Reading[]).reverse();
        for (const r of readings) {
          if (seen.has(r.id)) continue;
          seen.add(r.id);
          since = r.recordedAt;
          emit({ type: 'reading', data: r });
        }
        if (seen.size > 5000) seen.clear();
      } catch {
        /* API restarting; try again next tick */
      }
    }, 2000);
  };

  source.onopen = () => {
    errors = 0;
    setMode('live');
  };
  source.onmessage = (msg) => {
    try {
      emit(JSON.parse(msg.data) as StreamEvent);
    } catch {
      /* ignore malformed frames */
    }
  };
  source.onerror = () => {
    errors++;
    if (errors >= 3) startPolling();
  };

  return () => {
    source?.close();
    if (pollTimer) clearInterval(pollTimer);
    setMode('connecting');
  };
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (!stop) stop = connect();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && stop) {
      stop();
      stop = null;
    }
  };
}

/**
 * Call `onEvent` for every live event. Returns the connection mode so the UI can
 * show "live" vs "polling". Safe to use in as many components as you like.
 */
export function useStream(onEvent: (event: StreamEvent) => void): StreamMode {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => subscribe((e) => handler.current(e)), []);

  return useSyncExternalStore(
    (cb) => {
      modeListeners.add(cb);
      return () => modeListeners.delete(cb);
    },
    () => mode,
    () => 'connecting' as StreamMode,
  );
}
