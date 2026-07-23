import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { RgbImageMeta, RgbImagePixels } from '../../ipc/client';
import { useTheme } from '../../state/theme-context';
import { plotChrome } from './plot-theme';

interface Props {
  image: RgbImagePixels;
  meta?: RgbImageMeta | null;
  title?: string;
  testId?: string;
  // Reports the composited bitmap as a PNG data URL each render, so the view
  // can export it client-side (BUG-015). Pass a stable (memoized) callback.
  onBitmap?: (dataUrl: string) => void;
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

export function RgbImagePlot({ image, meta, title = '', testId, onBitmap }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { theme } = useTheme();

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
    // Canvas orientation: the bitmap fills the plot area in paper coords, so
    //   - canvas col c (left-to-right) maps to engine col c. The engine puts
    //     ra_grid = max_ra at col 0 and ra_grid = min_ra at col W-1. With the
    //     x-axis reversed (max_ra displays on the visual LEFT), canvas col 0
    //     (visual left of bitmap) already aligns with the visual-left RA tick.
    //   - canvas row r (top-to-bottom) maps to engine row H-1-r. The engine
    //     puts dec_grid = min_dec at row 0 (its native bottom) and max_dec at
    //     row H-1 (top), but HTML canvas has row 0 at the top — hence the
    //     row flip.
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const srcRow = h - 1 - r;
        const srcCol = c;
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

    // Layout image placed in PAPER coords (0..1 plot fraction) rather than data
    // coords. Plotly's data-coord layout images interact badly with reversed
    // axes — the bitmap was rendering at a tiny fraction of the intended size
    // for some sizex/sizey ranges. Paper coords sidestep that entirely; the
    // bitmap fills the plot area, and we made sure the canvas pixel order
    // matches the desired visual orientation:
    //   - canvas col 0 (visual LEFT of bitmap) holds the source's max_ra data;
    //     after reversed-axis display that lines up with the visual LEFT tick.
    //   - canvas row 0 (visual TOP of bitmap) holds the source's max_dec data,
    //     matching the visual TOP tick.
    const layoutImages = hasBounds
      ? [
          {
            source: dataUrl,
            xref: 'paper',
            yref: 'paper',
            x: 0,
            y: 1,
            sizex: 1,
            sizey: 1,
            xanchor: 'left',
            yanchor: 'top',
            sizing: 'stretch',
            layer: 'below',
          },
        ]
      : [];

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
      // Cast: Plotly's TS types for layout images are stricter than the
      // runtime allows (e.g. `sizing: 'stretch'` is supported but the type
      // sometimes restricts it).
      images: layoutImages as unknown as Plotly.Layout['images'],
    };
    Plotly.react(node, data, layout, { displayModeBar: false, responsive: true });
    return () => {
      Plotly.purge(node);
    };
  }, [image, meta, title, theme, onBitmap]);

  return (
    <div
      data-testid={testId ?? 'rgb-image-plot'}
      ref={ref}
      style={{ width: '100%', height: '100%', minHeight: 420 }}
    />
  );
}
