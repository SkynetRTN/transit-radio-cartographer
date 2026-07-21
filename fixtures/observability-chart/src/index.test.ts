import { describe, expect, it } from 'vitest';
import type { CatalogObject, MajorSolarSystemObject, Position } from 'skynet-sdk';
import { J2000, datetimeToJd } from 'skynet-sdk/coords';
import { computeObservability } from './index.js';
import { PARI } from './internal/__fixtures__/sites.js';

const CONSTRAINTS = {
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

function makeFixedEquatorialPosition(ra: number, dec: number): Position {
  return {
    id: 1,
    uid: '00000000-0000-0000-0000-000000000010',
    positionType: 'fixed',
    coordinates: {
      id: 1,
      coordinateType: 'equatorial',
      ra,
      dec,
    },
  } as unknown as Position;
}

function makeGalacticPosition(lon: number, lat: number): Position {
  return {
    id: 2,
    uid: '00000000-0000-0000-0000-000000000020',
    positionType: 'fixed',
    coordinates: {
      id: 2,
      coordinateType: 'galactic',
      lon,
      lat,
    },
  } as unknown as Position;
}

function makeHorizontalPosition(alt: number, az: number): Position {
  return {
    id: 3,
    uid: '00000000-0000-0000-0000-000000000030',
    positionType: 'fixed',
    coordinates: {
      id: 3,
      coordinateType: 'horizontal',
      az,
      alt,
    },
  } as unknown as Position;
}

function makeCatalogPosition(catalogObjectId: number): Position {
  return {
    id: 4,
    uid: '00000000-0000-0000-0000-000000000040',
    positionType: 'catalog',
    catalogObjectId,
  } as unknown as Position;
}

const RANGE = { startJd: J2000, stopJd: J2000 + 0.5, stepJd: 1 / 24 };

describe('computeObservability', () => {
  it('returns [] when position is missing', () => {
    expect(computeObservability(null, [PARI], RANGE, CONSTRAINTS)).toEqual([]);
  });

  it('returns [] when sites is empty', () => {
    expect(computeObservability(makeFixedEquatorialPosition(180, 30), [], RANGE, CONSTRAINTS)).toEqual([]);
  });

  it('skips undefined / null sites in the list', () => {
    const datasets = computeObservability(
      makeFixedEquatorialPosition(180, 30),
      [undefined, PARI, null],
      RANGE,
      CONSTRAINTS,
    );
    expect(datasets).toHaveLength(1);
    expect(datasets[0]!.site).toBe(PARI);
  });

  it('dispatches equatorial fixed positions to the RA/Dec path', () => {
    const datasets = computeObservability(
      makeFixedEquatorialPosition(180, 30),
      [PARI],
      RANGE,
      CONSTRAINTS,
    );
    expect(datasets).toHaveLength(1);
    expect(datasets[0]!.series.visible.xs.length).toBe(12);
  });

  it('dispatches galactic fixed positions via galacticToRaDec', () => {
    const datasets = computeObservability(makeGalacticPosition(0, 0), [PARI], RANGE, CONSTRAINTS);
    expect(datasets).toHaveLength(1);
    expect(datasets[0]!.series.visible.xs.length).toBe(12);
  });

  it('dispatches horizontal fixed positions to the alt-only path', () => {
    const datasets = computeObservability(makeHorizontalPosition(45, 180), [PARI], RANGE, CONSTRAINTS);
    expect(datasets).toHaveLength(1);
    expect(datasets[0]!.series.visible.xs.length).toBe(12);
  });

  it('catalog dispatch falls back to alt(0) when lookup returns undefined', () => {
    const datasets = computeObservability(makeCatalogPosition(99), [PARI], RANGE, CONSTRAINTS, () => undefined);
    expect(datasets).toHaveLength(1);
    expect(datasets[0]!.series.visible.xs.length).toBe(12);
  });

  it('catalog dispatch invokes the resolver and routes by catalogObjectType', () => {
    const MARS: MajorSolarSystemObject = {
      id: 100,
      uid: '00000000-0000-0000-0000-0000000000aa',
      catalogObjectType: 'major',
      name: 'mars',
    };
    const startJd = datetimeToJd(new Date(Date.UTC(2024, 0, 15)));
    let calls = 0;
    const resolver = (id: number): CatalogObject | undefined => {
      calls++;
      expect(id).toBe(100);
      return MARS;
    };
    const datasets = computeObservability(
      makeCatalogPosition(100),
      [PARI],
      { startJd, stopJd: startJd + 0.5, stepJd: 1 / 24 },
      CONSTRAINTS,
      resolver,
    );
    expect(calls).toBe(1);
    expect(datasets).toHaveLength(1);
    const allYs = ALL_KINDS.flatMap((k) => datasets[0]!.series[k].ys);
    expect(allYs.some((v) => Number.isFinite(v as number))).toBe(true);
  });
});
