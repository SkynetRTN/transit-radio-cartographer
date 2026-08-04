import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { ScanView } from '../views/ScanView';
import { CalibrateScanView } from '../views/CalibrateScanView';
import { rpcClient, type ScanMeta, type ScanOverview } from '../ipc/client';
import { ScanProvider, useScan } from '../state/scan-context';

// `vi.mock` is hoisted above all `import`s, so the factory body cannot read
// any top-level variables in this file. Build the mock state inline instead.
vi.mock('../ipc/client', () => {
  const overviewRaw = {
    name: 'CAS0A',
    path: '/tmp/cas0a.md1',
    source_count: 200,
    source_kept: 200,
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
    peak_flux: null,
  };
  const overviewCalibrated = { ...overviewRaw, calibrated: true };
  return {
    rpcClient: {
      closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
      openScan: vi.fn(),
      getScanOverview: vi.fn().mockResolvedValue(overviewRaw),
      getScanView: vi.fn().mockResolvedValue({
        name: 'CAS0A',
        calibrated: false,
        unit: 'volts',
        initial_on: { ra: [1, 2], dec: [10, 10], flux: [2, 2], mask: [true, true] },
        initial_off: { ra: [3, 4], dec: [10, 10], flux: [1, 1], mask: [true, true] },
        source: { ra: [5, 6, 7], dec: [10, 11, 12], flux: [3, 4, 5], mask: [true, true, true] },
        terminal_on: { ra: [8, 9], dec: [10, 10], flux: [4, 4], mask: [true, true] },
        terminal_off: { ra: [10, 11], dec: [10, 10], flux: [1, 1], mask: [true, true] },
      }),
      getScanCalibrationView: vi.fn().mockResolvedValue({
        name: 'CAS0A',
        initial: {
          label: 'initial',
          on: { ra: [1, 2], dec: [50, 50], flux: [2, 2], mask: [true, true] },
          off: { ra: [3, 4], dec: [50, 50], flux: [1, 1], mask: [true, true] },
        },
        terminal: {
          label: 'terminal',
          on: { ra: [9, 10], dec: [52, 52], flux: [4, 4], mask: [true, true] },
          off: { ra: [11, 12], dec: [52, 52], flux: [1, 1], mask: [true, true] },
        },
        cal1: 0.34,
        cal2: 0.36,
        initial_enabled: true,
        terminal_enabled: true,
        can_undo: false,
      }),
      cutScanCalibrationSegment: vi.fn().mockResolvedValue({ removed: 1, overview: overviewRaw }),
      selectScanCalibrationDeclination: vi
        .fn()
        .mockResolvedValue({ removed: 1, overview: overviewRaw }),
      applyScanCalibration: vi.fn().mockResolvedValue(overviewCalibrated),
      setScanBracketEnabled: vi.fn().mockResolvedValue(overviewRaw),
      selectScanDeclination: vi.fn().mockResolvedValue({ removed: 1, overview: overviewCalibrated }),
      cutScanSegment: vi.fn().mockResolvedValue({ removed: 1, overview: overviewCalibrated }),
      baselineScanSource: vi.fn().mockResolvedValue({ overview: overviewCalibrated }),
      determineScanPeak: vi
        .fn()
        .mockResolvedValue({ peak_flux: 4.5, overview: { ...overviewCalibrated, peak_flux: 4.5 } }),
      determineScanPeakFit: vi.fn().mockResolvedValue({
        peak_flux: 4.5,
        peak_ra: 10,
        fit_ra: [5, 10, 15],
        fit_flux: [3.5, 4.5, 3.5],
        overview: { ...overviewCalibrated, peak_flux: 4.5 },
      }),
      determineScanPeakGaussian: vi.fn().mockResolvedValue({
        peak_flux: 4.6,
        peak_ra: 10,
        fit_ra: [5, 10, 15],
        fit_flux: [3.0, 4.6, 3.0],
        overview: { ...overviewCalibrated, peak_flux: 4.6 },
      }),
      determineScanPeakSquaredCosine: vi.fn().mockResolvedValue({
        peak_flux: 4.7,
        peak_ra: 10,
        fit_ra: [5, 10, 15],
        fit_flux: [0.0, 4.7, 0.0],
        overview: { ...overviewCalibrated, peak_flux: 4.7 },
      }),
      determineScanPeakMaxValue: vi.fn().mockResolvedValue({
        peak_flux: 5.2,
        peak_ra: 6.5,
        fit_ra: [6.5],
        fit_flux: [5.2],
        overview: { ...overviewCalibrated, peak_flux: 5.2 },
      }),
      undoScan: vi.fn().mockResolvedValue({ undone: true, overview: overviewRaw }),
      saveScan: vi.fn().mockResolvedValue({ path: '/tmp/cyg0a.scn', bytes_written: 1234 }),
    },
  };
});

