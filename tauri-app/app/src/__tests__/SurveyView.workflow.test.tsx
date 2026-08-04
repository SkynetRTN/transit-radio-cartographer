import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { SurveyView } from '../views/SurveyView';
import { rpcClient, type SurveyMeta, type WorkspaceOverview } from '../ipc/client';
import { SurveyProvider, useSurvey } from '../state/survey-context';

vi.mock('../ipc/client', () => ({
  rpcClient: {
    openSurvey: vi.fn(),
    closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
    getSweepInline: vi.fn(),
    getWorkspaceOverview: vi.fn(),
    getSourceSweep: vi.fn().mockResolvedValue({
      ra: [1, 2, 3],
      dec: [10, 11, 12],
      flux: [0.1, 0.2, 0.3],
      sample_count: 3,
      returned_count: 3,
      index: 0,
      source_count: 5,
      unit: 'volts',
      label: 'AND0A - Sweep 1',
      calibrated: false,
    }),
    setSourceSweepFlux: vi.fn().mockResolvedValue({ overview: {} }),
    getCalibrationView: vi.fn(),
    cutCalibrationSegment: vi.fn(),
    selectCalibrationDeclination: vi.fn(),
    undoCalibrationCut: vi.fn(),
    applyGainCalibration: vi.fn(),
    setBracketEnabled: vi.fn(),
    smooth: vi.fn(),
    baseline: vi.fn(),
    align: vi.fn(),
    makeImage: vi.fn(),
    getImagePixels: vi.fn().mockResolvedValue({ pixels: [[0]], width: 1, height: 1 }),
  },
}));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));
// Headless PointScatter mock: exposes the per-panel point-click and free
// cursor-click callbacks as hidden buttons keyed off `testId`. Lets the
// workflow tests drive a Remove RFI baseline draw (two snapped point clicks)
// on the top panel and a recover-line draw (two free cursor clicks) on the
// bottom panel without a real Plotly render.
vi.mock('../lib/plots/PointScatter', () => ({
  PointScatter: (props: {
    testId?: string;
    onPointClick?: (p: {
      x: number;
      y: number;
      ra: number;
      dec: number;
      flux: number;
      sampleIndex?: number;
    }) => void;
    onCursorClick?: (x: number, y: number) => void;
    onCursorMove?: (x: number, y: number) => void;
  }) => {
    const id = props.testId ?? 'plot';
    return (
      <div data-testid={id}>
        <button
          data-testid={`${id}-click-first`}
          onClick={() =>
            props.onPointClick?.({ x: 10, y: 0.1, ra: 1, dec: 10, flux: 0.1, sampleIndex: 0 })
          }
        />
        <button
          data-testid={`${id}-click-second`}
          onClick={() =>
            props.onPointClick?.({ x: 12, y: 0.5, ra: 3, dec: 12, flux: 0.5, sampleIndex: 2 })
          }
        />
        {/* Free recovery-line endpoints drawn at removed≈0 across the full
            dec span [9, 13], which fully recovers every removed sample. */}
        <button
          data-testid={`${id}-line-first`}
          onClick={() => props.onCursorClick?.(9, 0)}
        />
        <button
          data-testid={`${id}-line-second`}
          onClick={() => props.onCursorClick?.(13, 0)}
        />
      </div>
    );
  },
}));

const workspaceOverview: WorkspaceOverview = {
  name: 'AND0A',
  path: '/tmp/and0a.md2',
  source_count: 5,
  initial_cal_samples: 120,
  terminal_cal_samples: 120,
  initial_kept: 120,
  terminal_kept: 120,
  cal1: 0.34,
  cal2: 0.36,
  calibrated: false,
  initial_enabled: true,
  terminal_enabled: true,
  can_undo: false,
  flux_calibrated: false,
  flux_slope: null,
};

