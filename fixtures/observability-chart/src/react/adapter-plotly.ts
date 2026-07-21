/** Plotly-specific rendering glue. Turns an `ObservabilityDataset[]` into the
 *  `data` + `layout` props that `<Plot>` expects, plus the dual-y-axis trick
 *  (altitude on the left, airmass on a co-scaled right axis) and the shaded
 *  rect for `minTargetAltitude` from the Angular component.
 *
 *  All Plotly-specific logic lives here. Swapping plotting libraries later is
 *  a single-file change. */

import type {
  Dash,
  Data,
  Layout,
  LayoutAxis,
  PlotData,
  PlotMouseEvent,
  PlotRelayoutEvent,
  Shape,
} from 'plotly.js';
import { jdToDatetime } from 'skynet-sdk/coords';
import type { ObservabilityDataset, ObservabilitySeriesKind } from '../types.js';
import {
  PLOTLY_DEFAULT_COLORS,
  type ResolvedChartTheme,
  type XAxisLabelMode,
} from './types.js';
import type { ObservabilityWindow } from './useControllableWindow.js';

/** Theme palette for the chart. Driven by `BuildLayoutOptions.theme`; defaults
 *  to a Plotly-default-ish light palette so callers that don't opt into theming
 *  get the historical look. */
interface ThemePalette {
  paperBg: string;
  plotBg: string;
  font: string;
  axis: string;
  axisTitle: string;
  grid: string;
  zeroLine: string;
  legendBg: string;
  legendBorder: string;
  /** Fill for the shaded `minTargetAltitude` rect at the bottom of the chart. */
  minAltFill: string;
  /** Opacity for the shaded `minTargetAltitude` rect. */
  minAltOpacity: number;
}

const LIGHT_THEME: ThemePalette = {
  // Plotly's defaults are white/white/black; we set them explicitly so the
  // `revision` bump that flips themes always sees a layout change.
  paperBg: '#ffffff',
  plotBg: '#ffffff',
  font: '#1f2937', // slate-800
  axis: '#1f2937',
  axisTitle: '#1f2937',
  grid: '#e5e7eb', // slate-200
  zeroLine: '#d1d5db', // slate-300
  legendBg: 'rgba(255,255,255,0.85)',
  legendBorder: '#e5e7eb',
  minAltFill: '#d3d3d3',
  minAltOpacity: 0.4,
};

const DARK_THEME: ThemePalette = {
  // Matches the toolbar's `dark:bg-surface-900` / `dark:border-surface-700`
  // tailwind classes so chart + toolbar read as one surface.
  paperBg: '#18181b', // zinc-900
  plotBg: '#27272a', // zinc-800
  font: '#e5e7eb', // gray-200
  axis: '#a1a1aa', // zinc-400
  axisTitle: '#e5e7eb',
  grid: '#3f3f46', // zinc-700
  zeroLine: '#52525b', // zinc-600
  legendBg: 'rgba(24,24,27,0.85)',
  legendBorder: '#3f3f46',
  // Darker tint for the unobservable-region overlay; the light-mode #d3d3d3
  // disappears on a dark plot background.
  minAltFill: '#000000',
  minAltOpacity: 0.35,
};

function paletteFor(theme: ResolvedChartTheme): ThemePalette {
  return theme === 'dark' ? DARK_THEME : LIGHT_THEME;
}

interface KindStyle {
  dash?: Dash;
  faded: boolean;
  label: string;
}

interface TraceMeta {
  kind: ObservabilitySeriesKind;
  siteSlug: string;
  siteId: number | null;
}

/** `'relative'` and `'relative-to-start'` differ only in what `nowMs`
 *  reference the caller passes in — the plotly-side formatting (hover
 *  template, customdata offsets, tick labels) is identical. Collapsing
 *  to this predicate keeps the rendering code mode-agnostic. */
function isRelativeMode(mode: XAxisLabelMode): boolean {
  return mode === 'relative' || mode === 'relative-to-start';
}

