/** Opt-in companion toolbar for `<ObservabilityChart>`. Renders the
 *  controls the plan calls out in §4.3 — Now button, preset durations,
 *  step-by-half-window buttons, date picker, and the UTC ↔ hours-from-now
 *  x-axis label mode toggle.
 *
 *  Slot-free and unopinionated about wrapper layout. Consumers compose the
 *  toolbar above/beside the chart and pipe `value` / `onChange` through. */

import { useEffect, useId, useState, type CSSProperties } from 'react';
import type { ObservabilityWindow } from './useControllableWindow.js';
import { DEFAULT_DURATION_SECONDS, type XAxisLabelMode } from './types.js';

/** Tolerance (ms) for treating the window's start as "now". Matches the
 *  relative-mode tick formatter, which prints `now` when |hours| < 1/60. */
const NOW_TOLERANCE_MS = 60_000;

export interface DurationPreset {
  /** Display label, e.g. `'24h'`. */
  label: string;
  /** Duration in seconds. */
  seconds: number;
}

/** Default preset durations. Astronomy-flavoured: a couple of intra-night
 *  sizes, one full night, two-night, and a week for trip planning. */
export const DEFAULT_DURATION_PRESETS: ReadonlyArray<DurationPreset> = [
  { label: '1h', seconds: 3_600 },
  { label: '6h', seconds: 21_600 },
  { label: '12h', seconds: 43_200 },
  { label: '24h', seconds: 86_400 },
  { label: '48h', seconds: 172_800 },
  { label: '7d', seconds: 604_800 },
];

/** Gantt-source toggle values. The chart itself is data-agnostic — the
 *  consumer owns the `ganttSource` state and passes the right `blocks` to
 *  the Gantt child. The toolbar only flips the visual indicator. */
export type GanttSourceValue = 'observability-window' | 'tasks';

export interface ObservabilityChartToolbarProps {
  /** Current visible window. Drive this from the same `useState` that the
   *  chart's `start` / `duration` props read from. */
  value: ObservabilityWindow;
  /** Emitted on any of: Now click, preset change, step click, date pick. */
  onChange: (window: ObservabilityWindow) => void;
  /** Preset duration buttons. Defaults to `DEFAULT_DURATION_PRESETS`.
   *  Pass `[]` to hide the segmented control entirely. */
  presets?: ReadonlyArray<DurationPreset>;
  /** Current x-axis label mode. When omitted, the toggle is hidden. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Fires when the user flips the UTC ↔ relative toggle. */
  onXAxisLabelModeChange?: (mode: XAxisLabelMode) => void;
  /** Current Gantt source (used by `<ObservabilityChartDuo>`). When this
   *  *and* `onGanttSourceChange` are both passed, an "obs window | tasks"
   *  segmented control is rendered. */
  ganttSource?: GanttSourceValue;
  onGanttSourceChange?: (source: GanttSourceValue) => void;
  /** Whether unobservable (red) windows are hidden on the observability-window
   *  Gantt. When this *and* `onHideUnobservableChange` are both passed, a
   *  toggle button is rendered (off by default → both states shown). Pair it
   *  with the `observability-window` source — it's a no-op on the tasks
   *  source. */
  hideUnobservable?: boolean;
  onHideUnobservableChange?: (hide: boolean) => void;
  /** Outer wrapper class. */
  className?: string;
  /** Outer wrapper inline style. */
  style?: CSSProperties;
}

