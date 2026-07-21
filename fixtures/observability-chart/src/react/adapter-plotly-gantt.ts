/** Plotly-specific rendering glue for the Gantt chart. Mirrors the
 *  structure of `adapter-plotly.ts` (elevation chart) but with categorical
 *  y-axis + horizontal-bar traces. One trace per `TimeBlockKind` (not per
 *  block, not per lane) — keeps the legend usable and the tooltip uniform.
 *
 *  Swapping plot libraries later remains a single-file change. */

import type {
  Data,
  Layout,
  LayoutAxis,
  PlotData,
  PlotMouseEvent,
  Shape,
} from 'plotly.js';
import type {
  Lane,
  TimeBlock,
  TimeBlockKind,
} from '../types.js';
import { bucketBlocks, computeLaneOrder } from '../internal/gantt/layout.js';
import {
  DEFAULT_Y_AXIS_TICK_ANGLE,
  estimateLaneLabelMargin,
} from '../internal/gantt/metrics.js';
import { KIND_STYLE, KINDS, type PatternShape } from '../internal/gantt/palette.js';
import {
  formatRelativeFromNowMs,
  formatRelativeHours,
  PLOTLY_CONFIG,
} from './adapter-plotly.js';
import type { ResolvedChartTheme, XAxisLabelMode } from './types.js';

// ── Theme palette ─────────────────────────────────────────────────────────
// A subset of the elevation chart's theme — just the paper / plot / axis /
// grid colours the Gantt needs.

interface GanttPalette {
  paperBg: string;
  plotBg: string;
  font: string;
  axis: string;
  axisTitle: string;
  grid: string;
}

const LIGHT_PALETTE: GanttPalette = {
  paperBg: '#ffffff',
  plotBg: '#ffffff',
  font: '#1f2937',
  axis: '#1f2937',
  axisTitle: '#1f2937',
  grid: '#e5e7eb',
};

const DARK_PALETTE: GanttPalette = {
  paperBg: '#18181b',
  plotBg: '#27272a',
  font: '#e5e7eb',
  axis: '#a1a1aa',
  axisTitle: '#e5e7eb',
  grid: '#3f3f46',
};

function paletteFor(theme: ResolvedChartTheme): GanttPalette {
  return theme === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
}

/** `customdata` shape stamped on every bar — used by both the hover template
 *  and the click decoder. `body` is the fully-composed hover text (header,
 *  optional sub-line, time range, duration) with empty lines already pruned,
 *  so the template can render it verbatim — a Plotly hovertemplate can't drop
 *  a line conditionally, so a block with no sub-line (e.g. an observable
 *  window, which has no "reasons" line) simply omits it from `body`. */
interface GanttCustomData {
  id: string;
  body: string;
}

interface GanttTraceMeta {
  kind: TimeBlockKind;
}

// ── Data builder ──────────────────────────────────────────────────────────

export interface BuildGanttDataOptions {
  /** Selects the hover-template time formatting. `'relative'` /
   *  `'relative-to-start'` both produce offset-from-`nowMs` strings; `'utc'`
   *  prints absolute UTC. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Reference "now" used when formatting relative-mode times in the
   *  hover template. Required when `xAxisLabelMode !== 'utc'`. */
  nowMs?: number;
  /** Keep a row for every passed lane even when it has no in-window block, so
   *  the y-axis stays stable as the user pans (each instrument keeps a fixed
   *  row height instead of the surviving lanes stretching to fill). Defaults
   *  to `false`. */
  showEmptyLanes?: boolean;
}

export interface BuildGanttDataResult {
  data: Data[];
  /** Lane-key → row-index map. Plotly will draw row 0 at the *top* because
   *  `categoryarray` is reversed in the layout builder. */
  laneOrder: Lane[];
  /** Block lookup by id — used by `decodeGanttClick`. */
  blockIndex: ReadonlyMap<string, TimeBlock>;
}

/** Build the Plotly `data` array. One horizontal-bar trace per
 *  `TimeBlockKind`; each bar's `base` is the start time and `x` is the
 *  duration in milliseconds.
 *
 *  Returns the data alongside the lane ordering and a block-id lookup — both
 *  are needed by the layout builder (lane categories) and the click decoder
 *  (id → original `TimeBlock`).
 *
 *  Note: callers can pre-clip with `bucketBlocks` before invoking, or pass
 *  raw blocks and let this function pass them through unchanged. Clipping is
 *  the caller's responsibility because the visible-window bounds live with
 *  the layout, not the data — the React component already knows them. */
