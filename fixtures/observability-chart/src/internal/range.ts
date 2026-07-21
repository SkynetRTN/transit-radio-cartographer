import type { ObservabilityRange } from '../types.js';

/** Default step size, mirrors the Angular component's lower bound (`jdmin`).
 *  ~0.16 s; safe minimum so we never emit pathological sub-sample steps. */
export const MIN_STEP_JD = 0.0000019;

/** Derive a step size from a range that didn't specify one. */
export function resolveStepJd(range: ObservabilityRange): number {
  if (range.stepJd && range.stepJd > 0) return range.stepJd;
  // Approximation of the Angular pipeline: stop-start in seconds * 1000 / 500000.
  // Equivalent to `(stop - start) * 2e-3` JD, but quantised at the millisecond
  // level to keep buckets stable across re-computes.
  const stepJdRaw = Math.floor((range.stopJd - range.startJd) * 1000) / 500000;
  return stepJdRaw < MIN_STEP_JD ? MIN_STEP_JD : stepJdRaw;
}

/** Number of complete `step`s that fit in `[start, stop)`. Rounds against
 *  FP accumulator drift — `[0, 1)` with step `1/24` returns 24, not 23 or 25. */
export function stepCount(range: ObservabilityRange, step: number): number {
  const span = range.stopJd - range.startJd;
  if (span <= 0 || step <= 0) return 0;
  return Math.max(0, Math.round(span / step));
}
