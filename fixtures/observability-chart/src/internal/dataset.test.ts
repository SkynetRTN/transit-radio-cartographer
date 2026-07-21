import { describe, expect, it } from 'vitest';
import { altToAirmass, ObservabilityDatasetBuilder } from './dataset.js';
import { CTIO } from './__fixtures__/sites.js';

describe('altToAirmass', () => {
  it('zenith → 1; horizon → very large; NaN passes through', () => {
    expect(altToAirmass(90)).toBeCloseTo(1, 9);
    expect(altToAirmass(30)).toBeCloseTo(2, 9); // sec(60°) = 2
    // Math.cos(pi/2) is ~6.1e-17 in IEEE 754, not 0, so we get a finite but
    // very large airmass at the horizon. That's fine — adapters cap display
    // at a sensible value if needed.
    expect(altToAirmass(0)).toBeGreaterThan(1e15);
    expect(Number.isNaN(altToAirmass(NaN))).toBe(true);
  });
});

describe('ObservabilityDatasetBuilder', () => {
  it('toDataset() returns the expected dataset shape with empty buffers', () => {
    const builder = new ObservabilityDatasetBuilder(CTIO);
    const dataset = builder.toDataset();
    expect(dataset.site).toBe(CTIO);
    expect(Number.isNaN(dataset.maxAltitude)).toBe(true);
    for (const kind of [
      'visible',
      'sunElevation',
      'minSunElevationDeg',
      'sunSeparation',
      'maxSunSeparation',
      'earth',
      'moon',
      'moonPhase',
      'minElevationDeg',
      'maxElevationDeg',
    ] as const) {
      expect(dataset.series[kind].kind).toBe(kind);
      expect(dataset.series[kind].xs).toEqual([]);
      expect(dataset.series[kind].ys).toEqual([]);
      expect(dataset.series[kind].airmass).toEqual([]);
    }
  });
});
