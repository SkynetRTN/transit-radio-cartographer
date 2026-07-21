/** Dispatch for fixed-equatorial (and pre-converted galactic) targets. */

import type { Site } from 'skynet-sdk';
import type { ObservabilityConstraints, ObservabilityDataset, ObservabilityRange } from '../types.js';
import { ObservabilityDatasetBuilder } from './dataset.js';
import { resolveStepJd, stepCount } from './range.js';

/** Plot one site's observability for a fixed RA/Dec target.
 *  @param ra   right ascension in **degrees** (SDK schema convention).
 *  @param dec  declination in degrees.
 */
export function plotRaDecObservability(
  ra: number,
  dec: number,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
): ObservabilityDataset {
  const stepJd = resolveStepJd(range);
  const builder = new ObservabilityDatasetBuilder(site);
  // raDecToAzEl takes RA in hours; SDK exposes RA in degrees. Convert here.
  const raHours = ra / 15;
  const n = stepCount(range, stepJd);
  for (let i = 0; i < n; i++) {
    const jd = range.startJd + i * stepJd;
    builder.pushRaDecData(jd, site, raHours, dec, constraints);
  }
  return builder.toDataset();
}
