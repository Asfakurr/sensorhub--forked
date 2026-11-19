import { linearRegression, slopePerMinuteFromPerMs } from './linear-regression';

describe('linearRegression', () => {
  it('computes positive slope', () => {
    const points = [
      { timestamp: 0, value: 10 },
      { timestamp: 60_000, value: 11 },
      { timestamp: 120_000, value: 12 },
    ];
    const res = linearRegression(points);
    expect(res.slope).toBeCloseTo(1 / 60_000, 10);
    expect(res.intercept).toBeCloseTo(10, 10);
  });

  it('computes negative slope', () => {
    const points = [
      { timestamp: 0, value: 20 },
      { timestamp: 60_000, value: 19 },
      { timestamp: 120_000, value: 18 },
    ];
    const res = linearRegression(points);
    expect(res.slope).toBeCloseTo(-1 / 60_000, 10);
    expect(res.intercept).toBeCloseTo(20, 10);
  });

  it('computes zero slope', () => {
    const points = [
      { timestamp: 0, value: 5 },
      { timestamp: 60_000, value: 5 },
      { timestamp: 120_000, value: 5 },
    ];
    const res = linearRegression(points);
    expect(res.slope).toBeCloseTo(0, 10);
    expect(res.intercept).toBeCloseTo(5, 10);
  });

  it('returns zeroed result for single point', () => {
    const res = linearRegression([{ timestamp: 1000, value: 42 }]);
    expect(res).toEqual({ slope: 0, intercept: 0 });
  });

  it('returns zeroed result for empty array', () => {
    const res = linearRegression([]);
    expect(res).toEqual({ slope: 0, intercept: 0 });
  });

  it('handles identical timestamps by returning safe result', () => {
    const points = [
      { timestamp: 1000, value: 10 },
      { timestamp: 1000, value: 20 },
    ];
    const res = linearRegression(points);
    expect(res.slope).toBe(0);
    expect(Number.isFinite(res.intercept)).toBe(true);
  });

  it('guards against NaN/Infinity values', () => {
    const pointsNaN = [
      { timestamp: 0, value: Number.NaN },
      { timestamp: 1000, value: 10 },
    ];
    const pointsInf = [
      { timestamp: 0, value: Number.POSITIVE_INFINITY },
      { timestamp: 1000, value: 10 },
    ];
    expect(linearRegression(pointsNaN)).toEqual({ slope: 0, intercept: 0 });
    expect(linearRegression(pointsInf)).toEqual({ slope: 0, intercept: 0 });
  });
});

describe('slopePerMinuteFromPerMs', () => {
  it('converts slope per ms to slope per minute', () => {
    const perMs = 1 / 60_000; // 1 degree per minute
    expect(slopePerMinuteFromPerMs(perMs)).toBeCloseTo(1, 10);
  });

  it('returns 0 for non-finite input', () => {
    expect(slopePerMinuteFromPerMs(Number.NaN)).toBe(0);
    expect(slopePerMinuteFromPerMs(Number.POSITIVE_INFINITY)).toBe(0);
  });
});
