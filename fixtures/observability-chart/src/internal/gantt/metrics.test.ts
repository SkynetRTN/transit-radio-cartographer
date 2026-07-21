/** Coverage for the lane-label margin estimator. */

import { describe, it, expect } from 'vitest';
import { DEFAULT_Y_AXIS_TICK_ANGLE, estimateLaneLabelMargin } from './metrics.js';
import type { Lane } from '../../types.js';

const MIN_MARGIN = 60;

function lane(label: string): Lane {
  return { key: `inst:${label}`, label };
}

describe('estimateLaneLabelMargin', () => {
  it('returns the floor when given no lanes', () => {
    expect(estimateLaneLabelMargin([])).toBe(MIN_MARGIN);
  });

  it('grows with label length', () => {
    const small = estimateLaneLabelMargin([lane('a')]);
    const medium = estimateLaneLabelMargin([lane('moderate-length')]);
    const large = estimateLaneLabelMargin([
      lane('a-really-quite-long-instrument-name-from-some-observatory'),
    ]);
    expect(medium).toBeGreaterThanOrEqual(small);
    expect(large).toBeGreaterThan(medium);
  });

  it('returns the max across multiple lanes', () => {
    const margin = estimateLaneLabelMargin([
      lane('a'),
      lane('zz'),
      lane('a much longer label'),
      lane('hi'),
    ]);
    const longestOnly = estimateLaneLabelMargin([lane('a much longer label')]);
    expect(margin).toBe(longestOnly);
  });

  it('adds horizontal headroom for additional <br> lines under rotation', () => {
    const singleLine = estimateLaneLabelMargin([lane('green-bank')]);
    const twoLine = estimateLaneLabelMargin([lane('green-bank<br>L-band')]);
    // Two-line label projects more horizontal extent at 45° rotation
    // because the second line stacks along the diagonal.
    expect(twoLine).toBeGreaterThan(singleLine);
  });

  it('shrinks at angles closer to vertical (sin gets bigger, cos gets smaller)', () => {
    const at45 = estimateLaneLabelMargin([lane('long-name')], -45);
    const at80 = estimateLaneLabelMargin([lane('long-name')], -80);
    // Near-vertical orientation reduces the horizontal projection of a
    // single line — the floor will eventually clamp it.
    expect(at80).toBeLessThanOrEqual(at45);
  });

  it('uses the documented default tick angle when none is supplied', () => {
    const fromDefault = estimateLaneLabelMargin([lane('test-label')]);
    const fromExplicit = estimateLaneLabelMargin(
      [lane('test-label')],
      DEFAULT_Y_AXIS_TICK_ANGLE,
    );
    expect(fromDefault).toBe(fromExplicit);
  });
});
