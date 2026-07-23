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
  isStaleHandleError,
  rpcClient,
  type ImageMeta,
  type ImagePixels,
  type PaletteStop,
  type ReductionResult,
  type RgbImageMeta,
  type RgbImagePixels,
  type SurveyMeta,
  type WorkspaceOverview,
} from '../ipc/client';

export type WorkspaceViewMode = 'survey' | 'calibrate-survey' | 'pre-image' | 'image';

export type ImageDisplayMode = 'sky' | 'raw' | 'pixel' | 'stretch';

export interface FluxRange {
  min: number;
  max: number;
}

export interface SurveyState {
  loading: boolean;
  error: string | null;
  survey: SurveyMeta | null;
  workspace: WorkspaceOverview | null;
  workspaceHandle: number | null;
  viewMode: WorkspaceViewMode;
  image: ImageMeta | null;
  imagePixels: ImagePixels | null;
  // RGB composite image (bi/tri-color) — only one of `image` or `rgbImage`
  // is non-null at a time. ImageView dispatches on which is present.
  rgbImage: RgbImageMeta | null;
  rgbImagePixels: RgbImagePixels | null;
  imagePalette: PaletteStop[] | null;
  imageFluxRange: FluxRange | null;
  imageName: string;
  imageSavePath: string | null;
  // Half-width of the magnifier window (in source-pixel cells). Lives in the
  // shared context so the Image menu's "Change Magnifier Size…" can update it
  // while the magnifier itself is rendered by ImageView.
  magnifierHalfSize: number;
  // FEAT-011: tri-state-plus image display mode, set via Image > Image Display.
  // - 'sky' (default): cos(dec_center)/240 — true sky shape (FEAT-008 v3).
  // - 'raw': 1/240 — equator-only sky shape, matches legacy VB (FEAT-008 v2).
  // - 'pixel': (decRange*w)/(raRange*h) — each pixel cell square on screen.
  // - 'stretch': no scaleanchor; image fills the workspace container.
  // Global so the menu and both views agree. Supersedes the per-view Lock
  // Aspect button (FEAT-008) and Snap to Square checkbox (FEAT-010) UIs.
  imageDisplay: ImageDisplayMode;
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
  acceptAll: () => void;
  resetSweepReview: () => void;
  refreshWorkspace: () => Promise<void>;
  applyReduction: (op: (handle: number) => Promise<ReductionResult>) => Promise<void>;
  makeImage: (pix?: number) => Promise<ImageMeta | null>;
  setImage: (meta: ImageMeta, pixels: ImagePixels, savePath?: string | null) => void;
  setRgbImage: (meta: RgbImageMeta, pixels: RgbImagePixels) => void;
  // Restore the scalar image a bi/tri-color composite was built from (BUG-016).
  // Returns false when there's nothing stashed.
  restoreScalarImage: () => boolean;
  setImagePalette: (palette: PaletteStop[] | null, flux: FluxRange | null) => void;
  setImageName: (name: string) => void;
  setSurveyName: (name: string) => Promise<void>;
  setMagnifierHalfSize: (n: number) => void;
  setImageDisplay: (mode: ImageDisplayMode) => void;
  saveImage: (path: string) => Promise<string | null>;
  clearImage: () => Promise<void>;
  // Re-multiply / un-multiply the open image's pixels by a flux-cal slope.
  // The image handle is preserved; meta and pixels are refreshed in place
  // (palette, savePath and name are kept). Used by the flux-cal auto-apply
  // effect when a `.cal` file is loaded while a standalone image is open.
  applyImageFluxCalibration: (slope: number) => Promise<void>;
  revertImageFluxCalibration: () => Promise<void>;
  save: (path?: string) => Promise<string | null>;
  markDirty: () => void;
  // BUG-012: clear all handle-bearing state after an engine restart and
  // return whether the survey had unsaved edits at the time. Does not call
  // closeHandle (the engine that owned those handles is already gone).
  resetForEngineRestart: () => boolean;
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
  const [rgbImage, setRgbImageState] = useState<RgbImageMeta | null>(null);
  const [rgbImagePixels, setRgbImagePixels] = useState<RgbImagePixels | null>(null);
  const [imagePalette, setImagePaletteState] = useState<PaletteStop[] | null>(null);
  const [imageFluxRange, setImageFluxRangeState] = useState<FluxRange | null>(null);
  const [imageName, setImageNameState] = useState<string>('image');
  const [imageSavePath, setImageSavePath] = useState<string | null>(null);
  // BUG-016: when a bi/tri-color composite is built, the scalar image it was
  // seeded from is stashed here (its engine handle kept open) so "Back to Pre
  // Image" can restore it instantly instead of routing back to the survey
  // pre-image.
  const [preComposeImage, setPreComposeImage] = useState<{
    meta: ImageMeta;
    pixels: ImagePixels;
    savePath: string | null;
  } | null>(null);
  const [magnifierHalfSize, setMagnifierHalfSizeState] = useState<number>(15);
  const [imageDisplay, setImageDisplayState] = useState<ImageDisplayMode>('sky');
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
  const imagePixelsRef = useRef<ImagePixels | null>(imagePixels);
  const imageSavePathRef = useRef<string | null>(imageSavePath);
  const preComposeImageRef = useRef(preComposeImage);
  const rgbImageRef = useRef<RgbImageMeta | null>(rgbImage);
  const imagePaletteRef = useRef<PaletteStop[] | null>(imagePalette);
  const imageFluxRangeRef = useRef<FluxRange | null>(imageFluxRange);
  const imageNameRef = useRef<string>(imageName);
  const savePathRef = useRef<string | null>(savePath);
  const acceptedSweepsRef = useRef<Set<number>>(acceptedSweeps);
  // BUG-012: resetForEngineRestart needs the current dirty flag without
  // taking a useCallback dep on `dirty` (it would re-create on every edit
  // and re-fire any useEffect that subscribes to the Tauri restart event).
  const dirtyRef = useRef<boolean>(dirty);
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
    imagePixelsRef.current = imagePixels;
  }, [imagePixels]);
  useEffect(() => {
    imageSavePathRef.current = imageSavePath;
  }, [imageSavePath]);
  useEffect(() => {
    preComposeImageRef.current = preComposeImage;
  }, [preComposeImage]);
  useEffect(() => {
    rgbImageRef.current = rgbImage;
  }, [rgbImage]);
  useEffect(() => {
    imagePaletteRef.current = imagePalette;
  }, [imagePalette]);
  useEffect(() => {
    imageFluxRangeRef.current = imageFluxRange;
  }, [imageFluxRange]);
  useEffect(() => {
    imageNameRef.current = imageName;
  }, [imageName]);
  useEffect(() => {
    savePathRef.current = savePath;
  }, [savePath]);
  useEffect(() => {
    acceptedSweepsRef.current = acceptedSweeps;
  }, [acceptedSweeps]);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  const resetForEngineRestart = useCallback((): boolean => {
    const wasDirty = dirtyRef.current;
    // Do NOT call closeHandle on any of these — the engine that knew them
    // is already gone; the call would just return another 1001.
    setSurvey(null);
    setWorkspace(null);
    setWorkspaceHandle(null);
    setImage(null);
    setImagePixels(null);
    setRgbImageState(null);
    setRgbImagePixels(null);
    setPreComposeImage(null);
    setImagePaletteState(null);
    setImageFluxRangeState(null);
    setImageSavePath(null);
    setImageNameState('image');
    setViewMode('survey');
    setCurrentSweepIndex(0);
    setAcceptedSweeps(new Set());
    setSavePath(null);
    setDirty(false);
    setLoading(false);
    setReducing(false);
    setSaving(false);
    setError(null);
    return wasDirty;
  }, []);

  // BUG-012: centralised catch-block helper. Stale-handle errors (race
  // condition or future engine bug) clear local state and surface a
  // clear-to-the-user message instead of "1001:unknown handle: N".
  const handleRpcError = useCallback(
    (e: unknown) => {
      if (isStaleHandleError(e)) {
        resetForEngineRestart();
        setError('Engine handle expired. Please re-open your files.');
        return;
      }
      handleRpcError(e);
    },
    [resetForEngineRestart],
  );

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
      setRgbImageState(null);
      setRgbImagePixels(null);
      setImagePaletteState(null);
      setImageFluxRangeState(null);
      setImageSavePath(null);
      setImageNameState(meta.workspace?.name ?? 'image');
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
      handleRpcError(e);
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
    closeInBackground(rgbImageRef.current?.handle);
    closeInBackground(preComposeImageRef.current?.meta.handle);
    setSurvey(null);
    setWorkspace(null);
    setWorkspaceHandle(null);
    setImage(null);
    setImagePixels(null);
    setRgbImageState(null);
    setRgbImagePixels(null);
    setPreComposeImage(null);
    setImagePaletteState(null);
    setImageFluxRangeState(null);
    setImageSavePath(null);
    setImageNameState('image');
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

  // Bulk-accept every sweep at once (bound to a keyboard shortcut, not an
  // exposed button — the one-by-one review is the intended default). Callers
  // in SurveyView commit any pending RFI edits on the current sweep first.
  const acceptAll = useCallback(() => {
    const sourceCount = workspace?.source_count ?? 0;
    if (sourceCount <= 0) return;
    const next = new Set<number>();
    for (let i = 0; i < sourceCount; i++) next.add(i);
    setAcceptedSweeps(next);
    setViewMode('pre-image');
  }, [workspace?.source_count]);

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
      handleRpcError(e);
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
        handleRpcError(e);
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
      handleRpcError(e);
      return null;
    } finally {
      setReducing(false);
    }
  }, []);

  const setImageAction = useCallback(
    (meta: ImageMeta, pixels: ImagePixels, savePath: string | null = null) => {
      const prevImage = imageRef.current;
      const prevRgb = rgbImageRef.current;
      const prevPreCompose = preComposeImageRef.current;
      setImage(meta);
      setImagePixels(pixels);
      setRgbImageState(null);
      setRgbImagePixels(null);
      if (prevPreCompose) {
        closeInBackground(prevPreCompose.meta.handle);
        setPreComposeImage(null);
      }
      setImageSavePath(savePath);
      // If the loaded file carried a palette (legacy .img), surface it. FITS
      // files have no palette, so leave the existing one alone — the user can
      // open the editor to pick a new one.
      if (meta.palette && meta.palette.length > 0) {
        setImagePaletteState(meta.palette);
      }
      setViewMode('image');
      if (prevImage && prevImage.handle !== meta.handle) {
        closeInBackground(prevImage.handle);
      }
      if (prevRgb) closeInBackground(prevRgb.handle);
    },
    [],
  );

  const setRgbImageAction = useCallback(
    (meta: RgbImageMeta, pixels: RgbImagePixels) => {
      const prevImage = imageRef.current;
      const prevImagePixels = imagePixelsRef.current;
      const prevRgb = rgbImageRef.current;
      const prevPreCompose = preComposeImageRef.current;
      setRgbImageState(meta);
      setRgbImagePixels(pixels);
      // BUG-016: keep the scalar image that seeded this composite alive (handle
      // NOT closed) and stash it, so "Back to Pre Image" can restore it
      // instantly. When the composite is built from an existing RGB (bi→tri),
      // prevImage is null — keep the stash from when the bi-color was made.
      if (prevImage && prevImagePixels) {
        if (prevPreCompose && prevPreCompose.meta.handle !== prevImage.handle) {
          closeInBackground(prevPreCompose.meta.handle);
        }
        setPreComposeImage({
          meta: prevImage,
          pixels: prevImagePixels,
          savePath: imageSavePathRef.current,
        });
      }
      setImage(null);
      setImagePixels(null);
      setImageSavePath(null);
      setViewMode('image');
      if (prevRgb && prevRgb.handle !== meta.handle) {
        closeInBackground(prevRgb.handle);
      }
    },
    [],
  );

  // BUG-016: restore the scalar image stashed when the current RGB composite
  // was built, and close the composite. Returns false if there's nothing to
  // restore (so the caller can fall back to the survey pre-image).
  const restoreScalarImage = useCallback((): boolean => {
    const stash = preComposeImageRef.current;
    if (!stash) return false;
    const prevRgb = rgbImageRef.current;
    setImage(stash.meta);
    setImagePixels(stash.pixels);
    setImageSavePath(stash.savePath);
    setRgbImageState(null);
    setRgbImagePixels(null);
    setPreComposeImage(null);
    setViewMode('image');
    if (prevRgb) closeInBackground(prevRgb.handle);
    return true;
  }, []);

  const setImagePaletteAction = useCallback(
    (palette: PaletteStop[] | null, flux: FluxRange | null) => {
      setImagePaletteState(palette);
      setImageFluxRangeState(flux);
    },
    [],
  );

  const setImageNameAction = useCallback((name: string) => {
    setImageNameState(name);
  }, []);

  const setSurveyNameAction = useCallback(async (name: string) => {
    const h = workspaceHandleRef.current;
    if (h === null) return;
    try {
      const overview = await rpcClient.setWorkspaceName(h, name);
      setWorkspace(overview);
      setDirty(true);
    } catch (e) {
      handleRpcError(e);
    }
  }, []);

  const setMagnifierHalfSizeAction = useCallback((n: number) => {
    // Clamp to a sane range so the magnifier always has at least a 3×3
    // window and never asks for more cells than the image actually contains.
    if (!Number.isFinite(n)) return;
    setMagnifierHalfSizeState(Math.max(1, Math.min(200, Math.round(n))));
  }, []);

  const saveImageAction = useCallback(async (path: string): Promise<string | null> => {
    const current = imageRef.current;
    if (!current) return null;
    const ext = path.toLowerCase().slice(path.lastIndexOf('.'));
    const palette = imagePaletteRef.current ?? undefined;
    const flux = imageFluxRangeRef.current;
    const opts: {
      palette?: PaletteStop[];
      flux_min?: number;
      flux_max?: number;
      name?: string;
      pix?: number;
      unit?: string;
    } = { name: imageNameRef.current };
    if (palette) opts.palette = palette;
    if (flux) {
      opts.flux_min = flux.min;
      opts.flux_max = flux.max;
    }
    // Persist the flux unit. Prefer whatever the in-memory image reports
    // (engine sets this from the workspace at `make_image` time or carries
    // it across via `open_image`). The user-stated invariant is that any
    // saved image is at least gain-calibrated, so default to GCU.
    opts.unit = current.unit ?? 'GCU';
    try {
      if (ext === '.bmp') {
        const bmpOpts: { palette?: PaletteStop[]; flux_min?: number; flux_max?: number } = {};
        if (palette) bmpOpts.palette = palette;
        if (flux) {
          bmpOpts.flux_min = flux.min;
          bmpOpts.flux_max = flux.max;
        }
        const r = await rpcClient.saveBitmap(current.handle, path, bmpOpts);
        return r.path;
      }
      const r = await rpcClient.saveImage(current.handle, path, opts);
      setImageSavePath(r.path);
      return r.path;
    } catch (e) {
      handleRpcError(e);
      return null;
    }
  }, []);

  const clearImage = useCallback(async () => {
    closeInBackground(imageRef.current?.handle);
    closeInBackground(rgbImageRef.current?.handle);
    closeInBackground(preComposeImageRef.current?.meta.handle);
    setImage(null);
    setImagePixels(null);
    setRgbImageState(null);
    setRgbImagePixels(null);
    setPreComposeImage(null);
    setImagePaletteState(null);
    setImageFluxRangeState(null);
    setImageSavePath(null);
  }, []);

  const applyImageFluxCalibration = useCallback(async (slope: number) => {
    const current = imageRef.current;
    if (!current) return;
    try {
      const updated = await rpcClient.fluxCalApplyToImage(current.handle, slope);
      const pixels = await rpcClient.getImagePixels(updated.handle);
      // Preserve palette, savePath, name, and viewMode — only the pixel
      // values and unit changed. Scale the user's selected flux range so
      // their palette stretch keeps mapping to the same physical features
      // (just expressed in Jy instead of GCU).
      setImage(updated);
      setImagePixels(pixels);
      const prev = imageFluxRangeRef.current;
      if (prev) {
        setImageFluxRangeState({ min: prev.min * slope, max: prev.max * slope });
      }
    } catch (e) {
      handleRpcError(e);
    }
  }, []);

  const revertImageFluxCalibration = useCallback(async () => {
    const current = imageRef.current;
    if (!current) return;
    const slope = current.flux_slope ?? null;
    try {
      const updated = await rpcClient.fluxCalRevertFromImage(current.handle);
      const pixels = await rpcClient.getImagePixels(updated.handle);
      setImage(updated);
      setImagePixels(pixels);
      const prev = imageFluxRangeRef.current;
      if (prev && slope && slope !== 0) {
        setImageFluxRangeState({ min: prev.min / slope, max: prev.max / slope });
      }
    } catch (e) {
      handleRpcError(e);
    }
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
      handleRpcError(e);
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
      rgbImage,
      rgbImagePixels,
      imagePalette,
      imageFluxRange,
      imageName,
      imageSavePath,
      magnifierHalfSize,
      imageDisplay,
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
      acceptAll,
      resetSweepReview,
      refreshWorkspace,
      applyReduction,
      makeImage,
      setImage: setImageAction,
      setRgbImage: setRgbImageAction,
      restoreScalarImage,
      setImagePalette: setImagePaletteAction,
      setImageName: setImageNameAction,
      setSurveyName: setSurveyNameAction,
      setMagnifierHalfSize: setMagnifierHalfSizeAction,
      setImageDisplay: setImageDisplayState,
      saveImage: saveImageAction,
      clearImage,
      applyImageFluxCalibration,
      revertImageFluxCalibration,
      save,
      markDirty,
      resetForEngineRestart,
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
      rgbImage,
      rgbImagePixels,
      imagePalette,
      imageFluxRange,
      imageName,
      imageSavePath,
      magnifierHalfSize,
      imageDisplay,
      reducing,
      savePath,
      dirty,
      saving,
      currentSweepIndex,
      acceptedSweeps,
      open,
      close,
      acceptCurrentSweep,
      acceptAll,
      resetSweepReview,
      refreshWorkspace,
      applyReduction,
      makeImage,
      setImageAction,
      setRgbImageAction,
      restoreScalarImage,
      setImagePaletteAction,
      setImageNameAction,
      setSurveyNameAction,
      setMagnifierHalfSizeAction,
      setImageDisplayState,
      saveImageAction,
      clearImage,
      applyImageFluxCalibration,
      revertImageFluxCalibration,
      save,
      markDirty,
      resetForEngineRestart,
    ],
  );

  return <SurveyContext.Provider value={value}>{children}</SurveyContext.Provider>;
}

export function useSurvey(): SurveyState {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error('useSurvey must be used inside a SurveyProvider');
  return ctx;
}