/** Per-kind rendering knobs. `visible` shows the legend entry for each site;
 *  the other sub-series share the visible's `legendgroup`, so toggling the
 *  site in the legend hides all of them at once.
 *
 *  Dash patterns are grouped by constraint family for accessibility — a
 *  colour-blind viewer can still distinguish *why* a target dropped out:
 *    • elevation gates  → `longdash`
 *    • sun-related      → `dash`
 *    • moon-related     → `dot`
 *    • earth shadow     → `dashdot` */
const KIND_STYLE: Record<ObservabilitySeriesKind, KindStyle> = {
  visible: { faded: false, label: '' },
  minElevationDeg: { dash: 'longdash', faded: true, label: 'below min elevation' },
  maxElevationDeg: { dash: 'longdash', faded: true, label: 'above max elevation' },
  sunElevation: { dash: 'dash', faded: true, label: 'sun too high' },
  minSunElevationDeg: { dash: 'dash', faded: true, label: 'sun too low' },
  sunSeparation: { dash: 'dash', faded: true, label: 'sun too close' },
  maxSunSeparation: { dash: 'dash', faded: true, label: 'sun too far' },
  moon: { dash: 'dot', faded: true, label: 'moon too close' },
  moonPhase: { dash: 'dot', faded: true, label: 'moon phase out of range' },
  earth: { dash: 'dashdot', faded: true, label: 'in shadow' },
};

/** Iteration order; also the order in which Plotly stacks traces. */
const KINDS: readonly ObservabilitySeriesKind[] = [
  'visible',
  'minElevationDeg',
  'maxElevationDeg',
  'sunElevation',
  'minSunElevationDeg',
  'sunSeparation',
  'maxSunSeparation',
  'moon',
  'moonPhase',
  'earth',
];

/** Opacity for non-`visible` sub-series — matches the Angular component. */
const SUB_SERIES_OPACITY = 0.3;

export interface DatasetsToPlotDataOptions {
  hiddenSites?: ReadonlyArray<number | string>;
  /** Selects the hover-template time formatting and (when `'relative'`)
   *  populates `customdata` with offset-from-now strings per point. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Required when `xAxisLabelMode === 'relative'`. Used to compute the
   *  `customdata` offsets stamped on each point. */
  nowMs?: number;
}

/** Marshal datasets into Plotly trace data. One dataset → five traces, one
 *  per kind. Sites cycle through `PLOTLY_DEFAULT_COLORS`. A trailing invisible
 *  anchor trace bound to `yaxis: 'y2'` is appended so Plotly actually realizes
 *  the overlaying airmass axis — an unreferenced overlaying axis renders as
 *  empty space. */
export function datasetsToPlotData(
  datasets: ReadonlyArray<ObservabilityDataset>,
  opts: DatasetsToPlotDataOptions = {},
): Data[] {
  const mode = opts.xAxisLabelMode ?? 'utc';
  const nowMs = opts.nowMs ?? Date.now();
  const out: Data[] = [];
  const hidden = new Set((opts.hiddenSites ?? []).map(String));
  datasets.forEach((dataset, siteIdx) => {
    const color = PLOTLY_DEFAULT_COLORS[siteIdx % PLOTLY_DEFAULT_COLORS.length]!;
    for (const kind of KINDS) {
      out.push(seriesToTrace(dataset, kind, color, mode, nowMs, hidden));
    }
  });
  out.push(yaxis2AnchorTrace(datasets));
  return out;
}

/** Single-point invisible trace whose only job is to attach to `yaxis: 'y2'`
 *  so Plotly draws the airmass axis on the right. `mode: 'none'` means no
 *  visual element is drawn (no markers, no line), so it can't capture pointer
 *  events or perturb the pan/hover behavior — yet the trace still references
 *  yaxis2, which is what realizes the overlaying axis. */
function yaxis2AnchorTrace(
  datasets: ReadonlyArray<ObservabilityDataset>,
): Partial<PlotData> {
  const anchorX = datasets[0]?.series.visible.xs[0] ?? new Date(0);
  return {
    type: 'scatter',
    mode: 'none',
    x: [anchorX],
    y: [0],
    xaxis: 'x',
    yaxis: 'y2',
    showlegend: false,
    hoverinfo: 'skip',
  };
}

