/** Public surface for `@skynet-rtn/observability-chart/react`.
 *
 *  Three entry points:
 *  - `<ObservabilityChart>` — drop-in chart component (`forwardRef` to
 *    `ObservabilityChartHandle` for imperative control).
 *  - `<ObservabilityChartToolbar>` — opt-in companion toolbar that drives
 *    the chart's controlled `start` / `duration` / `xAxisLabelMode` props.
 *  - `useObservabilitySeries()` — headless hook returning the framework-agnostic
 *    dataset, for custom layouts.
 *
 *  All Plotly-specific glue lives in `adapter-plotly.ts` and is also exported
 *  so callers that want to mount Plotly themselves (e.g. via their own
 *  `<Plot>` from `react-plotly.js/factory`) can reuse the same data + layout
 *  builders. */

export { ObservabilityChart } from './ObservabilityChart.js';
export type { ObservabilityChartPropsWithPlot } from './ObservabilityChart.js';
export type {
  ChartTheme,
  ResolvedChartTheme,
  ObservabilityChartHandle,
  ObservabilityChartProps,
  XAxisLabelMode,
} from './types.js';
export {
  ObservabilityChartToolbar,
  DEFAULT_DURATION_PRESETS,
} from './ObservabilityChartToolbar.js';
export type {
  DurationPreset,
  GanttSourceValue,
  ObservabilityChartToolbarProps,
} from './ObservabilityChartToolbar.js';
export { useObservabilitySeries } from './useObservabilitySeries.js';
export { useControllableWindow } from './useControllableWindow.js';
export type {
  ControllableWindow,
  UseControllableWindowOptions,
  ObservabilityWindow,
} from './useControllableWindow.js';
export {
  buildLayout,
  datasetsToPlotData,
  decodeClickPoint,
  formatRelativeFromNowMs,
  formatRelativeHours,
  PLOTLY_CONFIG,
  relayoutToWindow,
} from './adapter-plotly.js';
export type {
  BuildLayoutOptions,
  DatasetsToPlotDataOptions,
} from './adapter-plotly.js';
export {
  DEFAULT_CHART_THEME,
  DEFAULT_CONSTRAINTS,
  DEFAULT_DURATION_SECONDS,
  DEFAULT_X_AXIS_LABEL_MODE,
  PLOTLY_DEFAULT_COLORS,
} from './types.js';
export type {
  UseObservabilitySeriesResult,
  ObservabilityClickEvent,
} from './types.js';

export { ObservabilityChartLegend } from './ObservabilityChartLegend.js';
export type {
  ObservabilityChartLegendProps,
  ObservabilityLegendView,
} from './ObservabilityChartLegend.js';

// ─── Gantt chart (added in Phase 3 of the Gantt plan) ──────────────────────
export { ObservabilityGanttChart } from './ObservabilityGanttChart.js';
export type {
  GanttSource,
  ObservabilityGanttChartHandle,
  ObservabilityGanttChartProps,
} from './ObservabilityGanttChart.js';

export {
  buildGanttData,
  buildGanttLayout,
  decodeGanttClick,
} from './adapter-plotly-gantt.js';
export type {
  BuildGanttDataOptions,
  BuildGanttDataResult,
  BuildGanttLayoutOptions,
} from './adapter-plotly-gantt.js';

// ─── Duo orchestrator (Phase 4) ────────────────────────────────────────────
export { ObservabilityChartDuo } from './ObservabilityChartDuo.js';
export type { ObservabilityChartDuoProps } from './ObservabilityChartDuo.js';

export type { Lane, TimeBlock, TimeBlockKind } from '../types.js';
export {
  deriveLanes,
  requestTypeToKind,
} from '../internal/timeblocks/index.js';
export type {
  DeriveLanesOptions,
  LaneMetaEntry,
} from '../internal/timeblocks/index.js';
