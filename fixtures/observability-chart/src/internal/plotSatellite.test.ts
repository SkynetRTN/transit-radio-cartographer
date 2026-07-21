import { describe, expect, it } from 'vitest';
import type { NoradSatellite } from 'skynet-sdk';
import { datetimeToJd } from 'skynet-sdk/coords';
import { plotSatelliteObservability } from './plotSatellite.js';
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

// ISS 3-line TLE element set — vintage 2023; precision irrelevant for the
// dispatch-path smoke test. The first line is the "name", lines 2 and 3 are
// the TLE proper (matches the .split('\n') indexing in plotSatellite).
const ISS: NoradSatellite = {
  id: 25544,
  uid: '00000000-0000-0000-0000-0000000000ff',
  catalogObjectType: 'norad_satellite',
  satelliteCatalogNumber: 25544,
  classification: 'U',
  internationalDesignator: '1998-067A',
  name: 'ISS (ZARYA)',
  tle: [
    'ISS (ZARYA)',
    '1 25544U 98067A   23200.50000000  .00010000  00000-0  18000-3 0  9990',
    '2 25544  51.6400 100.0000 0005000  50.0000 310.0000 15.50000000400000',
  ].join('\n'),
};

describe('plotSatelliteObservability', () => {
  it('runs without throwing on a valid TLE and emits 24 samples over 24 h', () => {
    const startJd = datetimeToJd(new Date(Date.UTC(2023, 6, 20)));
    const dataset = plotSatelliteObservability(
      ISS,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 24 },
      PERMISSIVE,
    );
    expect(dataset.series.visible.xs.length).toBe(24);
  });

  it('accepts a 2-line TLE (no name header) the same as a 3-line one', () => {
    // The editor builds satellite previews as a bare `${tle1}\n${tle2}` pair
    // (no name header). The orbital lines must be located by their `1 `/`2 `
    // prefix, not by fixed position, or these never plot.
    const TWO_LINE: NoradSatellite = {
      ...ISS,
      tle: [
        '1 25544U 98067A   23200.50000000  .00010000  00000-0  18000-3 0  9990',
        '2 25544  51.6400 100.0000 0005000  50.0000 310.0000 15.50000000400000',
      ].join('\n'),
    };
    const startJd = datetimeToJd(new Date(Date.UTC(2023, 6, 20)));
    const dataset = plotSatelliteObservability(
      TWO_LINE,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 24 },
      PERMISSIVE,
    );
    expect(dataset.series.visible.xs.length).toBe(24);
  });

  it('returns an empty-but-shaped dataset when TLE is missing', () => {
    const NO_TLE: NoradSatellite = {
      ...ISS,
      tle: null,
    };
    const startJd = datetimeToJd(new Date(Date.UTC(2023, 6, 20)));
    const dataset = plotSatelliteObservability(
      NO_TLE,
      PARI,
      { startJd, stopJd: startJd + 1, stepJd: 1 / 24 },
      PERMISSIVE,
    );
    // No samples were pushed.
    expect(dataset.series.visible.xs.length).toBe(0);
    expect(dataset.series.visible.ys.length).toBe(0);
  });
});