function seriesToTrace(
  dataset: ObservabilityDataset,
  kind: ObservabilitySeriesKind,
  color: string,
  mode: XAxisLabelMode,
  nowMs: number,
  hidden: Set<string>,
): Partial<PlotData> {
  const style = KIND_STYLE[kind];
  const series = dataset.series[kind];
  const text = series.airmass.map((a) => (Number.isFinite(a) ? a.toFixed(2) : ''));
  const line: { color: string; dash?: Dash } = { color };
  if (style.dash) line.dash = style.dash;
  // `meta` is accepted by Plotly at runtime as a passthrough for arbitrary
  // per-trace data and is read back in click handlers via `point.data.meta`.
  // `@types/plotly.js` doesn't expose it on `PlotData`, so we stamp it via
  // an explicit cast — kept type-safe through `TraceMeta` on the read side.
  const meta: TraceMeta = {
    kind,
    siteSlug: dataset.site.slug,
    siteId: dataset.site.id ?? null,
  };
  const trace: Partial<PlotData> & { meta: TraceMeta } = {
    name: dataset.site.slug,
    x: series.xs,
    y: series.ys,
    text,
    type: 'scatter',
    mode: 'lines',
    line,
    legendgroup: legendGroupFor(dataset),
    showlegend: kind === 'visible',
    hovertemplate: buildHoverTemplate(style.label, mode),
    meta,
  };
  if (isRelativeMode(mode)) {
    trace.customdata = series.xs.map((d) =>
      formatRelativeFromNowMs(d.getTime() - nowMs),
    ) as unknown as PlotData['customdata'];
  }
  if (style.faded) trace.opacity = SUB_SERIES_OPACITY;
  const key = siteIdentity(dataset);
  if (hidden.has(key)) trace.visible = 'legendonly';
  return trace;
}

function legendGroupFor(dataset: ObservabilityDataset): string {
  return siteIdentity(dataset);
}

/** Stable identity for hidden-state and legend grouping. Mirrors the legend
 *  tree's `siteKey()` — prefers `site.key` (set by grouping callers) so
 *  cross-table id collisions don't collapse into one trace. */
function siteIdentity(dataset: ObservabilityDataset): string {
  const site = dataset.site;
  if (site.key) return site.key;
  return site.id != null ? String(site.id) : site.slug;
}

function buildHoverTemplate(label: string, mode: XAxisLabelMode): string {
  const head = label ? `<b>%{data.name}</b>: <i>${label}</i>` : '<b>%{data.name}</b>';
  // `utc` reads the date directly from `%{x}`; the relative modes read the
  // precomputed offset string from `%{customdata}` (stamped per point in
  // `seriesToTrace`).
  const timeLine = isRelativeMode(mode)
    ? '<br><i>Time</i>: %{customdata}'
    : '<br><i>Time</i>: %{x|%m-%d %H:%M} ';
  return (
    head +
    timeLine +
    '<br><i>Elevation</i>: %{y:.0f}° ' +
    '<br><i>Air mass</i>: %{text}' +
    '<extra></extra>'
  );
}

export interface BuildLayoutOptions {
  startJd: number;
  stopJd: number;
  /** Drawn as a shaded rect from `y=minTargetAltitude` down to the bottom of
   *  the chart. Visual cue for "anything in here is unobservable". */
  minTargetAltitude: number;
  /** Drawn as a shaded rect from `y=maxTargetAltitude` up to the top of the
   *  chart, mirroring the min-altitude band. Omitted (no rect drawn) when
   *  the gate is inactive — anything ≥ 90° is treated as "no upper gate"
   *  since the chart's y-axis caps at 90.5°. */
  maxTargetAltitude?: number;
  /** X-axis label mode. Defaults to `'utc'`. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Reference "now" for relative-mode tick labels. Ignored in `'utc'` mode.
   *  Defaults to `Date.now()`. */
  nowMs?: number;
  /** Resolved chart theme. Drives paper / plot background, font colour, grid
   *  lines, and the shaded unobservable-region overlay. Defaults to `'light'`. */
  theme?: ResolvedChartTheme;
  legendMode?: 'plotly' | 'none';
  /** When `false`, locks `dragmode` and `xaxis.fixedrange` so the user can't
   *  pan or zoom. Defaults to `true`. */
  interactive?: boolean;
  /** Override the x-axis title text. */
  xAxisTitle?: string;
  /** Hide the x-axis (tick labels + ticks + title) and zero the bottom
   *  margin. Used by the duo's top panel so the elevation chart stacks
   *  flush against the Gantt panel below. */
  xAxisHidden?: boolean;
  /** Lock the left/right paper margins to exact pixel values so a sibling
   *  chart can match them column-perfect. `null` falls back to Plotly's
   *  `automargin`. */
  fixedHorizontalMargins?: { left: number; right: number } | null;
}

