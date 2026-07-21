import { describe, expect, it } from 'vitest';
import {
  Body,
  EquatorFromVector,
  GeoVector,
} from 'astronomy-engine';
import { jdToDatetime } from 'skynet-sdk/coords';
import { bodyAngularDistanceRaDec } from './proximity.js';

/** Geocentric RA (hours) / Dec (degrees) of the sun at a given JD. */
function sunRaDec(jd: number): { ra: number; dec: number } {
  const eq = EquatorFromVector(GeoVector(Body.Sun, jdToDatetime(jd), true));
  return { ra: eq.ra, dec: eq.dec };
}

describe('bodyAngularDistanceRaDec', () => {
  const JD = 2459580.5; // arbitrary fixed epoch

  it('returns ~0° for a target sitting on the sun', () => {
    const { ra, dec } = sunRaDec(JD);
    expect(bodyAngularDistanceRaDec(JD, Body.Sun, ra, dec)).toBeCloseTo(0, 3);
  });

  it('treats RA in hours (not degrees): a target 6h east of the sun is ~90° away', () => {
    // On the celestial equator a 6-hour RA offset is a quarter turn = 90°.
    // The pre-fix code fed RA-in-hours straight to a degrees-expecting haversine,
    // which collapsed this to ~6°. Pin it to ~90° to lock the unit conversion.
    const { ra } = sunRaDec(JD);
    const sep = bodyAngularDistanceRaDec(JD, Body.Sun, ra + 6, 0);
    // Sun isn't exactly on the equator, so allow a few degrees of slack.
    expect(sep).toBeGreaterThan(80);
    expect(sep).toBeLessThan(100);
  });

  it('does not falsely report a far target as close to the sun', () => {
    // Hercules cluster (M13): RA 16h41m41s ≈ 16.69h, Dec +36.46°. With the sun
    // near RA 5h in early June, M13 is far from the sun — a radio min-sun-
    // separation gate (typically tens of degrees) must NOT fire here.
    const sep = bodyAngularDistanceRaDec(JD, Body.Sun, 16.695, 36.46);
    expect(sep).toBeGreaterThan(30);
  });
});