const overviewRaw: ScanOverview = {
  name: 'CAS0A',
  path: '/tmp/cas0a.md1',
  source_count: 200,
  source_kept: 200,
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
  peak_flux: null,
  flux_calibrated: false,
  flux_slope: null,
};

const overviewCalibrated: ScanOverview = { ...overviewRaw, calibrated: true };

// Headless PointScatter mock that exposes the drag / click callbacks as
// hidden buttons keyed off the plot's `testId`, so tests can drive a full
// gesture (Cut Segment drag, Baseline Source two-click, etc.) without a
// real Plotly render.
vi.mock('../lib/plots/PointScatter', () => ({
  PointScatter: (props: {
    testId?: string;
    highlightPoint?: { x: number; y: number; color?: string } | null;
    onPointClick?: (p: { x: number; y: number; ra: number; dec: number; flux: number }) => void;
    onEmptyClick?: () => void;
    onDragStart?: (v: number) => void;
    onDragUpdate?: (v: number) => void;
    onDragEnd?: () => void;
  }) => {
    const id = props.testId ?? 'plot';
    return (
      <div
        data-testid={id}
        data-highlight-x={props.highlightPoint?.x ?? ''}
        data-highlight-y={props.highlightPoint?.y ?? ''}
      >
        <button
          data-testid={`${id}-point-a`}
          onClick={() => props.onPointClick?.({ x: 5, y: 3, ra: 5, dec: 10, flux: 3 })}
        />
        <button
          data-testid={`${id}-point-b`}
          onClick={() => props.onPointClick?.({ x: 7, y: 5, ra: 7, dec: 12, flux: 5 })}
        />
        <button
          data-testid={`${id}-empty`}
          onClick={() => props.onEmptyClick?.()}
        />
        <button
          data-testid={`${id}-drag-start`}
          onClick={() => props.onDragStart?.(5)}
        />
        <button
          data-testid={`${id}-drag-update`}
          onClick={() => props.onDragUpdate?.(7)}
        />
        <button
          data-testid={`${id}-drag-end`}
          onClick={() => props.onDragEnd?.()}
        />
      </div>
    );
  },
}));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));

function HydrateScan({ meta }: { meta: ScanMeta }) {
  const { open } = useScan();
  useEffect(() => {
    (rpcClient.openScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(meta);
    void open(meta.metadata.path);
  }, [meta, open]);
  return null;
}

const baseMeta: ScanMeta = {
  handle: 7,
  metadata: { path: '/tmp/cas0a.md1', source_count: 200 },
  overview: overviewRaw,
};

test('Pre-calibration ScanView shows Calibrate Scan button', async () => {
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={baseMeta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Calibrate Scan')).toBeInTheDocument());
  // Source-reduction buttons must not appear until the scan is calibrated.
  expect(screen.queryByText('Baseline Source')).not.toBeInTheDocument();
  expect(screen.queryByText('Determine Peak')).not.toBeInTheDocument();
});

test('Clicking Calibrate Scan switches the scan view mode', async () => {
  function ModeProbe({ onChange }: { onChange: (m: string) => void }) {
    const { viewMode } = useScan();
    useEffect(() => {
      onChange(viewMode);
    }, [viewMode, onChange]);
    return null;
  }
  let mode = '';
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={baseMeta} />
        <ModeProbe onChange={(m) => (mode = m)} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Calibrate Scan')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Calibrate Scan'));
  await waitFor(() => expect(mode).toBe('calibrate-scan'));
});