/** Build the chart Layout. Dual y-axis: left = altitude (0–90°), right =
 *  airmass with hand-picked tickvals so the two axes line up (airmass = sec z
 *  at the same altitude). Pan-only drag mode; pinned axis ranges. */
export function buildLayout(opts: BuildLayoutOptions): Partial<Layout> {
  const { startJd, stopJd, minTargetAltitude } = opts;
  const mode = opts.xAxisLabelMode ?? 'utc';
  const nowMs = opts.nowMs ?? Date.now();
  const interactive = opts.interactive ?? true;
  const palette = paletteFor(opts.theme ?? 'light');
  const minAltRect: Partial<Shape> = {
    type: 'rect',
    xref: 'paper',
    yref: 'y',
    x0: 0,
    y0: minTargetAltitude,
    x1: 1,
    y1: -90,
    fillcolor: palette.minAltFill,
    opacity: palette.minAltOpacity,
    line: { width: 0 },
  };
  const shapes: Partial<Shape>[] = [minAltRect];
  if (opts.maxTargetAltitude != null && opts.maxTargetAltitude < 90) {
    shapes.push({
      type: 'rect',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      y0: opts.maxTargetAltitude,
      x1: 1,
      y1: 90.5,
      fillcolor: palette.minAltFill,
      opacity: palette.minAltOpacity,
      line: { width: 0 },
    });
  }
  const xaxis = isRelativeMode(mode)
    ? buildRelativeXAxis(startJd, stopJd, nowMs, palette, opts.xAxisTitle)
    : buildUtcXAxis(startJd, stopJd, palette, opts.xAxisTitle);
  if (!interactive) xaxis.fixedrange = true;
  const xAxisHidden = opts.xAxisHidden ?? false;
  if (xAxisHidden) {
    xaxis.showticklabels = false;
    if (xaxis.title) xaxis.title = { text: '' };
    xaxis.ticks = '';
  }
  const fixedMargins = opts.fixedHorizontalMargins ?? null;
  const marginL = fixedMargins ? fixedMargins.left : 40;
  const marginR = fixedMargins ? fixedMargins.right : 40;
  return {
    // `b` is pinned (not `automargin`-driven on the x-axis) so the plot area
    // stays the same height when toggling UTC ↔ relative labels. Plotly's
    // default UTC date ticks are two lines (`Mar 5` / `2026`); the relative
    // labels (`+2h`) are one. With automargin the bottom would jump between
    // those two sizes — the value below fits the taller UTC case.
    margin: { t: 35, b: xAxisHidden ? 0 : 55, l: marginL, r: marginR },
    paper_bgcolor: palette.paperBg,
    plot_bgcolor: palette.plotBg,
    font: { color: palette.font },
    xaxis,
    yaxis: {
      title: { text: 'elevation', font: { color: palette.axisTitle }, standoff: 5 },
      fixedrange: true,
      range: [0, 90.5],
      tickmode: 'array',
      tickvals: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90],
      ticktext: ['0', '10', '20', '30', '40', '50', '60', '70', '80', '90'],
      automargin: fixedMargins == null,
      gridcolor: palette.grid,
      zerolinecolor: palette.zeroLine,
      linecolor: palette.axis,
      tickcolor: palette.axis,
      tickfont: { color: palette.axis },
    },
    yaxis2: {
      title: { text: 'airmass', font: { color: palette.axisTitle }, standoff: 5 },
      side: 'right',
      tickmode: 'array',
      automargin: fixedMargins == null,
      // Airmass = sec(zenith). Tick at altitudes [0, 9.5, 20, 30, 90]° produces
      // sec(z) ≈ [∞, 6, 3, 2, 1] — written as labels [-, 6, 3, 2, 1].
      ticktext: ['-', '6', '3', '2', '1.3', '1'],
      tickvals: [0, 9.5, 20, 30, 50.28, 90],
      overlaying: 'y',
      range: [0, 90.5],
      fixedrange: true,
      linecolor: palette.axis,
      tickcolor: palette.axis,
      tickfont: { color: palette.axis },
    },
    shapes,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1,
      bgcolor: palette.legendBg,
      bordercolor: palette.legendBorder,
      font: { color: palette.font },
    },
    dragmode: interactive ? 'pan' : false,
    showlegend: (opts.legendMode ?? 'plotly') !== 'none',
    autosize: true,
  };
}

