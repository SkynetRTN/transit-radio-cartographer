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
  type ImagePixels,
  type ReductionResult,
  type SurveyMeta,
  type WorkspaceOverview,
} from '../ipc/client';

export type WorkspaceViewMode = 'survey' | 'calibrate-survey' | 'pre-image' | 'image';

export interface SurveyState {
  loading: boolean;
  error: string | null;
  survey: SurveyMeta | null;
  workspace: WorkspaceOverview | null;
  workspaceHandle: number | null;
  viewMode: WorkspaceViewMode;
  image: ImageMeta | null;
  imagePixels: ImagePixels | null;
  reducing: boolean;
  savePath: string | null;
  dirty: boolean;
  saving: boolean;
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
  save: (path?: string) => Promise<string | null>;
  markDirty: () => void;
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
  const [imagePixels, setImagePixels] = useState<ImagePixels | null>(null);
  const [loading, setLoading] = useState(false);
  const [reducing, setReducing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSweepIndex, setCurrentSweepIndex] = useState(0);
  const [acceptedSweeps, setAcceptedSweeps] = useState<Set<number>>(() => new Set());
  const [savePath, setSavePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const surveyRef = useRef<SurveyMeta | null>(survey);
  const workspaceHandleRef = useRef<number | null>(workspaceHandle);
  const imageRef = useRef<ImageMeta | null>(image);
  const savePathRef = useRef<string | null>(savePath);
  const acceptedSweepsRef = useRef<Set<number>>(acceptedSweeps);
  useEffect(() => {
    surveyRef.current = survey;
  }, [survey]);
  useEffect(() => {
    workspaceHandleRef.current = workspaceHandle;
  }, [workspaceHandle]);
  useEffect(() => {
    imageRef.current = image;
  }, [image]);
  useEffect(() => {
    savePathRef.current = savePath;
  }, [savePath]);
  useEffect(() => {
    acceptedSweepsRef.current = acceptedSweeps;
  }, [acceptedSweeps]);

  const open = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const isSaved = path.toLowerCase().endsWith('.srv');
      const meta = isSaved
        ? await rpcClient.openSavedSurvey(path)
        : await rpcClient.openSurvey(path);
      const prevSurvey = surveyRef.current;
      const prevImage = imageRef.current;
      const prevWorkspaceHandle = workspaceHandleRef.current;
      setSurvey(meta);
      setWorkspaceHandle(meta.workspace_handle ?? null);
      setWorkspace(meta.workspace ?? null);
      setImage(null);
      setImagePixels(null);
      if (isSaved) {
        const sweepCount = meta.workspace?.source_count ?? 0;
        const acceptedList =
          meta.accepted_sweeps ?? Array.from({ length: sweepCount }, (_, i) => i);
        const acceptedSet = new Set(acceptedList);
        setAcceptedSweeps(acceptedSet);
        if (acceptedSet.size >= sweepCount && sweepCount > 0) {
          setViewMode('pre-image');
          setCurrentSweepIndex(Math.max(0, sweepCount - 1));
        } else {
          let firstUnaccepted = 0;
          for (let i = 0; i < sweepCount; i++) {
            if (!acceptedSet.has(i)) {
              firstUnaccepted = i;
              break;
            }
          }
          setViewMode('survey');
          setCurrentSweepIndex(firstUnaccepted);
        }
        setSavePath(path);
      } else {
        setViewMode('survey');
        setCurrentSweepIndex(0);
        setAcceptedSweeps(new Set());
        setSavePath(null);
      }
      setDirty(false);
      closeInBackground(prevSurvey?.handle);
      closeInBackground(prevWorkspaceHandle);
      closeInBackground(prevImage?.handle);
    } catch (e) {
      setError((e as Error).message);
      setSurvey(null);
      setWorkspace(null);
      setWorkspaceHandle(null);
      setSavePath(null);
      setDirty(false);
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
    setImagePixels(null);
    setViewMode('survey');
    setCurrentSweepIndex(0);
    setAcceptedSweeps(new Set());
    setSavePath(null);
    setDirty(false);
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
      // refreshWorkspace is only called after a mutation, so anything that
      // reaches here means the workspace state diverged from disk.
      setDirty(true);
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
        // Workspace-aware reductions land on the workspace and omit `handle`
        // in the response — in that case we keep the existing survey handle
        // (the workspace already owns the reduced state).
        const nextHandle = result.handle ?? prevHandle;
        setSurvey({
          handle: nextHandle,
          metadata: { sweep_count: result.sweep_count, path },
        });
        setDirty(true);
        if (result.handle !== undefined) closeInBackground(prevHandle);
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
      // Pass the workspace handle so the engine grids from the workspace's
      // (possibly reduced/calibrated) source sweeps rather than the raw
      // survey — same convention PreImageView uses for its in-place preview.
      const meta = await rpcClient.makeImage(
        current.handle,
        pix,
        workspaceHandleRef.current,
      );
      const pixels = await rpcClient.getImagePixels(meta.handle);
      const prevImage = imageRef.current;
      setImage(meta);
      setImagePixels(pixels);
      setViewMode('image');
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
    setImagePixels(null);
  }, []);

  const markDirty = useCallback(() => {
    setDirty(true);
  }, []);

  const save = useCallback(async (path?: string): Promise<string | null> => {
    const h = workspaceHandleRef.current;
    if (h === null) return null;
    const target = path ?? savePathRef.current;
    if (!target) return null;
    setSaving(true);
    setError(null);
    try {
      const accepted = Array.from(acceptedSweepsRef.current).sort((a, b) => a - b);
      const result = await rpcClient.saveSurvey(h, target, accepted);
      setSavePath(result.path);
      setDirty(false);
      return result.path;
    } catch (e) {
      setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
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
      imagePixels,
      reducing,
      savePath,
      dirty,
      saving,
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
      save,
      markDirty,
    }),
    [
      loading,
      error,
      survey,
      workspace,
      workspaceHandle,
      viewMode,
      image,
      imagePixels,
      reducing,
      savePath,
      dirty,
      saving,
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
      save,
      markDirty,
    ],
  );

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}

export function useSurvey(): SurveyState {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurvey must be used inside a SurveyProvider');
  return ctx;
}
