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
import { rpcClient, type ScanMeta, type ScanOverview } from '../ipc/client';

export type ScanViewMode = 'scan' | 'calibrate-scan';

// Fit kind used by Determine Peak. Picked from the dropdown in the Scan
// menu and dispatched to one of four RPCs in ScanView's drag handler.
// `'max'` is the odd one out — it returns a single point that the UI
// renders as a ringed highlight instead of a fit curve.
export type PeakFitKind =
  | 'gaussian'
  | 'cos2'
  | 'poly2'
  | 'poly3'
  | 'poly4'
  | 'max';

export interface ScanState {
  loading: boolean;
  error: string | null;
  scan: ScanMeta | null;
  overview: ScanOverview | null;
  handle: number | null;
  viewMode: ScanViewMode;
  savePath: string | null;
  dirty: boolean;
  saving: boolean;
  open: (path: string) => Promise<void>;
  close: () => Promise<void>;
  setViewMode: (mode: ScanViewMode) => void;
  setOverview: (overview: ScanOverview) => void;
  setScanName: (name: string) => Promise<void>;
  markDirty: () => void;
  refreshOverview: () => Promise<void>;
  save: (path?: string) => Promise<string | null>;
  peakFitKind: PeakFitKind;
  setPeakFitKind: (kind: PeakFitKind) => void;
}

const ScanContext = createContext<ScanState | null>(null);

function closeInBackground(handle: number | undefined | null) {
  if (handle === undefined || handle === null) return;
  void rpcClient.closeHandle(handle).catch(() => {});
}

export function ScanProvider({ children }: { children: ReactNode }) {
  const [scan, setScan] = useState<ScanMeta | null>(null);
  const [overview, setOverview] = useState<ScanOverview | null>(null);
  const [handle, setHandle] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ScanViewMode>('scan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savePath, setSavePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [peakFitKind, setPeakFitKind] = useState<PeakFitKind>('gaussian');

  const handleRef = useRef<number | null>(handle);
  const savePathRef = useRef<string | null>(savePath);
  useEffect(() => {
    handleRef.current = handle;
  }, [handle]);
  useEffect(() => {
    savePathRef.current = savePath;
  }, [savePath]);

  const open = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const isSaved = path.toLowerCase().endsWith('.scn');
      const meta = isSaved
        ? await rpcClient.openSavedScan(path)
        : await rpcClient.openScan(path);
      const prev = handleRef.current;
      setScan(meta);
      setHandle(meta.handle);
      setOverview(meta.overview);
      setViewMode('scan');
      setSavePath(isSaved ? path : null);
      setDirty(false);
      closeInBackground(prev);
    } catch (e) {
      setError((e as Error).message);
      setScan(null);
      setOverview(null);
      setHandle(null);
      setSavePath(null);
      setDirty(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const close = useCallback(async () => {
    closeInBackground(handleRef.current);
    setScan(null);
    setOverview(null);
    setHandle(null);
    setViewMode('scan');
    setSavePath(null);
    setDirty(false);
  }, []);

  const markDirty = useCallback(() => {
    setDirty(true);
  }, []);

  const setScanName = useCallback(async (name: string) => {
    const h = handleRef.current;
    if (h === null) return;
    try {
      const overview = await rpcClient.setScanWorkspaceName(h, name);
      setOverview(overview);
      setDirty(true);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const refreshOverview = useCallback(async () => {
    const h = handleRef.current;
    if (h === null) return;
    try {
      const o = await rpcClient.getScanOverview(h);
      setOverview(o);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const save = useCallback(async (path?: string): Promise<string | null> => {
    const h = handleRef.current;
    if (h === null) return null;
    const target = path ?? savePathRef.current;
    if (!target) return null;
    setSaving(true);
    setError(null);
    try {
      const result = await rpcClient.saveScan(h, target);
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

  const value = useMemo<ScanState>(
    () => ({
      loading,
      error,
      scan,
      overview,
      handle,
      viewMode,
      savePath,
      dirty,
      saving,
      open,
      close,
      setViewMode,
      setOverview,
      setScanName,
      markDirty,
      refreshOverview,
      save,
      peakFitKind,
      setPeakFitKind,
    }),
    [
      loading,
      error,
      scan,
      overview,
      handle,
      viewMode,
      savePath,
      dirty,
      saving,
      open,
      close,
      setScanName,
      markDirty,
      refreshOverview,
      save,
      peakFitKind,
    ],
  );

  return <ScanContext.Provider value={value}>{children}</ScanContext.Provider>;
}

export function useScan(): ScanState {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used inside a ScanProvider');
  return ctx;
}
