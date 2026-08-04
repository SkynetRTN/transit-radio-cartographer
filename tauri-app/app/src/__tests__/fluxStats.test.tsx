import { describe, expect, it } from 'vitest';
import { computeFluxStats } from '../lib/fluxStats';
import type { ImagePixels } from '../ipc/client';

// A 4×3 grid (width=4, height=3), row-major pixels[row][col]. `null` marks a
// no-coverage cell that every aggregation must skip.
//   row0: 1    2    3    4
//   row1: 5   null  6   null
//   row2: 7    8    9   10
const grid: ImagePixels = {
  width: 4,
  height: 3,
  pixels: [
    [1, 2, 3, 4],
    [5, null, 6, null],
    [7, 8, 9, 10],
  ],
};

describe('computeFluxStats', () => {
  it('sums, counts, and averages covered cells inside the box', () => {
    // Box = cols 0..1, rows 0..1 → cells {1, 2, 5} (row1/col1 is null, skipped).
    const s = computeFluxStats(grid, { colMin: 0, colMax: 1, rowMin: 0, rowMax: 1 });
    expect(s.boxSum).toBe(1 + 2 + 5);
    expect(s.boxCount).toBe(3);
    expect(s.boxMean).toBeCloseTo((1 + 2 + 5) / 3);
  });

  it('excludes null cells from every aggregate', () => {
    // Whole grid as the box: total covered sum = 1+2+3+4+5+6+7+8+9+10 = 55.
    const s = computeFluxStats(grid, { colMin: 0, colMax: 3, rowMin: 0, rowMax: 2 });
    expect(s.boxSum).toBe(55);
    expect(s.boxCount).toBe(10); // two nulls excluded from the 12 cells
    expect(s.outsideSum).toBe(0); // box covers the whole map
  });

  it('computes outsideSum as total minus box', () => {
    const s = computeFluxStats(grid, { colMin: 0, colMax: 1, rowMin: 0, rowMax: 1 });
    // Total covered = 55, box = 8 → outside = 47.
    expect(s.outsideSum).toBe(55 - (1 + 2 + 5));
  });

  it('returns null mean for an all-null (or empty) box', () => {
    // Box = the single null cell at row1/col1.
    const s = computeFluxStats(grid, { colMin: 1, colMax: 1, rowMin: 1, rowMax: 1 });
    expect(s.boxCount).toBe(0);
    expect(s.boxSum).toBe(0);
    expect(s.boxMean).toBeNull();
    expect(s.outsideSum).toBe(55); // nothing covered inside the box
  });
});
