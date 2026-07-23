import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { RgbImageMeta, RgbImagePixels } from '../../ipc/client';
import type { BoxOverlay } from './ImagePlot';
import { useTheme } from '../../state/theme-context';
import { plotChrome } from './plot-theme';

// A cell on the RGB composite. No flux (3-channel), just sky position + grid
// indices — enough to drive the magnifier and an RA/Dec readout.
export interface RgbImagePoint {
  ra: number;
  dec: number;
  col: number;
  row: number;
}

interface Props {
  image: RgbImagePixels;
  meta?: RgbImageMeta | null;
  title?: string;
  testId?: string;
  // Reports the composited bitmap as a PNG data URL each render, so the view
  // can export it client-side (BUG-015). Pass a stable (memoized) callback.
  onBitmap?: (dataUrl: string) => void;
  // Cursor/right-click reporting for the magnifier + readout (BUG-017). Cells
  // are derived from the pointer position via the axis pixel→data transform
  // (there is no per-cell trace to fire Plotly hover events).
  onHover?: (point: RgbImagePoint | null) => void;
  onContextMenu?: (point: RgbImagePoint | null) => void;
  boxOverlay?: BoxOverlay | null;
  // Fixed pixel height (used by the magnifier panel); defaults to a flexible
  // min-height of 420 that fills the workspace.
  fixedHeight?: number;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatRaSeconds(ra: number): string {
  let s = ra;
  while (s < 0) s += 86400;
  s = s % 86400;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s - hrs * 3600) / 60);
  const secs = Math.floor(s - hrs * 3600 - mins * 60);
  return `${pad2(hrs)}:${pad2(mins)}:${pad2(secs)}`;
}

function formatDecDegrees(dec: number): string {
  const sign = dec < 0 ? '-' : '';
  const abs = Math.abs(dec);
  const deg = Math.floor(abs);
  const mins = Math.floor((abs - deg) * 60);
  const secs = Math.floor((abs - deg - mins / 60) * 3600);
  return `${sign}${pad2(deg)}:${pad2(mins)}:${pad2(secs)}`;
}

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

