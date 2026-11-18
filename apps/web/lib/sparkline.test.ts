import { describe, expect, it } from 'vitest';
import { sparklinePath, timeAgo } from './sparkline';

describe('sparklinePath', () => {
  it('returns an empty path for no data', () => {
    expect(sparklinePath([], 100, 20)).toBe('');
  });

  it('spans the full width and maps min to bottom, max to top', () => {
    expect(sparklinePath([0, 10], 100, 20, 0)).toBe('M0.0,20.0 L100.0,0.0');
  });

  it('draws a flat line through the middle-ish when all values are equal', () => {
    expect(sparklinePath([5, 5, 5], 10, 10, 0)).toBe('M0.0,10.0 L5.0,10.0 L10.0,10.0');
  });
});

describe('timeAgo', () => {
  const now = Date.parse('2026-01-01T12:00:00Z');
  it('formats seconds, minutes and hours', () => {
    expect(timeAgo('2026-01-01T11:59:50Z', now)).toBe('10s ago');
    expect(timeAgo('2026-01-01T11:55:00Z', now)).toBe('5m ago');
    expect(timeAgo('2026-01-01T09:00:00Z', now)).toBe('3h ago');
  });
});