test('Calibrated ScanView exposes the four source-reduction buttons', async () => {
  const meta: ScanMeta = { ...baseMeta, overview: overviewCalibrated };
  (rpcClient.getScanView as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    name: 'CAS0A',
    calibrated: true,
    unit: 'gain',
    source: { ra: [5, 6, 7], dec: [10, 11, 12], flux: [3, 4, 5], mask: [true, true, true] },
    peak_flux: null,
  });
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  for (const label of ['Select Declination', 'Baseline Source', 'Determine Peak', 'Cut Segment']) {
    await waitFor(() => expect(screen.getByText(label)).toBeInTheDocument());
  }
  expect(screen.queryByText('Calibrate Scan')).not.toBeInTheDocument();
});

test('Baseline Source toggles into pending-endpoint mode and back', async () => {
  const meta: ScanMeta = { ...baseMeta, overview: overviewCalibrated };
  (rpcClient.getScanView as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    name: 'CAS0A',
    calibrated: true,
    unit: 'gain',
    source: { ra: [5, 6, 7], dec: [10, 11, 12], flux: [3, 4, 5], mask: [true, true, true] },
    peak_flux: null,
  });
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Baseline Source')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Baseline Source'));
  expect(screen.getByText(/Baseline Source \(click/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Baseline Source \(click/));
  // Toggle back into idle.
  await waitFor(() => expect(screen.getByText('Baseline Source')).toBeInTheDocument());
});

test('Mutating actions set dirty; save clears it and records savePath', async () => {
  function StateProbe({
    onState,
  }: {
    onState: (s: { dirty: boolean; savePath: string | null }) => void;
  }) {
    const { dirty, savePath } = useScan();
    useEffect(() => {
      onState({ dirty, savePath });
    }, [dirty, savePath, onState]);
    return null;
  }
  function MutationProbe() {
    const { markDirty, save } = useScan();
    return (
      <>
        <button onClick={markDirty}>probe-dirty</button>
        <button onClick={() => void save('/tmp/cyg0a.scn')}>probe-save</button>
      </>
    );
  }

  let latest: { dirty: boolean; savePath: string | null } = { dirty: false, savePath: null };
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={baseMeta} />
        <StateProbe onState={(s) => (latest = s)} />
        <MutationProbe />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(latest.dirty).toBe(false));

  fireEvent.click(screen.getByText('probe-dirty'));
  await waitFor(() => expect(latest.dirty).toBe(true));

  fireEvent.click(screen.getByText('probe-save'));
  await waitFor(() =>
    expect(rpcClient.saveScan as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      7,
      '/tmp/cyg0a.scn',
    ),
  );
  await waitFor(() => expect(latest.dirty).toBe(false));
  await waitFor(() => expect(latest.savePath).toBe('/tmp/cyg0a.scn'));
});

test('Calibrate Scan view applies calibration and routes back to ScanView', async () => {
  function ModeProbe({ onChange }: { onChange: (m: string) => void }) {
    const { viewMode } = useScan();
    useEffect(() => {
      onChange(viewMode);
    }, [viewMode, onChange]);
    return null;
  }
  let mode = '';
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={baseMeta} />
        <ModeProbe onChange={(m) => (mode = m)} />
        <CalibrateScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText(/Calibrate Scan/)).toBeInTheDocument());
  // Cut Segment toggle should flip the button label to (drag…).
  fireEvent.click(screen.getByText('Cut Segment'));
  expect(screen.getByText(/Cut Segment \(drag/)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Cut Segment \(drag/));
  // Apply calibration → returns to scan view.
  fireEvent.click(screen.getByRole('button', { name: /^Calibrate Scan$/ }));
  await waitFor(() =>
    expect(rpcClient.applyScanCalibration as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(7),
  );
  await waitFor(() => expect(mode).toBe('scan'));
});

