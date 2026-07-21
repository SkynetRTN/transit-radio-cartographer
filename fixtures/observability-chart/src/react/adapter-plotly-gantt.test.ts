/** JSDoc-level tests for the Gantt Plotly adapter. Asserts:
 *  - One horizontal-bar trace per `TimeBlockKind` (no empty traces).
 *  - Categorical y-axis matches the (reversed) lane order.
 *  - Hover template wired with the customdata placeholders.
 *  - Cursor shape present when `cursorMs` is set.
 *  - `decodeGanttClick` round-trips the original `TimeBlock`. */

import { describe, it, expect } from 'vitest';
import {
  buildGanttData,
  buildGanttLayout,
  decodeGanttClick,
} from './adapter-plotly-gantt.js';
import type { PlotMouseEvent } from 'plotly.js';
import type { Lane, TimeBlock } from '../types.js';

const T0 = Date.UTC(2026, 4, 19, 0, 0, 0);

function block(
  id: string,
  laneKey: string,
  kind: TimeBlock['kind'],
  startOffsetH: number,
  durationH: number,
  label?: string,
): TimeBlock {
  return {
    id,
    laneKey,
    kind,
    start: new Date(T0 + startOffsetH * 3_600_000),
    stop: new Date(T0 + (startOffsetH + durationH) * 3_600_000),
    label: label ?? id,
  };
}

const LANES: Lane[] = [
  { key: 'inst:1', label: 'Cam1', telescopeLabel: 'T1', observatoryLabel: 'O' },
  { key: 'inst:2', label: 'Cam2', telescopeLabel: 'T2', observatoryLabel: 'O' },
  { key: 'inst:3', label: 'Radio', telescopeLabel: 'R', observatoryLabel: 'OtherObs' },
];

describe('buildGanttData', () => {
  it('produces one bar trace per kind that has blocks (no empty traces)', () => {
    const blocks = [
      block('a', 'inst:1', 'optical-imaging', 0, 1),
      block('b', 'inst:1', 'optical-imaging', 2, 1),
      block('c', 'inst:2', 'calibration', 0, 1),
    ];
    const { data } = buildGanttData(blocks, LANES);
    expect(data).toHaveLength(2);
    expect(data.map((d) => (d as { name?: string }).name)).toEqual([
      'optical imaging',
      'calibration',
    ]);
    for (const trace of data) {
      const t = trace as { type?: string; orientation?: string };
      expect(t.type).toBe('bar');
      expect(t.orientation).toBe('h');
    }
  });

  it('stamps customdata with id + a composed hover body (header / kind / duration)', () => {
    const blocks = [block('a', 'inst:1', 'optical-imaging', 0, 1, 'My target')];
    const { data } = buildGanttData(blocks, LANES);
    const trace = data[0] as unknown as { customdata: ReadonlyArray<Record<string, string>> };
    expect(trace.customdata).toHaveLength(1);
    expect(trace.customdata[0]!.id).toBe('a');
    // Header (bold) → kind label → time range → duration, joined by <br>.
    expect(trace.customdata[0]!.body).toBe(
      '<b>My target</b><br>optical imaging<br>05-19 00:00 → 05-19 01:00<br>duration: +1h',
    );
  });

  it('composes the type-line override (typeLabel) into the body', () => {
    const base = block('a', 'inst:1', 'unobservable', 0, 1, 'radio mapping unobservable');
    const blocks = [{ ...base, typeLabel: '* sun too high' }];
    const { data } = buildGanttData(blocks, LANES);
    const trace = data[0] as unknown as { customdata: ReadonlyArray<Record<string, string>> };
    // Header is the block label; the sub-line is the typeLabel override, not
    // the kind's palette label ("unobservable").
    expect(trace.customdata[0]!.body).toContain('<b>radio mapping unobservable</b><br>* sun too high<br>');
  });

  it('prunes the sub-line from the body when typeLabel is empty', () => {
    const base = block('a', 'inst:1', 'observable', 0, 1, 'radio mapping observable');
    const blocks = [{ ...base, typeLabel: '' }];
    const { data } = buildGanttData(blocks, LANES);
    const trace = data[0] as unknown as { customdata: ReadonlyArray<Record<string, string>> };
    // No blank line between the header and the time range.
    expect(trace.customdata[0]!.body).toBe(
      '<b>radio mapping observable</b><br>05-19 00:00 → 05-19 01:00<br>duration: +1h',
    );
  });

  it('uses relative-time formatting in the body when xAxisLabelMode is relative', () => {
    const blocks = [block('a', 'inst:1', 'optical-imaging', 2, 1)];
    const nowMs = T0; // start of window
    const { data } = buildGanttData(blocks, LANES, {
      xAxisLabelMode: 'relative',
      nowMs,
    });
    const trace = data[0] as unknown as { customdata: ReadonlyArray<Record<string, string>> };
    expect(trace.customdata[0]!.body).toContain('+2h → +3h');
  });

  it('returns lanes pruned to those with in-range blocks, in the canonical order', () => {
    const blocks = [
      block('a', 'inst:3', 'radio-tracking', 0, 1),
      block('b', 'inst:1', 'optical-imaging', 0, 1),
    ];
    const { laneOrder } = buildGanttData(blocks, LANES);
    expect(laneOrder.map((l) => l.key)).toEqual(['inst:1', 'inst:3']);
  });

  it('keeps every lane and anchors them when showEmptyLanes is set', () => {
    // Only inst:1 has a block, but with showEmptyLanes all three lanes stay
    // in laneOrder and an anchor trace registers every lane key so Plotly
    // draws a (fixed-height) row for each.
    const blocks = [block('a', 'inst:1', 'observable', 0, 1)];
    const { data, laneOrder } = buildGanttData(blocks, LANES, { showEmptyLanes: true });
    expect(laneOrder.map((l) => l.key)).toEqual(['inst:1', 'inst:2', 'inst:3']);
    const anchor = data.find(
      (d) => (d as { showlegend?: boolean }).showlegend === false,
    ) as unknown as { y: string[] } | undefined;
    expect(anchor?.y).toEqual(['inst:1', 'inst:2', 'inst:3']);
  });

  it('exposes a block-id → block lookup', () => {
    const blocks = [block('a', 'inst:1', 'optical-imaging', 0, 1)];
    const { blockIndex } = buildGanttData(blocks, LANES);
    expect(blockIndex.get('a')).toEqual(blocks[0]);
    expect(blockIndex.get('missing')).toBeUndefined();
  });
});

