/** Small display helpers for the temperature forecast card. */

export interface TrendFormat {
  label: string;
  direction: 'rising' | 'falling' | 'stable';
  formattedRate: string;
}

/** Slopes at or below this magnitude are considered flat. */
const STABLE_THRESHOLD = 0.01;

/**
 * Format a slope (°C per minute) for display.
 * Positive slopes above the threshold rise, negative slopes below it fall,
 * everything else (including non-finite input) is stable.
 */
export function formatTrend(slopePerMinute: number): TrendFormat {
  const slope = Number.isFinite(slopePerMinute) ? slopePerMinute : 0;
  const rate = Math.abs(slope).toFixed(2);

  if (slope > STABLE_THRESHOLD) {
    return { label: 'Rising', direction: 'rising', formattedRate: `+${rate} °C/min` };
  }
  if (slope < -STABLE_THRESHOLD) {
    return { label: 'Falling', direction: 'falling', formattedRate: `-${rate} °C/min` };
  }
  return { label: 'Stable', direction: 'stable', formattedRate: '0.00 °C/min' };
}

/** Format a prediction target ISO timestamp as a short local time. */
export function formatPredictionTargetTime(targetIso: string): string {
  const date = new Date(targetIso);
  if (Number.isNaN(date.getTime())) return '–';
  return date.toLocaleTimeString('en-GB');
}
