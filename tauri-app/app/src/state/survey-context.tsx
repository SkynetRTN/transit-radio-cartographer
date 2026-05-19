import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  rpcClient,
  type ImageMeta,
  type ReductionResult,
  type SurveyMeta,
  type WorkspaceOverview,
} from '../ipc/client';

export type WorkspaceViewMode = 'survey' | 'calibrate-survey' | 'pre-image';

export interface SurveyState {
  loading: boolean;
  error: string | null;
  survey: SurveyMeta | null;
  workspace: WorkspaceOverview | null;
  workspaceHandle: number | null;
  viewMode: WorkspaceViewMode;
  image: ImageMeta | null;
  reducing: boolean;
  // Per-sweep workflow state. `currentSweepIndex` is the sweep the user is
  // editing; `acceptedSweeps` is the set of sweep indices that have been
  // accepted into the survey. Once every source sweep is accepted the view
  // mode flips to 'pre-image' so the user can render the gridded image.
  currentSweepIndex: number;
  acceptedSweeps: Set<number>;
  open: (path: string) => Promise<void>;
  close: () => Promise<void>;
  setViewMode: (mode: WorkspaceViewMode) => void;
  setCurrentSweepIndex: (index: number) => void;
  acceptCurrentSweep: () => void;
  resetSweepReview: () => void;
  refreshWorkspace: () => Promise<void>;
  applyReduction: (op: (handle: number) => Promise<ReductionResult>) => Promise<void>;
  makeImage: (pix?: number) => Promise<ImageMeta | null>;
  clearImage: () => Promise<void>;
}

const SurveyContext = createContext<SurveyState | null>(null);

function closeInBackground(handle: number | undefined | null) {
  if (handle === undefined || handle === null) return;
  void rpcClient.closeHandle(handle).catch(() => {});
}

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [survey, setSurvey] = useState<SurveyMeta | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceOverview | null>(null);
  const [workspaceHandle, setWorkspaceHandle] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>('survey');
  const [image, setImage] = useState<ImageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [reducing, setReducing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSweepIndex, setCurrentSweepIndex] = useState(0);
  const [acceptedSweeps, setAcceptedSweeps] = useState<Set<number>>(() => new Set());

  const surveyRef = useRef<SurveyMeta | null>(survey);
  const workspaceHandleRef = useRef<number | null>(workspaceHandle);
  const imageRef = useRef<ImageMeta | null>(image);
  useEffect(() => {
    surveyRef.current = survey;
  }, [survey]);
  useEffect(() => {
    workspaceHandleRef.current = workspaceHandle;
  }, [workspaceHandle]);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);

  const open = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const meta = await rpcClient.openSurvey(path);
      const prevSurvey = surveyRef.current;
      const prevImage = imageRef.current;
      const prevWorkspaceHandle = workspaceHandleRef.current;
      setSurvey(meta);
      setWorkspaceHandle(meta.workspace_handle ?? null);
      setWorkspace(meta.workspace ?? null);
      setViewMode('survey');
      setImage(null);
      setCurrentSweepIndex(0);
      setAcceptedSweeps(new Set());
      closeInBackground(prevSurvey?.handle);
      closeInBackground(prevWorkspaceHandle);
      closeInBackground(prevImage?.handle);
    } catch (e) {
      setError((e as Error).message);
      setSurvey(null);
      setWorkspace(null);
      setWorkspaceHandle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(async () => {
    closeInBackground(surveyRef.current?.handle);
    closeInBackground(workspaceHandleRef.current);
    closeInBackground(imageRef.current?.handle);
    setSurvey(null);
    setWorkspace(null);
    setWorkspaceHandle(null);
    setImage(null);
    setViewMode('survey');
    setCurrentSweepIndex(0);
    setAcceptedSweeps(new Set());
  }, []);

  const acceptCurrentSweep = useCallback(() => {
    const sourceCount = workspace?.source_count ?? 0;
    if (sourceCount <= 0) return;
    const next = new Set(acceptedSweeps);
    next.add(currentSweepIndex);
    setAcceptedSweeps(next);
    if (next.size >= sourceCount) {
      setViewMode('pre-image');
      return;
    }
    // Advance to the next un-accepted sweep, wrapping if needed.
    for (let i = 1; i <= sourceCount; i++) {
      const candidate = (currentSweepIndex + i) % sourceCount;
      if (!next.has(candidate)) {
        setCurrentSweepIndex(candidate);
        break;
      }
    }
  }, [workspace?.source_count, currentSweepIndex, acceptedSweeps]);

  const resetSweepReview = useCallback(() => {
    setAcceptedSweeps(new Set());
    setCurrentSweepIndex(0);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    const h = workspaceHandleRef.current;
    if (h === null) return;
    try {
      const o = await rpcClient.getWorkspaceOverview(h);
      setWorkspace(o);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const applyReduction = useCallback(
    async (op: (handle: number) => Promise<ReductionResult>) => {
      const current = surveyRef.current;
      if (!current) return;
      setReducing(true);
      setError(null);
      const prevHandle = current.handle;
      const path = current.metadata.path;
      try {
        const result = await op(prevHandle);
        setSurvey({
          handle: result.handle,
          metadata: { sweep_count: result.sweep_count, path },
        });
        closeInBackground(prevHandle);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setReducing(false);
      }
    },
    [],
  );

  const makeImage = useCallback(async (pix = 1) => {
    const current = surveyRef.current;
    if (!current) return null;
    setReducing(true);
    setError(null);
    try {
      const meta = await rpcClient.makeImage(current.handle, pix);
      const prevImage = imageRef.current;
      setImage(meta);
      closeInBackground(prevImage?.handle);
      return meta;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setReducing(false);
    }
  }, []);

  const clearImage = useCallback(async () => {
    closeInBackground(imageRef.current?.handle);
    setImage(null);
  }, []);

  const value = useMemo<SurveyState>(
    () => ({
      loading,
      error,
      survey,
      workspace,
      workspaceHandle,
      viewMode,
      image,
      reducing,
      currentSweepIndex,
      acceptedSweeps,
      open,
      close,
      setViewMode,
      setCurrentSweepIndex,
      acceptCurrentSweep,
      resetSweepReview,
      refreshWorkspace,
      applyReduction,
      makeImage,
      clearImage,
    }),
    [
      loading,
      error,
      survey,
      workspace,
      workspaceHandle,
      viewMode,
      image,
      reducing,
      currentSweepIndex,
      acceptedSweeps,
      open,
      close,
      acceptCurrentSweep,
      resetSweepReview,
      refreshWorkspace,
      applyReduction,
      makeImage,
      clearImage,
    ],
  );

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}

export function useSurvey(): SurveyState {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurvey must be used inside a SurveyProvider');
  return ctx;
}
