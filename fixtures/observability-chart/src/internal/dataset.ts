/**
 * Per-site dataset builder. Steps are pushed via either `pushRaDecData`
 * (catalog-less RA/Dec targets) or `pushTopocentricVectorData` (solar-system
 * / MPC / NORAD), classified into one of ten `ObservabilitySeriesKind` buckets,
 * and later materialised to a renderer-agnostic `ObservabilityDataset` via
 * `toDataset()`.
 *
 * The classification cascade picks exactly one bucket per step in order:
 *   minElevationDeg → maxElevationDeg → sunElevation → minSunElevationDeg →
 *   moon → moonPhase → sunSeparation → maxSunSeparation → earth → visible.
 *
 * Ported from `apps/website/src/app/shared/target-visibility-chart/models/visibility-chart-data.ts`.
 * The notable shape change vs. the Angular original: `toDataset()` (was
 * `getDataset(color)`) returns library-agnostic series; airmass is a `number[]`
 * (NaN gaps) rather than a pre-formatted string array, so adapters can choose
 * their own formatting.
 */

import { Body, EquatorFromVector, Illumination, Vector } from 'astronomy-engine';
import { jdToDatetime, raDecToAzEl, solarAzEl } from 'skynet-sdk/coords';
import type { Site } from 'skynet-sdk';
import type {
  ObservabilityConstraints,
  ObservabilityDataset,
  ObservabilitySeries,
  ObservabilitySeriesKind,
} from '../types.js';
import {
  bodyAngularDistanceRaDec,
  bodyAngularDistanceVector,
} from './proximity.js';

// astronomy-engine v2 defines this internally (`EARTH_MEAN_RADIUS_KM = 6371.0`)
// but doesn't re-export it. Mirror the value here.
const EARTH_RADIUS_KM = 6371.0;

const KINDS: readonly ObservabilitySeriesKind[] = [
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
];

/** Kinds that count toward `maxAltitude` — anything that's physically
 *  observable (the target is above the horizon and not gated out by
 *  elevation). Used for the chart's pinned y-range sanity check. */
const MAX_ALT_KINDS: ReadonlyArray<ObservabilitySeriesKind> = [
  'visible',
  'sunElevation',
  'minSunElevationDeg',
  'sunSeparation',
  'maxSunSeparation',
  'earth',
  'moon',
  'moonPhase',
  'maxElevationDeg',
];

interface Buffers {
  xs: Date[];
  ys: number[];
}

export class ObservabilityDatasetBuilder {
  readonly site: Site;
  private buffers: Record<ObservabilitySeriesKind, Buffers>;

  constructor(site: Site) {
    this.site = site;
    this.buffers = {
      visible: { xs: [], ys: [] },
      sunElevation: { xs: [], ys: [] },
      minSunElevationDeg: { xs: [], ys: [] },
      sunSeparation: { xs: [], ys: [] },
      maxSunSeparation: { xs: [], ys: [] },
      earth: { xs: [], ys: [] },
      moon: { xs: [], ys: [] },
      moonPhase: { xs: [], ys: [] },
      minElevationDeg: { xs: [], ys: [] },
      maxElevationDeg: { xs: [], ys: [] },
    };
  }

  /** Classify a step where the target is encoded as a topocentric vector
   *  (solar-system / MPC / satellite). Calls into proximity helpers for
   *  moon/sun checks via the vector form. `r` is the satellite shadow scalar
   *  (sat-only); pass `NaN` to skip the shadow check. */
  pushTopocentricVectorData(
    jd: number,
    site: Site,
    topoCurrentVector: Vector,
    constraints: ObservabilityConstraints,
    r: number = NaN,
    isMoon: boolean = false,
  ): void {
    const date = jdToDatetime(jd);
    const topoCurrentRaDec = EquatorFromVector(topoCurrentVector);
    const altitude = raDecToAzEl(
      topoCurrentRaDec.ra,
      topoCurrentRaDec.dec,
      site.longitudeDeg,
      site.latitudeDeg,
      jd,
    )[1];
    const kind = classify(jd, site, constraints, altitude, {
      moonSeparation: () =>
        isMoon ? Infinity : bodyAngularDistanceVector(jd, site, Body.Moon, topoCurrentVector),
      sunSeparation: () => bodyAngularDistanceVector(jd, site, Body.Sun, topoCurrentVector),
      shadowR: r,
    });
    this.push(kind, date, altitude);
  }

