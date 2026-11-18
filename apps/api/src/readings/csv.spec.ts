import type { Reading } from '@sensorhub/shared';
import { csvField, readingsToCsv } from './csv';

const r = (recordedAt: string, temperature: number): Reading => ({
  id: recordedAt,
  deviceId: 'dev-001',
  temperature,
  humidity: 40,
  battery: 90,
  recordedAt,
});

describe('readingsToCsv', () => {
  it('writes a header and one row per reading, oldest first', () => {
    const csv = readingsToCsv([
      r('2026-01-01T00:01:00.000Z', 22.5),
      r('2026-01-01T00:00:00.000Z', 21),
    ]);
    expect(csv).toBe(
      'recordedAt,temperature,humidity,battery\r\n' +
        '2026-01-01T00:00:00.000Z,21,40,90\r\n' +
        '2026-01-01T00:01:00.000Z,22.5,40,90\r\n',
    );
  });

  it('writes only the header when there is no data', () => {
    expect(readingsToCsv([])).toBe('recordedAt,temperature,humidity,battery\r\n');
  });
});

describe('csvField', () => {
  it('escapes commas, quotes and newlines', () => {
    expect(csvField('plain')).toBe('plain');
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('line\nbreak')).toBe('"line\nbreak"');
  });
});
