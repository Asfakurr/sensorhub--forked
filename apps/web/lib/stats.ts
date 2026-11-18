export interface Summary {
  min: number;
  max: number;
  latest: number;
}

/** Min, max and latest (last) value of a series, or null when it's empty. */
export function summarize(values: number[]): Summary | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values), latest: values[values.length - 1] };
}

/**
 * Reduce a long series to at most `points` values by averaging equal-sized buckets,
 * so a day of readings draws as a smooth line instead of thousands of SVG points.
 */
export function downsample(values: number[], points: number): number[] {
  if (values.length <= points) return values;
  const size = values.length / points;
  return Array.from({ length: points }, (_, i) => {
    const bucket = values.slice(Math.floor(i * size), Math.floor((i + 1) * size));
    return bucket.reduce((a, b) => a + b, 0) / bucket.length;
  });
}
