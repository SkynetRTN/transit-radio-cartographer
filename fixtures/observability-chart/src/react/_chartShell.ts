/** Shared plumbing for the React chart components.
 *
 *  Both `<ObservabilityChart>` and `<ObservabilityGanttChart>` need the same
 *  set of hooks — lazy-loading `react-plotly.js`, observing container size,
 *  resolving the `auto` theme against the DOM, bumping a `revision` counter so
 *  Plotly re-applies layout, and a coarse ticking-`Date.now()` for the
 *  relative-mode tick labels. Keeping them in one module means a fix to any of
 *  them (cache, SSR, StrictMode, …) lands once.
 *
 *  No behaviour change relative to the previous inline definitions in
 *  `ObservabilityChart.tsx`. */

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type RefObject,
} from 'react';
import type {
  Config,
  Data,
  Layout,
  PlotMouseEvent,
  PlotRelayoutEvent,
} from 'plotly.js';
import type { ChartTheme, ResolvedChartTheme } from './types.js';

/** Subset of `react-plotly.js`'s `Plot` props we actually pass. Declared
 *  inline so the consumer-supplied `Plot` is just structurally checked — the
 *  package doesn't have to pull `@types/react-plotly.js` into the build of any
 *  consumer that injects its own Plot. */
export type PlotComponent = ComponentType<{
  data: Data[];
  layout: Partial<Layout>;
  revision?: number;
  config?: Partial<Config>;
  style?: CSSProperties;
  useResizeHandler?: boolean;
  onClick?: (event: PlotMouseEvent) => void;
  onHover?: (event: PlotMouseEvent) => void;
  onUnhover?: (event: PlotMouseEvent) => void;
  onRelayout?: (event: PlotRelayoutEvent) => void;
}>;

/** Refresh interval for the relative-mode "now" reference. One minute matches
 *  the plan's recommendation — coarse enough that the chart isn't constantly
 *  re-rendering, fine enough that "+2h" labels don't drift visibly. */
export const RELATIVE_NOW_REFRESH_MS = 60_000;

/** Observes the chart container and relays size changes to Plotly by
 *  dispatching a `window` resize event. `useResizeHandler` on `<Plot>` only
 *  listens to *window* resize, so a container that finishes laying out after
 *  the Plot mounts (the common case on first paint — flex/grid reflows,
 *  lazy-loaded Plot bundle, panel toggles) leaves the chart stuck at its
 *  initial measured size until something else triggers a re-render.
 *  ResizeObserver catches every container-size change and pipes it onto the
 *  listener Plotly already has wired up. SSR-safe: the effect no-ops when
 *  `ResizeObserver` isn't defined. */
export function useContainerResizeRelay(): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref as RefObject<HTMLDivElement>;
}

/** Incrementing counter for `<Plot revision={…}>`. Bumps whenever the layout
 *  reference changes (which itself only changes when its memo inputs
 *  change), forcing Plotly to re-apply the layout.
 *
 *  Bumps via `useEffect` so the value lands in the second render cycle.
 *  `react-plotly.js` already triggers `Plotly.react()` on a layout-reference
 *  change without needing a revision bump, so the second render is a
 *  no-op-but-cheap safety belt rather than the primary trigger. A previous
 *  experiment bumped the revision synchronously during render — that fired
 *  an extra `Plotly.react()` call mid-pan whenever any other state changed
 *  (e.g. a cursor update from a parent mousemove handler), which fought
 *  with Plotly's internal drag state and snapped the chart back. */
export function useRevision(layout: Partial<Layout>): number {
  const [revision, setRevision] = useState(0);
  const lastLayoutRef = useRef(layout);
  useEffect(() => {
    if (lastLayoutRef.current !== layout) {
      lastLayoutRef.current = layout;
      setRevision((r) => r + 1);
    }
  }, [layout]);
  return revision;
}

/** `Date.now()` that re-renders on a coarse interval. The interval only runs
 *  when `active` is true (i.e. relative mode), so the UTC code path doesn't
 *  pay the re-render tax. */
export function useTickingNow(active: boolean): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // Re-sync immediately on activation so a freshly-toggled relative mode
    // doesn't show a stale `nowMs` for up to a minute.
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), RELATIVE_NOW_REFRESH_MS);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/** Resolve a `ChartTheme` against the DOM. `'light'` / `'dark'` are passed
 *  through; `'auto'` follows the `dark` class on `<html>` and updates
 *  reactively via a `MutationObserver` so the chart re-renders when the
 *  website-react `ThemeProvider` flips themes. SSR-safe: assumes `'light'` on
 *  the server and rehydrates after mount. */
export function useResolvedTheme(theme: ChartTheme): ResolvedChartTheme {
  const [resolved, setResolved] = useState<ResolvedChartTheme>(() => {
    if (theme === 'light' || theme === 'dark') return theme;
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'light' || theme === 'dark') {
      setResolved(theme);
      return;
    }
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const read = () => (root.classList.contains('dark') ? 'dark' : 'light');
    setResolved(read());
    const observer = new MutationObserver(() => setResolved(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [theme]);

  return resolved;
}

/** Use the consumer-supplied `Plot` directly when present; otherwise lazy-load
 *  `react-plotly.js`'s default `Plot` on mount. The default export of
 *  `react-plotly.js` evaluates `window` at module load, which crashes SSR —
 *  the dynamic import defers evaluation to the client. */
export function useLazyPlot(
  override: PlotComponent | undefined,
): PlotComponent | null {
  const [loaded, setLoaded] = useState<PlotComponent | null>(null);
  useEffect(() => {
    if (override) return;
    let cancelled = false;
    void import('react-plotly.js').then((mod) => {
      if (cancelled) return;
      // Cast: react-plotly.js's default export accepts a strict superset of
      // PlotParams; our `PlotComponent` is the slice we actually use.
      setLoaded(() => mod.default as unknown as PlotComponent);
    });
    return () => {
      cancelled = true;
    };
  }, [override]);
  return override ?? loaded;
}