// FEAT-002 sticky-tool tests. Each renders a calibrated ScanView, exercises a
// full gesture on the mocked PointScatter (via the drag/click helper buttons
// it exposes), and asserts the tool button remains in its armed state.
const calibratedView = {
  name: 'CAS0A',
  calibrated: true,
  unit: 'gain',
  source: { ra: [5, 6, 7], dec: [10, 11, 12], flux: [3, 4, 5], mask: [true, true, true] },
  peak_flux: null,
};

function setupCalibratedScanView() {
  // Two queued resolutions: initial load + reload after the action completes.
  const getView = rpcClient.getScanView as unknown as ReturnType<typeof vi.fn>;
  getView.mockResolvedValueOnce(calibratedView).mockResolvedValueOnce(calibratedView);
  const getOverview = rpcClient.getScanOverview as unknown as ReturnType<typeof vi.fn>;
  getOverview.mockResolvedValueOnce(overviewCalibrated);
  return { ...baseMeta, overview: overviewCalibrated } as ScanMeta;
}

test('Cut Segment stays sticky after a cut (FEAT-002)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Cut Segment')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Cut Segment'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-start'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-end'));
  });
  await waitFor(() =>
    expect(rpcClient.cutScanSegment as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(7, 5, 7),
  );
  expect(screen.getByText(/Cut Segment \(drag/)).toBeInTheDocument();
});

test('Select Declination stays sticky after a select (FEAT-002)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Select Declination')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Select Declination'));
  fireEvent.click(screen.getByTestId('scan-dec-plot-drag-start'));
  fireEvent.click(screen.getByTestId('scan-dec-plot-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-dec-plot-drag-end'));
  });
  await waitFor(() =>
    expect(
      rpcClient.selectScanDeclination as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 7),
  );
  expect(screen.getByText(/Select Declination \(drag/)).toBeInTheDocument();
});

test('Baseline Source stays sticky after a two-click baseline (FEAT-002)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Baseline Source')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Baseline Source'));
  // First click sets the pending endpoint; second click triggers the RPC.
  fireEvent.click(screen.getByTestId('scan-flux-plot-point-a'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-point-b'));
  });
  await waitFor(() =>
    expect(
      rpcClient.baselineScanSource as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 3, 7, 5),
  );
  // Mode is still 'baseline' with no pending point → the no-pending click hint.
  expect(screen.getByText(/Baseline Source \(click/)).toBeInTheDocument();
});

test('Determine Peak stays sticky after a peak fit (FEAT-002)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Determine Peak')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Determine Peak'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-start'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-end'));
  });
  // peakFitKind defaults to 'gaussian' → Gaussian fit RPC.
  await waitFor(() =>
    expect(
      rpcClient.determineScanPeakGaussian as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 7),
  );
  expect(screen.getByText(/Determine Peak \(drag/)).toBeInTheDocument();
});

function FitKindPicker({ kind }: { kind: 'cos2' | 'max' | 'poly3' }) {
  const { setPeakFitKind } = useScan();
  useEffect(() => {
    setPeakFitKind(kind);
  }, [kind, setPeakFitKind]);
  return null;
}

test('Determine Peak with Squared Cosine fit kind invokes the cos² RPC (FEAT-006)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <FitKindPicker kind="cos2" />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Determine Peak')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Determine Peak'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-start'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-end'));
  });
  await waitFor(() =>
    expect(
      rpcClient.determineScanPeakSquaredCosine as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 7),
  );
  // cos² returns a fit curve, so no point-ring highlight should appear.
  expect(screen.getByTestId('scan-flux-plot').getAttribute('data-highlight-x')).toBe('');
});

