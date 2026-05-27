import { fireEvent, render, screen } from '@testing-library/react';
import { MainWindow } from '../views/MainWindow';
import { SurveyProvider } from '../state/survey-context';

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));
vi.mock('../lib/plots/RgbImagePlot', () => ({ RgbImagePlot: () => null }));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
vi.mock('../ipc/client', () => ({
  rpcClient: {
    openSurvey: vi.fn(),
    openScan: vi.fn(),
    closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
    getSweepInline: vi
      .fn()
      .mockResolvedValue({ ra: [], dec: [], flux: [], sample_count: 0, returned_count: 0 }),
    getSourceSweep: vi.fn().mockResolvedValue({
      ra: [],
      dec: [],
      flux: [],
      sample_count: 0,
      returned_count: 0,
      index: 0,
      source_count: 1,
      unit: 'volts',
      label: 'X - Sweep 1',
      calibrated: false,
    }),
    getCalibrationView: vi.fn(),
    cutCalibrationSegment: vi.fn(),
    selectCalibrationDeclination: vi.fn(),
    undoCalibrationCut: vi.fn(),
    applyGainCalibration: vi.fn(),
    setBracketEnabled: vi.fn(),
    getWorkspaceOverview: vi.fn(),
    smooth: vi.fn(),
    baseline: vi.fn(),
    align: vi.fn(),
    makeImage: vi.fn(),
    getImagePixels: vi.fn(),
    getScanOverview: vi.fn(),
    getScanView: vi.fn(),
    getScanCalibrationView: vi.fn(),
    cutScanCalibrationSegment: vi.fn(),
    selectScanCalibrationDeclination: vi.fn(),
    applyScanCalibration: vi.fn(),
    setScanBracketEnabled: vi.fn(),
    selectScanDeclination: vi.fn(),
    cutScanSegment: vi.fn(),
    baselineScanSource: vi.fn(),
    determineScanPeak: vi.fn(),
    undoScan: vi.fn(),
    saveScan: vi.fn(),
    saveSurvey: vi.fn(),
    setWorkspaceName: vi.fn(),
    setScanWorkspaceName: vi.fn(),
    fluxCalReadFile: vi.fn(),
    fluxCalWriteFile: vi.fn(),
    fluxCalFit: vi.fn(),
    fluxCalReadScnPeak: vi.fn(),
    fluxCalDefaultKnownJy: vi.fn(),
    fluxCalApplyToSurvey: vi.fn(),
    fluxCalRevertFromSurvey: vi.fn(),
    fluxCalApplyToScan: vi.fn(),
    fluxCalRevertFromScan: vi.fn(),
    fluxCalApplyToImage: vi.fn(),
    fluxCalRevertFromImage: vi.fn(),
  },
}));

import { ScanProvider } from '../state/scan-context';
import { FluxCalibrationProvider } from '../state/flux-cal-context';

function renderApp() {
  return render(
    <SurveyProvider>
      <ScanProvider>
        <FluxCalibrationProvider>
          <MainWindow />
        </FluxCalibrationProvider>
      </ScanProvider>
    </SurveyProvider>,
  );
}

test('top-level menus appear in legacy order with no FITS item', () => {
  renderApp();
  expect(screen.getByRole('navigation', { name: /main menu/i })).toBeInTheDocument();
  const expected = ['File', 'Image', 'Survey', 'Scan', 'Flux Calibration'];
  const rootMenuButtons = screen
    .getAllByRole('button')
    .filter((btn) => expected.includes((btn.textContent ?? '').trim()));
  expect(rootMenuButtons.map((b) => (b.textContent ?? '').trim())).toEqual(expected);
  expect(screen.queryByText(/FITS/i)).not.toBeInTheDocument();
});

test('image submenu items are disabled before an image exists', () => {
  renderApp();
  fireEvent.click(screen.getByText('Image'));
  expect(screen.getByRole('menuitem', { name: 'Save Image As…' })).toBeDisabled();
  expect(screen.getByRole('menuitem', { name: 'Save Bitmap As…' })).toBeDisabled();
  expect(screen.getByRole('menuitem', { name: 'Show Palette…' })).toBeDisabled();
});

test('save scan menu items respect hasScan and savePath state', () => {
  renderApp();
  fireEvent.click(screen.getByText('Scan'));
  // No scan loaded → both Save items are disabled.
  expect(screen.getByRole('menuitem', { name: 'Save Scan' })).toBeDisabled();
  expect(screen.getByRole('menuitem', { name: 'Save Scan As…' })).toBeDisabled();
});

