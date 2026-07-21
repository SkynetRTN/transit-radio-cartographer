/** React wrapper around the Gantt Plotly adapter.
 *
 *  Mirrors `ObservabilityChart.tsx`'s plumbing one-for-one:
 *  - `useControllableWindow` for the controlled/uncontrolled `start` /
 *    `duration`.
 *  - `useMemo` for both `data` + `layout` so unrelated prop churn doesn't
 *    force Plotly into a relayout.
 *  - Lazy-loaded `react-plotly.js` (`useLazyPlot`); container resize-relay
 *    (`useContainerResizeRelay`); `auto` theme resolved against the DOM
 *    (`useResolvedTheme`); ticking `Date.now()` for the relative-mode "now"
 *    reference (`useTickingNow`).
 *  - Imperative `{ resetToNow, setWindow, getWindow }` handle.
 *
 *  New surface area vs. the elevation chart:
 *  - `blocks` / `lanes` props (consumer-derived; helpers in
 *    `internal/timeblocks/` produce them from upstream payloads).
 *  - `onBlockClick` — click decoded back to the original `TimeBlock`.
 *  - `xAxisHidden` / `fixedHorizontalMargins` — used by the duo to stack
 *    two charts column-perfect.
 *
 *  The shared time cursor is NOT a chart concern — it's rendered as a DOM
 *  overlay by `<ObservabilityChartDuo>` so cursor movement never triggers a
 *  Plotly relayout (which would fight an in-progress pan). */

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import type { PlotMouseEvent, PlotRelayoutEvent } from 'plotly.js';
import type { Lane, TimeBlock } from '../types.js';
import { bucketBlocks } from '../internal/gantt/layout.js';
import {
  buildGanttData,
  buildGanttLayout,
  decodeGanttClick,
  PLOTLY_CONFIG,
} from './adapter-plotly-gantt.js';
import { relayoutToWindow } from './adapter-plotly.js';
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
import {
  useContainerResizeRelay,
  useLazyPlot,
  useResolvedTheme,
  useRevision,
  useTickingNow,
  type PlotComponent,
} from './_chartShell.js';

/** Which dataset the Gantt is currently showing. The chart doesn't fetch —
 *  the consumer toggles this flag and passes the appropriate `blocks`. */
export type GanttSource = 'observability-window' | 'tasks';

export interface ObservabilityGanttChartProps {
  blocks: ReadonlyArray<TimeBlock>;
  lanes: ReadonlyArray<Lane>;
  /** Tag for the toolbar's source label. Pure passthrough — does not affect
   *  rendering of the blocks themselves. */
  source?: GanttSource;
  /** Controlled inclusive window start. When omitted the chart manages it
   *  internally (defaulting to mount time). */
  start?: Date;
  /** Controlled window length in seconds. When omitted the chart manages it
   *  internally (defaulting to 24 h). */
  duration?: number;
  /** Fires when the user pans / zooms or the imperative ref updates the
   *  window. */
  onWindowChange?: (window: ObservabilityWindow) => void;
  /** Forwarded verbatim from Plotly. Most callers want `onWindowChange`. */
  onRelayout?: (event: PlotRelayoutEvent) => void;
  /** Block click — decoded back to the originating `TimeBlock`. */
  onBlockClick?: (block: TimeBlock, raw: PlotMouseEvent) => void;
  /** Controls x-axis tick labels and hover-template time strings. */
  xAxisLabelMode?: XAxisLabelMode;
  /** Colour theme. Defaults to `'auto'`, which follows `<html class="dark">`. */
  theme?: ChartTheme;
  /** When `false`, locks pan / zoom on the x-axis. Defaults to `true`. */
  interactive?: boolean;
  /** Hides the x-axis (ticks, title). Used by the duo to let the top panel
   *  inherit the bottom panel's axis. */
  xAxisHidden?: boolean;
  /** Locks the left/right paper margins to exact pixel values so a sibling
   *  chart can match them. `null` falls back to `automargin`. */
  fixedHorizontalMargins?: { left: number; right: number } | null;
  /** Override the x-axis title text. */
  xAxisTitle?: string;
  /** Render a row for every lane in `lanes`, even ones with no block in the
   *  current window. Keeps the y-axis stable (and each instrument's row
   *  height fixed) while panning. Defaults to `false`, which prunes empty
   *  lanes. */
  showEmptyLanes?: boolean;
  /** Outer container class. */
  className?: string;
  /** Outer container inline styles. The chart fills the container, so a
   *  height is usually wanted here. */
  style?: CSSProperties;
  /** Plotly bundle override — same shape as `<ObservabilityChart>`'s
   *  `Plot` prop. */
  Plot?: PlotComponent;
}

/** Imperative escape hatch — exposed via `forwardRef`. */
export interface ObservabilityGanttChartHandle {
  /** Recenter on `new Date()`, preserving the current `duration`. */
  resetToNow(): void;
  /** Set the visible window. `durationSeconds` defaults to current. */
  setWindow(start: Date, durationSeconds?: number): void;
  /** Read the current visible window (post-pan/zoom). */
  getWindow(): ObservabilityWindow;
}

export const ObservabilityGanttChart = forwardRef<
  ObservabilityGanttChartHandle,
  ObservabilityGanttChartProps
