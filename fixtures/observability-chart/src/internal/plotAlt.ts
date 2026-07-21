/** Dispatch for alt-only "horizontal" targets — generates a synthetic RA so the
 *  target rides along the meridian at the requested altitude. Used when the
 *  position is `{ coordinateType: 'horizontal' }`, which only fixes alt. */

import { altDecToHa, last } from 'skynet-sdk/coords';
import type { Site } from 'skynet-sdk';
import type { ObservabilityConstraints, ObservabilityDataset, ObservabilityRange } from '../types.js';
import { ObservabilityDatasetBuilder } from './dataset.js';
import { resolveStepJd, stepCount } from './range.js';

export function plotAltObservability(
  targetAltitude: number,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
): ObservabilityDataset {
  const stepJd = resolveStepJd(range);
  const builder = new ObservabilityDatasetBuilder(site);
  const n = stepCount(range, stepJd);
  for (let i = 0; i < n; i++) {
    const jd = range.startJd + i * stepJd;
    const lst = last(site.longitudeDeg, jd);
    const ha = altDecToHa(targetAltitude, 0, site.latitudeDeg);
    const ra = lst - ha;
    builder.pushRaDecData(jd, site, ra, 0, constraints);
  }
  return builder.toDataset();
}
