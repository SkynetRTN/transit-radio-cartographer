// @vitest-environment jsdom
/** Coverage for the flat 2-layer legend: rendering, view switching,
 *  click/double-click visibility semantics, controlled-view mode, and
 *  the empty placeholder. */

import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';

import { ObservabilityChartLegend, type ObservabilityLegendView } from './ObservabilityChartLegend.js';
import type { Site } from '../types.js';

function makeSite(overrides: Partial<Site> & { id: number; slug: string }): Site {
  return {
    id: overrides.id,
    uid: overrides.uid ?? `uid-${overrides.id}`,
    slug: overrides.slug,
    name: overrides.name ?? overrides.slug,
    location: overrides.location ?? '',
    countryCode: overrides.countryCode ?? '',
    latitudeDeg: overrides.latitudeDeg ?? 0,
    longitudeDeg: overrides.longitudeDeg ?? 0,
    elevationM: overrides.elevationM ?? 0,
    key: overrides.key ?? `obs:${overrides.id}`,
    telescopes: overrides.telescopes,
  } as Site;
}

const PROMPT = makeSite({
  id: 10,
  slug: 'prompt',
  name: 'PROMPT',
  telescopes: [
    { id: 100, uid: 't-100', slug: 'prompt-1', name: 'PROMPT-1' },
    { id: 101, uid: 't-101', slug: 'prompt-2', name: 'PROMPT-2' },
  ],
});
const MORA = makeSite({
  id: 11,
  slug: 'mora',
  name: 'Mora',
  telescopes: [{ id: 102, uid: 't-102', slug: 'mora-1', name: 'Mora-1' }],
});

describe('ObservabilityChartLegend', () => {
  it('renders one entry per Site in observatory view by default', () => {
    render(<ObservabilityChartLegend sites={[PROMPT, MORA]} onHiddenSitesChange={() => {}} />);
    const items = screen.getAllByRole('option');
    expect(items).toHaveLength(2);
    expect(within(items[0]!).getByText('prompt')).toBeTruthy();
    expect(within(items[1]!).getByText('mora')).toBeTruthy();
  });

  it('telescope view replaces observatory slug with the telescope-slug list', () => {
    render(
      <ObservabilityChartLegend
        sites={[PROMPT, MORA]}
        onHiddenSitesChange={() => {}}
        defaultView="telescope"
      />,
    );
    const items = screen.getAllByRole('option');
    expect(within(items[0]!).getByText('prompt-1')).toBeTruthy();
    expect(within(items[0]!).getByText('prompt-2')).toBeTruthy();
    expect(within(items[1]!).getByText('mora-1')).toBeTruthy();
    // Observatory slugs are no longer shown in this view.
    expect(within(items[0]!).queryByText('prompt')).toBeNull();
  });

  it('clicking the segmented "Telescope" tab flips view in uncontrolled mode', () => {
    render(<ObservabilityChartLegend sites={[PROMPT]} onHiddenSitesChange={() => {}} />);
    expect(screen.getByText('prompt')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Telescope' }));
    expect(screen.getByText('prompt-1')).toBeTruthy();
    expect(screen.queryByText('prompt')).toBeNull();
  });

  it('controlled view: parent owns view state via view + onViewChange', () => {
    function Wrapper() {
      const [view, setView] = useState<ObservabilityLegendView>('observatory');
      return (
        <>
          <button type="button" onClick={() => setView('telescope')}>
            external-switch
          </button>
          <ObservabilityChartLegend
            sites={[PROMPT]}
            view={view}
            onViewChange={setView}
            onHiddenSitesChange={() => {}}
          />
        </>
      );
    }
    render(<Wrapper />);
    expect(screen.getByText('prompt')).toBeTruthy();
    // Internal tab click flows through onViewChange.
    fireEvent.click(screen.getByRole('tab', { name: 'Telescope' }));
    expect(screen.getByText('prompt-1')).toBeTruthy();
    // External button moves view back; legend stays in sync.
    fireEvent.click(screen.getByRole('tab', { name: 'Observatory' }));
    expect(screen.getByText('prompt')).toBeTruthy();
  });

  it('single click toggles hiddenSites after the dblclick debounce window', () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(
        <ObservabilityChartLegend sites={[PROMPT, MORA]} onHiddenSitesChange={onChange} />,
      );
      const items = screen.getAllByRole('option');
      fireEvent.click(items[0]!);
      // Click fires before timer.
      expect(onChange).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(220);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      // First entry's key is 'obs:10'.
      expect(onChange).toHaveBeenCalledWith(['obs:10']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('double click isolates the entry (Plotly solo); a follow-up dblclick restores all', () => {
    vi.useFakeTimers();
    try {
      const calls: Array<Array<number | string>> = [];
      function Host() {
        const [hidden, setHidden] = useState<Array<number | string>>([]);
        return (
          <ObservabilityChartLegend
            sites={[PROMPT, MORA]}
            hiddenSites={hidden}
            onHiddenSitesChange={(next) => {
              calls.push(next);
              setHidden(next);
            }}
          />
        );
      }
      render(<Host />);
      const items = screen.getAllByRole('option');
      // dblclick on PROMPT → hide MORA only.
      fireEvent.doubleClick(items[0]!);
      act(() => {
        vi.advanceTimersByTime(220);
      });
      expect(calls.at(-1)).toEqual(['obs:11']);
      // dblclick again on PROMPT (now solo) → restore all.
      fireEvent.doubleClick(items[0]!);
      act(() => {
        vi.advanceTimersByTime(220);
      });
      expect(calls.at(-1)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('show-all button clears hiddenSites', () => {
    const onChange = vi.fn();
    render(
      <ObservabilityChartLegend
        sites={[PROMPT, MORA]}
        hiddenSites={['obs:11']}
        onHiddenSitesChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show all observatory series' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('renders the "No observatories" placeholder for an empty list', () => {
    render(<ObservabilityChartLegend sites={[]} />);
    expect(screen.getByText('No observatories')).toBeTruthy();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('Space toggles the focused entry via keyboard', () => {
    vi.useFakeTimers();
    try {
      const onChange = vi.fn();
      render(
        <ObservabilityChartLegend sites={[PROMPT, MORA]} onHiddenSitesChange={onChange} />,
      );
      const items = screen.getAllByRole('option');
      fireEvent.keyDown(items[0]!, { key: ' ' });
      // Space bypasses the dblclick debounce.
      expect(onChange).toHaveBeenCalledWith(['obs:10']);
    } finally {
      vi.useRealTimers();
    }
  });

  it('read-only mode (no onHiddenSitesChange) renders entries without click handlers and hides the eye button', () => {
    render(<ObservabilityChartLegend sites={[PROMPT, MORA]} />);
    expect(screen.queryByRole('button', { name: 'Show all observatory series' })).toBeNull();
    const items = screen.getAllByRole('option');
    expect(items).toHaveLength(2);
  });
});
