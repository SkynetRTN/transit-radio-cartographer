/** Pure-function tests for the Plotly adapter helpers added in Phase 4:
 *  the `onRelayout`→`{start, duration}` translation and the relative-time
 *  formatter the relative x-axis label mode + hover template both use. */

import { describe, it, expect } from 'vitest';
import type { PlotData, PlotRelayoutEvent } from 'plotly.js';
import {
  buildLayout,
  datasetsToPlotData,
  formatRelativeFromNowMs,
  formatRelativeHours,
  relayoutToWindow,
} from './adapter-plotly.js';
import type { ObservabilityDataset, Site } from '../types.js';

describe('relayoutToWindow', () => {
  it('parses indexed range keys (the form Plotly emits during a pan)', () => {
    const event = {
      'xaxis.range[0]': '2026-05-19 00:00:00.0000',
      'xaxis.range[1]': '2026-05-20 00:00:00.0000',
    } as unknown as PlotRelayoutEvent;
    const out = relayoutToWindow(event);
    expect(out).not.toBeNull();
    expect(out!.duration).toBeCloseTo(86_400, 0);
    expect(out!.start.getUTCFullYear()).toBe(2026);
    expect(out!.start.getUTCMonth()).toBe(4);
    expect(out!.start.getUTCDate()).toBe(19);
  });

  it('parses tuple-form range (used on autoscale + some zoom flows)', () => {
    const startMs = Date.UTC(2026, 4, 19, 12, 0, 0);
    const stopMs = startMs + 6 * 3_600_000; // 6 hours
    const event = {
      'xaxis.range': [new Date(startMs), new Date(stopMs)],
    } as unknown as PlotRelayoutEvent;
    const out = relayoutToWindow(event);
    expect(out).not.toBeNull();
    expect(out!.duration).toBe(21_600);
    expect(out!.start.getTime()).toBe(startMs);
  });

  it('prefers the indexed keys when both forms are present', () => {
    // Real-world: Plotly occasionally emits both; the indexed-key values are
    // the freshest because they reflect a single-bound update.
    const oldStartMs = Date.UTC(2020, 0, 1);
    const oldStopMs = Date.UTC(2020, 0, 2);
    const newStartMs = Date.UTC(2026, 5, 1);
    const newStopMs = Date.UTC(2026, 5, 2);
    const event = {
      'xaxis.range': [new Date(oldStartMs), new Date(oldStopMs)],
      'xaxis.range[0]': new Date(newStartMs),
      'xaxis.range[1]': new Date(newStopMs),
    } as unknown as PlotRelayoutEvent;
    const out = relayoutToWindow(event);
    expect(out!.start.getTime()).toBe(newStartMs);
    expect(out!.duration).toBe(86_400);
  });

  it('returns null for non-x-axis relayout events (autosize, drag-end)', () => {
    const autosize = { autosize: true } as unknown as PlotRelayoutEvent;
    expect(relayoutToWindow(autosize)).toBeNull();
    const dragmode = { dragmode: 'pan' } as unknown as PlotRelayoutEvent;
    expect(relayoutToWindow(dragmode)).toBeNull();
  });

  it('returns null for malformed / non-finite ranges', () => {
    const event = {
      'xaxis.range[0]': 'not-a-date',
      'xaxis.range[1]': 'also-not-a-date',
    } as unknown as PlotRelayoutEvent;
    expect(relayoutToWindow(event)).toBeNull();
  });

  it('returns null for zero / inverted ranges (degenerate)', () => {
    const t = Date.UTC(2026, 0, 1);
    const zero = {
      'xaxis.range[0]': new Date(t),
      'xaxis.range[1]': new Date(t),
    } as unknown as PlotRelayoutEvent;
    expect(relayoutToWindow(zero)).toBeNull();
    const inverted = {
      'xaxis.range[0]': new Date(t + 1_000),
      'xaxis.range[1]': new Date(t),
    } as unknown as PlotRelayoutEvent;
    expect(relayoutToWindow(inverted)).toBeNull();
  });
});

