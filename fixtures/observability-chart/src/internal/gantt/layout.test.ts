/** Pure-function tests for the Gantt layout helpers. Lane ordering rules,
 *  half-open block clipping at both window edges. */

import { describe, it, expect } from 'vitest';
import { bucketBlocks, computeLaneOrder } from './layout.js';
import type { Lane, TimeBlock } from '../../types.js';

function block(opts: {
  id: string;
  laneKey: string;
  startMs: number;
  stopMs: number;
}): TimeBlock {
  return {
    id: opts.id,
    laneKey: opts.laneKey,
    start: new Date(opts.startMs),
    stop: new Date(opts.stopMs),
    kind: 'optical-imaging',
  };
}

function lane(
  key: string,
  label: string,
  telescopeLabel?: string,
  observatoryLabel?: string,
): Lane {
  const out: Lane = { key, label };
  if (telescopeLabel !== undefined) out.telescopeLabel = telescopeLabel;
  if (observatoryLabel !== undefined) out.observatoryLabel = observatoryLabel;
  return out;
}

describe('computeLaneOrder', () => {
  it('orders lanes by observatory → telescope → label', () => {
    // Input is intentionally shuffled — the sort should put CTIO ahead of
    // Morehead, and within CTIO, PROMPT ahead of SkyNet.
    const lanes: Lane[] = [
      lane('inst:moreheadA', 'A', 'Morehead', 'Morehead'),
      lane('inst:promptB', 'B', 'PROMPT', 'CTIO'),
      lane('inst:promptA', 'A', 'PROMPT', 'CTIO'),
      lane('inst:skynetX', 'X', 'SkyNet', 'CTIO'),
    ];
    const blocks = lanes.map((l, i) =>
      block({ id: String(i), laneKey: l.key, startMs: 0, stopMs: 1 }),
    );
    const order = computeLaneOrder(blocks, lanes);
    expect(order.map((l) => l.key)).toEqual([
      'inst:promptA',
      'inst:promptB',
      'inst:skynetX',
      'inst:moreheadA',
    ]);
  });

  it('drops lanes with no in-range blocks', () => {
    const lanes = [
      lane('a', 'A'),
      lane('b', 'B'),
      lane('c', 'C'),
    ];
    const blocks = [
      block({ id: '1', laneKey: 'a', startMs: 0, stopMs: 1 }),
      block({ id: '2', laneKey: 'c', startMs: 0, stopMs: 1 }),
    ];
    const order = computeLaneOrder(blocks, lanes);
    expect(order.map((l) => l.key)).toEqual(['a', 'c']);
  });

  it('keeps empty lanes when includeEmpty is set (stable row set while panning)', () => {
    const lanes = [lane('a', 'A'), lane('b', 'B'), lane('c', 'C')];
    const blocks = [block({ id: '1', laneKey: 'a', startMs: 0, stopMs: 1 })];
    const order = computeLaneOrder(blocks, lanes, { includeEmpty: true });
    // All three lanes survive even though only 'a' has a block, still sorted.
    expect(order.map((l) => l.key)).toEqual(['a', 'b', 'c']);
  });

  it('is stable across equal sort keys (preserves input order)', () => {
    // Two lanes with identical (observatory, telescope, label) — the
    // tiebreaker must be input index, not name-hash or similar.
    const lanes = [
      lane('a-first', 'X', 'T', 'O'),
      lane('a-second', 'X', 'T', 'O'),
      lane('a-third', 'X', 'T', 'O'),
    ];
    const blocks = lanes.map((l, i) =>
      block({ id: String(i), laneKey: l.key, startMs: 0, stopMs: 1 }),
    );
    const order = computeLaneOrder(blocks, lanes);
    expect(order.map((l) => l.key)).toEqual(['a-first', 'a-second', 'a-third']);
  });

  it('treats unspecified observatory/telescope as empty strings (sorts first)', () => {
    const lanes = [
      lane('with-obs', 'A', 'T', 'CTIO'),
      lane('bare', 'A'),
    ];
    const blocks = lanes.map((l, i) =>
      block({ id: String(i), laneKey: l.key, startMs: 0, stopMs: 1 }),
    );
    const order = computeLaneOrder(blocks, lanes);
    // Bare lane has obs = '' which sorts before 'CTIO'.
    expect(order.map((l) => l.key)).toEqual(['bare', 'with-obs']);
  });
});

describe('bucketBlocks', () => {
  const WIN_START = 100_000;
  const WIN_STOP = 200_000;
  const win: readonly [Date, Date] = [new Date(WIN_START), new Date(WIN_STOP)];

  it('passes through blocks fully inside the window unchanged', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 120_000, stopMs: 180_000 });
    const out = bucketBlocks([b], win);
    expect(out).toHaveLength(1);
    expect(out[0]).toBe(b); // identity-preserving when no clip needed
  });

  it('clips blocks straddling the start edge', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 80_000, stopMs: 150_000 });
    const out = bucketBlocks([b], win);
    expect(out).toHaveLength(1);
    expect(out[0]!.start.getTime()).toBe(WIN_START);
    expect(out[0]!.stop.getTime()).toBe(150_000);
  });

  it('clips blocks straddling the stop edge', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 150_000, stopMs: 220_000 });
    const out = bucketBlocks([b], win);
    expect(out).toHaveLength(1);
    expect(out[0]!.start.getTime()).toBe(150_000);
    expect(out[0]!.stop.getTime()).toBe(WIN_STOP);
  });

  it('clips blocks that span both edges to the full window', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 0, stopMs: 500_000 });
    const out = bucketBlocks([b], win);
    expect(out).toHaveLength(1);
    expect(out[0]!.start.getTime()).toBe(WIN_START);
    expect(out[0]!.stop.getTime()).toBe(WIN_STOP);
  });

  it('drops blocks entirely before the window', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 0, stopMs: 50_000 });
    expect(bucketBlocks([b], win)).toEqual([]);
  });

  it('drops blocks entirely after the window', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 250_000, stopMs: 300_000 });
    expect(bucketBlocks([b], win)).toEqual([]);
  });

  it('treats stop == window start as outside (half-open)', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 50_000, stopMs: WIN_START });
    expect(bucketBlocks([b], win)).toEqual([]);
  });

  it('treats start == window stop as outside (half-open)', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: WIN_STOP, stopMs: 250_000 });
    expect(bucketBlocks([b], win)).toEqual([]);
  });

  it('drops degenerate (zero / negative duration) blocks', () => {
    const zero = block({ id: '1', laneKey: 'a', startMs: 150_000, stopMs: 150_000 });
    const inverted = block({ id: '2', laneKey: 'a', startMs: 160_000, stopMs: 140_000 });
    expect(bucketBlocks([zero, inverted], win)).toEqual([]);
  });

  it('preserves existing detail fields when clipping', () => {
    const b: TimeBlock = {
      ...block({ id: '1', laneKey: 'a', startMs: 0, stopMs: 150_000 }),
      detail: { existing: 'value' },
    };
    const out = bucketBlocks([b], win);
    expect(out[0]!.detail).toEqual({ existing: 'value' });
  });

  it('returns empty when the window itself is degenerate', () => {
    const b = block({ id: '1', laneKey: 'a', startMs: 120_000, stopMs: 180_000 });
    expect(
      bucketBlocks([b], [new Date(WIN_START), new Date(WIN_START)]),
    ).toEqual([]);
    expect(
      bucketBlocks([b], [new Date(WIN_STOP), new Date(WIN_START)]),
    ).toEqual([]);
  });
});
