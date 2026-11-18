import type { Reading } from '@sensorhub/shared';

export const CSV_HEADER = ['recordedAt', 'temperature', 'humidity', 'battery'] as const;

/** Quote a CSV field if it contains a comma, quote, or newline (RFC 4180). */
export function csvField(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Readings (any order in, oldest first out) as CSV text with a header row. */
export function readingsToCsv(readings: Reading[]): string {
  const rows = [...readings]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .map((r) => [r.recordedAt, r.temperature, r.humidity, r.battery].map(csvField).join(','));
  return [CSV_HEADER.join(','), ...rows].join('\r\n') + '\r\n';
}
