import { fireEvent, render, screen, act, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { PreImageView } from '../views/PreImageView';
import { rpcClient, type SurveyMeta, type WorkspaceOverview } from '../ipc/client';
import { SurveyProvider, useSurvey } from '../state/survey-context';

vi.mock('../ipc/client', () => ({
  rpcClient: {
    openSurvey: vi.fn(),
    closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
    getSweepInline: vi.fn(),
    getWorkspaceOverview: vi.fn(),
    getSourceSweep: vi.fn(),
    getCalibrationView: vi.fn(),
    cutCalibrationSegment: vi.fn(),
    selectCalibrationDeclination: vi.fn(),
    undoCalibrationCut: vi.fn(),
    applyGainCalibration: vi.fn(),
    setBracketEnabled: vi.fn(),
    smooth: vi.fn().mockResolvedValue({ sweep_count: 5, op: 'smooth' }),
    baseline: vi.fn().mockResolvedValue({ sweep_count: 5, op: 'baseline' }),
    align: vi.fn().mockResolvedValue({ sweep_count: 5, op: 'align' }),
    makeImage: vi.fn().mockResolvedValue({
      handle: 100,
      width: 10,
      height: 10,
      min_ra: 0,
      max_ra: 1,
      min_dec: 0,
      max_dec: 1,
      min_flux: 0,
      max_flux: 1,
    }),
    getImagePixels: vi.fn().mockResolvedValue({
      pixels: [[0]],
      width: 1,
      height: 1,
    }),
  },
}));
const imagePlotProps: Array<Record<string, unknown>> = [];
vi.mock('../lib/plots/ImagePlot', () => ({
  ImagePlot: (props: Record<string, unknown>) => {
    imagePlotProps.push(props);
    return null;
  },
}));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));

const workspaceOverview: WorkspaceOverview = {
  name: 'AND0A',
  path: '/tmp/and0a.md2',
  source_count: 1,
  initial_cal_samples: 120,
  terminal_cal_samples: 120,
  initial_kept: 120,
  terminal_kept: 120,
  cal1: 0.34,
  cal2: 0.36,
  calibrated: true,
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
    void open(meta.metadata.path).then(() => setViewMode('pre-image'));
  }, [meta, open, setViewMode]);
  return null;
}

test('Pre Image view auto-generates an image on entry', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  // The legacy default "Pixel Resolution" prompt seeds with `"2"` —
  // vb/survform.frm:1509 — so the auto-generated pre-image uses pix=2.
  // `(handle, pix, workspaceHandle)` — workspace_handle=2 comes from the
  // mocked SurveyMeta below. Passing it makes the engine drop cal sweeps.
  await waitFor(() =>
    expect(rpcClient.makeImage as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, 1, 2),
  );
  await waitFor(() => expect(screen.getByText('Smooth Sweeps')).not.toBeDisabled());
});

