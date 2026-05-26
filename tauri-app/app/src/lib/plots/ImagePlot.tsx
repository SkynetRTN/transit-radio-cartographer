import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { ImageMeta, ImagePixels, PaletteStop } from '../../ipc/client';

export interface ImagePoint {
  ra: number;
  dec: number;
  flux: number;
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
  showColorBar?: boolean;
  fixedHeight?: number;
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
  showColorBar = true,
  fixedHeight,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Keep the most recent hovered cell so the container's onContextMenu handler
  // can report it without needing Plotly's native (suppressed) right-click.
  const lastHoverRef = useRef<ImagePoint | null>(null);

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
        if (v > zmax) zmax = v;
      }
    }

    // Build per-cell coordinate arrays so the axes render in RA/Dec rather
    // than 0..width / 0..height pixel indices. `make_image` flips the RA axis
    // so col 0 = max_ra (cdelt1 < 0); replicate that here, otherwise the
    // labels would print in reverse.
    const w = image.width;
    const h = image.height;
    const hasBounds =
      meta !== undefined &&
      meta !== null &&
      Number.isFinite(meta.min_ra) &&
      Number.isFinite(meta.max_ra) &&
      Number.isFinite(meta.min_dec) &&
      Number.isFinite(meta.max_dec) &&
      meta.max_ra > meta.min_ra &&
      meta.max_dec > meta.min_dec;
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
    // Do NOT scaleanchor when we have real bounds: RA is stored in sidereal
    // seconds (range ~thousands) and Dec in degrees (range ~tens), so 1:1
    // data-unit scaling collapses the image to a single horizontal line.
    // Each axis fills the available area independently — the grid shape
    // (legacy `width × height`) already encodes the intended aspect ratio.
    const xaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Right Ascension' },
      ...(hasBounds
        ? { autorange: 'reversed' as const }
        : { scaleanchor: 'y' as const, constrain: 'domain' as const }),
      ...(raTicks
        ? { tickmode: 'array', tickvals: raTicks.tickvals, ticktext: raTicks.ticktext }
        : {}),
    };
    const yaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Declination' },
      ...(hasBounds ? {} : { autorange: 'reversed' as const }),
      ...(decTicks
        ? { tickmode: 'array', tickvals: decTicks.tickvals, ticktext: decTicks.ticktext }
        : {}),
    };

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

    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      margin: { l: 70, r: 20, t: title ? 40 : 12, b: 50 },
      paper_bgcolor: '#f3f3f3',
      plot_bgcolor: '#000000',
      font: { family: 'Tahoma, sans-serif', size: 11 },
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
      const p = d.points[0];
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
      const p = d.points[0];
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

    return () => {
      plotEl.removeAllListeners?.('plotly_hover');
      plotEl.removeAllListeners?.('plotly_unhover');
      plotEl.removeAllListeners?.('plotly_click');
      Plotly.purge(node);
    };
  }, [image, meta, title, palette, fluxRange, boxOverlay, showColorBar, onHover, onClick]);

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onContextMenu) return;
    e.preventDefault();
    onContextMenu(lastHoverRef.current);
  };

  return (
    <div
      data-testid={testId ?? 'image-plot'}
      ref={ref}
      onContextMenu={handleContextMenu}
      style={
        fixedHeight !== undefined
          ? { width: '100%', height: fixedHeight }
          : { width: '100%', height: '100%', minHeight: 420 }
      }
    />
  );
}
