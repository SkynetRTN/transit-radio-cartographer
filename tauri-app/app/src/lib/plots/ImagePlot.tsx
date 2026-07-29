import { useEffect, useRef, useState } from 'react';
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
  boxOverlay?: BoxOverlay | null;
  // BUG-020: draws a persistent target marker at the pinned (clicked) cell so
  // the user can see where the flux readout was sampled after moving the cursor.
  pinnedMarker?: { ra: number; dec: number } | null;
  showColorBar?: boolean;
  fixedHeight?: number;
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

// Dec is stored as signed decimal degrees. Mirrors vb/survform.frm:5622-5650.
function formatDecDegrees(dec: number): string {
  const sign = dec < 0 ? '-' : '';
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const mins = Math.floor((abs - deg) * 60);
  const secs = Math.floor((abs - deg - mins / 60) * 3600);
  return `${sign}${pad2(deg)}:${pad2(mins)}:${pad2(secs)}`;
}

// Roughly evenly-spaced ticks across [lo, hi] with `count` entries. Used to
// stamp HH:MM:SS / DD:MM:SS labels on the axes — Plotly's `tickformat`
// doesn't understand sexagesimal, so we feed it the labels directly.
function sexagesimalTicks(
  lo: number,
  hi: number,
  count: number,
  format: (v: number) => string,
): { tickvals: number[]; ticktext: string[] } {
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi <= lo || count < 2) {
    return { tickvals: [lo], ticktext: [format(lo)] };
  }
  const tickvals: number[] = [];
  const ticktext: string[] = [];
  for (let i = 0; i < count; i++) {
    const v = lo + ((hi - lo) * i) / (count - 1);
    tickvals.push(v);
    ticktext.push(format(v));
  }
  return { tickvals, ticktext };
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
// with a shapes-only `Plotly.relayout` — which never touches the axes — instead
// of a full `Plotly.react`, whose layout re-applies `autorange` and can snap an
// active zoom back out (BUG-025). The pinned ring is a fixed-pixel-size circle
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
): number | null {
  const hasBounds = hasBoundsOf(meta);
  if (!hasBounds) {
    // Pixel-index view (no RA/Dec bounds): render square pixel cells.
    return w > 0 && h > 0 ? w / h : null;
  }
  if (displayMode === 'stretch') return null;
  const raSpan = meta!.max_ra - meta!.min_ra;
  const decSpan = meta!.max_dec - meta!.min_dec;
  const decCenter = (meta!.min_dec + meta!.max_dec) / 2;
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
  boxOverlay,
  pinnedMarker,
  showColorBar = true,
  fixedHeight,
  displayMode = 'sky',
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Outer wrapper we measure to letterbox the plot to the sky aspect (BUG-025).
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const { theme } = useTheme();
  // Keep the most recent hovered cell so the container's onContextMenu handler
  // can report it without needing Plotly's native (suppressed) right-click.
  const lastHoverRef = useRef<ImagePoint | null>(null);
  // Latest overlay inputs, read by the main render so it can seed the shapes
  // without re-running when only the pin / magnifier box changes (BUG-025).
  const pinnedMarkerRef = useRef(pinnedMarker);
  const boxOverlayRef = useRef(boxOverlay);
  const onContextMenuRef = useRef(onContextMenu);
  pinnedMarkerRef.current = pinnedMarker;
  boxOverlayRef.current = boxOverlay;
  onContextMenuRef.current = onContextMenu;

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

    const raTicks = hasBounds
      ? sexagesimalTicks(meta!.min_ra, meta!.max_ra, 5, formatRaSeconds)
      : null;
    const decTicks = hasBounds
      ? sexagesimalTicks(meta!.min_dec, meta!.max_dec, 5, formatDecDegrees)
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
    const xaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Right Ascension' },
      gridcolor: chrome.gridColor,
      linecolor: chrome.axisColor,
      tickcolor: chrome.axisColor,
      ...(hasBounds ? { autorange: 'reversed' as const } : {}),
      ...(raTicks
        ? { tickmode: 'array', tickvals: raTicks.tickvals, ticktext: raTicks.ticktext }
        : {}),
    };
    const yaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Declination' },
      gridcolor: chrome.gridColor,
      linecolor: chrome.axisColor,
      tickcolor: chrome.axisColor,
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
      margin: { l: 70, r: 20, t: title ? 40 : 12, b: 50 },
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
    const onClickWired = (data: unknown) => {
      const d = data as { points?: Array<{ x: number; y: number; z: number; pointIndex?: [number, number] }> };
      if (!d.points || d.points.length === 0 || !onClick) return;
      const p = d.points.find((pt) => typeof pt.z === 'number') ?? d.points[0];
      const idx = p.pointIndex;
      onClick({
        ra: p.x,
        dec: p.y,
        flux: p.z,
        col: idx ? idx[1] : 0,
        row: idx ? idx[0] : 0,
      });
    };
    plotEl.on('plotly_hover', onHoverWired);
    plotEl.on('plotly_unhover', onUnhoverWired);
    plotEl.on('plotly_click', onClickWired);

    // BUG-008: when the user double-clicks (or any other action triggers
    // a zoom-out / autorange reset), Plotly resets `xaxis.autorange` to
    // `true` and drops the `'reversed'` flag we set in the initial layout
    // — so RA renders min-on-left, max-on-right and the axis appears
    // flipped. Re-apply 'reversed' whenever Plotly autorange-resets the
    // x-axis. Guarded by a flag so we don't loop on the relayout we
    // ourselves trigger.
    let suppressRelayout = false;
    const onRelayoutWired = (data: unknown) => {
      if (!hasBounds || suppressRelayout) return;
      const d = data as Record<string, unknown>;
      // Only re-apply on a genuine autorange reset (double-click). A box-zoom
      // sets explicit `xaxis.range[*]` keys; if any are present this is a zoom,
      // not a reset, and re-applying 'reversed' here would wipe it (BUG-025).
      const isBoxZoom = Object.keys(d).some((k) => k.startsWith('xaxis.range'));
      if (d['xaxis.autorange'] === true && !isBoxZoom) {
        suppressRelayout = true;
        // Plotly's TS types say `autorange` is boolean, but the runtime
        // accepts `'reversed'` (see the `xaxis` layout above, which uses
        // the same value with an `as const` cast). Mirror that here.
        Plotly.relayout(node, { 'xaxis.autorange': 'reversed' } as unknown as Partial<Plotly.Layout>).finally(() => {
          suppressRelayout = false;
        });
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

    return () => {
      plotEl.removeAllListeners?.('plotly_hover');
      plotEl.removeAllListeners?.('plotly_unhover');
      plotEl.removeAllListeners?.('plotly_click');
      plotEl.removeAllListeners?.('plotly_relayout');
      node.removeEventListener('contextmenu', onContextCapture, true);
      Plotly.purge(node);
    };
    // `displayMode` intentionally omitted from deps: it no longer changes the
    // Plotly layout (it only feeds the container aspect below), so switching
    // aspect modes must NOT re-run this effect and reset the user's zoom.
    // `boxOverlay` / `pinnedMarker` are also omitted: they only drive overlay
    // shapes, which are updated via the shapes-only relayout effect below so an
    // active zoom is never disturbed (BUG-025).
  }, [image, meta, title, palette, fluxRange, showColorBar, onHover, onClick, theme]);

  // Push pin / magnifier-box changes as a shapes-only relayout. Unlike
  // Plotly.react, relayout of `shapes` never re-applies the axis layout, so it
  // can't snap an active zoom back out (BUG-025). Runs after the main effect on
  // mount (the plot exists by then) and on every later pin / box change.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    void Plotly.relayout(node, {
      shapes: buildShapes(pinnedMarker, boxOverlay, hasBoundsOf(meta)),
    } as unknown as Partial<Plotly.Layout>);
  }, [pinnedMarker, boxOverlay, meta]);

  // Measure the wrapper so we can letterbox the plot to the sky aspect (BUG-025).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const measure = () => setBox({ w: wrap.clientWidth, h: wrap.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return; // jsdom / older envs
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  // Fit the largest box with the sky aspect inside the measured wrapper. When
  // there's no aspect to preserve ('stretch' / pixel span unusable), fill it.
  const aspect = plotAspect(meta, image.width, image.height, displayMode);
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
        style={{ width: innerW, height: innerH }}
      />
    </div>
  );
}