async function runSmoothBaselineAlign() {
  await waitFor(() => expect(screen.getByText('Smooth Sweeps')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Smooth Sweeps'));
  await waitFor(() =>
    expect(rpcClient.smooth as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
  await waitFor(() => expect(screen.getByText('Baseline Sweeps')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Baseline Sweeps'));
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.baseline as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
  await waitFor(() => expect(screen.getByText('Align Sweeps')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Align Sweeps'));
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.align as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
}

test('Pre Image shows the right-click-drag zoom hint once an image exists', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() =>
    expect(
      screen.getByText(/Right-click and drag on the image to zoom in/),
    ).toBeInTheDocument(),
  );
});

test('Make Image is gated until smooth, baseline, and align all run', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Smooth Sweeps')).not.toBeDisabled());
  const makeImageBtn = screen.getByRole('button', { name: 'Make Image' });
  expect(makeImageBtn).toBeDisabled();
  // Tooltip should call out the remaining steps.
  expect(makeImageBtn.getAttribute('title')).toMatch(/smooth sweeps/);
  expect(makeImageBtn.getAttribute('title')).toMatch(/apply a baseline/);
  expect(makeImageBtn.getAttribute('title')).toMatch(/align sweeps/);

  // After smooth + baseline only, the button stays disabled and the title
  // should no longer mention completed steps.
  fireEvent.click(screen.getByText('Smooth Sweeps'));
  await waitFor(() =>
    expect(rpcClient.smooth as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
  fireEvent.click(screen.getByText('Baseline Sweeps'));
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.baseline as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
  expect(screen.getByRole('button', { name: 'Make Image' })).toBeDisabled();
  expect(
    screen.getByRole('button', { name: 'Make Image' }).getAttribute('title'),
  ).toMatch(/align/);

  // After Align Sweeps the button enables.
  fireEvent.click(screen.getByText('Align Sweeps'));
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.align as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled(),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Make Image' })).not.toBeDisabled(),
  );
});

test('Make Image opens a Pixel Resolution prompt that defaults to current pix and re-renders', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await runSmoothBaselineAlign();
  const makeImageMock = rpcClient.makeImage as unknown as ReturnType<typeof vi.fn>;
  const initialCalls = makeImageMock.mock.calls.length;
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Make Image' })).not.toBeDisabled(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Make Image' }));
  const input = (await screen.findByRole('spinbutton')) as HTMLInputElement;
  expect(input.value).toBe('1');
  fireEvent.change(input, { target: { value: '4' } });
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() => expect(makeImageMock).toHaveBeenCalledWith(1, 4, 2));
  expect(makeImageMock.mock.calls.length).toBeGreaterThan(initialCalls);
});

test('Smooth Sweeps button calls smooth and regenerates the image', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Smooth Sweeps')).not.toBeDisabled());
  const smoothMock = rpcClient.smooth as unknown as ReturnType<typeof vi.fn>;
  const makeImageMock = rpcClient.makeImage as unknown as ReturnType<typeof vi.fn>;
  const callsBefore = makeImageMock.mock.calls.length;
  fireEvent.click(screen.getByText('Smooth Sweeps'));
  // The workspace handle must be forwarded so the engine applies the
  // reduction to `workspace.source_sweeps` — otherwise the regenerated
  // pre-image keeps the un-smoothed flux.
  await waitFor(() => expect(smoothMock).toHaveBeenCalledWith(1, 5, 2));
  await waitFor(() =>
    expect(makeImageMock.mock.calls.length).toBeGreaterThan(callsBefore),
  );
});

test('Baseline Sweeps opens a dialog with default 5 and submits to baseline rpc', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Baseline Sweeps')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Baseline Sweeps'));
  const input = (await screen.findByRole('spinbutton')) as HTMLInputElement;
  expect(input.value).toBe('5');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.baseline as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, 5, 2),
  );
});

test('Pre Image plot receives displayMode="sky" by default (FEAT-011)', async () => {
  imagePlotProps.length = 0;
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => {
    const last = imagePlotProps[imagePlotProps.length - 1];
    expect(last?.displayMode).toBe('sky');
  });
  // No Lock Aspect button exists — FEAT-011 removed it; control lives in
  // the Image menu instead.
  expect(screen.queryByRole('button', { name: 'Lock Aspect' })).toBeNull();
});

test('Align Sweeps opens a dialog with default 0.5 and submits to align rpc', async () => {
  await act(async () => {
    render(
      <SurveyProvider>
        <HydrateSurvey
          meta={{
            handle: 1,
            metadata: { sweep_count: 1, path: '/tmp/and0a.md2' },
            workspace_handle: 2,
            workspace: workspaceOverview,
          }}
        />
        <PreImageView />
      </SurveyProvider>,
    );
  });
  await waitFor(() => expect(screen.getByText('Align Sweeps')).not.toBeDisabled());
  fireEvent.click(screen.getByText('Align Sweeps'));
  const input = (await screen.findByRole('spinbutton')) as HTMLInputElement;
  expect(input.value).toBe('0.5');
  fireEvent.click(screen.getByRole('button', { name: 'OK' }));
  await waitFor(() =>
    expect(rpcClient.align as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, 0.5, 2),
  );
});
