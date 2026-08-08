import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { ImageMeta, ImagePixels, PaletteStop } from '../../ipc/client';
import type { ImageDisplayMode } from '../../state/survey-context';
import { useTheme } from '../../state/theme-context';
import { plotChrome } from './plot-theme';

export interface ImagePoint {
  ra: number;
  dec: number;
  // `null` means the cell is no-data (engine NaN sentinel encoded as null).
  // The readout shows this as blank rather than as a real flux value.
  flux: number | null;
  col: number;
  row: number;
}

export interface BoxOverlay {
  raCenter: number;
  decCenter: number;
  raHalfWidth: number;
  decHalfHeight: number;
}

interface Props {
  image: ImagePixels;
  meta?: ImageMeta | null;
  title: string;
  testId?: string;
  palette?: PaletteStop[] | null;
  fluxRange?: { min: number; max: number } | null;
  onHover?: (point: ImagePoint | null) => void;
  onClick?: (point: ImagePoint) => void;
  onContextMenu?: (point: ImagePoint | null) => void;
  // BUG-020/023 (dan): fired when the view zooms back out (double-click
  // reset). The Image view clears its pinned point here so zooming out never
  // leaves — or creates — a pin.
  onZoomReset?: () => void;
  boxOverlay?: BoxOverlay | null;
  // BUG-020: draws a persistent target marker at the pinned (clicked) cell so
  // the user can see where the flux readout was sampled after moving the cursor.
  pinnedMarker?: { ra: number; dec: number } | null;
  showColorBar?: boolean;
  fixedHeight?: number;
  // Force a 1:1 letterbox regardless of the sky aspect. Used by the magnifier
  // so the loupe is always a square instead of collapsing to the (often very
  // wide or very tall) shape of the source image.
  square?: boolean;
  // Hide the RA/Dec axis titles, ticks, tick labels, and gridlines. Used by the
  // magnifier so the loupe is a clean zoomed patch — hover still fires so the
  // RA/Dec/Flux readout keeps updating.
  hideAxes?: boolean;
  // BUG-016 (dan): draw the sky grid. The pre-image passes false so it renders
  // clean (no gridlines); the final Image view keeps the grid on by default.
  showGrid?: boolean;
  // FEAT-011: selects how the bounded-mode plot lays out its aspect ratio.
  // - 'sky' (default): cos(dec_center)/240 — true sky shape with cos(dec)
  //   correction at the image center (FEAT-008 v3 formula).
  // - 'raw': 1/240 — equator-only sky shape, no cos correction (matches the
  //   legacy VB app's main paint loop).
  // - 'pixel': (decRange*w)/(raRange*h) — each pixel cell is square on
  //   screen. Geometrically wrong but useful for inspecting very thin or
  //   very wide surveys.
  // - 'stretch': no scaleanchor; image fills the workspace container in
  //   both dimensions, ignoring intrinsic aspect.
  // The first three apply scaleanchor:'y' + constrain:'domain'; 'stretch'
  // drops the lock entirely. Pixel-mode (no RA/Dec bounds) keeps its
  // existing scaleanchor with default scaleratio:1.
  displayMode?: ImageDisplayMode;
}

function paletteToColorscale(stops: PaletteStop[]): Array<[number, string]> {
  // Plotly requires the colorscale to start at 0, end at 1, and be strictly
  // monotonic in between. Two stops at the same anchor (which can happen when
  // the user drags pegs together in the editor) crash Plotly without a clear
  // error — guard by nudging duplicates apart and filtering NaN.
  const finite = stops.filter(
    (s) => Number.isFinite(s.anchor) && Number.isFinite(s.r) && Number.isFinite(s.g) && Number.isFinite(s.b),
  );
  if (finite.length === 0) return [[0, 'rgb(0,0,0)'], [1, 'rgb(255,255,255)']];
  const sorted = [...finite].sort((a, b) => a.anchor - b.anchor);
  const maxAnchor = sorted[sorted.length - 1].anchor || 1;
  const out: Array<[number, string]> = sorted.map((s) => {
    const t = Math.max(0, Math.min(1, s.anchor / maxAnchor));
    const r = Math.round(Math.max(0, Math.min(255, s.r)));
    const g = Math.round(Math.max(0, Math.min(255, s.g)));
    const b = Math.round(Math.max(0, Math.min(255, s.b)));
    return [t, `rgb(${r},${g},${b})`];
  });
  if (out[0][0] > 0) out.unshift([0, out[0][1]]);
  if (out[out.length - 1][0] < 1) out.push([1, out[out.length - 1][1]]);
  // Nudge duplicate (or descending after rounding) anchors apart by a tiny
  // epsilon so the array is strictly increasing. Plotly fails silently on
  // duplicates; this keeps the editor usable while a peg sits on top of
  // another.
  const epsilon = 1e-6;
  for (let i = 1; i < out.length; i++) {
    if (out[i][0] <= out[i - 1][0]) {
      out[i][0] = Math.min(1, out[i - 1][0] + epsilon);
    }
  }
  return out;
}

