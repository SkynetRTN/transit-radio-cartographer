/** Thin React wrapper around the framework-agnostic observability core.
 *
 *  - Memoises `computeObservability(...)` via `useObservabilitySeries`.
 *  - Maintains a controlled/uncontrolled time window via
 *    `useControllableWindow` (`start` / `duration` are controlled props when
 *    supplied, otherwise the chart owns them internally; mixed modes work).
 *  - Translates Plotly `onRelayout` payloads into `{ start, duration }` and
 *    forwards them through `onWindowChange` so a parent toolbar can drive the
 *    chart.
 *  - Exposes an imperative `{ resetToNow, setWindow, getWindow }` handle via
 *    `forwardRef` for callers that don't have a place to lift state.
 *  - Renders `<Plot>` from `react-plotly.js` (lazy-loaded on mount so SSR and
 *    the first hydration paint don't crash on the Plotly bundle's `window`
 *    access at module-eval time). Consumers pinning a different Plotly bundle
 *    can pass a pre-built `Plot` component via the `Plot` prop.
 *  - Bumps a `revision` counter passed to `<Plot>` whenever the layout's
 *    range / mode / now-reference changes, so Plotly re-applies `xaxis.range`
 *    instead of silently ignoring it (Plotly only re-renders layout when
 *    `revision` changes). */

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react';
import type { PlotMouseEvent, PlotRelayoutEvent } from 'plotly.js';
import {
  buildLayout,
  datasetsToPlotData,
  decodeClickPoint,
  PLOTLY_CONFIG,
  relayoutToWindow,
} from './adapter-plotly.js';
import {
  DEFAULT_CHART_THEME,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_X_AXIS_LABEL_MODE,
  type ObservabilityChartHandle,
  type ObservabilityChartProps,
  type ObservabilityClickEvent,
} from './types.js';
import { useControllableWindow, type ObservabilityWindow } from './useControllableWindow.js';
import { useObservabilitySeries } from './useObservabilitySeries.js';
import {
  useContainerResizeRelay,
  useLazyPlot,
  useResolvedTheme,
  useRevision,
  useTickingNow,
  type PlotComponent,
} from './_chartShell.js';

export interface ObservabilityChartPropsWithPlot extends ObservabilityChartProps {
  /** Override the default Plotly `<Plot>` component. Useful when the host app
   *  pins a specific Plotly bundle via `react-plotly.js/factory` (e.g. the
   *  website-react app uses `plotly.js-dist-min`). When omitted, the adapter
   *  lazy-imports `react-plotly.js` on mount. */
  Plot?: PlotComponent;
}

export const ObservabilityChart = forwardRef<
  ObservabilityChartHandle,
  ObservabilityChartPropsWithPlot
