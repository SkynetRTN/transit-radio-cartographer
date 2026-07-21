/** Coverage for `deriveLanes`: one lane per instrument-with-blocks,
 *  sort order delegated to `computeLaneOrder`, label-collision
 *  disambiguation via the optional slug. */

import { describe, it, expect } from 'vitest';
import { deriveLanes } from './lanes.js';
import type { TimeBlock } from '../../types.js';

function block(laneKey: string): TimeBlock {
  return {
    id: `${laneKey}-0`,
    laneKey,
    start: new Date(0),
    stop: new Date(1_000),
    kind: 'optical-imaging',
  };
}

describe('deriveLanes', () => {
  it('returns one lane per distinct laneKey in the blocks list', () => {
    const lanes = deriveLanes([block('inst:1'), block('inst:1'), block('inst:2')]);
    expect(lanes).toHaveLength(2);
    expect(lanes.map((l) => l.key).sort()).toEqual(['inst:1', 'inst:2']);
  });

  it('populates labels and grouping metadata from laneMeta', () => {
    const lanes = deriveLanes([block('inst:1'), block('inst:2')], {
      laneMeta: {
        'inst:1': { label: 'Camera', telescopeLabel: 'PROMPT-1', observatoryLabel: 'CTIO' },
        'inst:2': { label: 'Spectrograph', telescopeLabel: 'PROMPT-2', observatoryLabel: 'CTIO' },
      },
    });
    expect(lanes[0]!.label).toBe('Camera');
    expect(lanes[0]!.observatoryLabel).toBe('CTIO');
    expect(lanes[1]!.telescopeLabel).toBe('PROMPT-2');
  });

  it('falls back to the lane key for missing metadata', () => {
    const lanes = deriveLanes([block('inst:99')]);
    expect(lanes[0]!.label).toBe('inst:99');
    expect(lanes[0]!.observatoryLabel).toBeUndefined();
  });

  it('disambiguates lanes that would otherwise share label/telescope/observatory', () => {
    // Two instruments named "Camera" on the same telescope/observatory —
    // without disambiguation the y-axis would have two indistinguishable
    // rows. With slugs supplied, the labels gain a `(slug)` suffix.
    const lanes = deriveLanes([block('inst:1'), block('inst:2')], {
      laneMeta: {
        'inst:1': { label: 'Camera', telescopeLabel: 'P', observatoryLabel: 'O', slug: 'cam-a' },
        'inst:2': { label: 'Camera', telescopeLabel: 'P', observatoryLabel: 'O', slug: 'cam-b' },
      },
    });
    expect(lanes.map((l) => l.label).sort()).toEqual(['Camera (cam-a)', 'Camera (cam-b)']);
  });

  it('does not modify labels when the triple is already unique', () => {
    const lanes = deriveLanes([block('inst:1'), block('inst:2')], {
      laneMeta: {
        'inst:1': { label: 'Camera', telescopeLabel: 'P1', observatoryLabel: 'O', slug: 'c1' },
        'inst:2': { label: 'Camera', telescopeLabel: 'P2', observatoryLabel: 'O', slug: 'c2' },
      },
    });
    expect(lanes.every((l) => l.label === 'Camera')).toBe(true);
  });

  it('sorts the result via the lane-order rules (observatory → telescope → label)', () => {
    const lanes = deriveLanes(
      [block('inst:a'), block('inst:b'), block('inst:c')],
      {
        laneMeta: {
          'inst:a': { label: 'Z', telescopeLabel: 'T', observatoryLabel: 'Morehead' },
          'inst:b': { label: 'A', telescopeLabel: 'T', observatoryLabel: 'CTIO' },
          'inst:c': { label: 'B', telescopeLabel: 'T', observatoryLabel: 'CTIO' },
        },
      },
    );
    expect(lanes.map((l) => l.key)).toEqual(['inst:b', 'inst:c', 'inst:a']);
  });
});