function HydrateSurvey({ meta }: { meta: SurveyMeta }) {
  const { open } = useSurvey();
  useEffect(() => {
    (rpcClient.openSurvey as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(meta);
    void open(meta.metadata.path);
  }, [meta, open]);
  return null;
}

function ViewModeProbe({ onChange }: { onChange: (mode: string) => void }) {
  const { viewMode } = useSurvey();
  useEffect(() => {
    onChange(viewMode);
  }, [viewMode, onChange]);
  return null;
}

test('Accept Sweep is disabled until the survey is calibrated', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Accept Sweep')).toBeInTheDocument());
  expect(screen.getByText('Accept Sweep')).toBeDisabled();
  expect(screen.getByText('Calibrate Survey')).not.toBeDisabled();
});

test('clicking Calibrate Survey switches the view mode', async () => {
  let currentMode = '';
  const onMode = (m: string) => {
    currentMode = m;
  };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <ViewModeProbe onChange={onMode} />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(currentMode).toBe('survey'));
  fireEvent.click(screen.getByText('Calibrate Survey'));
  await waitFor(() => expect(currentMode).toBe('calibrate-survey'));
});

test('Accept Sweep is enabled after calibration and disabled per-sweep once accepted', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Accept Sweep')).toBeInTheDocument());
  const acceptBtn = screen.getByText('Accept Sweep');
  expect(acceptBtn).not.toBeDisabled();
  // 0 / 5 accepted to start.
  expect(screen.getByText(/0 \/ 5 sweeps accepted/)).toBeInTheDocument();
  fireEvent.click(acceptBtn);
  await waitFor(() =>
    expect(screen.getByText(/1 \/ 5 sweeps accepted/)).toBeInTheDocument(),
  );
});

test('Remove RFI toggles the per-sweep RFI draw mode (FEAT-004)', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Remove RFI')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Remove RFI'));
  expect(screen.getByText(/Remove RFI \(click/)).toBeInTheDocument();
});

test('Recovery line on Removed plot recovers points while Remove RFI stays selected (BUG-004)', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });

  await waitFor(() => expect(screen.getByText('Remove RFI')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Remove RFI'));

  // Two clicks on the top sweep plot mark a baseline segment, which moves
  // every sample in the dec window [10, 12] into the Removed map.
  fireEvent.click(screen.getByTestId('survey-plot-click-first'));
  fireEvent.click(screen.getByTestId('survey-plot-click-second'));

  // Placeholder disappears once points land on the bottom panel.
  await waitFor(() =>
    expect(
      screen.queryByText(/Removed samples appear here/),
    ).not.toBeInTheDocument(),
  );

  // Draw a recovery line at removed≈0 across the dec span [9, 13] on the
  // Removed panel — fully recovers every removed sample (residual → 0).
  fireEvent.click(screen.getByTestId('baseline-plot-line-first'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('baseline-plot-line-second'));
  });

  // Placeholder is back → every removed sample was recovered.
  await waitFor(() =>
    expect(
      screen.getByText(/Removed samples appear here/),
    ).toBeInTheDocument(),
  );
  // Tool stays armed the whole time.
  expect(screen.getByText(/Remove RFI \(click/)).toBeInTheDocument();
});

test('Undo button reverts the last Remove RFI removal or recovery', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });

  await waitFor(() => expect(screen.getByText('Remove RFI')).toBeInTheDocument());
  // Undo starts disabled — no operations on the stack yet.
  expect(screen.getByText('Undo')).toBeDisabled();

  fireEvent.click(screen.getByText('Remove RFI'));

  // Removal: two clicks on the top plot drop samples into the Removed map.
  fireEvent.click(screen.getByTestId('survey-plot-click-first'));
  fireEvent.click(screen.getByTestId('survey-plot-click-second'));
  await waitFor(() =>
    expect(
      screen.queryByText(/Removed samples appear here/),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Undo')).not.toBeDisabled();

  // Recovery line (drawn at removed≈0 across [9, 13]) wipes them back out.
  fireEvent.click(screen.getByTestId('baseline-plot-line-first'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('baseline-plot-line-second'));
  });
  await waitFor(() =>
    expect(
      screen.getByText(/Removed samples appear here/),
    ).toBeInTheDocument(),
  );

  // Undo #1 → reverses the recovery. Removed samples reappear on the bottom plot.
  fireEvent.click(screen.getByText('Undo'));
  await waitFor(() =>
    expect(
      screen.queryByText(/Removed samples appear here/),
    ).not.toBeInTheDocument(),
  );

  // Undo #2 → reverses the removal. Bottom plot empties again and Undo
  // disables itself (stack drained).
  fireEvent.click(screen.getByText('Undo'));
  await waitFor(() =>
    expect(
      screen.getByText(/Removed samples appear here/),
    ).toBeInTheDocument(),
  );
  expect(screen.getByText('Undo')).toBeDisabled();
});

