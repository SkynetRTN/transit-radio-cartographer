import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export interface Point {
  x: number;
  y: number;
  ra: number;
  dec: number;
  flux: number;
}

export interface PointSeries {
  points: Point[];
  color: string;
  name?: string;
  faded?: boolean;
}

interface Props {
  series: PointSeries[];
  xAxisLabel: string;
  yAxisLabel: string;
  highlightRange?: { x0: number; x1: number } | null;
  highlightYRange?: { y0: number; y1: number } | null;
  verticalLines?: number[];
  overlayLines?: { points: Array<{ x: number; y: number }>; color?: string; width?: number }[];
  pinnedPoint?: { x: number; y: number } | null;
  onHover?: (p: Point | null) => void;
  onPointClick?: (p: Point) => void;
  onEmptyClick?: () => void;
  onDragStart?: (value: number) => void;
  onDragUpdate?: (value: number) => void;
  onDragEnd?: () => void;
  dragEnabled?: boolean;
  dragAxis?: 'x' | 'y';
  testId?: string;
  height?: number;
  fixedXRange?: [number, number];
  fixedYRange?: [number, number];
  showXTicks?: boolean;
}

type LayoutInternal = {
  _fullLayout?: {
    xaxis?: { p2d?: (px: number) => number; _length?: number; _offset?: number };
    yaxis?: { p2d?: (px: number) => number; _length?: number; _offset?: number };
  };
};

function buildShapes(
  highlightRange?: { x0: number; x1: number } | null,
  verticalLines?: number[],
  highlightYRange?: { y0: number; y1: number } | null,
): Partial<Plotly.Shape>[] {
  const shapes: Partial<Plotly.Shape>[] = [];
  if (highlightRange) {
    shapes.push({
      type: 'rect',
      xref: 'x',
      yref: 'paper',
      x0: highlightRange.x0,
      x1: highlightRange.x1,
      y0: 0,
      y1: 1,
      fillcolor: '#00c000',
      opacity: 0.5,
      line: { width: 0 },
      layer: 'above',
    });
  }
  if (highlightYRange) {
    // Yellow horizontal band — matches the legacy "Select Declination" overlay.
    shapes.push({
      type: 'rect',
      xref: 'paper',
      yref: 'y',
      x0: 0,
      x1: 1,
      y0: highlightYRange.y0,
      y1: highlightYRange.y1,
      fillcolor: '#f7e000',
      opacity: 0.55,
      line: { width: 0 },
      layer: 'above',
    });
  }
  if (verticalLines) {
    for (const x of verticalLines) {
      shapes.push({
        type: 'line',
        xref: 'x',
        yref: 'paper',
        x0: x,
        x1: x,
        y0: 0,
        y1: 1,
        line: { color: '#000', width: 1 },
      });
    }
  }
  return shapes;
}

