import { describe, expect, it } from 'vitest';
import type { MajorSolarSystemObject } from 'skynet-sdk';
import { datetimeToJd } from 'skynet-sdk/coords';
import { plotMajorSolarSystemObservability } from './plotMajor.js';
import { PARI } from './__fixtures__/sites.js';
import type { ObservabilityConstraints } from '../types.js';

const PERMISSIVE: ObservabilityConstraints = {
  minTargetAltitude: -90,
  maxTargetAltitude: 90,
  maxSunAltitude: 90,
  minSunAltitude: -90,
  minMoonSeparationDeg: 0,
  minSunSeparationDeg: 0,
  maxSunSeparation: 180,
  minMoonPhaseFraction: 0,
  maxMoonPhaseFraction: 1,
};

const ALL_KINDS = [
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
] as const;

const MARS: MajorSolarSystemObject = {
  id: 100,
  uid: '00000000-0000-0000-0000-0000000000aa',
  catalogObjectType: 'major',
  name: 'mars',
};

const SUN: MajorSolarSystemObject = {
  id: 101,
  uid: '00000000-0000-0000-0000-0000000000ab',
  catalogObjectType: 'major',
  name: 'sun',
};

describe('plotMajorSolarSystemObservability', () => {
  it('emits non-empty series for a planet over a 24h window', () => {
    // 2024-01-15 00:00 UT
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 0, 15)));
    const dataset = plotMajorSolarSystemObservability(
      MARS,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 12 },
      PERMISSIVE,
    );
    expect(dataset.series.visible.xs.length).toBe(12);
    // Some sample must be classified — at least one series has a finite y.
    const allYs = ALL_KINDS.flatMap((k) => dataset.series[k].ys);
    expect(allYs.some((v) => Number.isFinite(v as number))).toBe(true);
  });

  it('the sun, when above the horizon, lands in sunElevation when maxSunAltitude is enforced', () => {
    // Local noon at PARI in mid-summer → sun is well above the horizon.
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 5, 21, 17, 0, 0))); // ~12:00 local time (UTC-5)
    const dataset = plotMajorSolarSystemObservability(
      SUN,
      PARI,
      { startJd, stopJd: startJd + 1 / 96, stepJd: 1 / 96 },
      {
        ...PERMISSIVE,
        minTargetAltitude: 0,
        maxSunAltitude: -18, // night-only — sun is way above this
      },
    );
    // For the sun target at local noon: target alt > 0 (passes minTargetAltitude),
    // sun alt > maxSunAltitude → classified as sunElevation.
    expect(dataset.series.sunElevation.ys[0]).toBeGreaterThan(0);
    expect(Number.isNaN(dataset.series.visible.ys[0] as number)).toBe(true);
  });

  it('the sun is above the horizon around local solar noon (smoke test)', () => {
    // 2024-01-15 ~17:00 UT ≈ local solar noon at PARI (UTC-5, winter).
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 0, 15, 17, 0, 0)));
    const dataset = plotMajorSolarSystemObservability(
      SUN,
      PARI,
      { startJd, stopJd: startJd + 1 / 24, stepJd: 1 / 24 },
      PERMISSIVE,
    );
    const allKinds = ALL_KINDS.map((k) => dataset.series[k].ys[0]);
    const finite = allKinds.find((v) => Number.isFinite(v as number));
    expect(finite).toBeDefined();
    // PARI is at lat ~35°N; on 2024-01-15 (declination ~ -21°) the sun's
    // transit altitude is ~34°. We sampled at solar noon so we should be near
    // that — tolerate ±15° for off-noon and frame-conversion differences.
    expect(finite).toBeGreaterThan(15);
    expect(finite).toBeLessThan(50);
  });
});
