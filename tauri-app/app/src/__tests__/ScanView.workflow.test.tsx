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

vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
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