test('Determine Peak with Max Value fit kind invokes the max RPC and rings the point (FEAT-006)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <FitKindPicker kind="max" />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Determine Peak')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Determine Peak'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-start'));
  fireEvent.click(screen.getByTestId('scan-flux-plot-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-end'));
  });
  await waitFor(() =>
    expect(
      rpcClient.determineScanPeakMaxValue as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 7),
  );
  // Max Value renders a single ringed sample (mocked at ra=6.5, flux=5.2);
  // no fit curve, just the highlight.
  await waitFor(() =>
    expect(screen.getByTestId('scan-flux-plot').getAttribute('data-highlight-x')).toBe('6.5'),
  );
  expect(screen.getByTestId('scan-flux-plot').getAttribute('data-highlight-y')).toBe('5.2');
});

test('Undo restores the model-fit overlay, not just the reverted peak (BUG-022)', async () => {
  // Two Max-Value fits at different RAs, so the restored highlight is
  // distinguishable from both the current one and the cleared ("") state.
  const maxRes = (ra: number) => ({
    peak_flux: 5.2,
    peak_ra: ra,
    fit_ra: [ra],
    fit_flux: [5.2],
    overview: { ...overviewCalibrated, peak_flux: 5.2, can_undo: true },
  });
  const getView = rpcClient.getScanView as unknown as ReturnType<typeof vi.fn>;
  // mount uses the shared ref; the undo reload must get a FRESH object so the
  // `[view]` reset effect actually re-runs (React bails on an identical ref).
  getView.mockResolvedValueOnce(calibratedView).mockResolvedValueOnce({ ...calibratedView });
  (rpcClient.determineScanPeakMaxValue as unknown as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce(maxRes(6.5))
    .mockResolvedValueOnce(maxRes(8));
  (rpcClient.undoScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    undone: true,
    overview: overviewCalibrated,
  });

  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={{ ...baseMeta, overview: overviewCalibrated }} />
        <FitKindPicker kind="max" />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Determine Peak')).toBeInTheDocument());
  const highlightX = () =>
    screen.getByTestId('scan-flux-plot').getAttribute('data-highlight-x');

  const fit = async () => {
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-start'));
    fireEvent.click(screen.getByTestId('scan-flux-plot-drag-update'));
    await act(async () => {
      fireEvent.click(screen.getByTestId('scan-flux-plot-drag-end'));
    });
  };

  fireEvent.click(screen.getByText('Determine Peak'));
  await fit();
  await waitFor(() => expect(highlightX()).toBe('6.5'));
  await fit();
  await waitFor(() => expect(highlightX()).toBe('8'));

  // Undo: the fit the reverted peak now reflects (fit A, ra 6.5) reappears —
  // before the fix the overlay was wiped and never restored.
  await act(async () => {
    fireEvent.click(screen.getByText('Undo'));
  });
  await waitFor(() => expect(highlightX()).toBe('6.5'));
});

test('Switching tools deselects the previous one (FEAT-002)', async () => {
  const meta = setupCalibratedScanView();
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={meta} />
        <ScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Cut Segment')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Cut Segment'));
  expect(screen.getByText(/Cut Segment \(drag/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Select Declination'));
  // Cut Segment label snaps back to its idle form, Select Declination is now armed.
  expect(screen.getByText('Cut Segment')).toBeInTheDocument();
  expect(screen.getByText(/Select Declination \(drag/)).toBeInTheDocument();
});

test('CalibrateScanView Cut Segment stays sticky after a cut (FEAT-002)', async () => {
  await act(async () => {
    render(
      <ScanProvider>
        <HydrateScan meta={baseMeta} />
        <CalibrateScanView />
      </ScanProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Cut Segment')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Cut Segment'));
  fireEvent.click(screen.getByTestId('scan-cal-flux-initial-drag-start'));
  fireEvent.click(screen.getByTestId('scan-cal-flux-initial-drag-update'));
  await act(async () => {
    fireEvent.click(screen.getByTestId('scan-cal-flux-initial-drag-end'));
  });
  await waitFor(() =>
    expect(
      rpcClient.cutScanCalibrationSegment as unknown as ReturnType<typeof vi.fn>,
    ).toHaveBeenCalledWith(7, 5, 7),
  );
  expect(screen.getByText(/Cut Segment \(drag/)).toBeInTheDocument();
});
