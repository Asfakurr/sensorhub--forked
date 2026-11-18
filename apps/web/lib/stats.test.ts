import { describe, expect, it } from 'vitest';
import { downsample, summarize } from './stats';

describe('summarize', () => {
  it('returns null for no data', () => {
    expect(summarize([])).toBeNull();
  });
  it('finds min, max and the last value', () => {
    expect(summarize([3, 9, 1, 4])).toEqual({ min: 1, max: 9, latest: 4 });
  });
});

describe('downsample', () => {
  it('leaves short series alone', () => {
    expect(downsample([1, 2, 3], 10)).toEqual([1, 2, 3]);
  });
  it('averages buckets down to the requested size', () => {
    expect(downsample([1, 3, 5, 7, 9, 11], 3)).toEqual([2, 6, 10]);
  });
  it('never returns more points than asked for', () => {
    expect(
      downsample(
        Array.from({ length: 1001 }, (_, i) => i),
        200,
      ),
    ).toHaveLength(200);
  });
});
