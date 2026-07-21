/** Companion legend for `<ObservabilityChart>`. With the flat 2-layer rework
 *  (plan 2026-05-26), the chart draws one altitude curve per `Site` (an
 *  observatory) — this component renders one toggle-able entry per chart
 *  trace.
 *
 *  Interaction mirrors Plotly's native legend:
 *    - single click → toggle this observatory's trace visibility
 *    - double click → "solo": hide every other observatory (or, if this one
 *      is already isolated, restore all observatories to visible)
 *  Hidden observatories render with their colour swatch outlined and the
 *  label struck through + greyed out, again matching Plotly.
 *
 *  A header-level toggle switches the entries between **observatory view**
 *  (slug = the observatory) and **telescope view** (slug column lists the
 *  observatory's telescopes). Both views share the same entries, click
 *  surface, and visibility model — telescopes are informational only,
 *  there's no per-telescope toggle. */

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { PLOTLY_DEFAULT_COLORS, type ChartTheme } from './types.js';
import type { Site } from '../types.js';

export type ObservabilityLegendView = 'observatory' | 'telescope';

export interface ObservabilityChartLegendProps {
  /** Same `Site[]` passed to `<ObservabilityChart>`. Each entry becomes one
   *  legend row. */
  sites: ReadonlyArray<Site>;
  /** Keys of `Site`s currently hidden from the chart. The component keys
   *  rows by `site.key ?? site.id ?? site.slug`; matching entries here
   *  render unchecked. */
  hiddenSites?: ReadonlyArray<number | string>;
  /** Fires when the user toggles an entry. Receives the full next hidden-key
   *  list so callers don't have to diff. Optional so the component can
   *  render in a read-only mode for previews. */
  onHiddenSitesChange?: (next: Array<number | string>) => void;
  /** Override the swatch resolver. Defaults to the same
   *  `PLOTLY_DEFAULT_COLORS` cycle the chart uses, so swatches match the
   *  trace colours by site index. */
  colorForSite?: (site: Site, index: number) => string;
  /** Initial view; defaults to `'observatory'`. Used only when `view` is
   *  not also supplied (uncontrolled mode). */
  defaultView?: ObservabilityLegendView;
  /** Controlled view. When supplied alongside `onViewChange`, the parent
   *  owns view state. */
  view?: ObservabilityLegendView;
  onViewChange?: (next: ObservabilityLegendView) => void;
  /** Match the chart's theme. `auto` follows the `dark` class on `<html>` —
   *  same convention `<ObservabilityChart>` uses. */
  theme?: ChartTheme;
  className?: string;
  style?: CSSProperties;
}

function siteKey(site: Site): string {
  // Prefer the upstream group key (`obs:X` / `tel:X`) when the caller
  // stamped one. `id` alone is unsafe — `observatory` and `telescope`
  // share numeric-id space, so two distinct chart Sites can legitimately
  // have the same `.id`.
  if (site.key) return site.key;
  return site.id != null ? String(site.id) : site.slug;
}

function defaultColor(_site: Site, index: number): string {
  return PLOTLY_DEFAULT_COLORS[index % PLOTLY_DEFAULT_COLORS.length] ?? '#1f77b4';
}