describe('formatRelativeHours', () => {
  it('renders integer hours with sign', () => {
    expect(formatRelativeHours(2)).toBe('+2h');
    expect(formatRelativeHours(-3)).toBe('-3h');
    expect(formatRelativeHours(24)).toBe('+24h');
  });

  it('renders "now" inside the ±1 minute band', () => {
    expect(formatRelativeHours(0)).toBe('now');
    expect(formatRelativeHours(1 / 120)).toBe('now'); // ~30 seconds
    expect(formatRelativeHours(-1 / 120)).toBe('now');
  });

  it('renders sub-hour offsets in minutes', () => {
    expect(formatRelativeHours(0.5)).toBe('+30m');
    expect(formatRelativeHours(-0.25)).toBe('-15m');
  });

  it('renders fractional hours as "Xh Ym"', () => {
    expect(formatRelativeHours(1.5)).toBe('+1h 30m');
    expect(formatRelativeHours(-2.25)).toBe('-2h 15m');
  });

  it('rounds away the 60-minute carry', () => {
    expect(formatRelativeHours(2.999)).toBe('+3h');
  });
});

describe('formatRelativeFromNowMs', () => {
  it('matches formatRelativeHours after the ms→h conversion', () => {
    expect(formatRelativeFromNowMs(2 * 3_600_000)).toBe('+2h');
    expect(formatRelativeFromNowMs(-30 * 60_000)).toBe('-30m');
    expect(formatRelativeFromNowMs(0)).toBe('now');
  });
});

