/** Dispatch for major solar-system bodies (planets, moon, sun). */

import {
  AstroTime,
  Body,
  GeoVector,
  Observer,
  ObserverVector,
  RotateVector,
  Rotation_EQJ_EQD,
  Vector,
} from 'astronomy-engine';
import { OBJECT_ID_TO_BODY } from '@skynet-rtn/sky-chart/math';
import { jdToDatetime } from 'skynet-sdk/coords';
import type { MajorSolarSystemObject, Site } from 'skynet-sdk';
import type { ObservabilityConstraints, ObservabilityDataset, ObservabilityRange } from '../types.js';
import { ObservabilityDatasetBuilder } from './dataset.js';
import { resolveStepJd, stepCount } from './range.js';

export function plotMajorSolarSystemObservability(
  majorSolarSystemObject: MajorSolarSystemObject,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
): ObservabilityDataset {
  const stepJd = resolveStepJd(range);
  const builder = new ObservabilityDatasetBuilder(site);
  const body = OBJECT_ID_TO_BODY[majorSolarSystemObject.name];
  if (body == null) {
    return builder.toDataset();
  }
  const observer = new Observer(site.latitudeDeg, site.longitudeDeg, site.elevationM);
  const n = stepCount(range, stepJd);
  for (let i = 0; i < n; i++) {
    const jd = range.startJd + i * stepJd;
    const time: Date = jdToDatetime(jd);
    const astroTime = new AstroTime(time);
    const observerVector = ObserverVector(time, observer, true);
    const j2000ToCurrent = Rotation_EQJ_EQD(time);
    const geoJ2000Vector = GeoVector(body, time, true);
    const geoCurrentVector = RotateVector(j2000ToCurrent, geoJ2000Vector);
    const topoCurrentVector = new Vector(
      geoCurrentVector.x - observerVector.x,
      geoCurrentVector.y - observerVector.y,
      geoCurrentVector.z - observerVector.z,
      astroTime,
    );
    builder.pushTopocentricVectorData(jd, site, topoCurrentVector, constraints, NaN, body === Body.Moon);
  }
  return builder.toDataset();
}
