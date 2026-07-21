/** Coverage for `requestTypeToKind`'s mapping of `ObservationType` values
 *  onto the `TimeBlockKind` palette. */

import { describe, it, expect } from 'vitest';
import { requestTypeToKind } from './tasks.js';

describe('requestTypeToKind', () => {
  it('maps the six core ObservationType values', () => {
    expect(requestTypeToKind('optical_imaging')).toBe('optical-imaging');
    expect(requestTypeToKind('optical_imaging_bias_calibration')).toBe('calibration');
    expect(requestTypeToKind('optical_imaging_dark_calibration')).toBe('calibration');
    expect(requestTypeToKind('optical_imaging_flat_calibration')).toBe('calibration');
    expect(requestTypeToKind('radio_tracking')).toBe('radio-tracking');
    expect(requestTypeToKind('radio_mapping')).toBe('radio-mapping');
  });

  it('maps the maintenance pseudo-types', () => {
    expect(requestTypeToKind('shutdown')).toBe('maintenance');
    expect(requestTypeToKind('startup')).toBe('maintenance');
    expect(requestTypeToKind('maintenance')).toBe('maintenance');
  });

  it('falls back to "other" for unknown request types', () => {
    expect(requestTypeToKind('unknown_type')).toBe('other');
  });

  it('respects the fallback override', () => {
    expect(requestTypeToKind('unknown_type', 'calibration')).toBe('calibration');
  });
});