describe('buildLayout theme', () => {
  const baseOpts = {
    startJd: 2_460_000.0,
    stopJd: 2_460_001.0,
    minTargetAltitude: 30,
  };

  it('emits light paper/plot backgrounds by default (no theme opt-in)', () => {
    const layout = buildLayout(baseOpts);
    expect(layout.paper_bgcolor).toBe('#ffffff');
    expect(layout.plot_bgcolor).toBe('#ffffff');
    // Light minAlt overlay matches the historical Angular fill.
    expect(layout.shapes?.[0]?.fillcolor).toBe('#d3d3d3');
  });

  it('emits dark paper/plot backgrounds and dark grid for theme="dark"', () => {
    const layout = buildLayout({ ...baseOpts, theme: 'dark' });
    expect(layout.paper_bgcolor).toBe('#18181b');
    expect(layout.plot_bgcolor).toBe('#27272a');
    expect(layout.font?.color).toBe('#e5e7eb');
    // Axis grid should be the zinc-700 we picked for the dark palette.
    const yaxis = layout.yaxis as { gridcolor?: string } | undefined;
    expect(yaxis?.gridcolor).toBe('#3f3f46');
    // The unobservable-region rect uses the darker overlay fill in dark mode.
    expect(layout.shapes?.[0]?.fillcolor).toBe('#000000');
  });

  it('emits showlegend: false when legendMode is "none"', () => {
    const layout = buildLayout({ ...baseOpts, legendMode: 'none' });
    expect(layout.showlegend).toBe(false);
  });

  it('keeps showlegend: true by default (legendMode omitted)', () => {
    const layout = buildLayout(baseOpts);
    expect(layout.showlegend).toBe(true);
  });

  it('locks the x-axis range and disables dragmode when interactive=false', () => {
    const layout = buildLayout({ ...baseOpts, interactive: false });
    expect(layout.dragmode).toBe(false);
    const xaxis = layout.xaxis as { fixedrange?: boolean } | undefined;
    expect(xaxis?.fixedrange).toBe(true);
  });

  it('keeps dragmode "pan" by default (interactive omitted)', () => {
    const layout = buildLayout(baseOpts);
    expect(layout.dragmode).toBe('pan');
  });

  it('honours xAxisTitle override in utc mode', () => {
    const layout = buildLayout({ ...baseOpts, xAxisTitle: 'custom label' });
    const xaxis = layout.xaxis as { title?: { text?: string } } | undefined;
    expect(xaxis?.title?.text).toBe('custom label');
  });

  it('honours xAxisTitle override in relative mode', () => {
    const layout = buildLayout({
      ...baseOpts,
      xAxisLabelMode: 'relative',
      nowMs: Date.UTC(2026, 4, 19, 0, 0, 0),
      xAxisTitle: 'hours from current sky view',
    });
    const xaxis = layout.xaxis as { title?: { text?: string } } | undefined;
    expect(xaxis?.title?.text).toBe('hours from current sky view');
  });

  it('applies the dark palette to the relative-mode x-axis as well', () => {
    const layout = buildLayout({
      ...baseOpts,
      theme: 'dark',
      xAxisLabelMode: 'relative',
      nowMs: Date.UTC(2026, 4, 19, 0, 0, 0),
    });
    const xaxis = layout.xaxis as
      | { gridcolor?: string; tickfont?: { color?: string } }
      | undefined;
    expect(xaxis?.gridcolor).toBe('#3f3f46');
    expect(xaxis?.tickfont?.color).toBe('#a1a1aa');
  });

  it('omits the max-altitude rect when maxTargetAltitude is unset or ≥90', () => {
    expect(buildLayout(baseOpts).shapes).toHaveLength(1);
    expect(buildLayout({ ...baseOpts, maxTargetAltitude: 90 }).shapes).toHaveLength(1);
  });

  it('adds a second grey rect from maxTargetAltitude up to the top of the chart', () => {
    const layout = buildLayout({ ...baseOpts, maxTargetAltitude: 75 });
    expect(layout.shapes).toHaveLength(2);
    const maxRect = layout.shapes?.[1];
    expect(maxRect?.y0).toBe(75);
    expect(maxRect?.y1).toBe(90.5);
    // Same fill / opacity as the min-altitude rect for a symmetric overlay.
    expect(maxRect?.fillcolor).toBe(layout.shapes?.[0]?.fillcolor);
    expect(maxRect?.opacity).toBe(layout.shapes?.[0]?.opacity);
  });

  it('treats relative-to-start as a relative x-axis (tickvals, not date ticks)', () => {
    const layout = buildLayout({
      ...baseOpts,
      xAxisLabelMode: 'relative-to-start',
      // Caller passes `start.getTime()` as nowMs in this mode. `2_460_000.0` JD
      // ≈ 2023-02-25 12:00 UT — using that as both the window start AND nowMs
      // anchors the 0-offset tick exactly on the window start.
      nowMs: 1_677_326_400_000,
    });
    const xaxis = layout.xaxis as
      | { tickmode?: string; ticktext?: string[]; title?: { text?: string } }
      | undefined;
    expect(xaxis?.tickmode).toBe('array');
    expect((xaxis?.ticktext ?? []).length).toBeGreaterThan(0);
  });
});

