import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

  // Auto-apply: any time the slope, the workspace handle, or the workspace's
  // calibration state changes, push the slope into whichever workspace kinds
  // are open and gain-calibrated. The guards make this idempotent — already
  // flux-calibrated workspaces are skipped, so re-renders never double-apply.
  //
  // Two trigger directions both run through this:
  //  - User opens a `.cal` while a survey/scan/image is already gain-cal'd →
  //    `slope` flips from null to a number, effect runs, apply happens.
  //  - User loads `.cal` first, then gain-calibrates the workspace later →
  //    `calibrated` flips to true, effect runs, apply happens.
  useEffect(() => {
    if (slope === null || slope === 0) return;
    const ws = survey.workspace;
    const handle = survey.workspaceHandle;
    if (ws && handle !== null && ws.calibrated && !ws.flux_calibrated) {
      rpcClient
        .fluxCalApplyToSurvey(handle, slope)
        .then(() => survey.refreshWorkspace())
        .catch((err) => setRpcError((err as Error).message));
    }
  }, [
    slope,
    survey.workspace?.calibrated,
    survey.workspace?.flux_calibrated,
    survey.workspaceHandle,
  ]);

  useEffect(() => {
    if (slope === null || slope === 0) return;
    const ov = scan.overview;
    const handle = scan.handle;
    if (ov && handle !== null && ov.calibrated && !ov.flux_calibrated) {
      rpcClient
        .fluxCalApplyToScan(handle, slope)
        .then(() => scan.refreshOverview())
        .catch((err) => setRpcError((err as Error).message));
    }
  }, [slope, scan.overview?.calibrated, scan.overview?.flux_calibrated, scan.handle]);

  // Images opened standalone (via Image → Open Image…) carry their own
  // calibration flag — the user-stated convention is that an image always
  // implies at least gain calibration, so any image that isn't already in
  // Jy is a candidate for the loaded slope.
  useEffect(() => {
    if (slope === null || slope === 0) return;
    const img = survey.image;
    if (img && !img.flux_calibrated) {
      survey.applyImageFluxCalibration(slope).catch((err) => {
        setRpcError((err as Error).message);
      });
    }
  }, [slope, survey.image?.handle, survey.image?.flux_calibrated]);

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
