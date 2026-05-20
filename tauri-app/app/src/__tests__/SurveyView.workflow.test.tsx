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
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));

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

test('Baseline Segment toggles the per-sweep baseline draw mode', async () => {
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
  await waitFor(() => expect(screen.getByText('Baseline Segment')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Baseline Segment'));
  expect(screen.getByText(/Baseline Segment \(click/)).toBeInTheDocument();
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
