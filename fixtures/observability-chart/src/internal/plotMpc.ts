/** Dispatch for MPC comet / asteroid orbits. */

import {
  AstroTime,
  Observer,
  ObserverVector,
  RotateVector,
  Rotation_EQJ_EQD,
  Vector,
} from 'astronomy-engine';
import {
  geoVectorOfHelioBody,
  GM_SUN_PITJEVA_2005_KM3_S2,
  KeplerOrbit,
  mpcCometToKeplerOrbit,
  mpcOrbitToKeplerOrbit,
} from '@skynet-rtn/sky-chart/math';
import { jdToDatetime } from 'skynet-sdk/coords';
import type { MpcComet, MpcOrbit, Site } from 'skynet-sdk';
import type { ObservabilityConstraints, ObservabilityDataset, ObservabilityRange } from '../types.js';
import { ObservabilityDatasetBuilder } from './dataset.js';
import { resolveStepJd, stepCount } from './range.js';

export function plotMpcObservability(
  mpcObject: MpcComet | MpcOrbit,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
): ObservabilityDataset {
  const stepJd = resolveStepJd(range);
  const builder = new ObservabilityDatasetBuilder(site);
  const observer = new Observer(site.latitudeDeg, site.longitudeDeg, site.elevationM);
  let keplerOrbit: KeplerOrbit | undefined;
  if (mpcObject.catalogObjectType === 'mpc_comet') {
    keplerOrbit = mpcCometToKeplerOrbit(mpcObject, GM_SUN_PITJEVA_2005_KM3_S2);
  } else if (mpcObject.catalogObjectType === 'mpc_orbit') {
    keplerOrbit = mpcOrbitToKeplerOrbit(mpcObject, GM_SUN_PITJEVA_2005_KM3_S2);
  }
  if (!keplerOrbit) {
    return builder.toDataset();
  }
  const n = stepCount(range, stepJd);
  for (let i = 0; i < n; i++) {
    const jd = range.startJd + i * stepJd;
    const time: Date = jdToDatetime(jd);
    const astroTime = new AstroTime(time);
    const observerVector = ObserverVector(time, observer, true);
    const j2000ToCurrent = Rotation_EQJ_EQD(time);
    const j2000Vector = geoVectorOfHelioBody(keplerOrbit, astroTime);
    const currentVector = RotateVector(j2000ToCurrent, j2000Vector);
    const topoCurrentVector = new Vector(
      currentVector.x - observerVector.x,
      currentVector.y - observerVector.y,
      currentVector.z - observerVector.z,
      astroTime,
    );
    builder.pushTopocentricVectorData(jd, site, topoCurrentVector, constraints);
  }
  return builder.toDataset();
}
