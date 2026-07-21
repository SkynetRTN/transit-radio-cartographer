/** Framework-agnostic lane-ordering and bar-clipping helpers for the Gantt
 *  chart. Pure functions — no Plotly, no React. */

import type { Lane, TimeBlock } from '../../types.js';

/** Sort lanes by `(observatoryLabel, telescopeLabel, label)` and drop any
 *  lane that has zero in-range blocks. A "stable sort" — lanes with equal
 *  keys keep their input order so the consumer can pre-sort by an external
 *  tiebreaker (e.g. legacy display order).
 *
 *  In-range here means: at least one block whose `laneKey` matches. The
 *  caller is expected to have already called `bucketBlocks` to clip blocks
 *  to the window; lanes with no blocks in the visible window aren't drawn. */
export interface ComputeLaneOrderOptions {
  /** Keep every passed lane even when it has no in-range block, so the
   *  y-axis row set stays stable as the window pans (each instrument keeps a
   *  fixed-height row). Defaults to `false` — empty lanes are pruned. */
  includeEmpty?: boolean;
}

export function computeLaneOrder(
  blocks: ReadonlyArray<TimeBlock>,
  lanes: ReadonlyArray<Lane>,
  options: ComputeLaneOrderOptions = {},
): Lane[] {
  const populated = new Set<string>();
  for (const block of blocks) populated.add(block.laneKey);

  const filtered = options.includeEmpty
    ? [...lanes]
    : lanes.filter((lane) => populated.has(lane.key));

  // Decorate-sort-undecorate so the sort is stable on equal keys (the
  // ECMAScript spec only requires stability since 2019; Plotly targets
  // shipping in older runtimes too — the decorate pattern is portable).
  const decorated = filtered.map((lane, idx) => ({
    lane,
    idx,
    obs: lane.observatoryLabel ?? '',
    tel: lane.telescopeLabel ?? '',
    lbl: lane.label,
  }));
  decorated.sort((a, b) => {
    const o = a.obs.localeCompare(b.obs);
    if (o !== 0) return o;
    const t = a.tel.localeCompare(b.tel);
    if (t !== 0) return t;
    const l = a.lbl.localeCompare(b.lbl);
    if (l !== 0) return l;
    return a.idx - b.idx;
  });

  return decorated.map((d) => d.lane);
}

/** Clip `blocks` to the half-open window `[start, stop)`. A block that
 *  straddles either edge is clipped to fit.
 *
 *  Blocks fully outside the window are dropped. Blocks whose original range
 *  is degenerate (`stop <= start`) are also dropped — they'd render as zero
 *  width and pollute the click-decode lookup. */
export function bucketBlocks(
  blocks: ReadonlyArray<TimeBlock>,
  window: readonly [Date, Date],
): TimeBlock[] {
  const [winStart, winStop] = window;
  const winStartMs = winStart.getTime();
  const winStopMs = winStop.getTime();
  if (!(winStopMs > winStartMs)) return [];

  const out: TimeBlock[] = [];
  for (const block of blocks) {
    const startMs = block.start.getTime();
    const stopMs = block.stop.getTime();
    if (!(stopMs > startMs)) continue;
    if (stopMs <= winStartMs) continue;
    if (startMs >= winStopMs) continue;

    const clippedStartMs = Math.max(startMs, winStartMs);
    const clippedStopMs = Math.min(stopMs, winStopMs);
    if (clippedStartMs === startMs && clippedStopMs === stopMs) {
      out.push(block);
      continue;
    }
    out.push({
      ...block,
      start: new Date(clippedStartMs),
      stop: new Date(clippedStopMs),
    });
  }
  return out;
}
