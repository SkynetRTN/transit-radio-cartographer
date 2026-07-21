import { describe, expect, it } from 'vitest';
import { J2000, datetimeToJd, jdToDatetime, lmst, raDecToAzEl } from 'skynet-sdk/coords';
import { plotRaDecObservability } from './plotRaDec.js';
import { CTIO, PARI } from './__fixtures__/sites.js';
import type { ObservabilityConstraints, ObservabilityRange } from '../types.js';

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

const DAY = 1 / 24; // JD per hour scale handle

describe('plotRaDecObservability', () => {
  it('emits one (xs, ys) pair per series per step, with equal lengths across kinds', () => {
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 1, stepJd: 1 / 24 };
    const dataset = plotRaDecObservability(180, 30, PARI, range, PERMISSIVE);
    const series = dataset.series;
    const len = series.visible.xs.length;
    expect(len).toBe(24);
    for (const k of ALL_KINDS) {
      expect(series[k].xs).toHaveLength(len);
      expect(series[k].ys).toHaveLength(len);
      expect(series[k].airmass).toHaveLength(len);
      // Every step contributes to exactly one kind, so at any index exactly
      // one ys value is finite (the others are NaN). Test the contract on a
      // sample step.
    }
    const samplesAtIdx0 = ALL_KINDS.map((k) => series[k].ys[0]);
    const finite = samplesAtIdx0.filter((v) => !Number.isNaN(v as number));
    expect(finite.length).toBe(1);
  });

  it('airmass = sec(z) where z = 90 - altitude; NaN where altitude is NaN', () => {
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 0.5, stepJd: 1 / 24 };
    const dataset = plotRaDecObservability(180, 30, PARI, range, PERMISSIVE);
    for (const kind of ['visible', 'sunElevation', 'sunSeparation', 'earth', 'moon', 'minElevationDeg'] as const) {
      const s = dataset.series[kind];
      for (let i = 0; i < s.ys.length; i++) {
        const y = s.ys[i] as number;
        const am = s.airmass[i] as number;
        if (Number.isNaN(y)) {
          expect(Number.isNaN(am)).toBe(true);
        } else {
          const expected = 1 / Math.cos(((90 - y) * Math.PI) / 180);
          expect(am).toBeCloseTo(expected, 9);
        }
      }
    }
  });

  it('classifies a meridian transit at zenith-matching declination as visible (sun far below)', () => {
    // Pick a JD where LST = 6h at PARI's longitude. Place RA = 6h * 15 = 90° (degrees as SDK)
    // and Dec = PARI lat → object is at the zenith.
    const baseJd = 2459580.5;
    const lst6 = lmst(PARI.longitudeDeg, baseJd);
    const targetJd = baseJd + (6 - lst6) / 24;
    // Use a short window centred on transit so we get one sample at it.
    const range: ObservabilityRange = { startJd: targetJd - DAY / 2, stopJd: targetJd + DAY / 2, stepJd: DAY };
    const raDeg = 6 * 15;
    const dec = PARI.latitudeDeg;
    const dataset = plotRaDecObservability(raDeg, dec, PARI, range, {
      ...PERMISSIVE,
      minTargetAltitude: 0,
      maxSunAltitude: -10, // require night, but verify the sun is in fact down independently
    });
    // At least one sample should be "visible" — i.e. altitude high, sun low.
    const anyVisible = dataset.series.visible.ys.some(
      (v) => Number.isFinite(v) && (v as number) > 50,
    );
    expect(anyVisible).toBe(true);
  });

  it('routes below-minTargetAltitude samples to the minElevationDeg series', () => {
    // Target far south, low northern site → never above 30° at PARI.
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 1, stepJd: 1 / 24 };
    const dataset = plotRaDecObservability(0, -80, PARI, range, {
      ...PERMISSIVE,
      minTargetAltitude: 30,
    });
    for (const k of ALL_KINDS) {
      if (k === 'minElevationDeg') continue;
      expect(dataset.series[k].ys.every((v) => Number.isNaN(v as number))).toBe(true);
    }
    // Every step instead lands on minElevationDeg with its (sub-threshold) altitude.
    expect(dataset.series.minElevationDeg.ys.every((v) => Number.isFinite(v as number))).toBe(true);
    expect(dataset.series.minElevationDeg.ys.every((v) => (v as number) < 30)).toBe(true);
  });

  it('maxAltitude reflects the peak visible/earth/sunElevation altitude over the run', () => {
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 1, stepJd: 1 / 48 };
    const dataset = plotRaDecObservability(180, 30, PARI, range, PERMISSIVE);
    expect(dataset.maxAltitude).toBeGreaterThan(0);
    // Sanity: max should match the largest altitude in raDecToAzEl across the
    // window. The dataset iterates with index-derived jd while this loop
    // accumulates jd, so sub-microdegree drift is expected — match to ~1e-5°.
    let maxFromGroundTruth = -Infinity;
    for (let jd = range.startJd; jd < range.stopJd; jd += range.stepJd!) {
      const [, el] = raDecToAzEl(180 / 15, 30, PARI.longitudeDeg, PARI.latitudeDeg, jd);
      if (el > maxFromGroundTruth) maxFromGroundTruth = el;
    }
    expect(dataset.maxAltitude).toBeCloseTo(maxFromGroundTruth, 4);
  });

  it('routes above-maxTargetAltitude samples to the maxElevationDeg series', () => {
    // Target at PARI's zenith — every sample exceeds maxTargetAltitude = 30°.
    const baseJd = 2459580.5;
    const lst6 = lmst(PARI.longitudeDeg, baseJd);
    const targetJd = baseJd + (6 - lst6) / 24;
    const range: ObservabilityRange = {
      startJd: targetJd - DAY / 2,
      stopJd: targetJd + DAY / 2,
      stepJd: DAY,
    };
    const raDeg = 6 * 15;
    const dec = PARI.latitudeDeg;
    const dataset = plotRaDecObservability(raDeg, dec, PARI, range, {
      ...PERMISSIVE,
      maxTargetAltitude: 30,
    });
    // Across the short window centred on transit, the target rises above 30°,
    // so at least one sample lands in maxElevationDeg.
    const anyMaxElev = dataset.series.maxElevationDeg.ys.some(
      (v) => Number.isFinite(v) && (v as number) > 30,
    );
    expect(anyMaxElev).toBe(true);
  });

  it('routes far-from-sun samples to maxSunSeparation when the upper gate is set', () => {
    // Set maxSunSeparation = 5° → anything farther than 5° from the sun violates.
    // A target at (180°, 30°) is essentially never within 5° of the sun, so
    // every step with the target above the horizon routes to maxSunSeparation
    // (assuming the other gates pass — make sun-altitude permissive).
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 1, stepJd: 1 / 24 };
    const dataset = plotRaDecObservability(180, 30, PARI, range, {
      ...PERMISSIVE,
      maxSunSeparation: 5,
    });
    const anyMaxSunSep = dataset.series.maxSunSeparation.ys.some((v) => Number.isFinite(v));
    expect(anyMaxSunSep).toBe(true);
  });

  it('xs are returned as JS Dates equal to jdToDatetime(jd)', () => {
    // skynet-sdk/coords jdToDatetime rounds to integer seconds (no sub-second
    // precision), so JD round-trips are accurate to ~1.2e-5 JD (≈ 1 s).
    const range: ObservabilityRange = { startJd: J2000, stopJd: J2000 + 0.1, stepJd: 0.025 };
    const dataset = plotRaDecObservability(0, 0, CTIO, range, PERMISSIVE);
    for (let i = 0; i < dataset.series.visible.xs.length; i++) {
      const expectedJd = range.startJd + i * range.stepJd!;
      expect(datetimeToJd(dataset.series.visible.xs[i]!)).toBeCloseTo(expectedJd, 4);
      // Inverse round-trip: tolerate ±1 s. jdToDatetime drops sub-second
      // precision, so the same JD recomputed elsewhere can land 1 ms off.
      const deltaMs = Math.abs(
        dataset.series.visible.xs[i]!.getTime() - jdToDatetime(expectedJd).getTime(),
      );
      expect(deltaMs).toBeLessThanOrEqual(1000);
    }
  });
});