>(function ObservabilityGanttChart(props, ref) {
  const xAxisLabelMode = props.xAxisLabelMode ?? DEFAULT_X_AXIS_LABEL_MODE;
  const theme = useResolvedTheme(props.theme ?? DEFAULT_CHART_THEME);

  // ── Controlled / uncontrolled window ─────────────────────────────────────
  const windowState = useControllableWindow({
    start: props.start,
    duration: props.duration,
    defaultDuration: DEFAULT_DURATION_SECONDS,
    onChange: props.onWindowChange,
  });

  // ── "Now" reference for relative-mode tick labels ────────────────────────
  const tickingNow = useTickingNow(xAxisLabelMode === 'relative');
  const nowMs =
    xAxisLabelMode === 'relative-to-start'
      ? windowState.start.getTime()
      : tickingNow;

  const windowStop = useMemo(
    () => new Date(windowState.start.getTime() + windowState.duration * 1000),
    [windowState.start, windowState.duration],
  );

  // Clip blocks to the visible window. We do this in the React layer (not in
  // the adapter) so the lane derivation and the click-decode index can both
  // see the same clipped list — the layout's `categoryarray` only enumerates
  // lanes that have at least one in-range block.
  const clippedBlocks = useMemo(
    () => bucketBlocks(props.blocks, [windowState.start, windowStop]),
    [props.blocks, windowState.start, windowStop],
  );

  // ── Plotly data + layout ─────────────────────────────────────────────────
  const { data, laneOrder, blockIndex } = useMemo(
    () =>
      buildGanttData(clippedBlocks, props.lanes, {
        xAxisLabelMode,
        nowMs,
        ...(props.showEmptyLanes !== undefined
          ? { showEmptyLanes: props.showEmptyLanes }
          : {}),
      }),
    [clippedBlocks, props.lanes, xAxisLabelMode, nowMs, props.showEmptyLanes],
  );

  const layout = useMemo(
    () =>
      buildGanttLayout({
        start: windowState.start,
        stop: windowStop,
        laneOrder,
        xAxisLabelMode,
        nowMs,
        theme,
        ...(props.interactive !== undefined ? { interactive: props.interactive } : {}),
        ...(props.xAxisHidden !== undefined ? { xAxisHidden: props.xAxisHidden } : {}),
        ...(props.fixedHorizontalMargins !== undefined
          ? { fixedHorizontalMargins: props.fixedHorizontalMargins }
          : {}),
        ...(props.xAxisTitle !== undefined ? { xAxisTitle: props.xAxisTitle } : {}),
      }),
    [
      windowState.start,
      windowStop,
      laneOrder,
      xAxisLabelMode,
      nowMs,
      theme,
      props.interactive,
      props.xAxisHidden,
      props.fixedHorizontalMargins,
      props.xAxisTitle,
    ],
  );

  const revision = useRevision(layout);

  // ── Imperative handle ────────────────────────────────────────────────────
  const setWindowRef = useRef(windowState.setWindow);
  setWindowRef.current = windowState.setWindow;
  const durationRef = useRef(windowState.duration);
  durationRef.current = windowState.duration;
  const startRef = useRef(windowState.start);
  startRef.current = windowState.start;

  useImperativeHandle(
    ref,
    () => ({
      resetToNow() {
        setWindowRef.current({ start: new Date(), duration: durationRef.current });
      },
      setWindow(start: Date, durationSeconds?: number) {
        setWindowRef.current({
          start,
          duration: durationSeconds ?? durationRef.current,
        });
      },
      getWindow(): ObservabilityWindow {
        return { start: startRef.current, duration: durationRef.current };
      },
    }),
    [],
  );

  // ── Event wiring ─────────────────────────────────────────────────────────
  // Same non-memoised handler pattern as `<ObservabilityChart>` — see that
  // file's note on `react-plotly.js`'s stale-handler caching for the why.
  const propsRef = useRef(props);
  propsRef.current = props;
  const blockIndexRef = useRef(blockIndex);
  blockIndexRef.current = blockIndex;
  const setWindowRefForHandler = useRef(windowState.setWindow);
  setWindowRefForHandler.current = windowState.setWindow;

  const handleClick = props.onBlockClick
    ? (event: PlotMouseEvent) => {
        const onBlockClick = propsRef.current.onBlockClick;
        if (!onBlockClick) return;
        const block = decodeGanttClick(event, blockIndexRef.current);
        if (block) onBlockClick(block, event);
      }
    : undefined;

  const handleRelayout = (event: PlotRelayoutEvent) => {
    const window = relayoutToWindow(event);
    if (window) setWindowRefForHandler.current(window);
    propsRef.current.onRelayout?.(event);
  };

  const Plot = useLazyPlot(props.Plot);
  const containerRef = useContainerResizeRelay();

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
    ...props.style,
  };

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={containerStyle}
      aria-busy={Plot ? undefined : true}
      data-gantt-source={props.source ?? undefined}
    >
      {Plot ? (
        <Plot
          data={data}
          layout={layout}
          revision={revision}
          config={PLOTLY_CONFIG}
          useResizeHandler
          style={{ width: '100%', height: '100%' }}
          onRelayout={handleRelayout}
          {...(handleClick ? { onClick: handleClick } : {})}
        />
      ) : null}
    </div>
  );
});