describe('datasetsToPlotData hiddenSites', () => {
  function makeDataset(site: Site): ObservabilityDataset {
    const empty = { kind: 'visible' as const, xs: [], ys: [], airmass: [] };
    return {
      site,
      series: {
        visible: { ...empty, kind: 'visible' },
        sunElevation: { ...empty, kind: 'sunElevation' },
        minSunElevationDeg: { ...empty, kind: 'minSunElevationDeg' },
        sunSeparation: { ...empty, kind: 'sunSeparation' },
        maxSunSeparation: { ...empty, kind: 'maxSunSeparation' },
        earth: { ...empty, kind: 'earth' },
        moon: { ...empty, kind: 'moon' },
        moonPhase: { ...empty, kind: 'moonPhase' },
        minElevationDeg: { ...empty, kind: 'minElevationDeg' },
        maxElevationDeg: { ...empty, kind: 'maxElevationDeg' },
      },
      maxAltitude: 90,
    };
  }
  const ctio: Site = {
    id: 100,
    uid: 'site-100',
    slug: 'ctio',
    name: 'CTIO',
    location: 'Chile',
    countryCode: 'CL',
    latitudeDeg: -30.169,
    longitudeDeg: -70.806,
    elevationM: 2200,
  } as Site;
  const yerkes: Site = { ...ctio, id: 101, uid: 'site-101', slug: 'yerkes', name: 'Yerkes' };

  // The adapter appends a trailing anchor trace bound to yaxis: 'y2' so the
  // overlaying airmass axis actually renders. Tests below ignore that trace
  // by filtering on `name` (the anchor has no name).
  const namedSiteTraces = (data: ReturnType<typeof datasetsToPlotData>) =>
    (data as Partial<PlotData>[]).filter((d) => typeof d.name === 'string');

  it('stamps visible:"legendonly" on every kind-trace whose site.id is in hiddenSites', () => {
    const data = datasetsToPlotData([makeDataset(ctio), makeDataset(yerkes)], {
      hiddenSites: [100],
    });
    // 2 sites × 10 kinds = 20 named traces (plus the yaxis2 anchor we ignore).
    expect(namedSiteTraces(data)).toHaveLength(20);
    const ctioTraces = (data as Partial<PlotData>[]).filter((d) => d.name === 'ctio');
    const yerkesTraces = (data as Partial<PlotData>[]).filter((d) => d.name === 'yerkes');
    expect(ctioTraces).toHaveLength(10);
    for (const t of ctioTraces) expect(t.visible).toBe('legendonly');
    for (const t of yerkesTraces) expect(t.visible).toBeUndefined();
  });

  it('treats hiddenSites entries as strings (matches site.id or site.slug fallback)', () => {
    const data = datasetsToPlotData([makeDataset(ctio)], { hiddenSites: ['100'] });
    for (const t of namedSiteTraces(data)) expect(t.visible).toBe('legendonly');
  });

  it('leaves all traces visible when hiddenSites is empty / omitted', () => {
    const data = datasetsToPlotData([makeDataset(ctio)]);
    for (const t of namedSiteTraces(data)) expect(t.visible).toBeUndefined();
  });

  it('labels traces with the site slug (stable identifier across renames)', () => {
    const data = datasetsToPlotData([makeDataset(ctio)]);
    const traces = namedSiteTraces(data);
    expect(traces.length).toBeGreaterThan(0);
    for (const t of traces) expect(t.name).toBe('ctio');
  });

  it('groups dash patterns by constraint family — accessibility / colour-blind cue', () => {
    const data = datasetsToPlotData([makeDataset(ctio)]) as Partial<PlotData>[];
    const dashByKind = new Map<string, string | undefined>();
    for (const trace of data) {
      const meta = (trace as { meta?: { kind?: string } }).meta;
      if (!meta?.kind) continue;
      const line = trace.line as { dash?: string } | undefined;
      dashByKind.set(meta.kind, line?.dash);
    }
    // Elevation gates → longdash.
    expect(dashByKind.get('minElevationDeg')).toBe('longdash');
    expect(dashByKind.get('maxElevationDeg')).toBe('longdash');
    // Sun-related constraints → dash.
    expect(dashByKind.get('sunElevation')).toBe('dash');
    expect(dashByKind.get('minSunElevationDeg')).toBe('dash');
    expect(dashByKind.get('sunSeparation')).toBe('dash');
    expect(dashByKind.get('maxSunSeparation')).toBe('dash');
    // Moon-related constraints → dot.
    expect(dashByKind.get('moon')).toBe('dot');
    expect(dashByKind.get('moonPhase')).toBe('dot');
    // Earth shadow → dashdot.
    expect(dashByKind.get('earth')).toBe('dashdot');
    // The `visible` series stays solid (no dash override).
    expect(dashByKind.get('visible')).toBeUndefined();
  });
});