export function buildGanttData(
  blocks: ReadonlyArray<TimeBlock>,
  lanes: ReadonlyArray<Lane>,
  options: BuildGanttDataOptions = {},
): BuildGanttDataResult {
  const mode = options.xAxisLabelMode ?? 'utc';
  const nowMs = options.nowMs ?? Date.now();
  const showEmptyLanes = options.showEmptyLanes ?? false;

  const laneOrder = computeLaneOrder(blocks, lanes, { includeEmpty: showEmptyLanes });
  const blockIndex = new Map<string, TimeBlock>();
  for (const block of blocks) blockIndex.set(block.id, block);

  // Group blocks by kind so each trace's arrays are aligned.
  const byKind = new Map<TimeBlockKind, TimeBlock[]>();
  for (const kind of KINDS) byKind.set(kind, []);
  for (const block of blocks) {
    const bucket = byKind.get(block.kind) ?? byKind.get('other')!;
    bucket.push(block);
  }

  const data: Data[] = [];
  for (const kind of KINDS) {
    const bucket = byKind.get(kind)!;
    if (bucket.length === 0) continue;
    data.push(kindToTrace(kind, bucket, mode, nowMs));
  }
  // Plotly only draws a category row when some trace references it in `y`.
  // A zero-width ghost bar per lane anchors the categorical axis so the row
  // shows even with no real block. Needed when:
  //  - there are no real traces at all (otherwise the axis collapses), or
  //  - `showEmptyLanes` is on, so lanes with no in-window block still get a
  //    fixed-height row (keeps the y-axis stable as the user pans).
  if (laneOrder.length > 0 && (data.length === 0 || showEmptyLanes)) {
    data.push(emptyLaneAnchor(laneOrder));
  }

  return { data, laneOrder, blockIndex };
}

function kindToTrace(
  kind: TimeBlockKind,
  blocks: ReadonlyArray<TimeBlock>,
  mode: XAxisLabelMode,
  nowMs: number,
): Partial<PlotData> & { meta: GanttTraceMeta } {
  const style = KIND_STYLE[kind];

  const ys: string[] = [];
  const bases: number[] = []; // start in epoch ms
  const xs: number[] = []; // duration in ms
  const customdata: GanttCustomData[] = [];

  for (const block of blocks) {
    const startMs = block.start.getTime();
    const stopMs = block.stop.getTime();
    const durationMs = stopMs - startMs;
    ys.push(block.laneKey);
    bases.push(startMs);
    xs.push(durationMs);
    customdata.push(buildCustomData(block, durationMs, mode, nowMs));
  }

  const meta: GanttTraceMeta = { kind };
  // `base` + `x` is the Plotly idiom for a horizontal Gantt — `base` is the
  // left edge (a date or number), `x` is the bar width. `@types/plotly.js`
  // doesn't expose `base` on `PlotData`, so we stamp the field via a cast at
  // the assembled-object level. Plotly's date-axis accepts numbers as
  // millis-since-epoch, so we pass numeric `base`.
  const trace = {
    type: 'bar',
    orientation: 'h',
    name: style.label,
    legendgroup: kind,
    showlegend: true,
    base: bases,
    x: xs,
    y: ys,
    width: 0.7,
    marker: {
      color: style.color,
      line: { width: 0 },
      pattern: style.pattern
        ? {
            shape: style.pattern as PatternShape,
            // Plotly uses `solidity` ∈ [0, 1] for pattern density. Keep it
            // low so the hatch reads as a subtle texture (a non-colour cue
            // for greyscale / colour-blind palettes) rather than a heavy
            // fill that overpowers the bar.
            solidity: 0.3,
            // Translucent white so the hatch lines are a faint texture, not
            // a stark high-contrast checker over the bar colour.
            fgcolor: 'rgba(255,255,255,0.45)',
            bgcolor: style.color,
            size: 8,
          }
        : undefined,
    },
    customdata,
    hovertemplate: buildHoverTemplate(),
    meta,
  };
  return trace as unknown as Partial<PlotData> & { meta: GanttTraceMeta };
}

function emptyLaneAnchor(laneOrder: ReadonlyArray<Lane>): Partial<PlotData> {
  // Single zero-width invisible bar per lane so the categorical axis still
  // resolves to the full lane list when every lane is empty in-range. Plotly
  // shows a row per category as long as that category appears in *some*
  // trace's `y`.
  const anchor = {
    type: 'bar',
    orientation: 'h',
    x: laneOrder.map(() => 0),
    base: laneOrder.map(() => 0),
    y: laneOrder.map((l) => l.key),
    showlegend: false,
    hoverinfo: 'skip',
    marker: { color: 'rgba(0,0,0,0)' },
  };
  return anchor as unknown as Partial<PlotData>;
}

