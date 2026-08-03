import type { ImagePixels } from '../ipc/client';

// Aggregate flux stats over the magnifier box and the rest of the map. Single
// O(W*H) pass over the full grid, skipping no-coverage cells (`null`) exactly
// like the zmax scan in ImagePlot. `boxMean` divides by COVERED cells only (per
// user decision), so blank sky in the box never drags the average toward 0.
//
// Kept in its own Plotly-free module so it can be unit-tested without importing
// the plot components (which load plotly.js at module init).
export interface FluxStats {
  boxSum: number;
  boxCount: number; // covered (non-null) cells inside the box
  boxMean: number | null; // null when boxCount === 0
  outsideSum: number; // full-map covered sum minus boxSum
}

export function computeFluxStats(
  pixels: ImagePixels,
  bounds: { colMin: number; colMax: number; rowMin: number; rowMax: number },
): FluxStats {
  const { colMin, colMax, rowMin, rowMax } = bounds;
  let total = 0;
  let boxSum = 0;
  let boxCount = 0;
  for (let r = 0; r < pixels.height; r++) {
    const row = pixels.pixels[r];
    if (!row) continue;
    const inRowBand = r >= rowMin && r <= rowMax;
    for (let c = 0; c < pixels.width; c++) {
      const v = row[c];
      if (v === null || v === undefined) continue;
      total += v;
      if (inRowBand && c >= colMin && c <= colMax) {
        boxSum += v;
        boxCount += 1;
      }
    }
  }
  return {
    boxSum,
    boxCount,
    boxMean: boxCount > 0 ? boxSum / boxCount : null,
    outsideSum: total - boxSum,
  };
}