describe('buildGanttLayout', () => {
  it('builds a categorical y-axis with the reversed lane order so lane 0 is at the top', () => {
    const laneOrder: Lane[] = LANES.slice(0, 2);
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder,
    });
    expect(layout.yaxis?.type).toBe('category');
    const arr = (layout.yaxis as { categoryarray?: string[] }).categoryarray;
    expect(arr).toEqual(['inst:2', 'inst:1']);
  });

  it('hides the x-axis label/ticks when xAxisHidden is true', () => {
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
      xAxisHidden: true,
    });
    expect(layout.xaxis?.showticklabels).toBe(false);
    expect(layout.margin?.b).toBe(0);
  });

  it('uses the fixedHorizontalMargins when provided', () => {
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
      fixedHorizontalMargins: { left: 123, right: 45 },
    });
    expect(layout.margin?.l).toBe(123);
    expect(layout.margin?.r).toBe(45);
    expect(layout.yaxis?.automargin).toBe(false);
  });

  it('does not draw any line shape — the cursor is a DOM overlay, not a Plotly shape', () => {
    // Cursor rendering moved out of the layout (see ObservabilityChartDuo)
    // so it can never trigger a layout rebuild / Plotly.react mid-pan. The
    // only shapes the Gantt layout emits are lane-grouping rects.
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
    });
    const lineShapes = (layout.shapes ?? []).filter(
      (s) => (s as { type?: string }).type === 'line',
    );
    expect(lineShapes).toHaveLength(0);
  });

  it('unlocks xaxis.fixedrange when interactive (so Plotly`s pan engages)', () => {
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
    });
    expect((layout.xaxis as { fixedrange?: boolean }).fixedrange).toBe(false);
    expect(layout.dragmode).toBe('pan');
  });

  it('locks xaxis.fixedrange when interactive is false', () => {
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
      interactive: false,
    });
    expect((layout.xaxis as { fixedrange?: boolean }).fixedrange).toBe(true);
    expect(layout.dragmode).toBe(false);
  });

  it('rotates the y-axis tick labels for diagonal long-label support', () => {
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES.slice(0, 1),
    });
    expect((layout.yaxis as { tickangle?: number }).tickangle).toBe(-45);
    expect(layout.yaxis?.automargin).toBe(false);
  });

  it('estimates the left margin from lane labels when none is fixed', () => {
    // A short label produces the floor margin; a longer label widens it.
    const shortLayout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: [{ key: 'inst:1', label: 'a' }],
    });
    const longLayout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: [
        { key: 'inst:1', label: 'Green Bank 20m Receiver (L-band)' },
      ],
    });
    expect(shortLayout.margin?.l).toBeGreaterThanOrEqual(60);
    expect(longLayout.margin?.l).toBeGreaterThan(shortLayout.margin?.l ?? 0);
  });

  it('draws no per-row background shapes (uniform rows, no grouping tint)', () => {
    // The old same-observatory / same-telescope tint shaded only the 2nd+
    // lane of each group, reading as a stray shadow under some rows. Rows now
    // render uniformly, so the layout emits no rect shapes.
    const layout = buildGanttLayout({
      start: new Date(T0),
      stop: new Date(T0 + 3_600_000),
      laneOrder: LANES,
    });
    const rects = (layout.shapes ?? []).filter(
      (s) => (s as { type?: string }).type === 'rect',
    );
    expect(rects).toHaveLength(0);
  });
});

describe('decodeGanttClick', () => {
  const block0 = block('a', 'inst:1', 'optical-imaging', 0, 1);
  const block1 = block('b', 'inst:2', 'calibration', 0, 1);
  const index = new Map([
    [block0.id, block0],
    [block1.id, block1],
  ]);

  it('round-trips the original block from a click event with stamped customdata', () => {
    const event = {
      points: [{ customdata: { id: 'a' } }],
    } as unknown as PlotMouseEvent;
    expect(decodeGanttClick(event, index)).toBe(block0);
  });

  it('returns null when the click point has no customdata.id', () => {
    const event = { points: [{}] } as unknown as PlotMouseEvent;
    expect(decodeGanttClick(event, index)).toBeNull();
  });

  it('returns null when the id is unknown', () => {
    const event = {
      points: [{ customdata: { id: 'missing' } }],
    } as unknown as PlotMouseEvent;
    expect(decodeGanttClick(event, index)).toBeNull();
  });

  it('returns null when the event has no points (legend / background click)', () => {
    const event = { points: [] } as unknown as PlotMouseEvent;
    expect(decodeGanttClick(event, index)).toBeNull();
  });
});
