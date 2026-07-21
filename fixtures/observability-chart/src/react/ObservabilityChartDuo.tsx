/** Stacked elevation + Gantt panel pair. Owns the cross-plot state —
 *  shared time window, shared cursor, locked paper-margin alignment — and
 *  re-exposes its children's controlled props at the top level.
 *
 *  Composition is "small, opt-in, one obvious layout": flex column, top
 *  panel sized via `heights.top`, bottom panel via `heights.bottom`. A
 *  consumer who needs a different layout (side-by-side, three panels,
 *  popover overlay) can build it from the same primitives:
 *  `<ObservabilityChart>` and `<ObservabilityGanttChart>`. */

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { ObservabilityChart } from './ObservabilityChart.js';
import type { ObservabilityChartPropsWithPlot } from './ObservabilityChart.js';
import {
  ObservabilityGanttChart,
  type ObservabilityGanttChartProps,
} from './ObservabilityGanttChart.js';
import { estimateLaneLabelMargin } from '../internal/gantt/metrics.js';
import {
  DEFAULT_CHART_THEME,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_X_AXIS_LABEL_MODE,
  type ChartTheme,
  type XAxisLabelMode,
} from './types.js';
import {
  useControllableWindow,
  type ObservabilityWindow,
} from './useControllableWindow.js';

/** Keys the duo orchestrator owns directly on each child — passing these in
 *  the per-child prop bundles would conflict. Subtracting them via `Omit`
 *  produces the child bundles `<ObservabilityChartDuo>` actually accepts. */
type TopChildProps = Omit<
  ObservabilityChartPropsWithPlot,
  | 'start'
  | 'duration'
  | 'onWindowChange'
  | 'xAxisLabelMode'
  | 'theme'
  | 'xAxisHidden'
  | 'fixedHorizontalMargins'
>;

type BottomChildProps = Omit<
  ObservabilityGanttChartProps,
  | 'start'
  | 'duration'
  | 'onWindowChange'
  | 'xAxisLabelMode'
  | 'theme'
  | 'xAxisHidden'
  | 'fixedHorizontalMargins'
>;

export interface ObservabilityChartDuoProps {
  /** Props forwarded to the top elevation chart. */
  top: TopChildProps;
  /** Props forwarded to the bottom Gantt chart. */
  bottom: BottomChildProps;
  start?: Date;
  duration?: number;
  onWindowChange?: (window: ObservabilityWindow) => void;
  xAxisLabelMode?: XAxisLabelMode;
  theme?: ChartTheme;
  /** Heights of the two panels. Numbers are flex grow values; strings are
   *  CSS lengths. Defaults to a 60/40 flex split. */
  heights?: { top: number | string; bottom: number | string };
  /** Outer container class. */
  className?: string;
  /** Outer container inline styles. The duo fills its container, so a
   *  height is usually wanted here. */
  style?: CSSProperties;
  /** Fixed horizontal paper margins applied to *both* panels so the plot
   *  columns align. The defaults match Plotly's automargin output for the
   *  typical lane-label width; override when the labels would clip. */
  fixedHorizontalMargins?: { left: number; right: number };
  /** Colour of the shared time cursor. Defaults to a red that reads on both
   *  themes. */
  cursorColor?: string;
}

const DEFAULT_HEIGHTS = { top: 6, bottom: 4 };
const DEFAULT_RIGHT_MARGIN = 40;
const DEFAULT_CURSOR_COLOR = '#ef4444'; // red-500

