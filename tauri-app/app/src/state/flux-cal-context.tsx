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
  type FluxCalEntry,
  type FluxCalTable,
} from '../ipc/client';
import { useScan } from './scan-context';
import { useSurvey } from './survey-context';

export interface FluxCalState {
  // The in-memory `.cal` table. Null when nothing is loaded or being edited.
  table: FluxCalTable | null;
  slope: number | null;
  error: number | null;
  filePath: string | null;
  dirty: boolean;
  loading: boolean;
  saving: boolean;
  rpcError: string | null;

  // Lifecycle
  newCalibration: () => void;
  loadFromFile: (path: string) => Promise<void>;
  save: () => Promise<string | null>;
  saveAs: (path: string) => Promise<string | null>;
  clear: () => void;

  // Editing
  setCaption: (caption: string) => void;
  addEntry: (entry: FluxCalEntry) => Promise<void>;
  removeEntry: (index: number) => Promise<void>;
  refit: () => Promise<void>;
}

const FluxCalContext = createContext<FluxCalState | null>(null);

const EMPTY_TABLE: FluxCalTable = {
  caption: 'Untitled Calibration',
  fit_annotation: '',
  fit_result: '',
  max_measured_flux: 0,
  max_known_flux: 0,
  entries: [],
};

export function FluxCalibrationProvider({ children }: { children: ReactNode }) {
  const [table, setTable] = useState<FluxCalTable | null>(null);
  const [slope, setSlope] = useState<number | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rpcError, setRpcError] = useState<string | null>(null);

  const survey = useSurvey();
  const scan = useScan();

  // Refs for the auto-apply effect — it must read the *latest* slope and
  // workspace handle, but the effect should fire on workspace state changes,
  // not on every slope change (which would cause apply loops).
  const slopeRef = useRef<number | null>(null);
  useEffect(() => {
    slopeRef.current = slope;
  }, [slope]);

  // Auto-apply: when the survey workspace becomes gain-calibrated and a flux
  // slope is loaded but not yet applied, push it down. Same for the scan.
  // Reverse direction: when a workspace reverts to raw (e.g., the user closed
  // and reopened a file), we leave the flag alone — the next gain calibration
  // will trigger this effect again.
  useEffect(() => {
    const s = slopeRef.current;
    if (s === null || s === 0) return;
    const ws = survey.workspace;
    const handle = survey.workspaceHandle;
    if (
      ws &&
      handle !== null &&
      ws.calibrated &&
      !ws.flux_calibrated
    ) {
      rpcClient
        .fluxCalApplyToSurvey(handle, s)
        .then(() => survey.refreshWorkspace())
        .catch((err) => setRpcError((err as Error).message));
    }
  }, [survey.workspace?.calibrated, survey.workspace?.flux_calibrated, survey.workspaceHandle]);

  useEffect(() => {
    const s = slopeRef.current;
    if (s === null || s === 0) return;
    const ov = scan.overview;
    const handle = scan.handle;
    if (ov && handle !== null && ov.calibrated && !ov.flux_calibrated) {
      rpcClient
        .fluxCalApplyToScan(handle, s)
        .then(() => scan.refreshOverview())
        .catch((err) => setRpcError((err as Error).message));
    }
  }, [scan.overview?.calibrated, scan.overview?.flux_calibrated, scan.handle]);

  const newCalibration = useCallback(() => {
    setTable({ ...EMPTY_TABLE, entries: [] });
    setSlope(null);
    setError(null);
    setFilePath(null);
    setDirty(false);
    setRpcError(null);
  }, []);

  const loadFromFile = useCallback(async (path: string) => {
    setLoading(true);
    setRpcError(null);
    try {
      const result = await rpcClient.fluxCalReadFile(path);
      setTable(result.table);
      setSlope(result.slope);
      setError(result.error);
      setFilePath(result.path);
      setDirty(false);
    } catch (e) {
      setRpcError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveAs = useCallback(
    async (path: string) => {
      if (!table) return null;
      setSaving(true);
      setRpcError(null);
      try {
        const result = await rpcClient.fluxCalWriteFile(
          path,
          table.caption,
          table.entries,
        );
        setTable(result.table);
        setSlope(result.slope);
        setError(result.error);
        setFilePath(result.path);
        setDirty(false);
        return result.path;
      } catch (e) {
        setRpcError((e as Error).message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [table],
  );

  const save = useCallback(async () => {
    if (!filePath) return null;
    return saveAs(filePath);
  }, [filePath, saveAs]);

  const clear = useCallback(() => {
    setTable(null);
    setSlope(null);
    setError(null);
    setFilePath(null);
    setDirty(false);
    setRpcError(null);
  }, []);

  const setCaption = useCallback((caption: string) => {
    setTable((prev) => (prev ? { ...prev, caption } : prev));
    setDirty(true);
  }, []);

  const refitWithEntries = useCallback(
    async (caption: string, entries: FluxCalEntry[]) => {
      try {
        const result = await rpcClient.fluxCalFit(caption, entries);
        setTable(result.table);
        setSlope(result.slope);
        setError(result.error);
      } catch (e) {
        setRpcError((e as Error).message);
      }
    },
    [],
  );

  const addEntry = useCallback(
    async (entry: FluxCalEntry) => {
      const base = table ?? { ...EMPTY_TABLE, entries: [] };
      const nextEntries = [...base.entries, entry];
      setDirty(true);
      await refitWithEntries(base.caption, nextEntries);
    },
    [table, refitWithEntries],
  );

  const removeEntry = useCallback(
    async (index: number) => {
      if (!table) return;
      const nextEntries = table.entries.filter((_, i) => i !== index);
      setDirty(true);
      await refitWithEntries(table.caption, nextEntries);
    },
    [table, refitWithEntries],
  );

  const refit = useCallback(async () => {
    if (!table) return;
    await refitWithEntries(table.caption, table.entries);
  }, [table, refitWithEntries]);

  const value = useMemo<FluxCalState>(
    () => ({
      table,
      slope,
      error,
      filePath,
      dirty,
      loading,
      saving,
      rpcError,
      newCalibration,
      loadFromFile,
      save,
      saveAs,
      clear,
      setCaption,
      addEntry,
      removeEntry,
      refit,
    }),
    [
      table,
      slope,
      error,
      filePath,
      dirty,
      loading,
      saving,
      rpcError,
      newCalibration,
      loadFromFile,
      save,
      saveAs,
      clear,
      setCaption,
      addEntry,
      removeEntry,
      refit,
    ],
  );

  return <FluxCalContext.Provider value={value}>{children}</FluxCalContext.Provider>;
}

export function useFluxCal(): FluxCalState {
  const ctx = useContext(FluxCalContext);
  if (!ctx) throw new Error('useFluxCal must be used inside a FluxCalibrationProvider');
  return ctx;
}
