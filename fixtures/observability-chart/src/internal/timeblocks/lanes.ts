/** Derive `Lane[]` from a `TimeBlock[]` (+ optional per-instrument metadata).
 *
 *  The chart accepts the derived lanes directly; the helper exists so a
 *  consumer who already has a flat blocks-list doesn't have to maintain a
 *  parallel `Lane[]` by hand. Returns one lane per instrument that has at
 *  least one block, sorted via `computeLaneOrder` (observatory → telescope →
 *  label). */

import type { Lane, TimeBlock } from '../../types.js';
import { computeLaneOrder } from '../gantt/layout.js';

/** Minimal metadata describing one instrument. Keys are `laneKey` values
 *  (`'inst:<id>'`); the helper looks them up to populate display fields. */
export interface LaneMetaEntry {
  /** Human-readable instrument label. Falls back to the lane key when
   *  unspecified. */
  label?: string;
  telescopeLabel?: string;
  observatoryLabel?: string;
  /** Optional slug appended to `label` when two lanes would otherwise share
   *  the same `(observatory, telescope, label)` triple — the third tiebreaker
   *  in the sort order. */
  slug?: string;
}

export interface DeriveLanesOptions {
  /** Per-lane metadata, keyed by `laneKey`. Missing keys produce a lane
   *  whose `label` is the key itself. */
  laneMeta?: Readonly<Record<string, LaneMetaEntry>>;
}

export function deriveLanes(
  blocks: ReadonlyArray<TimeBlock>,
  options: DeriveLanesOptions = {},
): Lane[] {
  const meta = options.laneMeta ?? {};
  // Insertion order ≅ first-seen order; the subsequent `computeLaneOrder`
  // call re-sorts properly, but a stable insertion order keeps the tiebreaker
  // deterministic.
  const seen = new Map<string, true>();
  for (const block of blocks) {
    if (!seen.has(block.laneKey)) seen.set(block.laneKey, true);
  }

  const lanes: Lane[] = [];
  for (const key of seen.keys()) {
    const m = meta[key] ?? {};
    const lane: Lane = {
      key,
      label: m.label ?? key,
    };
    if (m.telescopeLabel !== undefined) lane.telescopeLabel = m.telescopeLabel;
    if (m.observatoryLabel !== undefined) lane.observatoryLabel = m.observatoryLabel;
    lanes.push(lane);
  }

  // Disambiguate collisions on (observatory, telescope, label) by appending
  // the slug. Only mutates labels for lanes that would otherwise tie — the
  // common case (no collision) leaves labels untouched.
  disambiguateLabels(lanes, meta);

  return computeLaneOrder(blocks, lanes);
}

function disambiguateLabels(
  lanes: Lane[],
  meta: Readonly<Record<string, LaneMetaEntry>>,
): void {
  const buckets = new Map<string, Lane[]>();
  for (const lane of lanes) {
    const k = `${lane.observatoryLabel ?? ''}|${lane.telescopeLabel ?? ''}|${lane.label}`;
    const bucket = buckets.get(k);
    if (bucket) bucket.push(lane);
    else buckets.set(k, [lane]);
  }
  for (const bucket of buckets.values()) {
    if (bucket.length <= 1) continue;
    for (const lane of bucket) {
      const slug = meta[lane.key]?.slug;
      if (slug) lane.label = `${lane.label} (${slug})`;
    }
  }
}