function buildCustomData(
  block: TimeBlock,
  durationMs: number,
  mode: XAxisLabelMode,
  nowMs: number,
): GanttCustomData {
  const startStr =
    mode === 'utc'
      ? formatUtc(block.start)
      : formatRelativeFromNowMs(block.start.getTime() - nowMs);
  const stopStr =
    mode === 'utc'
      ? formatUtc(block.stop)
      : formatRelativeFromNowMs(block.stop.getTime() - nowMs);
  const duration = formatRelativeHours(durationMs / 3_600_000);

  // Header line; bold. Sub-line is the block's `typeLabel` override (e.g. the
  // observability view's bulleted reasons), falling back to the kind's palette
  // label. Either may be an empty string — those lines are pruned so the
  // tooltip never shows a blank row.
  const header = block.label ?? '';
  const sub = block.typeLabel ?? KIND_STYLE[block.kind].label;
  const lines: string[] = [];
  if (header) lines.push(`<b>${header}</b>`);
  if (sub) lines.push(sub);
  lines.push(`${startStr} → ${stopStr}`);
  lines.push(`duration: ${duration}`);

  return {
    id: block.id,
    body: lines.join('<br>'),
  };
}

function formatUtc(d: Date): string {
  // Match the elevation chart's hover template format `MM-DD HH:MM`.
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month}-${day} ${hh}:${mm}`;
}

function buildHoverTemplate(): string {
  return (
    // `body` is pre-composed (header / optional sub-line / time range /
    // duration) with empty lines already pruned — see `buildCustomData`.
    '%{customdata.body}' +
    '<extra></extra>'
  );
}

// ── Layout builder ────────────────────────────────────────────────────────

export interface BuildGanttLayoutOptions {
  /** The visible window. Drives the x-axis range and the relative-mode
   *  tick labels. Must match the bounds passed to `bucketBlocks`. */
  start: Date;
  stop: Date;
  /** Lane order from `buildGanttData`. The y-axis categorical order is the
   *  reverse of this, so lane 0 sits at the top of the chart. */
  laneOrder: ReadonlyArray<Lane>;
  xAxisLabelMode?: XAxisLabelMode;
  nowMs?: number;
  theme?: ResolvedChartTheme;
  /** When `false`, locks `dragmode` + `xaxis.fixedrange`. Default `true`. */
  interactive?: boolean;
  /** Hides the x-axis (ticks + title + bottom margin → 0). Used by the
   *  duo orchestrator's top panel. */
  xAxisHidden?: boolean;
  /** Lock the horizontal paper margins to exact pixel values so a sibling
   *  chart can match them column-perfect. `null` (default) falls back to
   *  Plotly's `automargin`. */
  fixedHorizontalMargins?: { left: number; right: number } | null;
  /** Override the x-axis title. Defaults to the elevation chart's wording. */
  xAxisTitle?: string;
}

export function buildGanttLayout(opts: BuildGanttLayoutOptions): Partial<Layout> {
  const mode = opts.xAxisLabelMode ?? 'utc';
  const nowMs = opts.nowMs ?? Date.now();
  const interactive = opts.interactive ?? true;
  const xAxisHidden = opts.xAxisHidden ?? false;
  const palette = paletteFor(opts.theme ?? 'light');

  // No per-row background shapes: the earlier same-observatory / same-telescope
  // grouping tint shaded only the 2nd+ lane of each group, which read as a
  // stray shadow under *some* rows. Rows now render uniformly.
  const shapes: Partial<Shape>[] = [];

  const xaxis =
    mode === 'utc'
      ? buildUtcXAxis(opts.start, opts.stop, palette, opts.xAxisTitle)
      : buildRelativeXAxis(opts.start, opts.stop, nowMs, palette, opts.xAxisTitle);
  // Explicitly unlock the x-axis when interactive so Plotly's pan handler
  // engages. Plotly's default is technically `false` for date axes, but
  // setting it explicitly avoids inheritance ambiguity from category-y +
  // bar-trace combos that sometimes lock the value axis to fixedrange.
  xaxis.fixedrange = !interactive;
  if (xAxisHidden) {
    xaxis.showticklabels = false;
    if (xaxis.title) xaxis.title = { text: '' };
    xaxis.ticks = '';
  }

  // Reverse the lane order for the y-axis so the first lane sits at the
  // top — Plotly draws category 0 at the bottom by default.
  const reversedLaneKeys = opts.laneOrder.map((l) => l.key).reverse();
  const reversedLaneLabels = opts.laneOrder.map((l) => l.label).reverse();

  // When the consumer doesn't lock the margins (i.e. the chart is standalone,
  // not inside `<ObservabilityChartDuo>`), estimate the left margin from the
  // lane labels so the rotated text always has room. The duo passes its own
  // pre-computed value so both panels share the same plot column.
  const estimatedLeft = estimateLaneLabelMargin(opts.laneOrder);
  const left = opts.fixedHorizontalMargins?.left ?? estimatedLeft;
  const right = opts.fixedHorizontalMargins?.right ?? 40;

  return {
    margin: {
      t: 10,
      b: xAxisHidden ? 0 : 55,
      l: left,
      r: right,
    },
    paper_bgcolor: palette.paperBg,
    plot_bgcolor: palette.plotBg,
    font: { color: palette.font },
    xaxis,
    yaxis: {
      type: 'category',
      // Plotly draws category 0 at the bottom. Pass the reversed list so
      // lane 0 sits at the top.
      categoryorder: 'array',
      categoryarray: reversedLaneKeys,
      tickmode: 'array',
      tickvals: reversedLaneKeys,
      ticktext: reversedLaneLabels,
      // Rotate labels so long telescope/instrument names occupy diagonal
      // space rather than pushing the plot area to the right. The left
      // margin estimate above is sized for this angle.
      tickangle: DEFAULT_Y_AXIS_TICK_ANGLE,
      // The Gantt always controls its own left margin (estimated or
      // duo-supplied), so disable automargin to keep both panels in sync.
      automargin: false,
      fixedrange: true,
      gridcolor: palette.grid,
      linecolor: palette.axis,
      tickcolor: palette.axis,
      tickfont: { color: palette.axis },
    },
    // `overlay` keeps each kind's bars at the lane's full y position. The
    // default `'group'` would split each lane into N sub-rows (one per
    // trace) when multiple kinds share a lane — visually wrong for the
    // Gantt layout.
    barmode: 'overlay',
    bargap: 0.3,
    // `hovermode: 'closest'` matches Plotly's default for scatter but is
    // worth pinning because bar traces sometimes default to `'x'` which
    // shows a spike line we don't want (the cursor line is our spike).
    hovermode: 'closest',
    shapes,
    dragmode: interactive ? 'pan' : false,
    // The kind legend is intentionally always hidden — the toolbar's
    // source toggle plus the colored bars in the chart give consumers
    // enough information; an extra legend overlay just cluttered the
    // plot area on dense Gantt views.
    showlegend: false,
    autosize: true,
  };
}

function buildUtcXAxis(
  start: Date,
  stop: Date,
  palette: GanttPalette,
  titleOverride?: string,
): Partial<LayoutAxis> {
  return {
    type: 'date',
    autorange: false,
    range: [start, stop],
    title: {
      text: titleOverride ?? 'time (UTC)',
      font: { color: palette.axisTitle },
      standoff: 10,
    },
    gridcolor: palette.grid,
    linecolor: palette.axis,
    tickcolor: palette.axis,
    tickfont: { color: palette.axis },
  };
}

function buildRelativeXAxis(
  start: Date,
  stop: Date,
  nowMs: number,
  palette: GanttPalette,
  titleOverride?: string,
): Partial<LayoutAxis> {
  const startMs = start.getTime();
  const stopMs = stop.getTime();
  const spanHours = (stopMs - startMs) / 3_600_000;
  const stepHours = spanHours <= 6 ? 1 : spanHours <= 24 ? 2 : 6;
  const stepMs = stepHours * 3_600_000;

  const tickvals: Date[] = [];
  const ticktext: string[] = [];
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
    linecolor: palette.axis,
    tickcolor: palette.axis,
    tickfont: { color: palette.axis },
  };
}


// ── Click decoder ─────────────────────────────────────────────────────────

/** Decode a Plotly click event back to the originating `TimeBlock`. Returns
 *  `null` when the click hit something that wasn't a bar (legend, plot
 *  background) or a bar with no matching block in the index. */
export function decodeGanttClick(
  event: PlotMouseEvent,
  blockIndex: ReadonlyMap<string, TimeBlock>,
): TimeBlock | null {
  const point = event.points[0];
  if (!point) return null;
  // `customdata` is per-point; Plotly forwards it as `point.customdata`.
  const data = (point as unknown as { customdata?: GanttCustomData }).customdata;
  if (!data || !data.id) return null;
  return blockIndex.get(data.id) ?? null;
}

// ── Helpers re-exported for convenience ───────────────────────────────────

export { PLOTLY_CONFIG };
export { bucketBlocks };
