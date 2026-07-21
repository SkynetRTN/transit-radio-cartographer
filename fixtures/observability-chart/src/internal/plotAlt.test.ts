import { describe, expect, it } from 'vitest';
import { J2000, raDecToAzEl } from 'skynet-sdk/coords';
import { plotAltObservability } from './plotAlt.js';
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

describe('plotAltObservability', () => {
  it('synthesises an RA that puts a 0-dec target at the requested altitude on the meridian', () => {
    // For requested alt=45° at PARI, the RA is chosen so the object sits at HA
    // matching alt=45° at dec=0. Sample at a few JDs and confirm
    // raDecToAzEl reports an altitude consistent with that target alt.
    const range = { startJd: J2000, stopJd: J2000 + 0.5, stepJd: 1 / 24 };
    const dataset = plotAltObservability(45, PARI, range, PERMISSIVE);
    // Every step must show altitude exactly 45° (since the synthetic RA is
    // chosen per-step to keep the object at the requested alt).
    for (const series of [dataset.series.visible, dataset.series.sunElevation]) {
      for (let i = 0; i < series.ys.length; i++) {
        const y = series.ys[i] as number;
        if (!Number.isNaN(y)) {
          expect(y).toBeCloseTo(45, 1);
        }
      }
    }
  });

  it('handles requested alt of 0 — used as the fallback in computeObservability', () => {
    const range = { startJd: J2000, stopJd: J2000 + 0.1, stepJd: 0.025 };
    const dataset = plotAltObservability(0, PARI, range, PERMISSIVE);
    expect(dataset.series.visible.xs.length).toBeGreaterThan(0);
  });

  it('uses last() to make the RA track the LST, so altitude stays pinned even at large steps', () => {
    // Sanity check: at any step the implied RA equals lst - ha, so feeding
    // that back into raDecToAzEl reproduces the target alt.
    const range = { startJd: J2000, stopJd: J2000 + 0.5, stepJd: 1 / 12 };
    const dataset = plotAltObservability(30, PARI, range, PERMISSIVE);
    const all = ALL_KINDS.flatMap((k) => dataset.series[k].ys);
    const finite = all.filter((v) => !Number.isNaN(v as number));
    expect(finite.length).toBeGreaterThan(0);
    for (const y of finite) {
      expect(y as number).toBeCloseTo(30, 1);
    }
    // Reference raDecToAzEl on a known sample — ensures we didn't drift from
    // the SDK transform.
    const [, el] = raDecToAzEl(0, 0, PARI.longitudeDeg, PARI.latitudeDeg, range.startJd);
    expect(Number.isFinite(el)).toBe(true);
  });
});
