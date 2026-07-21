/** Public-facing re-exports for `internal/gantt/`. */

export { computeLaneOrder, bucketBlocks } from './layout.js';
export { KIND_STYLE, KINDS } from './palette.js';
export type { KindStyle, PatternShape } from './palette.js';
export { estimateLaneLabelMargin, DEFAULT_Y_AXIS_TICK_ANGLE } from './metrics.js';
