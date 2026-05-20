import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { CalibrateSurveyView } from '../views/CalibrateSurveyView';
import { rpcClient, type SurveyMeta, type WorkspaceOverview } from '../ipc/client';
import { SurveyProvider, useSurvey } from '../state/survey-context';

vi.mock('../ipc/client', () => ({
  rpcClient: {
    openSurvey: vi.fn(),
    closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
    getSweepInline: vi.fn(),
    getWorkspaceOverview: vi.fn(),
    getSourceSweep: vi.fn(),
    getCalibrationView: vi.fn().mockResolvedValue({
      name: 'AND0A',
      initial: {
        label: 'initial',
        on: { ra: [1], dec: [50], flux: [2.1], mask: [true] },
        off: { ra: [2], dec: [50], flux: [1.8], mask: [true] },
      },
      terminal: {
        label: 'terminal',
        on: { ra: [9], dec: [52], flux: [2.2], mask: [true] },
        off: { ra: [10], dec: [52], flux: [1.9], mask: [true] },
      },
      cal1: 0.34,
      cal2: 0.36,
      initial_enabled: true,
      terminal_enabled: true,
      can_undo: false,
    }),
    cutCalibrationSegment: vi.fn().mockResolvedValue({
      removed: 1,
      overview: {} as WorkspaceOverview,
    }),
    selectCalibrationDeclination: vi.fn().mockResolvedValue({
      removed: 1,
      overview: {} as WorkspaceOverview,
    }),
    undoCalibrationCut: vi
      .fn()
      .mockResolvedValue({ undone: true, overview: {} as WorkspaceOverview }),
    applyGainCalibration: vi.fn().mockResolvedValue({} as WorkspaceOverview),
    setBracketEnabled: vi.fn().mockResolvedValue({} as WorkspaceOverview),
    smooth: vi.fn(),
    baseline: vi.fn(),
    align: vi.fn(),
    makeImage: vi.fn(),
    getImagePixels: vi.fn(),
  },
}));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));

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
  const { open, setViewMode } = useSurvey();
  useEffect(() => {
    (rpcClient.openSurvey as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(meta);
    void open(meta.metadata.path).then(() => setViewMode('calibrate-survey'));
  }, [meta, open, setViewMode]);
  return null;
}

test('Cut Segment toggle enables drag-cut mode then exits after a cut', async () => {
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
        <CalibrateSurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Cut Segment')).toBeInTheDocument());
  const cutBtn = screen.getByText('Cut Segment');
  fireEvent.click(cutBtn);
  expect(screen.getByText(/Cut Segment \(drag/)).toBeInTheDocument();
  // Toggle back off
  fireEvent.click(screen.getByText(/Cut Segment \(drag/));
  expect(screen.getByText('Cut Segment')).toBeInTheDocument();
});

test('Apply Calibration calls the gain calibration rpc and returns to survey view', async () => {
  let mode = '';
  function Probe() {
    const { viewMode } = useSurvey();
    useEffect(() => {
      mode = viewMode;
    }, [viewMode]);
    return null;
  }
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
        <Probe />
        <CalibrateSurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(mode).toBe('calibrate-survey'));
  fireEvent.click(screen.getByRole('button', { name: /^Calibrate Survey$/ }));
  await waitFor(() =>
    expect(rpcClient.applyGainCalibration as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(2),
  );
  await waitFor(() => expect(mode).toBe('survey'));
});

test('Select Declination toggle enables drag-select mode then exits when toggled off', async () => {
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
        <CalibrateSurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Select Declination')).toBeInTheDocument());
  const selBtn = screen.getByText('Select Declination');
  fireEvent.click(selBtn);
  expect(screen.getByText(/Select Declination \(drag/)).toBeInTheDocument();
  // Toggle back off
  fireEvent.click(screen.getByText(/Select Declination \(drag/));
  expect(screen.getByText('Select Declination')).toBeInTheDocument();
});

test('Initial / Terminal checkboxes toggle the cal brackets', async () => {
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
        <CalibrateSurveyView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText(/Initial: 0\.340 V/)).toBeInTheDocument());
  const checkboxes = screen.getAllByRole('checkbox');
  expect(checkboxes).toHaveLength(2);
  fireEvent.click(checkboxes[0]);
  await waitFor(() =>
    expect(rpcClient.setBracketEnabled as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      2,
      'initial',
      false,
    ),
  );
});
