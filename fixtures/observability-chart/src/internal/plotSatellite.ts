/** Dispatch for NORAD satellites (TLE-propagated via satellite.js). */

import {
  AngleBetween,
  AstroTime,
  Body,
  DEG2RAD,
  GeoVector,
  KM_PER_AU,
  Observer,
  ObserverVector,
  RAD2DEG,
  RotateVector,
  Rotation_EQJ_EQD,
  Rotation_HOR_EQD,
  Spherical,
  Vector,
  VectorFromSphere,
} from 'astronomy-engine';
import {
  ecfToLookAngles,
  eciToEcf,
  type EciVec3,
  gstime,
  propagate,
  twoline2satrec,
} from 'satellite.js';
import { jdToDatetime } from 'skynet-sdk/coords';
import type { NoradSatellite, Site } from 'skynet-sdk';
import type { ObservabilityConstraints, ObservabilityDataset, ObservabilityRange } from '../types.js';
import { ObservabilityDatasetBuilder } from './dataset.js';
import { resolveStepJd, stepCount } from './range.js';

export function plotSatelliteObservability(
  satellite: NoradSatellite,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
): ObservabilityDataset {
  const stepJd = resolveStepJd(range);
  const builder = new ObservabilityDatasetBuilder(site);
  if (!satellite.tle) {
    return builder.toDataset();
  }
  const observer = new Observer(site.latitudeDeg, site.longitudeDeg, site.elevationM);
  // `Observer`, `GeodeticLocation`, and `LookAngles` are astronomy-engine /
  // satellite.js types; their property names (`latitude`, `longitude`,
  // `elevation`) are external API and must NOT carry the unit suffix.
  const observerRadians = {
    latitude: observer.latitude * DEG2RAD,
    longitude: observer.longitude * DEG2RAD,
    height: observer.height / 1000,
  };
  // `tle` is "Two- or Three-Line Elements" (per the NoradSatellite schema): a
  // bare pair of orbital lines, optionally preceded by a name header. Find the
  // two orbital lines by their NORAD line-number prefix rather than by position
  // so a 2-line TLE (e.g. the editor's `${tle1}\n${tle2}` previews) works the
  // same as a 3-line one — matching how the sky-chart marker propagator parses.
  const tleLines = satellite.tle
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const line1 = tleLines.find((l) => /^1 /.test(l));
  const line2 = tleLines.find((l) => /^2 /.test(l));
  if (!line1 || !line2) {
    return builder.toDataset();
  }
  const record = twoline2satrec(line1, line2);
  const n = stepCount(range, stepJd);
  for (let i = 0; i < n; i++) {
    const jd = range.startJd + i * stepJd;
    const time: Date = jdToDatetime(jd);
    const astroTime = new AstroTime(time);
    const gmst = gstime(time);
    const positionAndVelocity = propagate(record, time);
    if (typeof positionAndVelocity.position === 'boolean' || !positionAndVelocity.position) {
      builder.pushTopocentricVectorData(jd, site, new Vector(0, 0, 0, astroTime), constraints);
      continue;
    }
    const positionEci = positionAndVelocity.position as EciVec3<number>;
    const positionEcf = eciToEcf(positionEci, gmst);
    const lookAngles = ecfToLookAngles(observerRadians, positionEcf);
    const satAlt = lookAngles.elevation * RAD2DEG;
    const satAz = lookAngles.azimuth * RAD2DEG;
    const satRange = lookAngles.rangeSat;

    const j2000ToCurrent = Rotation_EQJ_EQD(astroTime);
    const sunGeoJ2000Vector = GeoVector(Body.Sun, time, true);
    const sunGeoCurrentVector = RotateVector(j2000ToCurrent, sunGeoJ2000Vector);
    const shadowGeoCurrentVector = new Vector(
      -sunGeoCurrentVector.x,
      -sunGeoCurrentVector.y,
      -sunGeoCurrentVector.z,
      astroTime,
    );

    const satTopoHorizonSpherical = new Spherical(satAlt, 360 - satAz, satRange);
    const satTopoHorizonVector = VectorFromSphere(satTopoHorizonSpherical, astroTime);
    const horizonToCurrent = Rotation_HOR_EQD(astroTime, observer);
    const satTopoCurrentVector = RotateVector(horizonToCurrent, satTopoHorizonVector);
    let observerCurrentVector = ObserverVector(astroTime, observer, true);
    observerCurrentVector = new Vector(
      observerCurrentVector.x * KM_PER_AU,
      observerCurrentVector.y * KM_PER_AU,
      observerCurrentVector.z * KM_PER_AU,
      observerCurrentVector.t,
    );
    const satGeoCurrentVector = new Vector(
      satTopoCurrentVector.x + observerCurrentVector.x,
      satTopoCurrentVector.y + observerCurrentVector.y,
      satTopoCurrentVector.z + observerCurrentVector.z,
      astroTime,
    );

    const shadowAngle = AngleBetween(shadowGeoCurrentVector, satGeoCurrentVector);
    const r = Math.sin(shadowAngle * DEG2RAD) * satGeoCurrentVector.Length();

    builder.pushTopocentricVectorData(jd, site, satTopoCurrentVector, constraints, r);
  }
  return builder.toDataset();
}
