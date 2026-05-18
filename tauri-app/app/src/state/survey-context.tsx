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

export type WorkspaceViewMode = 'survey' | 'calibrate-survey';

export interface SurveyState {
  loading: boolean;
  error: string | null;
  survey: SurveyMeta | null;
  workspace: WorkspaceOverview | null;
  workspaceHandle: number | null;
  viewMode: WorkspaceViewMode;
  image: ImageMeta | null;
  reducing: boolean;
  open: (path: string) => Promise<void>;
  close: () => Promise<void>;
  setViewMode: (mode: WorkspaceViewMode) => void;
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
      open,
      close,
      setViewMode,
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
      open,
      close,
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
