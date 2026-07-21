/** Sun/moon proximity helpers — pure given (jd, site, body, vector). */

import {
  AngleBetween,
  AstroTime,
  Body,
  EquatorFromVector,
  GeoVector,
  Observer,
  ObserverVector,
  RotateVector,
  Rotation_EQJ_EQD,
  Vector,
} from 'astronomy-engine';
import { haversine, jdToDatetime } from 'skynet-sdk/coords';
import type { Site } from 'skynet-sdk';

/** Topocentric angular distance in degrees between `body` and the direction
 *  encoded in `topoCurrentVector`. Returns `NaN` when `topoCurrentVector` is
 *  null (no target direction to compare against). */
export function bodyAngularDistanceVector(
  jd: number,
  site: Site,
  body: Body,
  topoCurrentVector: Vector | null,
): number {
  if (topoCurrentVector == null) return NaN;
  const time = jdToDatetime(jd);
  const astroTime = new AstroTime(time);
  const observer = new Observer(site.latitudeDeg, site.longitudeDeg, site.elevationM);
  const observerVector = ObserverVector(time, observer, true);
  const j2000ToCurrent = Rotation_EQJ_EQD(time);
  const geoJ2000Vector = GeoVector(body, time, true);
  const geoCurrentVector = RotateVector(j2000ToCurrent, geoJ2000Vector);
  const bodyTopoCurrentVector = new Vector(
    geoCurrentVector.x - observerVector.x,
    geoCurrentVector.y - observerVector.y,
    geoCurrentVector.z - observerVector.z,
    astroTime,
  );
  return Math.abs(AngleBetween(topoCurrentVector, bodyTopoCurrentVector));
}

/** Geocentric angular distance (haversine) between `body` and `(ra, dec)`
 *  — ra in hours, dec in degrees. */
export function bodyAngularDistanceRaDec(
  jd: number,
  body: Body,
  ra: number,
  dec: number,
): number {
  const coordinates = EquatorFromVector(GeoVector(body, jdToDatetime(jd), true));
  // `haversine` takes RA in degrees, but both the target RA and astronomy-engine's
  // `coordinates.ra` are in hours — convert (×15) so the RA term isn't compressed
  // 15×. The Angular original fed hours straight in, which collapsed real
  // separations (e.g. a target 170° from the sun read as a few degrees) and made
  // the min-sun-separation gate fire spuriously for radio requests.
  return Math.abs(haversine(ra * 15, dec, coordinates.ra * 15, coordinates.dec));
}

/** True iff `body`'s topocentric direction is within `threshold` degrees of
 *  the topocentric direction encoded in `topoCurrentVector`. */
export function bodyTooCloseVector(
  jd: number,
  site: Site,
  threshold: number,
  body: Body,
  topoCurrentVector: Vector | null,
): boolean {
  const d = bodyAngularDistanceVector(jd, site, body, topoCurrentVector);
  return Number.isFinite(d) && d < threshold;
}

/** True iff `body`'s geocentric RA/Dec at `jd` is within `threshold` degrees
 *  of `(ra, dec)` (ra in hours, dec in degrees). */
export function bodyTooCloseRaDec(
  jd: number,
  threshold: number,
  body: Body,
  ra: number,
  dec: number,
): boolean {
  return bodyAngularDistanceRaDec(jd, body, ra, dec) < threshold;
}
