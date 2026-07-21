/** Maps Skynet `ObservationType` values to the `TimeBlockKind` palette.
 *
 *  Consumers building `TimeBlock[]` from their own wire shape (e.g. the
 *  observation Tasks-tab projection in
 *  `apps/website-react/app/lib/observation-tasks-gantt.ts`) call this to
 *  pick the right kind without hard-coding the table. The `ObservationType`
 *  enum lives in `skynet_sdk/enums.py:942-948`; the five
 *  `optical_imaging_*_calibration` variants collapse to `calibration`, the
 *  bare `optical_imaging` keeps its own kind, and anything unknown projects
 *  to the supplied `fallback` (default `'other'`) rather than throwing — the
 *  chart should still render unknown work, just without a kind-specific
 *  colour. */

import type { TimeBlockKind } from '../../types.js';

export function requestTypeToKind(
  requestType: string,
  fallback: TimeBlockKind = 'other',
): TimeBlockKind {
  switch (requestType) {
    case 'optical_imaging':
      return 'optical-imaging';
    case 'optical_imaging_bias_calibration':
    case 'optical_imaging_dark_calibration':
    case 'optical_imaging_flat_calibration':
      return 'calibration';
    case 'radio_tracking':
      return 'radio-tracking';
    case 'radio_mapping':
      return 'radio-mapping';
    case 'shutdown':
    case 'startup':
    case 'maintenance':
      return 'maintenance';
    default:
      return fallback;
  }
}
