/** Per-`TimeBlockKind` rendering knobs — colour + Plotly pattern shape.
 *
 *  Accessibility: every kind has a distinct pattern so the chart is legible in
 *  greyscale and colour-blind palettes. Plotly's `marker.pattern.shape` is
 *  used for the fill pattern; the chart should never rely on colour alone.
 *
 *  Framework-agnostic — the React adapter reads this map and stamps it into
 *  Plotly traces. */

import type { TimeBlockKind } from '../../types.js';

/** Subset of Plotly's pattern shape strings we actually use. Kept narrow so
 *  switching plot libraries later only requires re-mapping six values rather
 *  than the whole Plotly enum. */
export type PatternShape = '' | '/' | '\\' | 'x' | '-' | '|' | '+' | '.';

export interface KindStyle {
  /** Resolved hex (no alpha). The React adapter mixes alpha in as needed. */
  color: string;
  /** Plotly `marker.pattern.shape`. `''` is a solid fill. */
  pattern: PatternShape;
  /** Human-readable kind label for legend + hover tooltip. */
  label: string;
}

/** Colour family rationale: optical = warm blues / cyans (sky-correlated),
 *  radio = warm oranges / yellows (radio-dish association), calibration =
 *  muted purple (system maintenance), maintenance = grey (offline / no-go),
 *  other = neutral sage so we don't accidentally collide with any of the
 *  above. */
export const KIND_STYLE: Record<TimeBlockKind, KindStyle> = {
  'optical-imaging': {
    color: '#1f77b4',
    pattern: '',
    label: 'optical imaging',
  },
  'radio-tracking': {
    color: '#ff7f0e',
    pattern: '/',
    label: 'radio tracking',
  },
  'radio-mapping': {
    color: '#d62728',
    pattern: 'x',
    label: 'radio mapping',
  },
  calibration: {
    color: '#9467bd',
    pattern: '.',
    label: 'calibration',
  },
  maintenance: {
    color: '#7f7f7f',
    pattern: '-',
    label: 'maintenance',
  },
  // Tasks Gantt — a single blue for every scheduled task, so the "what will
  // run" view stays visually distinct from the observability view's green/red.
  task: {
    color: '#2563eb', // blue-600
    pattern: '',
    label: 'task',
  },
  // Observability-window view. Green = observable, red = unobservable.
  // The pattern doubles as a non-colour cue (solid vs. cross-hatch) so the
  // observable/unobservable split survives greyscale / colour-blind palettes.
  observable: {
    color: '#5aa872', // muted green (desaturated from green-600)
    pattern: '',
    label: 'observable',
  },
  unobservable: {
    color: '#d27b72', // muted clay-red (desaturated from red-600)
    pattern: '/', // single diagonal — calmer than the old 'x' cross-hatch
    label: 'unobservable',
  },
  other: {
    color: '#2ca02c',
    pattern: '+',
    label: 'other',
  },
};

/** Iteration order — also the order in which Plotly stacks traces in the
 *  legend. Most-common kinds first so the typical legend is short. */
export const KINDS: readonly TimeBlockKind[] = [
  'optical-imaging',
  'radio-tracking',
  'radio-mapping',
  'calibration',
  'maintenance',
  'task',
  'observable',
  'unobservable',
  'other',
];