export function ObservabilityChartDuo(props: ObservabilityChartDuoProps) {
  const xAxisLabelMode = props.xAxisLabelMode ?? DEFAULT_X_AXIS_LABEL_MODE;
  const theme = props.theme ?? DEFAULT_CHART_THEME;
  const heights = props.heights ?? DEFAULT_HEIGHTS;
  // The left margin tracks the Gantt's lane labels — long instrument
  // names need more horizontal room, and both panels must share the same
  // value so their plot columns align. The estimate uses the same
  // rotation angle the Gantt adapter applies to its y-axis ticks.
  const fixedMargins = useMemo(() => {
    if (props.fixedHorizontalMargins) return props.fixedHorizontalMargins;
    return {
      left: estimateLaneLabelMargin(props.bottom.lanes),
      right: DEFAULT_RIGHT_MARGIN,
    };
  }, [props.fixedHorizontalMargins, props.bottom.lanes]);

  // ── Shared time window ──────────────────────────────────────────────────
  // The duo owns one window and routes both children's `onWindowChange`
  // through it so panning either chart updates both. The window state is
  // controllable from outside via `start` / `duration` / `onWindowChange` on
  // the duo itself.
  const windowState = useControllableWindow({
    start: props.start,
    duration: props.duration,
    defaultDuration: DEFAULT_DURATION_SECONDS,
    onChange: props.onWindowChange,
  });

  const handleChildWindowChange = useCallback(
    (window: ObservabilityWindow) => {
      windowState.setWindow(window);
    },
    [windowState],
  );

  // ── Shared cursor (DOM overlay) ───────────────────────────────────────────
  // The cursor is rendered as an absolutely-positioned `<div>` over the
  // panels, NOT as a Plotly shape. This is deliberate: a Plotly-shape cursor
  // had to live in each chart's `layout`, so every pointer move rebuilt the
  // layout and fired `Plotly.react`. Mid-pan, that extra `Plotly.react`
  // overwrote Plotly's in-progress drag range with the (stale) React-side
  // range — the chart snapped back to its original position on release.
  // A DOM overlay sidesteps Plotly entirely: cursor moves never touch the
  // plot, so panning is undisturbed.
  //
  // We track the cursor as a pixel offset relative to the container's left
  // edge (not a time), so it follows the pointer exactly with no
  // snap-to-data-point offset and appears even over empty plot regions.
  const [cursorX, setCursorX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fixedMarginsRef = useRef(fixedMargins);
  fixedMarginsRef.current = fixedMargins;

  const handleLeave = useCallback(() => setCursorX(null), []);
  const handleMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const margins = fixedMarginsRef.current;
    const dataAreaLeft = margins.left;
    const dataAreaRight = rect.width - margins.right;
    if (dataAreaRight <= dataAreaLeft) return;
    const x = event.clientX - rect.left;
    // Only show the cursor inside the shared plot column — drifting into the
    // y-axis label margin hides it rather than parking it at the edge.
    if (x < dataAreaLeft || x > dataAreaRight) {
      setCursorX(null);
      return;
    }
    setCursorX(x);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────
  const containerStyle: CSSProperties = useMemo(
    () => ({
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      position: 'relative',
      ...props.style,
    }),
    [props.style],
  );

  const cursorColor = props.cursorColor ?? DEFAULT_CURSOR_COLOR;

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={containerStyle}
      onMouseLeave={handleLeave}
      onMouseMove={handleMouseMove}
    >
      <div style={paneStyle(heights.top)}>
        <ObservabilityChart
          {...props.top}
          start={windowState.start}
          duration={windowState.duration}
          onWindowChange={handleChildWindowChange}
          xAxisLabelMode={xAxisLabelMode}
          theme={theme}
          xAxisHidden
          fixedHorizontalMargins={fixedMargins}
        />
      </div>
      <div style={paneStyle(heights.bottom)}>
        <ObservabilityGanttChart
          {...props.bottom}
          start={windowState.start}
          duration={windowState.duration}
          onWindowChange={handleChildWindowChange}
          xAxisLabelMode={xAxisLabelMode}
          theme={theme}
          fixedHorizontalMargins={fixedMargins}
        />
      </div>
      {cursorX != null ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: cursorX,
            width: 0,
            borderLeft: `1px solid ${cursorColor}`,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />
      ) : null}
    </div>
  );
}

function paneStyle(size: number | string): CSSProperties {
  if (typeof size === 'number') {
    return { flex: size, minHeight: 0 };
  }
  return { flex: `0 0 ${size}`, minHeight: 0 };
}