  /** Classify a step where the target is encoded as RA/Dec (fixed equatorial,
   *  galactic-then-converted, or alt-only). */
  pushRaDecData(
    jd: number,
    site: Site,
    ra: number,
    dec: number,
    constraints: ObservabilityConstraints,
    r: number = NaN,
  ): void {
    const date = jdToDatetime(jd);
    const altitude = raDecToAzEl(ra, dec, site.longitudeDeg, site.latitudeDeg, jd)[1];
    const kind = classify(jd, site, constraints, altitude, {
      moonSeparation: () => bodyAngularDistanceRaDec(jd, Body.Moon, ra, dec),
      sunSeparation: () => bodyAngularDistanceRaDec(jd, Body.Sun, ra, dec),
      shadowR: r,
    });
    this.push(kind, date, altitude);
  }

  /** Materialise to a renderer-agnostic `ObservabilityDataset`. */
  toDataset(): ObservabilityDataset {
    const series = {} as Record<ObservabilitySeriesKind, ObservabilitySeries>;
    let maxAltitude = -Infinity;
    const maxAltKindSet = new Set(MAX_ALT_KINDS);
    for (const kind of KINDS) {
      const { xs, ys } = this.buffers[kind];
      const airmass = ys.map(altToAirmass);
      series[kind] = { kind, xs: xs.slice(), ys: ys.slice(), airmass };
      if (maxAltKindSet.has(kind)) {
        for (const y of ys) {
          if (!Number.isNaN(y) && y > maxAltitude) maxAltitude = y;
        }
      }
    }
    if (maxAltitude === -Infinity) maxAltitude = NaN;
    return { site: this.site, series, maxAltitude };
  }

  private push(kind: ObservabilitySeriesKind, date: Date, altitude: number): void {
    for (const k of KINDS) {
      this.buffers[k].xs.push(date);
      this.buffers[k].ys.push(k === kind ? altitude : NaN);
    }
  }
}

interface ClassifyInputs {
  /** Lazy moon-separation in degrees (only called when needed). */
  moonSeparation: () => number;
  /** Lazy sun-separation in degrees. */
  sunSeparation: () => number;
  /** Satellite shadow scalar in km, or `NaN` to skip the earth-shadow check. */
  shadowR: number;
}

/** Pick the single series bucket a step belongs to. Cascade order picks the
 *  most fundamental violation first so the chart always shows the dominant
 *  reason a target is unobservable at that moment. */
function classify(
  jd: number,
  site: Site,
  constraints: ObservabilityConstraints,
  altitude: number,
  inputs: ClassifyInputs,
): ObservabilitySeriesKind {
  if (altitude < constraints.minTargetAltitude) return 'minElevationDeg';
  if (altitude > constraints.maxTargetAltitude) return 'maxElevationDeg';
  const sunAltitude = solarAzEl(site.latitudeDeg, site.longitudeDeg, jd)[1];
  if (sunAltitude > constraints.maxSunAltitude) return 'sunElevation';
  if (sunAltitude < constraints.minSunAltitude) return 'minSunElevationDeg';
  if (inputs.moonSeparation() < constraints.minMoonSeparationDeg) return 'moon';
  if (moonPhaseOutOfRange(jd, constraints)) return 'moonPhase';
  const sunSep = inputs.sunSeparation();
  if (sunSep < constraints.minSunSeparationDeg) return 'sunSeparation';
  if (sunSep > constraints.maxSunSeparation) return 'maxSunSeparation';
  if (Number.isFinite(inputs.shadowR) && inputs.shadowR < EARTH_RADIUS_KM) return 'earth';
  return 'visible';
}

function moonPhaseOutOfRange(jd: number, constraints: ObservabilityConstraints): boolean {
  const noMin = constraints.minMoonPhaseFraction <= 0;
  const noMax = constraints.maxMoonPhaseFraction >= 1;
  if (noMin && noMax) return false;
  const phase = Illumination(Body.Moon, jdToDatetime(jd)).phase_fraction;
  return phase < constraints.minMoonPhaseFraction || phase > constraints.maxMoonPhaseFraction;
}

/** Airmass = sec(zenith angle), with NaN passthrough. */
export function altToAirmass(altitudeDeg: number): number {
  if (Number.isNaN(altitudeDeg)) return NaN;
  const zenithRad = ((90 - altitudeDeg) * Math.PI) / 180;
  return 1 / Math.cos(zenithRad);
}
