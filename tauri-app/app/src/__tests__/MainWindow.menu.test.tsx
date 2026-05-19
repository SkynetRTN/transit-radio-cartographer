import { fireEvent, render, screen } from '@testing-library/react';
import { MainWindow } from '../views/MainWindow';
import { SurveyProvider } from '../state/survey-context';

vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
vi.mock('../ipc/client', () => ({
  rpcClient: {
    openSurvey: vi.fn(),
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
  },
}));

function renderApp() {
  return render(
    <SurveyProvider>
      <MainWindow />
    </SurveyProvider>,
  );
}

test('top-level menus appear in legacy order with no FITS item', () => {
  renderApp();
  expect(screen.getByRole('navigation', { name: /main menu/i })).toBeInTheDocument();
  const expected = ['File', 'Image', 'Survey', 'Scan', 'Calibration'];
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