export function ObservabilityChartToolbar(props: ObservabilityChartToolbarProps) {
  const presets = props.presets ?? DEFAULT_DURATION_PRESETS;
  const { value, onChange } = props;
  const datePickerId = useId();

  const handleNow = () => {
    onChange({ start: new Date(), duration: value.duration });
  };

  const handlePresetSelect = (seconds: number) => {
    onChange({ start: value.start, duration: seconds });
  };

  const handleStep = (direction: -1 | 1) => {
    const stepMs = (value.duration * 1000) / 2;
    onChange({
      start: new Date(value.start.getTime() + direction * stepMs),
      duration: value.duration,
    });
  };

  const handleDatePick = (isoYmd: string) => {
    if (!isoYmd) return;
    // `<input type="date">` emits `YYYY-MM-DD` in the browser-local calendar.
    // Anchoring on local midnight matches the planner's "show me the night of
    // this date" expectation.
    const [y, m, d] = isoYmd.split('-').map((s) => Number(s));
    if (!y || !m || !d) return;
    const newStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    onChange({ start: newStart, duration: value.duration });
  };

  const presetMatch = presets.find((p) => p.seconds === value.duration);
  const dateValue = toLocalYmd(value.start);
  const nowMs = useTickingNow();
  const isNow = Math.abs(value.start.getTime() - nowMs) < NOW_TOLERANCE_MS;

  return (
    <div
      className={[
        'inline-flex flex-wrap items-center gap-2',
        'rounded border border-surface-200 bg-surface-50 p-2',
        'dark:border-surface-700 dark:bg-surface-900',
        props.className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={props.style}
      role="toolbar"
      aria-label="Observability chart controls"
    >
      <button
        type="button"
        onClick={handleNow}
        aria-pressed={isNow}
        className={`rounded border px-3 py-1 text-xs font-medium transition ${
          isNow
            ? 'border-transparent bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
            : 'border-surface-300 bg-surface-100 hover:bg-surface-200 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700'
        }`}
        title="Recenter on the current time, preserving the window length"
      >
        Now
      </button>

      <div className="inline-flex items-center" role="group" aria-label="Step window">
        <button
          type="button"
          onClick={() => handleStep(-1)}
          className="rounded-l border border-surface-300 bg-surface-100 px-2 py-1 text-xs font-medium transition hover:bg-surface-200 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700"
          title="Step back by half the window"
          aria-label="Step back"
        >
          <i className="fa-solid fa-backward-step" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => handleStep(1)}
          className="-ml-px rounded-r border border-surface-300 bg-surface-100 px-2 py-1 text-xs font-medium transition hover:bg-surface-200 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700"
          title="Step forward by half the window"
          aria-label="Step forward"
        >
          <i className="fa-solid fa-forward-step" aria-hidden />
        </button>
      </div>

      {presets.length > 0 && (
        <div
          className="inline-flex overflow-hidden rounded border border-surface-300 dark:border-surface-600"
          role="group"
          aria-label="Window size"
        >
          {presets.map((preset) => {
            const active = preset === presetMatch;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset.seconds)}
                aria-pressed={active}
                className={`px-2.5 py-1 text-xs font-medium transition border-l border-surface-300 first:border-l-0 dark:border-surface-600 ${
                  active
                    ? 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
                    : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}

      <label
        htmlFor={datePickerId}
        className="inline-flex items-center gap-1.5 text-xs"
        title="Jump the start to local midnight on the chosen day"
      >
        <span className="opacity-70">Date</span>
        <input
          id={datePickerId}
          type="date"
          value={dateValue}
          onChange={(e) => handleDatePick(e.target.value)}
          className="rounded border border-surface-300 bg-surface-100 px-2 py-0.5 text-xs dark:border-surface-600 dark:bg-surface-800"
        />
      </label>

      {props.xAxisLabelMode !== undefined && props.onXAxisLabelModeChange && (
        <div
          className="inline-flex overflow-hidden rounded border border-surface-300 dark:border-surface-600"
          role="group"
          aria-label="X-axis label mode"
        >
          {(['relative', 'utc'] as const).map((mode) => {
            const active = props.xAxisLabelMode === mode;
            const label = mode === 'utc' ? 'UTC' : 'relative';
            const title =
              mode === 'utc'
                ? 'Show absolute UTC time on the x-axis'
                : 'Show offsets from now (e.g. +2h) on the x-axis';
            return (
              <button
                key={mode}
                type="button"
                onClick={() => props.onXAxisLabelModeChange!(mode)}
                aria-pressed={active}
                title={title}
                className={`px-2.5 py-1 text-xs font-medium transition border-l border-surface-300 first:border-l-0 dark:border-surface-600 ${
                  active
                    ? 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
                    : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {props.ganttSource !== undefined && props.onGanttSourceChange && (
        <div
          className="inline-flex overflow-hidden rounded border border-surface-300 dark:border-surface-600"
          role="group"
          aria-label="Gantt data source"
        >
          {(['observability-window', 'tasks'] as const).map((source) => {
            const active = props.ganttSource === source;
            const label = source === 'tasks' ? 'tasks' : 'obs window';
            const title =
              source === 'tasks'
                ? 'Show scheduled tasks on the Gantt panel'
                : 'Show server-computed observability windows on the Gantt panel';
            return (
              <button
                key={source}
                type="button"
                onClick={() => props.onGanttSourceChange!(source)}
                aria-pressed={active}
                title={title}
                className={`px-2.5 py-1 text-xs font-medium transition border-l border-surface-300 first:border-l-0 dark:border-surface-600 ${
                  active
                    ? 'bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
                    : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-800 dark:hover:bg-surface-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      {props.hideUnobservable !== undefined && props.onHideUnobservableChange && (
        <button
          type="button"
          onClick={() => props.onHideUnobservableChange!(!props.hideUnobservable)}
          aria-pressed={props.hideUnobservable}
          title="Hide observability windows where the target can't be observed (red bars)"
          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition ${
            props.hideUnobservable
              ? 'border-transparent bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700'
              : 'border-surface-300 bg-surface-100 hover:bg-surface-200 dark:border-surface-600 dark:bg-surface-800 dark:hover:bg-surface-700'
          }`}
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: '#d27b72' }}
          />
          Hide unobservable
        </button>
      )}
    </div>
  );
}

/** `Date.now()` that re-renders on a coarse interval, so the "Now" button's
 *  highlight state decays as the window's start ages relative to wall-clock. */
function useTickingNow(): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), NOW_TOLERANCE_MS);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** `Date` → `YYYY-MM-DD` in the browser-local calendar. Suitable for an
 *  `<input type="date">` `value`. */
function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export { DEFAULT_DURATION_SECONDS };
