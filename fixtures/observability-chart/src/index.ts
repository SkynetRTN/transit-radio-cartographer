/** Public surface for `@skynet-rtn/observability-chart`.
 *
 * The five `plot…Observability` functions are framework-agnostic dataset
 * producers; `computeObservability` dispatches on a SDK `Target.position` and
 * forwards to the appropriate producer for each site.
 */

import { galacticToRaDec } from 'skynet-sdk/coords';
import {
  isCatalogPosition,
  isEquatorialCoordinate,
  isFixedPosition,
  isGalacticCoordinate,
  isHorizontalCoordinate,
  isMajorSolarSystemObject,
  isMpcComet,
  isMpcOrbit,
  isNoradSatellite,
  type CatalogObject,
  type Position,
  type Site,
} from 'skynet-sdk';
import { plotAltObservability } from './internal/plotAlt.js';
import { plotMajorSolarSystemObservability } from './internal/plotMajor.js';
import { plotMpcObservability } from './internal/plotMpc.js';
import { plotRaDecObservability } from './internal/plotRaDec.js';
import { plotSatelliteObservability } from './internal/plotSatellite.js';
import type {
  ObservabilityConstraints,
  ObservabilityDataset,
  ObservabilityRange,
} from './types.js';

export type {
  ObservabilityConstraints,
  ObservabilityDataset,
  ObservabilityRange,
  ObservabilitySeries,
  ObservabilitySeriesKind,
  Site,
  SiteTelescopeChild,
  Lane,
  TimeBlock,
  TimeBlockKind,
} from './types.js';

export { plotAltObservability } from './internal/plotAlt.js';
export { plotMajorSolarSystemObservability } from './internal/plotMajor.js';
export { plotMpcObservability } from './internal/plotMpc.js';
export { plotRaDecObservability } from './internal/plotRaDec.js';
export { plotSatelliteObservability } from './internal/plotSatellite.js';
export { altToAirmass, ObservabilityDatasetBuilder } from './internal/dataset.js';

export {
  deriveLanes,
  requestTypeToKind,
} from './internal/timeblocks/index.js';
export type {
  DeriveLanesOptions,
  LaneMetaEntry,
} from './internal/timeblocks/index.js';

/** Resolver for catalog references on a `Target` — given the
 *  `catalogObjectId` recorded on a `CatalogPosition`, return the resolved
 *  `CatalogObject` (or `undefined` if not yet loaded).
 *
 *  Callers inject this so the core never depends on Angular's `PositionService`
 *  or any analogous React store. The website-react port will likely build a
 *  thin hook around its own catalog loader. */
export type CatalogLookup = (catalogObjectId: number) => CatalogObject | undefined;

/** Top-level entry: produce one `ObservabilityDataset` per site, dispatching on
 *  the supplied `Position`. The React port resolves `Target → Position` via
 *  the graph bundle (`graph.targetPositions[target.positionId]`) and passes
 *  the result in directly.
 *
 *  Returns `[]` when the inputs aren't actionable yet (missing position /
 *  missing sites). For an unresolved catalog reference, returns the alt(0)
 *  fallback per site (matches the Angular component's behaviour). */
export function computeObservability(
  position: Position | null | undefined,
  sites: ReadonlyArray<Site | undefined | null>,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
  catalogLookup?: CatalogLookup,
): ObservabilityDataset[] {
  if (!position || !sites || sites.length === 0) return [];
  const result: ObservabilityDataset[] = [];
  for (const site of sites) {
    if (!site) continue;
    const dataset = computeForSite(position, site, range, constraints, catalogLookup);
    if (dataset) result.push(dataset);
  }
  return result;
}

function computeForSite(
  position: Position,
  site: Site,
  range: ObservabilityRange,
  constraints: ObservabilityConstraints,
  catalogLookup: CatalogLookup | undefined,
): ObservabilityDataset | null {
  if (isFixedPosition(position)) {
    const coordinates = position.coordinates;
    if (!coordinates) return plotAltObservability(0, site, range, constraints);
    if (isEquatorialCoordinate(coordinates)) {
      return plotRaDecObservability(coordinates.raDeg, coordinates.decDeg, site, range, constraints);
    }
    if (isGalacticCoordinate(coordinates)) {
      const [raHours, dec] = galacticToRaDec(coordinates.lonDeg, coordinates.latDeg);
      // galacticToRaDec returns ra in hours; downstream wants degrees.
      return plotRaDecObservability(raHours * 15, dec, site, range, constraints);
    }
    if (isHorizontalCoordinate(coordinates)) {
      return plotAltObservability(coordinates.altDeg, site, range, constraints);
    }
    return plotAltObservability(0, site, range, constraints);
  }

  if (isCatalogPosition(position)) {
    const objectId = position.catalogObjectId;
    const object = objectId != null && catalogLookup ? catalogLookup(objectId) : undefined;
    if (!object) return plotAltObservability(0, site, range, constraints);
    if (isMajorSolarSystemObject(object)) {
      return plotMajorSolarSystemObservability(object, site, range, constraints);
    }
    if (isMpcComet(object) || isMpcOrbit(object)) {
      return plotMpcObservability(object, site, range, constraints);
    }
    if (isNoradSatellite(object)) {
      return plotSatelliteObservability(object, site, range, constraints);
    }
    return plotAltObservability(0, site, range, constraints);
  }

  return plotAltObservability(0, site, range, constraints);
}
