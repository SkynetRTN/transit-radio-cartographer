import { describe, expect, it } from 'vitest';
import type { MpcOrbit } from 'skynet-sdk';
import { datetimeToJd } from 'skynet-sdk/coords';
import { plotMpcObservability } from './plotMpc.js';
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

// (1) Ceres — well-known asteroid, elements from MPC circa epoch 2024.0.
// Values are approximate but precise enough to verify the dispatch path runs.
const CERES: MpcOrbit = {
  id: 1,
  uid: '00000000-0000-0000-0000-0000000000c1',
  catalogObjectType: 'mpc_orbit',
  designation: '00001',
  name: 'Ceres',
  epoch: 2024.0,
  semimajorAxis: 2.7676568,
  eccentricity: 0.07873625,
  inclination: 10.58620,
  longitudeOfAscendingNode: 80.25496,
  argumentOfPerihelion: 73.59764,
  meanAnomaly: 145.32434,
};

describe('plotMpcObservability', () => {
  it('runs the kepler-propagation path without throwing and emits 24 samples over 24 h', () => {
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 5, 1)));
    const dataset = plotMpcObservability(
      CERES,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 24 },
      PERMISSIVE,
    );
    expect(dataset.series.visible.xs.length).toBe(24);
  });

  it('produces at least one finite-altitude sample for Ceres over a 24h window', () => {
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 5, 1)));
    const dataset = plotMpcObservability(
      CERES,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 12 },
      PERMISSIVE,
    );
    const all = ALL_KINDS.flatMap((k) => dataset.series[k].ys);
    expect(all.some((v) => Number.isFinite(v as number))).toBe(true);
  });

  it('routes below-minTargetAltitude samples to the minElevationDeg series', () => {
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 5, 1)));
    // Set min alt to 89° — Ceres won't be above that from PARI.
    const dataset = plotMpcObservability(
      CERES,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 24 },
      {
        ...PERMISSIVE,
        minTargetAltitude: 89,
      },
    );
    for (const k of ALL_KINDS) {
      if (k === 'minElevationDeg') continue;
      expect(dataset.series[k].ys.every((v) => Number.isNaN(v as number))).toBe(true);
    }
    // The 24 below-threshold samples all land on minElevationDeg.
    expect(dataset.series.minElevationDeg.ys.every((v) => Number.isFinite(v as number))).toBe(true);
    expect(dataset.series.minElevationDeg.ys.every((v) => (v as number) < 89)).toBe(true);
  });
});