function buildUtcXAxis(
  startJd: number,
  stopJd: number,
  palette: ThemePalette,
  titleOverride?: string,
): Partial<LayoutAxis> {
  return {
    type: 'date',
    autorange: false,
    range: [jdToDatetime(startJd), jdToDatetime(stopJd)],
    title: {
      text: titleOverride ?? 'time (UTC)',
      font: { color: palette.axisTitle },
      standoff: 10,
    },
    gridcolor: palette.grid,
    zerolinecolor: palette.zeroLine,
    linecolor: palette.axis,
    tickcolor: palette.axis,
    tickfont: { color: palette.axis },
  };
}

/** Build a `tickvals` / `ticktext` overlay so a `Date[]` x-axis reads as
 *  hours-from-now. Step size scales with window width (1h / 2h / 6h for ≤6h /
 *  ≤24h / ≤7d windows). Anchored to the first step boundary at or after the
 *  window start, so the labels stay aligned as the window scrolls. */
function buildRelativeXAxis(
  startJd: number,
  stopJd: number,
  nowMs: number,
  palette: ThemePalette,
  titleOverride?: string,
): Partial<LayoutAxis> {
  const start = jdToDatetime(startJd);
  const stop = jdToDatetime(stopJd);
  const startMs = start.getTime();
  const stopMs = stop.getTime();
  const spanHours = (stopMs - startMs) / 3_600_000;
  const stepHours = spanHours <= 6 ? 1 : spanHours <= 24 ? 2 : 6;
  const stepMs = stepHours * 3_600_000;

  const tickvals: Date[] = [];
  const ticktext: string[] = [];
  // Anchor on `now`: each tick is at `now + k * stepMs` for integer k. The
  // first tick is the smallest k such that the tick is ≥ startMs.
  const firstK = Math.ceil((startMs - nowMs) / stepMs);
  for (let k = firstK; ; k++) {
    const t = nowMs + k * stepMs;
    if (t > stopMs) break;
    tickvals.push(new Date(t));
    ticktext.push(formatRelativeHours(k * stepHours));
  }

  return {
    type: 'date',
    autorange: false,
    range: [start, stop],
    tickmode: 'array',
    tickvals,
    ticktext,
    title: {
      text: titleOverride ?? 'hours from now',
      font: { color: palette.axisTitle },
      standoff: 10,
    },
    gridcolor: palette.grid,
    zerolinecolor: palette.zeroLine,
    linecolor: palette.axis,
    tickcolor: palette.axis,
    tickfont: { color: palette.axis },
  };
}

/** "Now" / "+2h" / "-30m" / "+0.5h". Whole-hour offsets render integer-only;
 *  sub-hour offsets fall back to minutes. */