export function PointScatter({
  series,
  xAxisLabel,
  yAxisLabel,
  highlightRange,
  highlightYRange,
  verticalLines,
  overlayLines,
  pinnedPoint,
  onHover,
  onPointClick,
  onEmptyClick,
  onDragStart,
  onDragUpdate,
  onDragEnd,
  dragEnabled = false,
  dragAxis = 'x',
  testId,
  height = 280,
  fixedXRange,
  fixedYRange,
  showXTicks = true,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const hoverRef = useRef(onHover);
  const clickRef = useRef(onPointClick);
  const emptyClickRef = useRef(onEmptyClick);
  const dragStartRef = useRef(onDragStart);
  const dragUpdateRef = useRef(onDragUpdate);
  const dragEndRef = useRef(onDragEnd);
  const dragEnabledRef = useRef(dragEnabled);
  const dragAxisRef = useRef(dragAxis);
  const lastPointClickAt = useRef(0);
  hoverRef.current = onHover;
  clickRef.current = onPointClick;
  emptyClickRef.current = onEmptyClick;
  dragStartRef.current = onDragStart;
  dragUpdateRef.current = onDragUpdate;
  dragEndRef.current = onDragEnd;
  dragEnabledRef.current = dragEnabled;
  dragAxisRef.current = dragAxis;

  // ── Effect 1: build/refresh the plot when data or axes change.
  //   Highlight & vertical-lines updates do NOT trip this effect — they go
  //   through Plotly.relayout in Effect 2 so a fast mousemove can repaint the
  //   green overlay 60×/s without rebuilding the entire trace.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const traces: Plotly.Data[] = series.map((s) => ({
      x: s.points.map((p) => p.x),
      y: s.points.map((p) => p.y),
      customdata: s.points.map((p) => [p.ra, p.dec, p.flux] as [number, number, number]),
      type: 'scatter',
      mode: 'markers',
      marker: {
        color: s.color,
        size: 5,
        symbol: 'diamond',
        opacity: s.faded ? 0.25 : 1,
      },
      hoverinfo: 'none',
      name: s.name ?? '',
    }));

    if (pinnedPoint) {
      // Draw the pinned-point outline as a transparent marker with a thick
      // yellow border, sitting on top of the regular series so the underlying
      // red/blue diamond stays visible inside the ring.
      traces.push({
        x: [pinnedPoint.x],
        y: [pinnedPoint.y],
        type: 'scatter',
        mode: 'markers',
        marker: {
          symbol: 'circle-open',
          size: 16,
          line: { color: '#f5b400', width: 3 },
        },
        hoverinfo: 'skip',
        showlegend: false,
        name: 'pinned',
      });
    }

    if (overlayLines) {
      for (const line of overlayLines) {
        traces.push({
          x: line.points.map((p) => p.x),
          y: line.points.map((p) => p.y),
          type: 'scatter',
          mode: 'lines',
          line: { color: line.color ?? '#c020c0', width: line.width ?? 2 },
          hoverinfo: 'skip',
          showlegend: false,
          name: 'baseline',
        });
      }
    }

    const layout: Partial<Plotly.Layout> = {
      margin: { l: 56, r: 16, t: 8, b: showXTicks ? 36 : 16 },
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: { family: 'Tahoma, "Segoe UI", sans-serif', size: 11, color: '#111' },
      xaxis: {
        title: { text: xAxisLabel, font: { size: 12 } },
        zeroline: false,
        showgrid: false,
        ticks: showXTicks ? 'outside' : '',
        showticklabels: showXTicks,
        linecolor: '#000',
        mirror: true,
        ...(fixedXRange ? { range: fixedXRange, autorange: false } : {}),
      },
      yaxis: {
        title: { text: yAxisLabel, font: { size: 12 } },
        zeroline: false,
        showgrid: false,
        ticks: 'outside',
        linecolor: '#000',
        mirror: true,
        ...(fixedYRange ? { range: fixedYRange, autorange: false } : {}),
      },
      shapes: buildShapes(highlightRange, verticalLines, highlightYRange),
      showlegend: false,
      hovermode: 'closest',
      dragmode: false,
    };

    Plotly.react(node, traces, layout, {
      displayModeBar: false,
      responsive: true,
      staticPlot: false,
    });

    // Plotly hover/click → callbacks
    type HoverEvent = { points?: Array<{ customdata?: [number, number, number] }> };
    const onHoverEvt = (data: HoverEvent) => {
      const pt = data.points?.[0];
      const cd = pt?.customdata;
      if (cd && hoverRef.current) {
        hoverRef.current({ x: 0, y: 0, ra: cd[0], dec: cd[1], flux: cd[2] });
      }
    };
    const onUnhoverEvt = () => {
      hoverRef.current?.(null);
    };
    const onClickEvt = (data: HoverEvent) => {
      const cd = data.points?.[0]?.customdata;
      if (cd && clickRef.current) {
        lastPointClickAt.current = Date.now();
        clickRef.current({ x: 0, y: 0, ra: cd[0], dec: cd[1], flux: cd[2] });
      }
    };
    // DOM-level click on the plot div fires AFTER plotly_click. If plotly_click
    // didn't claim the gesture (i.e. the user clicked empty space inside the
    // plot), call onEmptyClick so the host can unpin.
    const onDomClick = () => {
      if (dragEnabledRef.current) return;
      if (Date.now() - lastPointClickAt.current < 150) return;
      emptyClickRef.current?.();
    };
    type PlotlyDom = HTMLDivElement & {
      on: (event: string, handler: (data: HoverEvent) => void) => void;
      removeAllListeners?: (event: string) => void;
    };
    const plot = node as PlotlyDom;
    plot.on('plotly_hover', onHoverEvt);
    plot.on('plotly_unhover', onUnhoverEvt);
    plot.on('plotly_click', onClickEvt);
    node.addEventListener('click', onDomClick);

    return () => {
      plot.removeAllListeners?.('plotly_hover');
      plot.removeAllListeners?.('plotly_unhover');
      plot.removeAllListeners?.('plotly_click');
      node.removeEventListener('click', onDomClick);
      Plotly.purge(node);
    };
  }, [series, xAxisLabel, yAxisLabel, fixedXRange, fixedYRange, showXTicks, pinnedPoint, overlayLines]);

  // ── Effect 2: cheap shape-only updates via relayout. This is what makes the
  //   drag-highlight follow the cursor smoothly without rebuilding the plot.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const internal = node as unknown as LayoutInternal;
    if (!internal._fullLayout) return; // plot not initialised yet
    Plotly.relayout(node, {
      shapes: buildShapes(highlightRange, verticalLines, highlightYRange),
    }).catch(() => {});
  }, [highlightRange, verticalLines, highlightYRange]);

  // ── Effect 3: drag-to-cut. Attached once and always live so cursor and
  //   listener state can flip with dragEnabled (read via ref) without
  //   re-creating Plotly.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const computeDataValue = (clientX: number, clientY: number): number | null => {
      const internal = node as unknown as LayoutInternal;
      const rect = node.getBoundingClientRect();
      if (dragAxisRef.current === 'y') {
        const ya = internal._fullLayout?.yaxis;
        if (!ya || !ya.p2d || ya._offset === undefined) return null;
        const py = clientY - rect.top - ya._offset;
        return ya.p2d(py);
      }
      const xa = internal._fullLayout?.xaxis;
      if (!xa || !xa.p2d || xa._offset === undefined) return null;
      const px = clientX - rect.left - xa._offset;
      return xa.p2d(px);
    };

    let dragging = false;

    const onMouseDown = (e: MouseEvent) => {
      if (!dragEnabledRef.current || e.button !== 0) return;
      const v = computeDataValue(e.clientX, e.clientY);
      if (v === null) return;
      dragging = true;
      // Block Plotly's draglayer from claiming this gesture.
      e.preventDefault();
      e.stopPropagation();
      dragStartRef.current?.(v);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const v = computeDataValue(e.clientX, e.clientY);
      if (v === null) return;
      dragUpdateRef.current?.(v);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!dragging) return;
      dragging = false;
      const v = computeDataValue(e.clientX, e.clientY);
      if (v !== null) dragUpdateRef.current?.(v);
      dragEndRef.current?.();
    };

    // Capture-phase on the plot div so we fire BEFORE Plotly's mouselayer
    // SVG listeners can claim the gesture.
    node.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove, true);
    window.addEventListener('mouseup', onMouseUp, true);

    return () => {
      node.removeEventListener('mousedown', onMouseDown, true);
      window.removeEventListener('mousemove', onMouseMove, true);
      window.removeEventListener('mouseup', onMouseUp, true);
    };
  }, []);

  return (
    <div
      data-testid={testId ?? 'point-scatter'}
      ref={ref}
      style={{
        width: '100%',
        height: `${height}px`,
        cursor: dragEnabled ? 'crosshair' : 'default',
      }}
    />
  );
}
