import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { MainWindow } from '../views/MainWindow';
import { SurveyProvider, useSurvey } from '../state/survey-context';
import { ScanProvider } from '../state/scan-context';
import { FluxCalibrationProvider } from '../state/flux-cal-context';
import type { SurveyMeta, WorkspaceOverview } from '../ipc/client';
import { RpcError } from '../ipc/client';

// BUG-012: regression test for the engine_restarted recovery path. The Rust
// harness emits the event after the Python sidecar dies and respawns; the UI
// must reset all handle state and surface a single toast (dirty-aware).

let firedHandlers: Array<(event: { payload: unknown }) => void> = [];
vi.mock('@tauri-apps/api/event', () => ({
  // Capture every listener so the test can fire `engine_restarted`. Returns
  // an unlisten promise like the real API.
  listen: vi.fn((_eventName: string, handler: (e: { payload: unknown }) => void) => {
    firedHandlers.push(handler);
    return Promise.resolve(() => {
      firedHandlers = firedHandlers.filter((h) => h !== handler);
    });
  }),
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), save: vi.fn() }));
vi.mock('../lib/plots/SweepPlot', () => ({ SweepPlot: () => null }));
vi.mock('../lib/plots/ImagePlot', () => ({ ImagePlot: () => null }));
vi.mock('../lib/plots/RgbImagePlot', () => ({ RgbImagePlot: () => null }));
vi.mock('../lib/plots/PointScatter', () => ({ PointScatter: () => null }));
vi.mock('../ipc/client', async () => {
  // Keep the real RpcError export so consumers (and the helper below)
  // still get a usable structured error type.
  const actual = await vi.importActual<typeof import('../ipc/client')>('../ipc/client');
  return {
    ...actual,
    rpcClient: {
      openSurvey: vi.fn(),
      openScan: vi.fn(),
      closeHandle: vi.fn().mockResolvedValue({ closed: 1 }),
      getSweepInline: vi
        .fn()
        .mockResolvedValue({ ra: [], dec: [], flux: [], sample_count: 0, returned_count: 0 }),
      getSourceSweep: vi.fn().mockResolvedValue({
        ra: [], dec: [], flux: [],
        sample_count: 0, returned_count: 0, index: 0, source_count: 1,
        unit: 'volts', label: 'X - Sweep 1', calibrated: false,
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
      determineScanPeakFit: vi.fn(),
      determineScanPeakGaussian: vi.fn(),
      determineScanPeakSquaredCosine: vi.fn(),
      determineScanPeakMaxValue: vi.fn(),
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
      request: vi.fn(),
    },
  };
});

import { rpcClient } from '../ipc/client';

const workspace: WorkspaceOverview = {
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

function MarkSurveyDirty() {
  const { markDirty, survey } = useSurvey();
  useEffect(() => {
    if (survey) markDirty();
  }, [survey, markDirty]);
  return null;
}

function SurveyProbe({ onChange }: { onChange: (s: SurveyMeta | null) => void }) {
  const { survey } = useSurvey();
  useEffect(() => {
    onChange(survey);
  }, [survey, onChange]);
  return null;
}

function renderApp(children: React.ReactNode = null) {
  return render(
    <SurveyProvider>
      <ScanProvider>
        <FluxCalibrationProvider>
          <MainWindow />
          {children}
        </FluxCalibrationProvider>
      </ScanProvider>
    </SurveyProvider>,
  );
}

beforeEach(() => {
  firedHandlers = [];
});

function fireEngineRestarted(pid = 1234) {
  // Each provider mounts its own listener; only MainWindow currently does,
  // but the test fires every captured handler defensively.
  act(() => {
    for (const h of firedHandlers) h({ payload: { pid } });
  });
}

test('clean restart: survey handle is cleared and the "please re-open" toast appears', async () => {
  let lastSurvey: SurveyMeta | null | undefined = undefined;
  await act(async () => {
    renderApp(
      <>
        <HydrateSurvey
          meta={{
            handle: 7,
            metadata: { sweep_count: 5, path: '/tmp/and0a.md2' },
            workspace_handle: 8,
            workspace,
          }}
        />
        <SurveyProbe onChange={(s) => { lastSurvey = s; }} />
      </>,
    );
  });
  await waitFor(() => expect(lastSurvey?.handle).toBe(7));

  fireEngineRestarted();

  await waitFor(() => expect(lastSurvey).toBeNull());
  // The warning-toast carries role="status"; it is the only element rendering
  // the message text, so a getByText is sufficient.
  expect(screen.getByText(/Engine restarted; please re-open your files\./)).toBeInTheDocument();
  expect(
    screen.queryByText(/Unsaved changes could not be recovered/),
  ).not.toBeInTheDocument();
});

test('dirty restart: toast warns that unsaved changes were lost', async () => {
  let lastSurvey: SurveyMeta | null | undefined = undefined;
  await act(async () => {
    renderApp(
      <>
        <HydrateSurvey
          meta={{
            handle: 7,
            metadata: { sweep_count: 5, path: '/tmp/and0a.md2' },
            workspace_handle: 8,
            workspace,
          }}
        />
        <MarkSurveyDirty />
        <SurveyProbe onChange={(s) => { lastSurvey = s; }} />
      </>,
    );
  });
  await waitFor(() => expect(lastSurvey?.handle).toBe(7));

  fireEngineRestarted();

  await waitFor(() => expect(lastSurvey).toBeNull());
  expect(
    screen.getByText(/Engine restarted\. Unsaved changes could not be recovered\./),
  ).toBeInTheDocument();
});

test('a stale-handle RPC error in a context catch resets state too (defense in depth)', async () => {
  // Layer 3 path: even without an engine_restarted event (race or future
  // engine bug), an RpcError with code 1001 from any RPC call inside a
  // context catch should clear handle state and surface a clear message
  // rather than the cryptic "1001:unknown handle: N".
  let surveyError: string | null = null;
  let lastSurvey: SurveyMeta | null | undefined = undefined;
  function ErrorProbe() {
    const { error, survey } = useSurvey();
    useEffect(() => {
      surveyError = error;
      lastSurvey = survey;
    }, [error, survey]);
    return null;
  }

  // First open succeeds; second open simulates the engine having been
  // restarted out-of-band (stale handle).
  (rpcClient.openSurvey as unknown as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({
      handle: 7,
      metadata: { sweep_count: 5, path: '/tmp/and0a.md2' },
      workspace_handle: 8,
      workspace,
    } as SurveyMeta)
    .mockRejectedValueOnce(new RpcError(1001, 'unknown handle: 7'));

  function Driver() {
    const { open } = useSurvey();
    useEffect(() => {
      void (async () => {
        await open('/tmp/and0a.md2');
        await open('/tmp/elsewhere.md2');
      })();
    }, [open]);
    return null;
  }
  await act(async () => {
    render(
      <SurveyProvider>
        <Driver />
        <ErrorProbe />
      </SurveyProvider>,
    );
  });

  await waitFor(() => expect(surveyError).toBe('Engine handle expired. Please re-open your files.'));
  expect(lastSurvey).toBeNull();
});
