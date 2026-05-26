import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import type { RgbImageMeta, RgbImagePixels } from '../../ipc/client';

interface Props {
  image: RgbImagePixels;
  meta?: RgbImageMeta | null;
  title?: string;
  testId?: string;
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

export function RgbImagePlot({ image, meta, title = '', testId }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

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
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const srcRow = h - 1 - r;
        const srcCol = w - 1 - c;
        const idx = (r * w + c) * 4;
        imgData.data[idx] = Math.round(Math.max(0, Math.min(1, image.r[srcRow][srcCol])) * 255);
        imgData.data[idx + 1] = Math.round(Math.max(0, Math.min(1, image.g[srcRow][srcCol])) * 255);
        imgData.data[idx + 2] = Math.round(Math.max(0, Math.min(1, image.b[srcRow][srcCol])) * 255);
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    const dataUrl = canvas.toDataURL();

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

    const xaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Right Ascension' },
      ...(hasBounds ? { autorange: 'reversed' as const } : {}),
      ...(raTicks
        ? { tickmode: 'array', tickvals: raTicks.tickvals, ticktext: raTicks.ticktext }
        : {}),
    };
    const yaxis: Partial<Plotly.LayoutAxis> = {
      title: { text: 'Declination' },
      ...(decTicks
        ? { tickmode: 'array', tickvals: decTicks.tickvals, ticktext: decTicks.ticktext }
        : {}),
    };

    const layoutImages = hasBounds
      ? [
          {
            source: dataUrl,
            xref: 'x',
            yref: 'y',
            // Anchor at axis (min_ra, max_dec). With the x axis reversed,
            // min_ra is the visual RIGHT side — and because we pre-rotated
            // the canvas, canvas col 0 holds min_ra data. So the bitmap's
            // left edge (canvas col 0) ends up at visual right, lining up
            // with the axis label for min_ra.
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

    const layout: Partial<Plotly.Layout> = {
      title: { text: title },
      margin: { l: 70, r: 20, t: title ? 40 : 12, b: 50 },
      paper_bgcolor: '#f3f3f3',
      plot_bgcolor: '#000000',
      font: { family: 'Tahoma, sans-serif', size: 11 },
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
  }, [image, meta, title]);

  return (
    <div
      data-testid={testId ?? 'rgb-image-plot'}
      ref={ref}
      style={{ width: '100%', height: '100%', minHeight: 420 }}
    />
  );
}