// Legacy 8-stop default palette from vb/survform.frm:1518-1550 — anchors are
// `Pal!(N, 1)` (renormalised from 0..255 to 0..1) and the RGB triplets are the
// other three palette fields. Black → magenta → blue → cyan → green → yellow →
// red → white is the canonical Radio Cartographer ramp the legacy pre-image
// uses; `docs/legacy_ui_reference/screenshots/preimage.png` is rendered with
// exactly these stops.
const RADIO_CARTOGRAPHER_PALETTE: Array<[number, string]> = [
  [0 / 255, 'rgb(0,0,0)'],
  [(255 / 7) / 255, 'rgb(255,0,255)'],
  [(255 * 2 / 7) / 255, 'rgb(0,0,255)'],
  [(255 * 3 / 7) / 255, 'rgb(0,255,255)'],
  [(255 * 4 / 7) / 255, 'rgb(0,255,0)'],
  [(255 * 5 / 7) / 255, 'rgb(255,255,0)'],
  [(255 * 6 / 7) / 255, 'rgb(255,0,0)'],
  [255 / 255, 'rgb(255,255,255)'],
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// RA is stored as elapsed sidereal seconds in [0, 86400). Format the same way
// the legacy hover readout does (vb/survform.frm:5571-5620): zero-pad each
// field, wrap hours mod 24 so values past midnight don't display as `24:…`.
function formatRaSeconds(ra: number): string {
  let s = ra;
  while (s < 0) s += 86400;
  s = s % 86400;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s - hrs * 3600) / 60);
  const secs = Math.floor(s - hrs * 3600 - mins * 60);
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
}

// Forced grid color: a light gray that reads on both light and dark themes, so
// the sky grid is never a dark/heavy line regardless of theme.
const GRID_COLOR = '#e6e6e6';

// One degree of RA in stored units (seconds of time): 360° = 24h = 86400s, so
// 1° = 240s. The sky grid steps every 10°, i.e. every 2400s of RA.
const SEC_PER_DEG_RA = 240;
const GRID_STEP_DEG = 10;

