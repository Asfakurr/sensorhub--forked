import { describe, expect, it } from 'vitest';
import { formatPredictionTargetTime, formatTrend } from './predictions';

describe('formatTrend', () => {
  it('reports a rising trend for a positive slope above the threshold', () => {
    expect(formatTrend(0.15)).toEqual({
      label: 'Rising',
      direction: 'rising',
      formattedRate: '+0.15 °C/min',
    });
  });

  it('reports a falling trend for a negative slope below the threshold', () => {
    expect(formatTrend(-0.1)).toEqual({
      label: 'Falling',
      direction: 'falling',
      formattedRate: '-0.10 °C/min',
    });
  });

  it('reports a stable trend for slopes within the threshold', () => {
    const stable = {
      label: 'Stable',
      direction: 'stable',
      formattedRate: '0.00 °C/min',
    };
    expect(formatTrend(0)).toEqual(stable);
    expect(formatTrend(0.005)).toEqual(stable);
    expect(formatTrend(-0.005)).toEqual(stable);
  });

  it('treats the exact threshold boundaries as stable', () => {
    expect(formatTrend(0.01).direction).toBe('stable');
    expect(formatTrend(-0.01).direction).toBe('stable');
  });

  it('rounds the displayed rate to two decimal places', () => {
    expect(formatTrend(0.126).formattedRate).toBe('+0.13 °C/min');
    expect(formatTrend(-0.126).formattedRate).toBe('-0.13 °C/min');
  });

  it('handles non-finite slopes as stable', () => {
    expect(formatTrend(Number.NaN)).toEqual({
      label: 'Stable',
      direction: 'stable',
      formattedRate: '0.00 °C/min',
    });
    expect(formatTrend(Number.POSITIVE_INFINITY).direction).toBe('stable');
    expect(formatTrend(Number.NEGATIVE_INFINITY).direction).toBe('stable');
  });
});

describe('formatPredictionTargetTime', () => {
  it('formats a valid ISO timestamp as a local en-GB time', () => {
    const iso = '2026-11-20T14:32:05.000Z';
    expect(formatPredictionTargetTime(iso)).toBe(new Date(iso).toLocaleTimeString('en-GB'));
  });

  it('returns a placeholder for invalid timestamps', () => {
    expect(formatPredictionTargetTime('not-a-date')).toBe('–');
    expect(formatPredictionTargetTime('')).toBe('–');
  });
});
