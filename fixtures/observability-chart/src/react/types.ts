/** React adapter types — prop shape, event payloads, and the colour palette. */

import type { CSSProperties } from 'react';
import type { PlotMouseEvent, PlotRelayoutEvent } from 'plotly.js';
import type { Position } from 'skynet-sdk';
import type { Site } from '../types.js';
import type { CatalogLookup } from '../index.js';
import type {
  ObservabilityConstraints,
  ObservabilityDataset,
  ObservabilitySeriesKind,
} from '../types.js';
import type { ObservabilityWindow } from './useControllableWindow.js';

/** Click payload — the raw Plotly event plus a decoded `{site, kind, date, …}`
 *  so consumers don't have to re-derive these from the trace metadata. */
export interface ObservabilityClickEvent {
  /** Raw Plotly mouse event (use `raw.event` for the DOM `MouseEvent`). */
  raw: PlotMouseEvent;
  /** The site this point belongs to. */
  site: Site;
  /** Which observability bucket the point falls into. */
  kind: ObservabilitySeriesKind;
  /** Wall-clock time of the sample. */
  date: Date;
  /** Altitude in degrees. */
  altitude: number;
  /** Airmass (sec z) at the sample. `NaN` for gapped points (shouldn't fire). */
  airmass: number;
}

/** X-axis tick label mode.
 *  - `utc` — absolute UTC wall-clock time.
 *  - `relative` — hours-from-now (`+2h`, `-30m`, `now`); reference re-ticks
 *    every minute so labels stay current as wall-clock time drifts.
 *  - `relative-to-start` — same `+Nh` formatting as `'relative'`, but the
 *    reference point is the controlled `start` prop instead of wall-clock
 *    now. Use this when the chart is anchored to a separate clock (e.g. a
 *    sky-chart's current time) and the labels should read as offsets from
 *    that anchor, not from real time.
 *
 *  In all three modes the underlying x-data is `Date[]` — only the tick
 *  labels (and the hover template's time line) change. */
export type XAxisLabelMode = 'utc' | 'relative' | 'relative-to-start';

/** Chart colour theme. `light` / `dark` pin the palette; `auto` (default)
 *  reads the `dark` class on `<html>` and re-renders when it changes — this
 *  is what the website-react `ThemeProvider` toggles, so the chart tracks the
 *  app's theme without explicit wiring. Plotly is canvas-based so it doesn't
 *  pick up CSS `.dark` rules on its own; the adapter threads theme colours
 *  through Plotly's `paper_bgcolor` / `plot_bgcolor` / `font` / axis fields. */
export type ChartTheme = 'light' | 'dark' | 'auto';

/** Concrete theme after `'auto'` is resolved against the DOM. Passed to the
 *  framework-agnostic adapter helpers. */
export type ResolvedChartTheme = 'light' | 'dark';

export interface ObservabilityChartProps {
  /** The resolved position to plot. `null`/`undefined` renders an empty chart. */
  position: Position | null | undefined;
  /** Sites to plot. Falsy entries are skipped. One trace-set per site. */
  sites: ReadonlyArray<Site | null | undefined>;
  /** Controlled inclusive window start. When omitted, the chart manages it
   *  internally (defaulting to mount time). Pair with `onWindowChange` to
   *  drive the window from outside. */
  start?: Date;
  /** Controlled window length in seconds. When omitted, the chart manages it
   *  internally (defaulting to 24 h). Pair with `onWindowChange` to drive the
   *  window from outside. */
  duration?: number;
  /** Fires when the user pans / zooms the chart, *or* when the window is
   *  changed via the imperative ref. Translated from Plotly's `xaxis.range`
   *  payload — pair with `start` / `duration` to make the chart fully
   *  controlled. */
  onWindowChange?: (window: ObservabilityWindow) => void;
  /** Override any of the observability constraints. Defaults gate target
   *  altitude (≥30°) and sun altitude (≤-18° / nautical twilight) while
   *  leaving the rest disabled at permissive sentinels — see
   *  `DEFAULT_CONSTRAINTS` for the full list. */
  constraints?: Partial<ObservabilityConstraints>;
  /** Step size in Julian days. When omitted, derived from the duration. */
  stepJd?: number;
  /** Resolver for catalog references. Required when `position` is a
   *  `CatalogPosition`; otherwise unused. */
  catalogLookup?: CatalogLookup;
  /** Controls the x-axis tick label and hover format.
   *  - `'relative'` (default): hours from now, e.g. `+2h` / `-30m` / `now`.
   *  - `'utc'`: absolute UTC, e.g. `05-19 18:30`. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Colour theme. Defaults to `'auto'`, which follows the `dark` class on
   *  `<html>` (the website-react `ThemeProvider` convention). Pass `'light'`
   *  or `'dark'` to pin the theme regardless of DOM state. */
  theme?: ChartTheme;
  /** Fires when the user clicks a chart point. */
  onPointClick?: (event: ObservabilityClickEvent) => void;
  /** Fires when the user pans / zooms — forwarded verbatim from Plotly.
   *  Most callers want `onWindowChange` instead; this stays for callers that
   *  need the full Plotly payload (e.g. autoscale events). */
  onRelayout?: (event: PlotRelayoutEvent) => void;
  /** Outer container class. */
  className?: string;
  /** Outer container inline styles. The chart fills the container, so a height
   *  is usually wanted here (e.g. `{ height: 360 }`). */
  style?: CSSProperties;
  hiddenSites?: ReadonlyArray<number | string>;
  legendMode?: 'plotly' | 'none';
  /** When `false`, disables pan / zoom / drag on both axes. The chart still
   *  responds to controlled `start` / `duration` props (so the host can drive
   *  the window from outside), but the user can't pan or zoom by dragging.
   *  Defaults to `true`. */
  interactive?: boolean;
  /** Override the x-axis title text. When omitted, the chart picks a default
   *  matching the `xAxisLabelMode` (`'time (UTC)'` for `utc`, `'hours from
   *  now'` for `relative`). */
  xAxisTitle?: string;
  /** Hide the x-axis (tick labels, ticks, title) and zero the bottom margin
   *  so this chart can stack flush against a sibling that owns the shared
   *  x-axis. Used by `<ObservabilityChartDuo>` on the top panel. */
  xAxisHidden?: boolean;
  /** Lock the left/right paper margins to exact pixel values so a sibling
   *  chart can match them column-perfect. `null` (the default) falls back to
   *  Plotly's `automargin`. */
  fixedHorizontalMargins?: { left: number; right: number } | null;
}

