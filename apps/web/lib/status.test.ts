import { describe, expect, it } from 'vitest';
import { formatDeviceStatus, formatLastSeen, getStatusBadgeClass } from './status';

describe('formatDeviceStatus', () => {
  it('formats online to "Online"', () => {
    expect(formatDeviceStatus('online')).toBe('Online');
  });

  it('formats offline to "Offline"', () => {
    expect(formatDeviceStatus('offline')).toBe('Offline');
  });
});

describe('getStatusBadgeClass', () => {
  it('returns class for online status', () => {
    expect(getStatusBadgeClass('online')).toBe('status-badge status-online');
  });

  it('returns class for offline status', () => {
    expect(getStatusBadgeClass('offline')).toBe('status-badge status-offline');
  });
});

describe('formatLastSeen', () => {
  const baseTime = Date.parse('2026-01-01T12:00:00Z');

  it('handles null, undefined, and empty string', () => {
    expect(formatLastSeen(null, baseTime)).toBe('never');
    expect(formatLastSeen(undefined, baseTime)).toBe('never');
    expect(formatLastSeen('', baseTime)).toBe('never');
  });

  it('handles invalid date values', () => {
    expect(formatLastSeen('invalid-date', baseTime)).toBe('unknown');
  });

  it('handles future timestamps or clock skew gracefully', () => {
    const future = new Date(baseTime + 5000).toISOString();
    expect(formatLastSeen(future, baseTime)).toBe('just now');
  });

  it('formats seconds', () => {
    const tenSecondsAgo = new Date(baseTime - 10_000).toISOString();
    expect(formatLastSeen(tenSecondsAgo, baseTime)).toBe('10s ago');
  });

  it('formats minutes', () => {
    const fiveMinutesAgo = new Date(baseTime - 5 * 60_000).toISOString();
    expect(formatLastSeen(fiveMinutesAgo, baseTime)).toBe('5m ago');
  });

  it('formats hours', () => {
    const threeHoursAgo = new Date(baseTime - 3 * 3_600_000).toISOString();
    expect(formatLastSeen(threeHoursAgo, baseTime)).toBe('3h ago');
  });

  it('formats days', () => {
    const twoDaysAgo = new Date(baseTime - 48 * 3_600_000).toISOString();
    expect(formatLastSeen(twoDaysAgo, baseTime)).toBe('2d ago');
  });

  it('accepts Date objects directly', () => {
    const tenSecondsAgoDate = new Date(baseTime - 10_000);
    expect(formatLastSeen(tenSecondsAgoDate, baseTime)).toBe('10s ago');
  });
});