test('removed samples persist after accepting, so an accepted sweep can be revisited and re-edited', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  (rpcClient.setSourceSweepFlux as unknown as ReturnType<typeof vi.fn>).mockClear();
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });

  await waitFor(() => expect(screen.getByText('Remove RFI')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Remove RFI'));

  // Remove a band on sweep 1 (index 0): points land on the Removed panel.
  fireEvent.click(screen.getByTestId('survey-plot-click-first'));
  fireEvent.click(screen.getByTestId('survey-plot-click-second'));
  await waitFor(() =>
    expect(screen.queryByText(/Removed samples appear here/)).not.toBeInTheDocument(),
  );

  // Accept the sweep → commits corrected flux to the engine and advances to
  // the next unaccepted sweep.
  await act(async () => {
    fireEvent.click(screen.getByText('Accept Sweep'));
  });
  await waitFor(() =>
    expect(screen.getByText(/1 \/ 5 sweeps accepted/)).toBeInTheDocument(),
  );
  expect(rpcClient.setSourceSweepFlux).toHaveBeenCalledWith(2, 0, expect.any(Array));

  // Go back to the accepted sweep.
  await act(async () => {
    fireEvent.click(screen.getByText(/Prev/));
  });

  // Its removed samples are still on the Removed panel (placeholder absent),
  // and the accept button now offers Apply Edits rather than being a disabled
  // Accept Sweep — proving the sweep stayed re-editable.
  await waitFor(() =>
    expect(screen.queryByText(/Removed samples appear here/)).not.toBeInTheDocument(),
  );
  expect(screen.getByText('Apply Edits')).toBeInTheDocument();
});

test('clicking a point in Remove RFI mode still updates the RA/Dec/Flux readout', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Remove RFI')).toBeInTheDocument());
  // Readout starts empty.
  expect(screen.getByText('Dec: --:--:--')).toBeInTheDocument();

  fireEvent.click(screen.getByText('Remove RFI'));
  // Clicking the first endpoint in Remove RFI mode should update the readout
  // (dec 10 → 10:00:00), not just arm the baseline gesture.
  fireEvent.click(screen.getByTestId('survey-plot-click-first'));
  await waitFor(() => expect(screen.getByText('Dec: 10:00:00')).toBeInTheDocument());
});

test('ArrowRight accepts the current sweep and advances when calibrated', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() =>
    expect(screen.getByText(/0 \/ 5 sweeps accepted/)).toBeInTheDocument(),
  );
  fireEvent.keyDown(document.body, { key: 'ArrowRight' });
  await waitFor(() =>
    expect(screen.getByText(/1 \/ 5 sweeps accepted/)).toBeInTheDocument(),
  );
});

test('Ctrl+Shift+A accepts every sweep and moves to pre-image', async () => {
  const calibrated: WorkspaceOverview = { ...workspaceOverview, calibrated: true };
  let currentMode = '';
  const onMode = (m: string) => {
    currentMode = m;
  };
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: calibrated,
          }}
        />
        <ViewModeProbe onChange={onMode} />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(currentMode).toBe('survey'));
  fireEvent.keyDown(document.body, { key: 'A', ctrlKey: true, shiftKey: true });
  await waitFor(() => expect(currentMode).toBe('pre-image'));
});

test('Prev/Next sweep nav advances the source sweep index', async () => {
  const getSweep = rpcClient.getSourceSweep as unknown as ReturnType<typeof vi.fn>;
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 9, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <SurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(getSweep).toHaveBeenCalledWith(2, 0));
  fireEvent.click(screen.getByText('Next ›'));
  await waitFor(() => expect(getSweep).toHaveBeenCalledWith(2, 1));
});