>(function ObservabilityChart(props, ref) {
  const xAxisLabelMode = props.xAxisLabelMode ?? DEFAULT_X_AXIS_LABEL_MODE;
  const theme = useResolvedTheme(props.theme ?? DEFAULT_CHART_THEME);

  // ── Controlled / uncontrolled window ──────────────────────────────────────
  const windowState = useControllableWindow({
    start: props.start,
    duration: props.duration,
    defaultDuration: DEFAULT_DURATION_SECONDS,
    onChange: props.onWindowChange,
  });

  // Pass the *resolved* window into the headless hook. This keeps
  // `useObservabilitySeries` decoupled from the controllable-state machinery —
  // it just sees `start` / `duration` like any other call site.
  const resolvedProps = useMemo<ObservabilityChartProps>(
    () => ({ ...props, start: windowState.start, duration: windowState.duration }),
    [props, windowState.start, windowState.duration],
  );

  const { datasets, startJd, stopJd, constraints } = useObservabilitySeries(resolvedProps);

  // ── "Now" reference for the relative tick labels ─────────────────────────
  //
  //   - `'relative'` ticks at hours-from-wall-clock, so `nowMs` is a
  //     coarsely-polled `Date.now()` (re-renders once a minute via
  //     `useTickingNow`).
  //   - `'relative-to-start'` ticks at hours-from-`start`, so `nowMs` is the
  //     resolved window start. No polling — the reference moves whenever the
  //     controlled `start` prop moves.
  //   - `'utc'` doesn't use `nowMs`, so the value passed below is inert.
  const tickingNow = useTickingNow(xAxisLabelMode === 'relative');
  const nowMs =
    xAxisLabelMode === 'relative-to-start'
      ? windowState.start.getTime()
      : tickingNow;

  // ── Plotly data + layout ──────────────────────────────────────────────────
  const data = useMemo(
    () =>
      datasetsToPlotData(datasets, {
        xAxisLabelMode,
        nowMs,
        ...(props.hiddenSites ? { hiddenSites: props.hiddenSites } : {}),
      }),
    [datasets, xAxisLabelMode, nowMs, props.hiddenSites],
  );
  const layout = useMemo(
    () =>
      buildLayout({
        startJd,
        stopJd,
        minTargetAltitude: constraints.minTargetAltitude,
        maxTargetAltitude: constraints.maxTargetAltitude,
        xAxisLabelMode,
        nowMs,
        theme,
        ...(props.legendMode ? { legendMode: props.legendMode } : {}),
        ...(props.interactive !== undefined ? { interactive: props.interactive } : {}),
        ...(props.xAxisTitle !== undefined ? { xAxisTitle: props.xAxisTitle } : {}),
        ...(props.xAxisHidden !== undefined ? { xAxisHidden: props.xAxisHidden } : {}),
        ...(props.fixedHorizontalMargins !== undefined
          ? { fixedHorizontalMargins: props.fixedHorizontalMargins }
          : {}),
      }),
    [
      startJd,
      stopJd,
      constraints.minTargetAltitude,
      constraints.maxTargetAltitude,
      xAxisLabelMode,
      nowMs,
      theme,
      props.legendMode,
      props.interactive,
      props.xAxisTitle,
      props.xAxisHidden,
      props.fixedHorizontalMargins,
    ],
  );

  // Plotly only re-applies layout (incl. `xaxis.range`) when `revision`
  // changes. Bump on every layout identity change so external setWindow /
  // toolbar updates take effect.
  const revision = useRevision(layout);

  // ── Imperative handle ─────────────────────────────────────────────────────
  // Keep `setWindow` reachable from the ref methods without forcing them to
  // depend on the latest `windowState` closure.
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

  // ── Event wiring ──────────────────────────────────────────────────────────
  // NOTE: handlers are deliberately NOT memoised. `react-plotly.js` v2 caches
  // the last attached handler in `this.handlers` and only re-attaches when the
  // prop reference changes (factory.js `syncEventHandlers`). After any
  // `Plotly.purge` (StrictMode unmount/remount cycle, route navigation that
  // tears down and recreates the chart, …) Plotly's own listener registry is
  // wiped but `this.handlers` still holds the stale reference — so a memoised
  // prop would silently skip re-attach and the chart would render with zero
  // relayout/click listeners. Building a new closure each render forces
  // `prop !== handler` and reattaches, which costs essentially nothing because
  // both handlers immediately read live values from `propsRef`.
  const propsRef = useRef(props);
  propsRef.current = props;
  const datasetsRef = useRef(datasets);
  datasetsRef.current = datasets;
  const setWindowRefForHandler = useRef(windowState.setWindow);
  setWindowRefForHandler.current = windowState.setWindow;

  const handleClick = props.onPointClick
    ? (event: PlotMouseEvent) => {
        const onPointClick = propsRef.current.onPointClick;
        if (!onPointClick) return;
        const decoded = decodeClickPoint(event, datasetsRef.current);
        if (decoded) {
          const payload: ObservabilityClickEvent = { raw: event, ...decoded };
          onPointClick(payload);
        }
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
    // Match the resolved Plotly paper background so a theme-mismatched
    // placeholder doesn't flash white during the lazy-load / hydration window.
    backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
    ...props.style,
  };

  return (
    <div
      ref={containerRef}
      className={props.className}
      style={containerStyle}
      aria-busy={Plot ? undefined : true}
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
