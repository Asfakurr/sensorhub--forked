/**
 * Shared contracts between apps/api, apps/web and apps/simulator.
 *
 * Rule for agents: if you change a shape here, update every app that uses it
 * in the same change, and run `pnpm -r build` to catch mismatches.
 */

/** A physical (here: simulated) embedded device that reports telemetry. */
export interface Device {
  id: string;
  name: string;
  type: string;
  /** Last reported battery level, 0–100. */
  battery: number | null;
  firstSeen: string;
  lastSeen: string;
}

/** One telemetry sample from a device. */
export interface Reading {
  id: string;
  deviceId: string;
  /** Degrees Celsius. */
  temperature: number;
  /** Relative humidity, 0–100. */
  humidity: number;
  /** Battery level, 0–100. */
  battery: number;
  recordedAt: string;
}

/** Body of POST /api/readings, sent by the simulator. */
export interface CreateReadingInput {
  deviceId: string;
  /** Optional friendly name; used the first time a device is seen. */
  deviceName?: string;
  deviceType?: string;
  temperature: number;
  humidity: number;
  battery: number;
  /** ISO timestamp; defaults to "now" on the server. */
  recordedAt?: string;
}

export type AlertKind = 'temperature_high';

/** Raised by an alert rule in apps/api/src/alerts when a reading crosses a threshold. */
export interface Alert {
  id: string;
  deviceId: string;
  kind: AlertKind;
  message: string;
  /** The reading value that triggered the alert. */
  value: number;
  createdAt: string;
}

/** Events pushed on the server-sent events stream at GET /api/stream. */
export type StreamEvent =
  | { type: 'reading'; data: Reading }
  | { type: 'alert'; data: Alert }
  | { type: 'ping'; data: { at: string } };