// Dec axis label in plain decimal degrees (e.g. "40°"), not sexagesimal.
function formatDecDeg(dec: number): string {
  const rounded = Math.round(dec * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}°` : `${rounded.toFixed(1)}°`;
}

// Ticks (and therefore gridlines) on a fixed `interval`, aligned to multiples of
// it, so the grid lands on whole-degree boundaries. Plotly's `tickformat` can't
// do sexagesimal, so we feed labels directly. Falls back to the endpoints when
// the span is smaller than one interval so the axis is never blank.
function fixedIntervalTicks(
  lo: number,
  hi: number,
  interval: number,
  format: (v: number) => string,
): { tickvals: number[]; ticktext: string[] } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || interval <= 0) {
    return { tickvals: [lo], ticktext: [format(lo)] };
  }
  const tickvals: number[] = [];
  const start = Math.ceil(lo / interval) * interval;
  for (let v = start; v <= hi + 1e-9; v += interval) tickvals.push(v);
  if (tickvals.length < 2) {
    return { tickvals: [lo, hi], ticktext: [format(lo), format(hi)] };
  }
  return { tickvals, ticktext: tickvals.map(format) };
}

function hasBoundsOf(meta: ImageMeta | null | undefined): boolean {
  return (
    !!meta &&
    Number.isFinite(meta.min_ra) &&
    Number.isFinite(meta.max_ra) &&
    Number.isFinite(meta.min_dec) &&
    Number.isFinite(meta.max_dec) &&
    meta.max_ra > meta.min_ra &&
    meta.max_dec > meta.min_dec
  );
}

// Overlay shapes drawn on top of the heatmap: the magnifier box and the pinned-
// cell target ring. Kept in a helper so pin / magnifier changes can be pushed
// with a `shapes` `Plotly.relayout` instead of a full `Plotly.react`, whose
// layout re-applies `autorange` and can snap an active zoom back out (BUG-025).
// NOTE (BUG-023): a full-array `shapes:` relayout is NOT axes-neutral — Plotly
// escalates it internally to a full layout replot. The explicit ranges in
// gd.layout keep an active zoom intact, but Plotly's own double-click reset
// can die afterwards; the native-dblclick reset in the main effect covers
// that. The pinned ring is a fixed-pixel-size circle
// anchored at the data point (`xsizemode/ysizemode: 'pixel'`), so it stays the
// same size at any zoom, moves with pan/zoom, clips when out of view, and — as
// a shape, not a trace — never expands the axis autorange. Black halo under a
// white ring keeps it visible over any palette color.
function buildShapes(
  pinnedMarker: { ra: number; dec: number } | null | undefined,
  boxOverlay: BoxOverlay | null | undefined,
  hasBounds: boolean,
): Partial<Plotly.Shape>[] {
  const shapes: Partial<Plotly.Shape>[] = [];
  if (boxOverlay && hasBounds) {
    shapes.push({
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: boxOverlay.raCenter - boxOverlay.raHalfWidth,
      x1: boxOverlay.raCenter + boxOverlay.raHalfWidth,
      y0: boxOverlay.decCenter - boxOverlay.decHalfHeight,
      y1: boxOverlay.decCenter + boxOverlay.decHalfHeight,
      line: { color: 'white', width: 2 },
      fillcolor: 'rgba(255, 255, 255, 0.05)',
    } as Partial<Plotly.Shape>);
  }
  if (
    pinnedMarker &&
    hasBounds &&
    Number.isFinite(pinnedMarker.ra) &&
    Number.isFinite(pinnedMarker.dec)
  ) {
    const ring = (px: number, color: string, width: number) =>
      ({
        type: 'circle',
        xref: 'x',
        yref: 'y',
        xsizemode: 'pixel',
        ysizemode: 'pixel',
        xanchor: pinnedMarker.ra,
        yanchor: pinnedMarker.dec,
        x0: -px,
        x1: px,
        y0: -px,
        y1: px,
        line: { color, width },
      }) as unknown as Partial<Plotly.Shape>;
    shapes.push(ring(9, '#000', 4), ring(8, '#fff', 2));
  }
  return shapes;
}

// BUG-025: the plot container is letterboxed to this width:height ratio so the
// default (un-zoomed) view keeps the correct sky shape WITHOUT an axis
// `scaleanchor` — which would lock the pixels-per-unit ratio and make free box-
// zoom impossible. This is the very ratio scaleanchor would have enforced: with
// `scaleratio` R linking x to y, R x-units share the pixel span of 1 y-unit, so
// the sky-correct pixel box has W/H = raSpan * R / decSpan. Returns null when
// the plot should simply fill its container ('stretch', or an unusable span).
function plotAspect(
  meta: ImageMeta | null | undefined,
  w: number,
  h: number,
  displayMode: ImageDisplayMode,
  // BUG-019: when zoomed, the visible RA/Dec region drives the letterbox so the
  // zoomed view keeps correct sky proportions instead of the full-image shape.
  region?: { minRa: number; maxRa: number; minDec: number; maxDec: number } | null,
): number | null {
  const hasBounds = hasBoundsOf(meta);
  if (!hasBounds) {
    // Pixel-index view (no RA/Dec bounds): render square pixel cells.
    return w > 0 && h > 0 ? w / h : null;
  }
  if (displayMode === 'stretch') return null;
  const minRa = region ? Math.min(region.minRa, region.maxRa) : meta!.min_ra;
  const maxRa = region ? Math.max(region.minRa, region.maxRa) : meta!.max_ra;
  const minDec = region ? Math.min(region.minDec, region.maxDec) : meta!.min_dec;
  const maxDec = region ? Math.max(region.minDec, region.maxDec) : meta!.max_dec;
  const raSpan = maxRa - minRa;
  const decSpan = maxDec - minDec;
  const decCenter = (minDec + maxDec) / 2;
  // Same R the old scaleanchor used (see FEAT-011): 'raw' = 1/240, 'pixel' =
  // per-cell-square, 'sky' = cos(dec)/240.
  const ratio =
    displayMode === 'raw'
      ? 1 / 240
      : displayMode === 'pixel'
        ? (decSpan * w) / (raSpan * h)
        : Math.cos((decCenter * Math.PI) / 180) / 240;
  const aspect = (raSpan * ratio) / decSpan;
  return Number.isFinite(aspect) && aspect > 0 ? aspect : null;
}

export function ImagePlot({
  image,
  meta,
  title,
  testId,
  palette,
  fluxRange,
  onHover,
  onClick,
  onContextMenu,
  onZoomReset,
  boxOverlay,
  pinnedMarker,
  showColorBar = true,
  fixedHeight,
  square = false,
  hideAxes = false,
  showGrid = true,
  displayMode = 'sky',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Outer wrapper we measure to letterbox the plot to the sky aspect (BUG-025).
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  // BUG-019/020 (dan): the currently zoomed-into RA/Dec region (data coords).
  // When set, the container is letterboxed to THIS region's dec-corrected shape
  // so the zoomed view keeps correct sky proportions; cleared on zoom-out so the
  // letterbox reverts to the full image.
  const [zoomRange, setZoomRange] = useState<{
    minRa: number;
    maxRa: number;
    minDec: number;
    maxDec: number;
  } | null>(null);
  const { theme } = useTheme();
  // Keep the most recent hovered cell so the container's onContextMenu handler
  // can report it without needing Plotly's native (suppressed) right-click.
  const lastHoverRef = useRef<ImagePoint | null>(null);
  // Latest overlay inputs, read by the main render so it can seed the shapes
  // without re-running when only the pin / magnifier box changes (BUG-025).
  const pinnedMarkerRef = useRef(pinnedMarker);
  const boxOverlayRef = useRef(boxOverlay);
  const onContextMenuRef = useRef(onContextMenu);
  const onZoomResetRef = useRef(onZoomReset);
  pinnedMarkerRef.current = pinnedMarker;
  boxOverlayRef.current = boxOverlay;
  onContextMenuRef.current = onContextMenu;
  onZoomResetRef.current = onZoomReset;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Cells in the legacy app are painted with `Picture4.Line ... , BF` —
    // filled rectangles, one per (RA, Dec) bin. Each cell stays a single
    // solid color (no smoothing between cells), so the pre-image reads as a
    // mosaic of discrete blocks. Match that by leaving `zsmooth` off.
    // Anchor `zmin` at 0 so the palette's anchor=0 stop (black) lines up with
    // truly empty cells (outside the swept region). Without this, Plotly auto-
    // scales the lowest filled value to black, which would shift the whole
    // ramp and lose the magenta background that's the legacy pre-image's
    // signature look (see docs/legacy_ui_reference/screenshots/preimagecygnus.png).
    let zmax = 0;
    for (const row of image.pixels) {
      for (const v of row) {
        // Skip no-coverage cells (BUG-014) when finding the bright cap — they
        // arrive as `null` and would otherwise short-circuit the `>` compare.
        if (v !== null && v > zmax) zmax = v;
      }
    }

    // Build per-cell coordinate arrays so the axes render in RA/Dec rather
    // than 0..width / 0..height pixel indices. `make_image` flips the RA axis
    // so col 0 = max_ra (cdelt1 < 0); replicate that here, otherwise the
    // labels would print in reverse.
    const w = image.width;
    const h = image.height;
    const hasBounds = hasBoundsOf(meta);
    const xs: number[] = new Array(w);
    const ys: number[] = new Array(h);
    if (hasBounds) {
      const { min_ra, max_ra, min_dec, max_dec } = meta!;
      for (let i = 0; i < w; i++) {
        xs[i] = w === 1 ? max_ra : max_ra - ((max_ra - min_ra) * i) / (w - 1);
      }
      for (let j = 0; j < h; j++) {
        ys[j] = h === 1 ? min_dec : min_dec + ((max_dec - min_dec) * j) / (h - 1);
      }
    } else {
      for (let i = 0; i < w; i++) xs[i] = i;
      for (let j = 0; j < h; j++) ys[j] = j;
    }

    const colorscale =
      palette && palette.length > 0
        ? paletteToColorscale(palette)
        : RADIO_CARTOGRAPHER_PALETTE;
    const effectiveZMin = fluxRange ? fluxRange.min : 0;
    const effectiveZMax = fluxRange ? fluxRange.max : zmax > 0 ? zmax : 1;
    const data: Plotly.Data[] = [
      {
        z: image.pixels,
        x: xs,
        y: ys,
        type: 'heatmap',
        colorscale,
        zsmooth: false,
        zmin: effectiveZMin,
        zmax: effectiveZMax,
        showscale: showColorBar,
        hoverongaps: false,
        // Suppress Plotly's hover tooltip — the RA/Dec/Flux readout lives in
        // the side panel now. `hoverinfo: 'none'` hides the label but still
        // fires `plotly_hover` events so the React-side readout updates.
        hoverinfo: 'none',
      } as Plotly.Data,
    ];

    // The pinned-cell marker (BUG-020) is drawn as a layout SHAPE below, not a
    // scatter trace. A trace's data participates in autorange, so adding it
    // while zoomed pulled the view back out to include the point (BUG-025); a
    // pixel-sized shape never affects autorange and simply clips when the pinned
    // cell is off-screen — so the RA/Dec/Flux readout stays but no ring is drawn.

    // Grid on a fixed 10° sky spacing: RA every 2400s (=10°, kept in HH:MM:SS),
    // Dec every 10° (labeled in plain decimal degrees).
    const raTicks = hasBounds
      ? fixedIntervalTicks(meta!.min_ra, meta!.max_ra, GRID_STEP_DEG * SEC_PER_DEG_RA, formatRaSeconds)
      : null;
    const decTicks = hasBounds
      ? fixedIntervalTicks(meta!.min_dec, meta!.max_dec, GRID_STEP_DEG, formatDecDeg)
      : null;

    // Legacy convention (vb/survform.frm: Picture4 paint loop): MaxRa on the
    // LEFT, MinRa on the RIGHT — RA increases eastward, which is leftward in
    // a standard sky image. Reverse the x-axis so xs[0]=max_ra (col 0 of the
    // pixel grid) renders on the left.
    //
    // BUG-025: the true sky shape used to be enforced with `scaleanchor` +
    // `constrain: 'domain'`, which locks the pixels-per-unit ratio between the
    // axes. That lock makes box-zoom impossible — dragging a box whose shape
    // doesn't match the locked ratio just snaps the view back out, so the zoom
    // "flashes and disappears". We instead leave BOTH axes free (a drawn box
    // zooms to fit exactly) and preserve the correct default proportions by
    // letterboxing the plot container to the sky aspect (see `plotAspect` and
    // the wrapper in the return below). FEAT-011's display modes now feed that
    // container aspect rather than a Plotly axis constraint.
    const chrome = plotChrome(theme);
    // When axes are hidden (magnifier), drop titles/ticks/labels/grid but keep
    // the reversed x-orientation so RA still increases leftward and hover coords
    // stay correct.
    const hiddenAxis: Partial<Plotly.LayoutAxis> = {
      showticklabels: false,
      ticks: '',
      showgrid: false,
      zeroline: false,
      showline: false,
      title: { text: '' },
    };
    const xaxis: Partial<Plotly.LayoutAxis> = hideAxes
      ? { ...hiddenAxis, ...(hasBounds ? { autorange: 'reversed' as const } : {}) }
      : {
          title: { text: 'Right Ascension' },
          // Forced light-gray grid on 10° boundaries; no dark zeroline or frame.
          // BUG-016: the pre-image turns the grid off via showGrid={false}.
          showgrid: showGrid,
          gridcolor: GRID_COLOR,
          gridwidth: 1,
          zeroline: false,
          linecolor: GRID_COLOR,
          tickcolor: GRID_COLOR,
          ...(hasBounds ? { autorange: 'reversed' as const } : {}),
          ...(raTicks
            ? { tickmode: 'array', tickvals: raTicks.tickvals, ticktext: raTicks.ticktext }
            : {}),
        };
    const yaxis: Partial<Plotly.LayoutAxis> = hideAxes
      ? { ...hiddenAxis, ...(hasBounds ? {} : { autorange: 'reversed' as const }) }
      : {
          title: { text: 'Declination' },
          showgrid: showGrid,
          gridcolor: GRID_COLOR,
          gridwidth: 1,
          zeroline: false,
          linecolor: GRID_COLOR,
          tickcolor: GRID_COLOR,
          ...(hasBounds ? {} : { autorange: 'reversed' as const }),
          ...(decTicks
            ? { tickmode: 'array', tickvals: decTicks.tickvals, ticktext: decTicks.ticktext }
            : {}),
        };

    // Seed overlays from refs so this effect does NOT list pinnedMarker /
    // boxOverlay as deps — those changes are pushed via a shapes-only relayout
    // below, which never disturbs an active zoom (BUG-025).
    const shapes = buildShapes(pinnedMarkerRef.current, boxOverlayRef.current, hasBounds);

    // BUG-025: keep the user's zoom/pan across Plotly.react calls. This effect
    // re-runs whenever the pinned marker, magnifier box, palette, flux range or
    // theme changes — each call passes a layout with `autorange`, which would
    // otherwise snap the axes back to full and wipe an active zoom (the
    // "flashes and disappears" symptom). A constant `uirevision` tells Plotly
    // to preserve interactive axis state; it changes only when the underlying
    // image (its bounds / size) changes, so a genuinely new image still resets.
    const uirevision = hasBounds
      ? `b:${meta!.min_ra}:${meta!.max_ra}:${meta!.min_dec}:${meta!.max_dec}`
      : `p:${w}x${h}`;
    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      uirevision,
      margin: hideAxes
        ? { l: 6, r: 6, t: title ? 40 : 6, b: 6 }
        : { l: 70, r: 20, t: title ? 40 : 12, b: 50 },
      paper_bgcolor: chrome.paperBg,
      // BUG-014: no-coverage cells arrive as `null` (engine NaN sentinel,
      // JSON-encoded as null). Plotly's heatmap renders them transparent,
      // so the plot background shows through — set to the theme's plot
      // background to match the "blank sky" appearance for append/superimpose
      // gutters (white in light/retro, dark zinc in dark mode).
      plot_bgcolor: chrome.plotBg,
      font: { family: 'Tahoma, sans-serif', size: 11, color: chrome.fontColor },
      xaxis,
      yaxis,
      shapes,
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });

    // Wire up Plotly's hover / click events to the optional React callbacks.
    // Plotly attaches these via `node.on(...)`; we remove them on cleanup via
    // `removeAllListeners` (provided by Plotly's events module).
    const plotEl = node as unknown as {
      on: (event: string, cb: (data: unknown) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
    const onHoverWired = (data: unknown) => {
      const d = data as { points?: Array<{ x: number; y: number; z: number; pointIndex?: [number, number] }> };
      if (!d.points || d.points.length === 0) return;
      // Prefer the heatmap point (it carries `z`) in case the cursor is also
      // over the pinned-marker scatter trace.
      const p = d.points.find((pt) => typeof pt.z === 'number') ?? d.points[0];
      const idx = p.pointIndex;
      const point: ImagePoint = {
        ra: p.x,
        dec: p.y,
        flux: p.z,
        col: idx ? idx[1] : 0,
        row: idx ? idx[0] : 0,
      };
      lastHoverRef.current = point;
      if (onHover) onHover(point);
    };
    const onUnhoverWired = () => {
      // Don't clear lastHoverRef — context-menu after the mouse drifts a hair
      // off a cell should still target the most recent cell.
      if (onHover) onHover(null);
    };
    // BUG-020 (dan): Plotly fires `plotly_click` for EACH constituent click of
    // a double-click (order: click #1 → plotly_doubleclick → relayout → click
    // #2), so double-click-to-zoom-out used to pin the cell under the cursor.
    // Defer the pin by Plotly's own double-click window; a doubleclick cancels
    // the pending pin and swallows the trailing click #2.
    const dblDelay =
      ((node as unknown as { _context?: { doubleClickDelay?: number } })._context
        ?.doubleClickDelay as number | undefined) ?? 300;
    let pendingClick: number | null = null;
    let suppressNextClick = false;
    const onClickWired = (data: unknown) => {
      const d = data as { points?: Array<{ x: number; y: number; z: number; pointIndex?: [number, number] }> };
      if (!d.points || d.points.length === 0 || !onClick) return;
      if (suppressNextClick) {
        // Click #2 of a double-click (fires after plotly_doubleclick).
        suppressNextClick = false;
        return;
      }
      const p = d.points.find((pt) => typeof pt.z === 'number') ?? d.points[0];
      const idx = p.pointIndex;
      const point: ImagePoint = {
        ra: p.x,
        dec: p.y,
        flux: p.z,
        col: idx ? idx[1] : 0,
        row: idx ? idx[0] : 0,
      };
      if (pendingClick !== null) clearTimeout(pendingClick);
      pendingClick = window.setTimeout(() => {
        pendingClick = null;
        onClick(point);
      }, dblDelay);
    };
    const onDoubleClickWired = () => {
      if (pendingClick !== null) {
        clearTimeout(pendingClick);
        pendingClick = null;
      }
      suppressNextClick = true;
      onZoomResetRef.current?.();
    };
    plotEl.on('plotly_hover', onHoverWired);
    plotEl.on('plotly_unhover', onUnhoverWired);
    plotEl.on('plotly_click', onClickWired);
    plotEl.on('plotly_doubleclick', onDoubleClickWired);

    // BUG-008: when the user double-clicks (or any other action triggers
    // a zoom-out / autorange reset), Plotly resets `xaxis.autorange` to
    // `true` and drops the `'reversed'` flag we set in the initial layout
    // — so RA renders min-on-left, max-on-right and the axis appears
    // flipped. Re-apply 'reversed' whenever Plotly autorange-resets the
    // x-axis. Guarded by a flag so we don't loop on the relayout we
    // ourselves trigger.
    let suppressRelayout = false;
    const readRanges = ():
      | { minRa: number; maxRa: number; minDec: number; maxDec: number }
      | null => {
      const fl = (node as unknown as {
        _fullLayout?: { xaxis?: { range?: number[] }; yaxis?: { range?: number[] } };
      })._fullLayout;
      const xr = fl?.xaxis?.range;
      const yr = fl?.yaxis?.range;
      if (!xr || !yr || xr.length < 2 || yr.length < 2) return null;
      return {
        minRa: Math.min(xr[0], xr[1]),
        maxRa: Math.max(xr[0], xr[1]),
        minDec: Math.min(yr[0], yr[1]),
        maxDec: Math.max(yr[0], yr[1]),
      };
    };
    const onRelayoutWired = (data: unknown) => {
      if (!hasBounds || suppressRelayout) return;
      const d = data as Record<string, unknown>;
      // A box-zoom / pan / ctrl-zoom sets explicit `x/yaxis.range[*]` keys; a
      // double-click reset sets `xaxis.autorange: true`.
      const isRangeChange = Object.keys(d).some(
        (k) => k.startsWith('xaxis.range') || k.startsWith('yaxis.range'),
      );
      if (d['xaxis.autorange'] === true && !isRangeChange) {
        // BUG-020: zoom-out reverts the letterbox to the full-image aspect and
        // re-applies the reversed RA orientation (BUG-008).
        setZoomRange(null);
        suppressRelayout = true;
        // Plotly's TS types say `autorange` is boolean, but the runtime
        // accepts `'reversed'` (see the `xaxis` layout above).
        Plotly.relayout(node, { 'xaxis.autorange': 'reversed' } as unknown as Partial<Plotly.Layout>).finally(() => {
          suppressRelayout = false;
        });
        return;
      }
      if (isRangeChange) {
        // BUG-019: letterbox the container to the visible region so the zoomed
        // view keeps correct (dec-corrected) sky proportions.
        const region = readRanges();
        if (region) setZoomRange(region);
      }
    };
    plotEl.on('plotly_relayout', onRelayoutWired);

    // Right-click drives the magnifier from React (BUG-025/020). Intercept it in
    // the CAPTURE phase so Plotly's own handlers on descendant nodes never see
    // it — Plotly resets the axes on right-click, which would wipe an active
    // zoom (BUG-008). This replaces the old React onContextMenu, whose bubble-
    // phase preventDefault fired too late to stop Plotly. On views without a
    // magnifier (PreImageView) onContextMenuRef is undefined, so this just
    // blocks the reset + browser menu.
    const onContextCapture = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onContextMenuRef.current?.(lastHoverRef.current);
    };
    node.addEventListener('contextmenu', onContextCapture, true);

    // BUG-022 (dan): the right mouse button must never start a Plotly drag
    // (pan/zoom). Swallow right-button mousedown in the capture phase so Plotly's
    // drag layer never sees it; the contextmenu handler above still opens the
    // magnifier.
    const onMouseDownCapture = (e: MouseEvent) => {
      if (e.button === 2) e.stopPropagation();
    };
    node.addEventListener('mousedown', onMouseDownCapture, true);

    // BUG-021 (dan): Ctrl/Cmd + '+' / '-' zoom the main image about its center.
    // Only the main plot (axes visible) responds — not the magnifier loupe.
    const onKeyZoom = (e: KeyboardEvent) => {
      if (hideAxes || !hasBounds) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const zoomIn = e.key === '=' || e.key === '+' || e.key === 'Add';
      const zoomOut = e.key === '-' || e.key === '_' || e.key === 'Subtract';
      if (!zoomIn && !zoomOut) return;
      e.preventDefault();
      const region = readRanges();
      if (!region) return;
      const factor = zoomIn ? 0.8 : 1.25;
      const fl = (node as unknown as {
        _fullLayout?: { xaxis?: { range?: number[] }; yaxis?: { range?: number[] } };
      })._fullLayout;
      const xr = fl?.xaxis?.range;
      const yr = fl?.yaxis?.range;
      if (!xr || !yr) return;
      // Scale each axis about its center, preserving axis direction (RA is
      // reversed, so xr may be descending).
      const scale = (r: number[]): [number, number] => {
        const c = (r[0] + r[1]) / 2;
        const half = ((r[0] - r[1]) / 2) * factor;
        return [c + half, c - half];
      };
      void Plotly.relayout(node, {
        'xaxis.range': scale(xr),
        'yaxis.range': scale(yr),
      } as unknown as Partial<Plotly.Layout>);
    };
    window.addEventListener('keydown', onKeyZoom);

    // BUG-023 (dan): after the magnifier closes, the boxOverlay change fires a
    // `shapes` relayout — which Plotly escalates to a FULL layout replot — and
    // Plotly's internal double-click reset stops firing afterwards, leaving the
    // user stuck zoomed in (reopening the magnifier replots again and revives
    // it, which is the confusing symptom). Do our own deterministic reset off
    // the native DOM `dblclick`, which the browser dispatches regardless of
    // Plotly's internal click bookkeeping. Registered in the CAPTURE phase so
    // Plotly's own drag-layer handler can't swallow it via stopPropagation, and
    // with no target filter — any double-click on the plot means "reset".
    // Idempotent when Plotly's own reset also ran (autorange lands on the same
    // full ranges).
    const onNativeDblClick = () => {
      if (pendingClick !== null) {
        clearTimeout(pendingClick);
        pendingClick = null;
      }
      setZoomRange(null); // revert the BUG-019 letterbox to the full image
      onZoomResetRef.current?.(); // clear the pin (main plot only, BUG-020)
      void Plotly.relayout(node, {
        'xaxis.autorange': hasBounds ? 'reversed' : true,
        'yaxis.autorange': hasBounds ? true : 'reversed',
      } as unknown as Partial<Plotly.Layout>);
    };
    node.addEventListener('dblclick', onNativeDblClick, true);

    return () => {
      plotEl.removeAllListeners?.('plotly_hover');
      plotEl.removeAllListeners?.('plotly_unhover');
      plotEl.removeAllListeners?.('plotly_click');
      plotEl.removeAllListeners?.('plotly_doubleclick');
      plotEl.removeAllListeners?.('plotly_relayout');
      node.removeEventListener('contextmenu', onContextCapture, true);
      node.removeEventListener('mousedown', onMouseDownCapture, true);
      node.removeEventListener('dblclick', onNativeDblClick, true);
      window.removeEventListener('keydown', onKeyZoom);
      if (pendingClick !== null) clearTimeout(pendingClick);
      Plotly.purge(node);
    };
    // `displayMode` intentionally omitted from deps: it no longer changes the
    // Plotly layout (it only feeds the container aspect below), so switching
    // aspect modes must NOT re-run this effect and reset the user's zoom.
    // `boxOverlay` / `pinnedMarker` are also omitted: they only drive overlay
    // shapes, which are updated via the shapes-only relayout effect below so an
    // active zoom is never disturbed (BUG-025).
  }, [image, meta, title, palette, fluxRange, showColorBar, hideAxes, showGrid, onHover, onClick, theme]);

  // Push pin / magnifier-box changes as a `shapes` relayout. Unlike
  // Plotly.react, it doesn't re-apply our layout's `autorange`, so it can't
  // snap an active zoom back out (BUG-025) — but note it is still a full
  // layout replot internally (see buildShapes note / BUG-023). Runs after the
  // main effect on mount (the plot exists by then) and on every later pin /
  // box change.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    void Plotly.relayout(node, {
      shapes: buildShapes(pinnedMarker, boxOverlay, hasBoundsOf(meta)),
    } as unknown as Partial<Plotly.Layout>);
  }, [pinnedMarker, boxOverlay, meta]);

  // BUG-019/020: a genuinely new image (its bounds/size changed) resets Plotly's
  // zoom via `uirevision`, so clear our tracked zoom region too — otherwise the
  // letterbox would keep the previous image's zoomed aspect.
  useEffect(() => {
    setZoomRange(null);
  }, [meta?.min_ra, meta?.max_ra, meta?.min_dec, meta?.max_dec, image.width, image.height]);

  // Measure the wrapper so we can letterbox the plot to the sky aspect (BUG-025).
  // BUG-011 (dan): a layout effect, not a passive one — the measurement lands
  // before the browser paints and before the (passive) Plotly render effect
  // runs, so the very first `Plotly.react` already draws into the final
  // letterboxed div. With the old post-paint measure, the plot was drawn at
  // 100% size and only re-fit ~100ms later (`Plots.resize` debounces
  // internally), flashing an unscaled frame when the pre-image opened.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () =>
      setBox((prev) => {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        return prev && prev.w === w && prev.h === h ? prev : { w, h };
      });
    measure();
    if (typeof ResizeObserver === 'undefined') return; // jsdom / older envs
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Fit the largest box with the sky aspect inside the measured wrapper. When
  // there's no aspect to preserve ('stretch' / pixel span unusable), fill it.
  // `square` forces 1:1 so the magnifier is a square regardless of sky shape.
  const aspect = square
    ? 1
    : plotAspect(meta, image.width, image.height, displayMode, zoomRange);
  let innerW: number | string = '100%';
  let innerH: number | string = '100%';
  if (aspect && box && box.w > 0 && box.h > 0) {
    if (box.w / box.h > aspect) {
      innerH = box.h;
      innerW = box.h * aspect;
    } else {
      innerW = box.w;
      innerH = box.w / aspect;
    }
  }

  // Re-fit Plotly to the letterboxed inner box. `Plotly.Plots.resize` keeps the
  // current axis ranges, so this never disturbs an active zoom.
  useEffect(() => {
    const node = ref.current;
    if (node && node.getBoundingClientRect().width > 0) {
      void (Plotly as unknown as { Plots: { resize: (n: HTMLElement) => void } }).Plots.resize(node);
    }
  }, [innerW, innerH]);

  return (
    <div
      ref={wrapRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(fixedHeight !== undefined
          ? { width: '100%', height: fixedHeight }
          : { width: '100%', height: '100%', minHeight: 420 }),
      }}
    >
      <div
        data-testid={testId ?? 'image-plot'}
        ref={ref}
        style={{
          width: innerW,
          height: innerH,
          // BUG-011 (dan): hide the plot until the wrapper has been measured and
          // the letterbox size is known, so the first frame is already correctly
          // scaled instead of briefly flashing an unscaled/full-bleed image.
          visibility: box ? 'visible' : 'hidden',
        }}
      />
    </div>
  );
}