test('Change Degree of Determine Peak menu item opens a numeric prompt', async () => {
  const dialog = await import('@tauri-apps/plugin-dialog');
  const client = await import('../ipc/client');
  (dialog.open as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/cyg0a.md1');
  (client.rpcClient.openScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    handle: 11,
    metadata: { path: '/tmp/cyg0a.md1', source_count: 200 },
    overview: {
      name: 'CYG0A',
      path: '/tmp/cyg0a.md1',
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
    },
  });
  renderApp();
  // Disabled until a scan is loaded.
  fireEvent.click(screen.getByText('Scan'));
  expect(
    screen.getByRole('menuitem', { name: 'Change Determine Peak Fit…' }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole('menuitem', { name: 'New Scan…' }));
  await vi.waitFor(() => {
    expect(client.rpcClient.openScan).toHaveBeenCalledWith('/tmp/cyg0a.md1');
  });
  // Open the dialog, change the value, submit. Clamp-to-[2,4] is enforced in onSubmit;
  // here we just check the dialog appears and accepts an in-range value.
  fireEvent.click(screen.getByText('Scan'));
  await vi.waitFor(() => {
    expect(
      screen.getByRole('menuitem', { name: 'Change Determine Peak Fit…' }),
    ).not.toBeDisabled();
  });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Change Determine Peak Fit…' }));
  const input = await screen.findByLabelText('Fit kind (0 = Gaussian, 2/3/4 = polynomial degree):');
  fireEvent.change(input, { target: { value: '3' } });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  // Dialog dismisses after submit.
  await vi.waitFor(() => {
    expect(screen.queryByLabelText('Fit kind (0 = Gaussian, 2/3/4 = polynomial degree):')).not.toBeInTheDocument();
  });
});

test('save survey menu items respect hasSurvey and savePath state', () => {
  renderApp();
  fireEvent.click(screen.getByText('Survey'));
  expect(screen.getByRole('menuitem', { name: 'Save Survey' })).toBeDisabled();
  expect(screen.getByRole('menuitem', { name: 'Save Survey As…' })).toBeDisabled();
});

test('save scan as opens save dialog and invokes saveScan rpc', async () => {
  const dialog = await import('@tauri-apps/plugin-dialog');
  const client = await import('../ipc/client');
  (dialog.open as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/cyg0a.md1');
  (client.rpcClient.openScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    handle: 9,
    metadata: { path: '/tmp/cyg0a.md1', source_count: 200 },
    overview: {
      name: 'CYG0A',
      path: '/tmp/cyg0a.md1',
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
    },
  });
  (dialog.save as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/cyg0a.scn');
  (client.rpcClient.saveScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    path: '/tmp/cyg0a.scn',
    bytes_written: 1234,
  });

  renderApp();
  // Open a scan so hasScan flips true.
  fireEvent.click(screen.getByText('Scan'));
  fireEvent.click(screen.getByRole('menuitem', { name: 'New Scan…' }));
  await vi.waitFor(() => {
    expect(client.rpcClient.openScan).toHaveBeenCalledWith('/tmp/cyg0a.md1');
  });

  fireEvent.click(screen.getByText('Scan'));
  await vi.waitFor(() => {
    expect(screen.getByRole('menuitem', { name: 'Save Scan As…' })).not.toBeDisabled();
  });
  // Save (no path yet) is still disabled.
  expect(screen.getByRole('menuitem', { name: 'Save Scan' })).toBeDisabled();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Save Scan As…' }));
  await vi.waitFor(() => {
    expect(dialog.save).toHaveBeenCalled();
    expect(client.rpcClient.saveScan).toHaveBeenCalledWith(9, '/tmp/cyg0a.scn');
  });
  // After a successful Save As, savePath is remembered → Save enables.
  fireEvent.click(screen.getByText('Scan'));
  await vi.waitFor(() => {
    expect(screen.getByRole('menuitem', { name: 'Save Scan' })).not.toBeDisabled();
  });
});

test('Change Scan Name opens a text prompt and calls set_scan_workspace_name', async () => {
  const dialog = await import('@tauri-apps/plugin-dialog');
  const client = await import('../ipc/client');
  (dialog.open as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/cyg0a.md1');
  (client.rpcClient.openScan as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    handle: 31,
    metadata: { path: '/tmp/cyg0a.md1', source_count: 200 },
    overview: {
      name: 'CYG0A',
      path: '/tmp/cyg0a.md1',
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
    },
  });
  (client.rpcClient.setScanWorkspaceName as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    name: 'Renamed Scan',
    path: '/tmp/cyg0a.md1',
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
  });

  renderApp();
  fireEvent.click(screen.getByText('Scan'));
  // Disabled before a scan is loaded.
  expect(screen.getByRole('menuitem', { name: 'Change Scan Name…' })).toBeDisabled();
  fireEvent.click(screen.getByRole('menuitem', { name: 'New Scan…' }));
  await vi.waitFor(() => {
    expect(client.rpcClient.openScan).toHaveBeenCalledWith('/tmp/cyg0a.md1');
  });

  fireEvent.click(screen.getByText('Scan'));
  await vi.waitFor(() => {
    expect(screen.getByRole('menuitem', { name: 'Change Scan Name…' })).not.toBeDisabled();
  });
  fireEvent.click(screen.getByRole('menuitem', { name: 'Change Scan Name…' }));

  const input = await screen.findByLabelText('Scan name:');
  fireEvent.change(input, { target: { value: 'Renamed Scan' } });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));

  await vi.waitFor(() => {
    expect(client.rpcClient.setScanWorkspaceName).toHaveBeenCalledWith(31, 'Renamed Scan');
  });
});

test('survey > new survey opens dialog and triggers open_survey rpc', async () => {
  const dialog = await import('@tauri-apps/plugin-dialog');
  const client = await import('../ipc/client');
  (dialog.open as unknown as ReturnType<typeof vi.fn>).mockResolvedValue('/tmp/sample.md2');
  (client.rpcClient.openSurvey as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    handle: 1,
    metadata: { sweep_count: 3, path: '/tmp/sample.md2' },
    workspace_handle: 2,
    workspace: {
      name: 'SAMPLE',
      path: '/tmp/sample.md2',
      source_count: 1,
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
    },
  });

  renderApp();
  fireEvent.click(screen.getByText('Survey'));
  fireEvent.click(screen.getByRole('menuitem', { name: 'New Survey…' }));
  await vi.waitFor(() => {
    expect(client.rpcClient.openSurvey).toHaveBeenCalledWith('/tmp/sample.md2');
  });
});
