/** Controlled / uncontrolled state for the chart's visible time window.
 *
 *  Mirrors the React `<input value={…} defaultValue={…}>` pattern but for the
 *  two-prop `(start, duration)` pair. Either or both can be controlled
 *  independently — passing `start` but omitting `duration` is a valid mixed
 *  mode that pins the start but lets the user resize via Plotly pan/zoom or
 *  the toolbar.
 *
 *  Uncontrolled defaults are captured once (in `useState` initializers) so a
 *  re-render doesn't drift the chart's "now". */

import { useCallback, useRef, useState } from 'react';

export interface ObservabilityWindow {
  start: Date;
  duration: number;
}

export interface UseControllableWindowOptions {
  /** Controlled start. When omitted the hook owns the value. */
  start: Date | undefined;
  /** Controlled duration in seconds. When omitted the hook owns the value. */
  duration: number | undefined;
  /** Uncontrolled fallback duration (seconds). */
  defaultDuration: number;
  /** Fires on every internal update — covers both Plotly pan/zoom and
   *  toolbar/imperative updates. */
  onChange?: ((window: ObservabilityWindow) => void) | undefined;
}

export interface ControllableWindow extends ObservabilityWindow {
  /** Push a new window. In uncontrolled mode also updates internal state. */
  setWindow: (next: ObservabilityWindow) => void;
  /** True iff the parent has pinned `start` (controlled). */
  isStartControlled: boolean;
  /** True iff the parent has pinned `duration` (controlled). */
  isDurationControlled: boolean;
}

export function useControllableWindow(
  opts: UseControllableWindowOptions,
): ControllableWindow {
  const isStartControlled = opts.start !== undefined;
  const isDurationControlled = opts.duration !== undefined;

  const [internalStart, setInternalStart] = useState<Date>(() => new Date());
  const [internalDuration, setInternalDuration] = useState<number>(
    () => opts.defaultDuration,
  );

  const start = isStartControlled ? opts.start! : internalStart;
  const duration = isDurationControlled ? opts.duration! : internalDuration;

  // Keep latest onChange in a ref so `setWindow`'s identity stays stable.
  const onChangeRef = useRef(opts.onChange);
  onChangeRef.current = opts.onChange;

  const setWindow = useCallback(
    (next: ObservabilityWindow) => {
      if (!isStartControlled) setInternalStart(next.start);
      if (!isDurationControlled) setInternalDuration(next.duration);
      onChangeRef.current?.(next);
    },
    [isStartControlled, isDurationControlled],
  );

  return { start, duration, setWindow, isStartControlled, isDurationControlled };
}