export function RgbImagePlot({
  image,
  meta,
  title = '',
  testId,
  onBitmap,
  onHover,
  onContextMenu,
  boxOverlay,
  fixedHeight,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();
  // Keep the latest callbacks in refs so the pointer listeners (wired once)
  // always call the current handler without re-running the Plotly effect.
  const onHoverRef = useRef(onHover);
  const onContextMenuRef = useRef(onContextMenu);
  onHoverRef.current = onHover;
  onContextMenuRef.current = onContextMenu;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const h = image.height;
    const w = image.width;

    // Render the 3-channel pixel grid to an HTML canvas. We use a layout
    // image (background bitmap) rather than Plotly's `image` trace because
    // the `image` trace force-locks `yaxis.scaleanchor = x` to keep cells
    // square — which collapses Dec to a thin strip given that RA spans
    // thousands of sidereal seconds while Dec spans tens of degrees. The
    // layout-image path leaves each axis free to fill its own domain.
    //
    // Canvas orientation: we pre-rotate the data by 180° so that canvas
    // row 0 (visual top) holds max_dec and canvas col 0 (visual left of the
    // bitmap = visual right of the plot once the x axis is reversed) holds
    // min_ra. That matches the sky-image convention used by ImagePlot:
    // max_ra on the visual LEFT, min_dec at the visual BOTTOM.
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.createImageData(w, h);
    // BUG-013/-014 channel-wise no-data semantic: each channel independently
    // signals "no data here" by arriving as `null` (engine's JSON-safe NaN).
    // For a disjoint bi-color (Cas-A in R, Crab in G), Cas-A's cells have R
    // finite but G null — the user still wants those rendered red, not blank.
    // So the rule is: paint white only when EVERY channel is non-finite; if
    // at least one channel carries data, treat the others as 0.
    //
    // Canvas orientation for a DATA-coordinate layout image (BUG-017). Plotly
    // maps the canvas source pixels linearly across the data box
    // [min_ra, max_ra] × [min_dec, max_dec] with source-left → min_ra and
    // source-top → max_dec (xanchor left / yanchor top). We orient the canvas
    // to match, then let the reversed x-axis flip it for display so max_ra
    // still shows on the visual LEFT:
    //   - canvas col c → engine col (W-1-c): source col 0 = engine col W-1 =
    //     min_ra, source last col = engine col 0 = max_ra.
    //   - canvas row r → engine row (H-1-r): source row 0 = engine row H-1 =
    //     max_dec (visual top), source last row = min_dec.
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const srcRow = h - 1 - r;
        const srcCol = w - 1 - c;
        const idx = (r * w + c) * 4;
        const rv = image.r[srcRow][srcCol];
        const gv = image.g[srcRow][srcCol];
        const bv = image.b[srcRow][srcCol];
        const rOk = Number.isFinite(rv);
        const gOk = Number.isFinite(gv);
        const bOk = Number.isFinite(bv);
        if (!rOk && !gOk && !bOk) {
          imgData.data[idx] = 255;
          imgData.data[idx + 1] = 255;
          imgData.data[idx + 2] = 255;
          imgData.data[idx + 3] = 255;
          continue;
        }
        imgData.data[idx] = rOk ? Math.round(Math.max(0, Math.min(1, rv as number)) * 255) : 0;
        imgData.data[idx + 1] = gOk ? Math.round(Math.max(0, Math.min(1, gv as number)) * 255) : 0;
        imgData.data[idx + 2] = bOk ? Math.round(Math.max(0, Math.min(1, bv as number)) * 255) : 0;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL();
    // Hand the composited PNG up so the view can export exactly what's shown.
    onBitmap?.(dataUrl);

    const hasBounds =
      !!meta &&
      Number.isFinite(meta.min_ra) &&
      Number.isFinite(meta.max_ra) &&
      Number.isFinite(meta.min_dec) &&
      Number.isFinite(meta.max_dec) &&
      meta.max_ra > meta.min_ra &&
      meta.max_dec > meta.min_dec;

    // Invisible scatter trace to anchor the axes — the bitmap is in
    // layout.images. Without any trace, Plotly may not render the plot
    // area at all.
    const data: Plotly.Data[] = [
      {
        type: 'scatter',
        x: hasBounds ? [meta!.min_ra, meta!.max_ra] : [0, w - 1],
        y: hasBounds ? [meta!.min_dec, meta!.max_dec] : [0, h - 1],
        mode: 'markers',
        marker: { opacity: 0, size: 0.001 },
        hoverinfo: 'skip',
        showlegend: false,
      } as Plotly.Data,
    ];

    const raTicks = hasBounds
      ? sexagesimalTicks(meta!.min_ra, meta!.max_ra, 5, formatRaSeconds)
      : null;
    const decTicks = hasBounds
      ? sexagesimalTicks(meta!.min_dec, meta!.max_dec, 5, formatDecDegrees)
      : null;

    const chrome = plotChrome(theme);
    const xaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Right Ascension' },
      // RGB composites paint over the full plot area as a single bitmap; the
      // gridlines that scalar heatmaps lean on for cell registration would
      // overlay each footprint and obscure source structure.
      showgrid: false,
      zeroline: false,
      linecolor: chrome.axisColor,
      tickcolor: chrome.axisColor,
      ...(hasBounds ? { autorange: 'reversed' as const } : {}),
      ...(raTicks
        ? { tickmode: 'array', tickvals: raTicks.tickvals, ticktext: raTicks.ticktext }
        : {}),
    };
    const yaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Declination' },
      showgrid: false,
      zeroline: false,
      linecolor: chrome.axisColor,
      tickcolor: chrome.axisColor,
      ...(decTicks
        ? { tickmode: 'array', tickvals: decTicks.tickvals, ticktext: decTicks.ticktext }
        : {}),
    };

    // Layout image placed in DATA coords (BUG-017) so it zooms/pans with the
    // axes — the previous paper-coord placement pinned the bitmap to the plot
    // rectangle, so zooming moved the ticks but not the picture. The canvas is
    // oriented (above) so source-left = min_ra and source-top = max_dec, which
    // is exactly what xanchor:'left' / yanchor:'top' expect; the reversed
    // x-axis then flips it for display (max_ra on the visual left). Using a
    // real data box (x=min_ra, sizex=RA span) avoids the historical mis-sizing
    // that came from mixing paper anchors with reversed data ranges.
    const layoutImages = hasBounds
      ? [
          {
            source: dataUrl,
            xref: 'x',
            yref: 'y',
            x: meta!.min_ra,
            y: meta!.max_dec,
            sizex: meta!.max_ra - meta!.min_ra,
            sizey: meta!.max_dec - meta!.min_dec,
            xanchor: 'left',
            yanchor: 'top',
            sizing: 'stretch',
            layer: 'below',
          },
        ]
      : [];

    // Magnifier box drawn on the main plot (BUG-017), in data coords so it
    // tracks the region being magnified as the user zooms.
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
      paper_bgcolor: chrome.paperBg,
      // BUG-013: the bitmap covers only the union footprint, so anything the
      // user sees outside the painted area (and through any transparent canvas
      // pixels, though we paint alpha=255 everywhere) should be blank — the
      // theme's plot background (white in light/retro, dark zinc in dark mode),
      // matching legacy bi-color where un-imaged sky is blank, not black.
      plot_bgcolor: chrome.plotBg,
      font: { family: 'Tahoma, sans-serif', size: 11, color: chrome.fontColor },
      xaxis,
      yaxis,
      shapes,
      // Cast: Plotly's TS types for layout images are stricter than the
      // runtime allows (e.g. `sizing: 'stretch'` is supported but the type
      // sometimes restricts it).
      images: layoutImages as unknown as Plotly.Layout['images'],
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });

    // Pointer → cell mapping via the axis pixel→data transform (there is no
    // per-cell trace on the RGB plot to fire Plotly hover events).
    type AxisInternal = {
      p2d?: (px: number) => number;
      _offset?: number;
      _length?: number;
    };
    const toCell = (clientX: number, clientY: number): RgbImagePoint | null => {
      if (!hasBounds) return null;
      const internal = node as unknown as {
        _fullLayout?: { xaxis?: AxisInternal; yaxis?: AxisInternal };
      };
      const rect = node.getBoundingClientRect();
      const xa = internal._fullLayout?.xaxis;
      const ya = internal._fullLayout?.yaxis;
      if (!xa?.p2d || xa._offset === undefined) return null;
      if (!ya?.p2d || ya._offset === undefined) return null;
      const px = clientX - rect.left - xa._offset;
      const py = clientY - rect.top - ya._offset;
      if (xa._length !== undefined && (px < 0 || px > xa._length)) return null;
      if (ya._length !== undefined && (py < 0 || py > ya._length)) return null;
      const ra = xa.p2d(px);
      const dec = ya.p2d(py);
      const { min_ra, max_ra, min_dec, max_dec } = meta!;
      const col = Math.max(
        0,
        Math.min(w - 1, Math.round(((max_ra - ra) / (max_ra - min_ra)) * (w - 1))),
      );
      const row = Math.max(
        0,
        Math.min(h - 1, Math.round(((dec - min_dec) / (max_dec - min_dec)) * (h - 1))),
      );
      return { ra, dec, col, row };
    };
    const onMove = (e: MouseEvent) => onHoverRef.current?.(toCell(e.clientX, e.clientY));
    const onLeave = () => onHoverRef.current?.(null);
    const onCtx = (e: MouseEvent) => {
      // Suppress the browser menu and (like ImagePlot) prevent Plotly from
      // resetting the reversed axis; report the right-clicked cell instead.
      e.preventDefault();
      onContextMenuRef.current?.(toCell(e.clientX, e.clientY));
    };
    node.addEventListener('mousemove', onMove);
    node.addEventListener('mouseleave', onLeave);
    node.addEventListener('contextmenu', onCtx);

    // BUG-008: a double-click / zoom-out resets `xaxis.autorange` to `true`,
    // dropping the 'reversed' flag and flipping RA. Re-apply it, guarded so we
    // don't loop on our own relayout.
    const plotEl = node as unknown as {
      on: (event: string, cb: (data: unknown) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
    let suppressRelayout = false;
    const onRelayoutWired = (data: unknown) => {
      if (!hasBounds || suppressRelayout) return;
      const d = data as Record<string, unknown>;
      if (d['xaxis.autorange'] === true) {
        suppressRelayout = true;
        Plotly.relayout(node, { 'xaxis.autorange': 'reversed' } as unknown as Partial<Plotly.Layout>).finally(() => {
          suppressRelayout = false;
        });
      }
    };
    plotEl.on('plotly_relayout', onRelayoutWired);

    return () => {
      node.removeEventListener('mousemove', onMove);
      node.removeEventListener('mouseleave', onLeave);
      node.removeEventListener('contextmenu', onCtx);
      plotEl.removeAllListeners?.('plotly_relayout');
      Plotly.purge(node);
    };
  }, [image, meta, title, theme, onBitmap, boxOverlay]);

  return (
    <div
      data-testid={testId ?? 'rgb-image-plot'}
      ref={ref}
      style={
        fixedHeight !== undefined
          ? { width: '100%', height: fixedHeight }
          : { width: '100%', height: '100%', minHeight: 420 }
      }
    />
  );
}