function useResolvedTheme(theme: ChartTheme | undefined): 'light' | 'dark' {
  const resolved = theme ?? 'auto';
  const [value, setValue] = useState<'light' | 'dark'>(() => {
    if (resolved === 'light' || resolved === 'dark') return resolved;
    if (typeof document === 'undefined') return 'light';
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });
  useEffect(() => {
    if (resolved === 'light' || resolved === 'dark') {
      setValue(resolved);
      return;
    }
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const read = () => (root.classList.contains('dark') ? 'dark' : 'light');
    setValue(read());
    const observer = new MutationObserver(() => setValue(read()));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [resolved]);
  return value;
}

export function ObservabilityChartLegend(props: ObservabilityChartLegendProps) {
  const {
    sites,
    hiddenSites,
    onHiddenSitesChange,
    colorForSite = defaultColor,
    defaultView = 'observatory',
    view: controlledView,
    onViewChange,
    theme,
    className,
    style,
  } = props;

  const resolvedTheme = useResolvedTheme(theme);
  const hidden = useMemo(() => new Set((hiddenSites ?? []).map(String)), [hiddenSites]);

  const isControlled = controlledView !== undefined;
  const [internalView, setInternalView] = useState<ObservabilityLegendView>(defaultView);
  const view = isControlled ? controlledView : internalView;
  const setView = (next: ObservabilityLegendView) => {
    if (!isControlled) setInternalView(next);
    onViewChange?.(next);
  };

  // Keyboard focus tracking.
  const [focusIdx, setFocusIdx] = useState(0);
  useEffect(() => {
    if (focusIdx >= sites.length) setFocusIdx(Math.max(0, sites.length - 1));
  }, [sites.length, focusIdx]);

  const toggleSite = (key: string) => {
    if (!onHiddenSitesChange) return;
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onHiddenSitesChange(Array.from(next));
  };

  /** Isolate this site (Plotly's double-click semantics): hide every other
   *  site so only the clicked one renders. If the clicked site is already
   *  the only visible one, restore all sites to visible. */
  const soloSite = (key: string) => {
    if (!onHiddenSitesChange) return;
    const selfVisible = !hidden.has(key);
    const otherIds: Array<number | string> = [];
    let othersAllHidden = true;
    for (const site of sites) {
      const k = siteKey(site);
      if (k === key) continue;
      otherIds.push(k);
      if (!hidden.has(k)) othersAllHidden = false;
    }
    if (selfVisible && othersAllHidden) {
      onHiddenSitesChange([]);
    } else {
      onHiddenSitesChange(otherIds);
    }
  };

  // Click vs. double-click debounce. The browser fires `click` before
  // `dblclick`, so we defer single-toggles by ~220 ms and cancel the
  // pending toggle when a dblclick arrives in time. Same window Plotly's
  // own legend uses.
  const clickTimerRef = useRef<number | null>(null);
  const cancelPendingClick = () => {
    if (clickTimerRef.current != null) {
      window.clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
  };
  useEffect(() => () => cancelPendingClick(), []);

  const entryRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  useEffect(() => {
    const node = entryRefs.current.get(focusIdx);
    if (node && document.activeElement !== node) {
      const root = node.closest('[role="listbox"]');
      if (root && root.contains(document.activeElement)) {
        node.focus();
      }
    }
  }, [focusIdx]);

  const handleKeyDown = (idx: number, key: string) => (event: KeyboardEvent<HTMLLIElement>) => {
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        setFocusIdx(Math.min(sites.length - 1, idx + 1));
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        setFocusIdx(Math.max(0, idx - 1));
        return;
      }
      case ' ':
      case 'Enter': {
        event.preventDefault();
        toggleSite(key);
        return;
      }
      default:
        return;
    }
  };

  const containerStyle: CSSProperties = {
    fontSize: '0.75rem',
    color: resolvedTheme === 'dark' ? '#e5e7eb' : '#1f2937',
    ...style,
  };

  const showAll = () => onHiddenSitesChange?.([]);

  const headerIconButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: 0,
    margin: 0,
    cursor: 'pointer',
    color: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    width: 16,
    flex: 'none',
    opacity: 0.75,
  };

  const segBase: CSSProperties = {
    background: 'transparent',
    border: '1px solid',
    borderColor: resolvedTheme === 'dark' ? '#374151' : '#d1d5db',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: '0.7rem',
    padding: '2px 8px',
    lineHeight: 1.4,
  };
  const segActive: CSSProperties = {
    ...segBase,
    background: resolvedTheme === 'dark' ? '#1f2937' : '#e5e7eb',
    fontWeight: 600,
  };

  const renderHeader = () => {
    const canShowAll = sites.length > 0 && !!onHiddenSitesChange;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 6,
          padding: '2px 4px',
        }}
      >
        {canShowAll ? (
          <button
            type="button"
            title="Show all"
            aria-label="Show all observatory series"
            onClick={showAll}
            style={headerIconButtonStyle}
          >
            <i className="fa-solid fa-eye" aria-hidden />
          </button>
        ) : (
          <span aria-hidden style={{ display: 'inline-block', width: 16, flex: 'none' }} />
        )}
        <div style={{ flex: 1 }} />
        <div role="tablist" aria-label="Legend grouping" style={{ display: 'inline-flex' }}>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'observatory'}
            onClick={() => setView('observatory')}
            style={{
              ...(view === 'observatory' ? segActive : segBase),
              borderTopLeftRadius: 4,
              borderBottomLeftRadius: 4,
              borderRight: 'none',
            }}
          >
            Observatory
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'telescope'}
            onClick={() => setView('telescope')}
            style={{
              ...(view === 'telescope' ? segActive : segBase),
              borderTopRightRadius: 4,
              borderBottomRightRadius: 4,
            }}
          >
            Telescope
          </button>
        </div>
      </div>
    );
  };

  if (sites.length === 0) {
    return (
      <div
        className={className}
        style={containerStyle}
        role="group"
        aria-label="Observatories"
      >
        {renderHeader()}
        <div style={{ opacity: 0.6 }}>No observatories</div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={containerStyle}
      role="group"
      aria-label="Observatories"
    >
      {renderHeader()}
      <ul
        role="listbox"
        aria-label="Observatory series"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {sites.map((site, idx) => {
          const key = siteKey(site);
          const visible = !hidden.has(key);
          const isFocus = idx === focusIdx;
          const swatch = colorForSite(site, idx);
          const setRef = (node: HTMLLIElement | null) => {
            if (node) entryRefs.current.set(idx, node);
            else entryRefs.current.delete(idx);
          };
          const onClickEntry = (event: ReactMouseEvent<HTMLLIElement>) => {
            setFocusIdx(idx);
            cancelPendingClick();
            if (event.detail > 1) return;
            clickTimerRef.current = window.setTimeout(() => {
              clickTimerRef.current = null;
              toggleSite(key);
            }, 220);
          };
          const onDoubleClickEntry = (event: ReactMouseEvent<HTMLLIElement>) => {
            event.preventDefault();
            cancelPendingClick();
            soloSite(key);
          };

          const itemStyle: CSSProperties = {
            display: 'flex',
            alignItems: 'stretch',
            gap: 8,
            padding: '4px 6px',
            border: '1px solid',
            borderColor: resolvedTheme === 'dark' ? '#374151' : '#d1d5db',
            borderRadius: 6,
            cursor: onHiddenSitesChange ? 'pointer' : 'default',
            outline: isFocus ? '1px solid currentColor' : 'none',
            userSelect: 'none',
            opacity: visible ? 1 : 0.6,
          };

          return (
            <li
              key={key}
              ref={setRef}
              role="option"
              aria-selected={visible}
              {...(onHiddenSitesChange ? { 'aria-checked': visible } : {})}
              tabIndex={isFocus ? 0 : -1}
              style={itemStyle}
              onClick={onHiddenSitesChange ? onClickEntry : undefined}
              onDoubleClick={onHiddenSitesChange ? onDoubleClickEntry : undefined}
              onKeyDown={onHiddenSitesChange ? handleKeyDown(idx, key) : undefined}
            >
              {view === 'observatory' ? (
                <ObservatoryEntry site={site} swatch={swatch} visible={visible} />
              ) : (
                <TelescopeEntry site={site} swatch={swatch} visible={visible} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Swatch({ color, visible, centered }: { color: string; visible: boolean; centered: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 40,
        height: 10,
        borderRadius: 2,
        border: `1px solid ${color}`,
        background: visible ? color : 'transparent',
        opacity: visible ? 1 : 0.6,
        flex: 'none',
        alignSelf: centered ? 'center' : 'center',
      }}
    />
  );
}

function ObservatoryEntry({
  site,
  swatch,
  visible,
}: {
  site: Site;
  swatch: string;
  visible: boolean;
}) {
  return (
    <>
      <Swatch color={swatch} visible={visible} centered />
      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: 'right',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textDecoration: visible ? 'none' : 'line-through',
          alignSelf: 'center',
        }}
      >
        {site.slug || site.name}
      </span>
    </>
  );
}

function TelescopeEntry({
  site,
  swatch,
  visible,
}: {
  site: Site;
  swatch: string;
  visible: boolean;
}) {
  const telescopes = site.telescopes ?? [];
  // Fallback to the site's own slug when no telescope children exist —
  // matches the orphan-telescope case where the telescope IS the Site.
  const labels =
    telescopes.length > 0 ? telescopes.map((t) => t.slug || t.name) : [site.slug || site.name];
  return (
    <>
      <Swatch color={swatch} visible={visible} centered />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {labels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            style={{
              textAlign: 'right',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textDecoration: visible ? 'none' : 'line-through',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </>
  );
}