/** Imperative escape hatch — exposed via `forwardRef`. Useful for callers
 *  that don't have a convenient place to lift window state (deep popovers,
 *  legacy consumers). All methods funnel through the same controlled-state
 *  path that `onWindowChange` uses, so observers see one consistent event. */
export interface ObservabilityChartHandle {
  /** Recenter on `new Date()`, preserving the current `duration`. */
  resetToNow(): void;
  /** Set the visible window. `durationSeconds` defaults to current. */
  setWindow(start: Date, durationSeconds?: number): void;
  /** Read the current visible window (post-pan/zoom). */
  getWindow(): ObservabilityWindow;
}

/** What `useObservabilitySeries` returns. Useful for embedding the same data into
 *  a custom layout (table view, alt-tonight summary, etc.) alongside the chart. */
export interface UseObservabilitySeriesResult {
  datasets: ObservabilityDataset[];
  /** Window start as Julian day (resolved from `start` / now). */
  startJd: number;
  /** Window stop as Julian day. */
  stopJd: number;
  /** Effective step size in Julian days. */
  stepJd: number;
  /** Resolved constraints (defaults applied). */
  constraints: ObservabilityConstraints;
}

/** Default constraints. The two active gates (`minTargetAltitude`,
 *  `maxSunAltitude`) match the Angular component's initial Inputs; the
 *  remaining axes are pinned to permissive sentinels (full hemisphere /
 *  full phase / full separation range) so an unsupplied constraint is a
 *  no-op rather than a hard filter. */
export const DEFAULT_CONSTRAINTS: ObservabilityConstraints = {
  minTargetAltitude: 30,
  maxTargetAltitude: 90,
  maxSunAltitude: -18,
  minSunAltitude: -90,
  minMoonSeparationDeg: 0,
  minSunSeparationDeg: 0,
  maxSunSeparation: 180,
  minMoonPhaseFraction: 0,
  maxMoonPhaseFraction: 1,
};

/** Default 24-hour window. */
export const DEFAULT_DURATION_SECONDS = 86400;

/** Default x-axis label mode (`'relative'`). Hours-from-now reads more
 *  naturally for planning the current night than absolute UTC. */
export const DEFAULT_X_AXIS_LABEL_MODE: XAxisLabelMode = 'relative';

/** Default chart theme (`'auto'`). Picks up the `dark` class on `<html>` so
 *  the chart matches the app's resolved theme by default. */
export const DEFAULT_CHART_THEME: ChartTheme = 'auto';

/** Plotly's default qualitative palette. Sites are cycled through these in
 *  index order. Long site lists wrap. */
export const PLOTLY_DEFAULT_COLORS: readonly string[] = [
  '#1f77b4', // muted blue
  '#ff7f0e', // safety orange
  '#2ca02c', // cooked asparagus green
  '#d62728', // brick red
  '#9467bd', // muted purple
  '#8c564b', // chestnut brown
  '#e377c2', // raspberry yogurt pink
  '#7f7f7f', // middle gray
  '#bcbd22', // curry yellow-green
  '#17becf', // blue-teal
];