export function formatRelativeHours(hours: number): string {
  if (Math.abs(hours) < 1 / 60) return 'now';
  const sign = hours >= 0 ? '+' : '-';
  const abs = Math.abs(hours);
  if (abs < 1) {
    const minutes = Math.round(abs * 60);
    return `${sign}${minutes}m`;
  }
  if (Number.isInteger(abs)) return `${sign}${abs}h`;
  // Mixed hours / minutes for fractional values (e.g. "+2h 30m").
  const wholeHours = Math.floor(abs);
  const minutes = Math.round((abs - wholeHours) * 60);
  if (minutes === 0) return `${sign}${wholeHours}h`;
  if (minutes === 60) return `${sign}${wholeHours + 1}h`;
  return `${sign}${wholeHours}h ${minutes}m`;
}

/** Convenience wrapper that takes a date-millisecond offset (`date - now`).
 *  Same output formatting as `formatRelativeHours`. */
export function formatRelativeFromNowMs(deltaMs: number): string {
  return formatRelativeHours(deltaMs / 3_600_000);
}

/** Default Plotly config — pan-only mode bar disabled, no logo, responsive.
 *  Typed as `Partial<Config>` so the consumer-supplied `<Plot>` accepts it. */
export const PLOTLY_CONFIG: Partial<import('plotly.js').Config> = {
  modeBarButtons: [['pan2d', 'zoom2d', 'zoomIn2d', 'zoomOut2d', 'resetScale2d']],
  displayModeBar: false,
  doubleClick: false,
  displaylogo: false,
  responsive: true,
};

/** Decode a Plotly click point back to `{site, kind, date, altitude, airmass}`
 *  using the `meta` we stamped on each trace. Returns `null` when the click
 *  hit something we can't decode (legend, etc.). */
export function decodeClickPoint(
  event: PlotMouseEvent,
  datasets: ReadonlyArray<ObservabilityDataset>,
): {
  site: ObservabilityDataset['site'];
  kind: ObservabilitySeriesKind;
  date: Date;
  altitude: number;
  airmass: number;
} | null {
  const point = event.points[0];
  if (!point) return null;
  const meta = (point.data as { meta?: TraceMeta } | undefined)?.meta;
  if (!meta) return null;
  const dataset = datasets.find((d) => sameSite(d.site, meta));
  if (!dataset) return null;
  const series = dataset.series[meta.kind];
  const idx = point.pointIndex;
  if (typeof idx !== 'number' || idx < 0 || idx >= series.xs.length) return null;
  return {
    site: dataset.site,
    kind: meta.kind,
    date: series.xs[idx]!,
    altitude: series.ys[idx]!,
    airmass: series.airmass[idx]!,
  };
}

function sameSite(site: ObservabilityDataset['site'], meta: TraceMeta): boolean {
  if (meta.siteId != null && site.id != null) return site.id === meta.siteId;
  return site.slug === meta.siteSlug;
}

/** Extract `{ start, duration }` from a Plotly `onRelayout` payload. Plotly
 *  delivers the new x-axis range either as a tuple under `'xaxis.range'` or
 *  as two indexed scalars under `'xaxis.range[0]'` / `'xaxis.range[1]'` (the
 *  latter when only one bound changed). Returns `null` for relayout events
 *  unrelated to the x-axis (autosize, drag-end without pan, etc.). */
export function relayoutToWindow(
  event: PlotRelayoutEvent,
): ObservabilityWindow | null {
  // Indexed-key form takes precedence; some Plotly versions emit it alongside
  // the tuple but with the freshest values on the keys.
  const indexed = event as unknown as {
    'xaxis.range[0]'?: string | number | Date;
    'xaxis.range[1]'?: string | number | Date;
    'xaxis.range'?: ReadonlyArray<string | number | Date>;
  };
  const raw0 = indexed['xaxis.range[0]'] ?? indexed['xaxis.range']?.[0];
  const raw1 = indexed['xaxis.range[1]'] ?? indexed['xaxis.range']?.[1];
  if (raw0 == null || raw1 == null) return null;
  const start = toDate(raw0);
  const stop = toDate(raw1);
  if (!start || !stop) return null;
  const duration = (stop.getTime() - start.getTime()) / 1000;
  if (!Number.isFinite(duration) || duration <= 0) return null;
  return { start, duration };
}

function toDate(v: string | number | Date): Date | null {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}
