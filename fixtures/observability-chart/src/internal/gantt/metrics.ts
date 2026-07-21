/** Y-axis label sizing helpers. Pure functions — no Plotly, no DOM
 *  measurement. The adapter (and `<ObservabilityChartDuo>`) use these to
 *  decide how much horizontal space the rotated lane labels need, so the
 *  Gantt panel and a sibling chart can keep their plot columns aligned
 *  without an `automargin` round-trip. */

import type { Lane } from '../../types.js';

/** Tick-label rotation for the Gantt's categorical y-axis. Negative angles
 *  tilt the right end of the text downward — i.e. the label reads going
 *  from upper-left to lower-right. Chosen because long telescope/instrument
 *  labels project less horizontal distance when rotated, and the adapter
 *  is the only consumer that cares about the convention. */
export const DEFAULT_Y_AXIS_TICK_ANGLE = -45;

/** Approximate pixel width of one character at Plotly's default 12 px
 *  sans-serif font. Real glyph widths vary; this is a conservative average
 *  that handles ASCII + the common Unicode glyphs we use (°, ×, …). */
const PX_PER_CHAR = 7;

/** Vertical spacing between rendered `<br>` lines, in pixels. Plotly stacks
 *  multi-line tick labels along the rotated baseline, so each extra line
 *  contributes a fraction of its line height to the horizontal projection. */
const LINE_HEIGHT_PX = 14;

/** Constant overhead added to every estimate — covers the axis line, tick
 *  marks, and a small buffer so labels don't touch the plot area. */
const AXIS_PADDING_PX = 30;

/** Floor for the returned margin. A Gantt with one short-named lane should
 *  still have enough room for the axis itself to render. */
const MIN_MARGIN_PX = 60;

/** Estimate the left-margin (in pixels) needed to draw the categorical
 *  y-axis for the supplied lanes, taking `tickAngleDeg` rotation into
 *  account.
 *
 *  Each lane's `label` may contain `<br>` line breaks; the function picks
 *  the widest line and adds a per-extra-line contribution that grows as
 *  the rotation moves the lines off the horizontal axis.
 *
 *  Returns at least `MIN_MARGIN_PX`. The estimate is intentionally a
 *  little generous — labels clipping into the plot area is worse than a
 *  few extra pixels of whitespace. */
export function estimateLaneLabelMargin(
  lanes: ReadonlyArray<Lane>,
  tickAngleDeg: number = DEFAULT_Y_AXIS_TICK_ANGLE,
): number {
  if (lanes.length === 0) return MIN_MARGIN_PX;
  const angleRad = (tickAngleDeg * Math.PI) / 180;
  const cosAbs = Math.abs(Math.cos(angleRad));
  const sinAbs = Math.abs(Math.sin(angleRad));
  let widest = 0;
  for (const lane of lanes) {
    const lines = lane.label.split('<br>');
    let longest = 0;
    for (const line of lines) {
      if (line.length > longest) longest = line.length;
    }
    const projection =
      longest * PX_PER_CHAR * cosAbs + (lines.length - 1) * LINE_HEIGHT_PX * sinAbs;
    if (projection > widest) widest = projection;
  }
  return Math.max(MIN_MARGIN_PX, Math.ceil(widest) + AXIS_PADDING_PX);
}
