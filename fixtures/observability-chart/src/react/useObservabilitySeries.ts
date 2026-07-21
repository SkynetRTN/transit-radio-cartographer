/** Headless hook that memoises `computeObservability(...)` against prop changes.
 *  Useful escape hatch for embedding observability data into a custom layout
 *  (table, summary tile, etc.) alongside or instead of the chart. */

import { useMemo } from 'react';
import { datetimeToJd } from 'skynet-sdk/coords';
import { computeObservability } from '../index.js';
import { resolveStepJd } from '../internal/range.js';
import type { ObservabilityConstraints, ObservabilityRange } from '../types.js';
import {
  DEFAULT_CONSTRAINTS,
  DEFAULT_DURATION_SECONDS,
  type ObservabilityChartProps,
  type UseObservabilitySeriesResult,
} from './types.js';

/** Memoised observability datasets for the given inputs. Recomputes only when
 *  one of the dataset-affecting props changes (sites, position, time window,
 *  constraints, catalog resolver). */
export function useObservabilitySeries(
  props: ObservabilityChartProps,
): UseObservabilitySeriesResult {
  const constraints = useMergedConstraints(props.constraints);
  const startMs = props.start ? props.start.getTime() : null;
  const duration = props.duration ?? DEFAULT_DURATION_SECONDS;

  return useMemo(() => {
    const start = startMs != null ? new Date(startMs) : new Date();
    const startJd = datetimeToJd(start);
    const stopJd = startJd + duration / 86400;
    const range: ObservabilityRange = props.stepJd
      ? { startJd, stopJd, stepJd: props.stepJd }
      : { startJd, stopJd };
    const stepJd = resolveStepJd(range);
    const datasets = computeObservability(
      props.position ?? null,
      props.sites,
      range,
      constraints,
      props.catalogLookup,
    );
    return { datasets, startJd, stopJd, stepJd, constraints };
  }, [
    props.position,
    props.sites,
    startMs,
    duration,
    props.stepJd,
    constraints,
    props.catalogLookup,
  ]);
}

function useMergedConstraints(
  override: Partial<ObservabilityConstraints> | undefined,
): ObservabilityConstraints {
  return useMemo(
    () => ({ ...DEFAULT_CONSTRAINTS, ...(override ?? {}) }),
    [
      override?.minTargetAltitude,
      override?.maxTargetAltitude,
      override?.maxSunAltitude,
      override?.minSunAltitude,
      override?.minMoonSeparationDeg,
      override?.minSunSeparationDeg,
      override?.maxSunSeparation,
      override?.minMoonPhaseFraction,
      override?.maxMoonPhaseFraction,
    ],
  );
}
