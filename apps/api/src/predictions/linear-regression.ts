export interface RegressionPoint {
  timestamp: number;
  value: number;
}

export interface RegressionResult {
  slope: number;
  intercept: number;
}

export function linearRegression(points: RegressionPoint[]): RegressionResult {
  if (!Array.isArray(points) || points.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = points.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    if (!p || typeof p.timestamp !== 'number' || typeof p.value !== 'number') {
      return { slope: 0, intercept: 0 };
    }
    if (!Number.isFinite(p.timestamp) || !Number.isFinite(p.value)) {
      return { slope: 0, intercept: 0 };
    }
    sumX += p.timestamp;
    sumY += p.value;
    sumXY += p.timestamp * p.value;
    sumXX += p.timestamp * p.timestamp;
  }

  const denom = n * sumXX - sumX * sumX;
  if (!Number.isFinite(denom) || Math.abs(denom) < Number.EPSILON) {
    // All x are the same (or degenerate) => cannot compute a valid slope
    const avgY = sumY / n;
    return { slope: 0, intercept: Number.isFinite(avgY) ? avgY : 0 };
  }

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  if (!Number.isFinite(slope) || !Number.isFinite(intercept)) {
    return { slope: 0, intercept: 0 };
  }

  return { slope, intercept };
}

export function slopePerMinuteFromPerMs(slopePerMs: number): number {
  if (!Number.isFinite(slopePerMs)) return 0;
  return slopePerMs * 60_000;
}
