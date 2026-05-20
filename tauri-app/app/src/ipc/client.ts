import { invoke } from '@tauri-apps/api/core';

export type RpcId = number;
export type RpcError = { code: number; message: string; data?: unknown };
export type RpcResponse<T> = { jsonrpc: '2.0'; id: RpcId; result?: T; error?: RpcError };
export type BinaryRef = { token: string; size: number };

export interface WorkspaceOverview {
  name: string;
  path: string;
  source_count: number;
  initial_cal_samples: number;
  terminal_cal_samples: number;
  initial_kept: number;
  terminal_kept: number;
  cal1: number;
  cal2: number;
  calibrated: boolean;
  initial_enabled: boolean;
  terminal_enabled: boolean;
  can_undo: boolean;
  flux_calibrated: boolean;
  flux_slope: number | null;
}

export interface SurveyMeta {
  handle: number;
  metadata: { sweep_count: number; path: string };
  workspace_handle?: number;
  workspace?: WorkspaceOverview;
}

export interface SourceSweep {
  ra: number[];
  dec: number[];
  flux: number[];
  sample_count: number;
  returned_count: number;
  index: number;
  source_count: number;
  unit: 'volts' | 'gain' | 'jy';
  label: string;
  calibrated: boolean;
}

export interface BracketSweepData {
  ra: number[];
  dec: number[];
  flux: number[];
  mask: boolean[];
}

export interface CalibrationBracket {
  label: 'initial' | 'terminal';
  on: BracketSweepData;
  off: BracketSweepData;
}

export interface CalibrationView {
  name: string;
  initial: CalibrationBracket;
  terminal: CalibrationBracket;
  cal1: number;
  cal2: number;
  initial_enabled: boolean;
  terminal_enabled: boolean;
  can_undo: boolean;
}

export interface SweepInline {
  ra: number[];
  dec: number[];
  flux: number[];
  sample_count: number;
  returned_count: number;
}

export interface ReductionResult {
  // Workspace-aware reductions land on the workspace's source sweeps and
  // omit `handle`; legacy survey-handle reductions return a fresh handle for
  // the reduced `Survey`.
  handle?: number;
  sweep_count: number;
  op: 'smooth' | 'baseline' | 'align';
  overview?: WorkspaceOverview;
}

export interface ScanOverview {
  name: string;
  path: string;
  source_count: number;
  source_kept: number;
  initial_cal_samples: number;
  terminal_cal_samples: number;
  initial_kept: number;
  terminal_kept: number;
  cal1: number;
  cal2: number;
  calibrated: boolean;
  initial_enabled: boolean;
  terminal_enabled: boolean;
  can_undo: boolean;
  peak_flux: number | null;
  flux_calibrated: boolean;
  flux_slope: number | null;
}

export interface ScanMeta {
  handle: number;
  metadata: { source_count: number; path: string };
  overview: ScanOverview;
}

export interface ScanSamples {
  ra: number[];
  dec: number[];
  flux: number[];
  mask: boolean[];
}

export interface ScanViewCalibrated {
  name: string;
  calibrated: true;
  unit: 'gain' | 'jy';
  source: ScanSamples;
  peak_flux: number | null;
}

export interface ScanViewRaw {
  name: string;
  calibrated: false;
  unit: 'volts';
  initial_on: ScanSamples;
  initial_off: ScanSamples;
  source: ScanSamples;
  terminal_on: ScanSamples;
  terminal_off: ScanSamples;
}

export type ScanViewPayload = ScanViewCalibrated | ScanViewRaw;

export interface ScanCalibrationView {
  name: string;
  initial: CalibrationBracket;
  terminal: CalibrationBracket;
  cal1: number;
  cal2: number;
  initial_enabled: boolean;
  terminal_enabled: boolean;
  can_undo: boolean;
}

// ─── Flux calibration (.cal file → Jy/GCU slope) ────────────────────────────
export interface FluxCalEntry {
  name: string;
  measured_flux: number;
  known_flux: number;
}

export interface FluxCalTable {
  caption: string;
  fit_annotation: string;
  fit_result: string;
  max_measured_flux: number;
  max_known_flux: number;
  entries: FluxCalEntry[];
}

export interface FluxCalReadResult {
  path: string;
  table: FluxCalTable;
  slope: number;
  error: number;
}

export interface FluxCalFitResult {
  slope: number;
  error: number;
  table: FluxCalTable;
}

export interface FluxCalWriteResult {
  path: string;
  bytes_written: number;
  table: FluxCalTable;
  slope: number;
  error: number;
}

export interface FluxCalScnPeakResult {
  name: string;
  peak_flux: number;
  default_known_jy: number;
}

export interface ImageMeta {
  handle: number;
  width: number;
  height: number;
  min_ra: number;
  max_ra: number;
  min_dec: number;
  max_dec: number;
  min_flux: number;
  max_flux: number;
}

export interface ImagePixels {
  pixels: number[][];
  width: number;
  height: number;
}

export class RpcClient {
  private nextId = 1;
  constructor(private timeoutMs = 15000) {}

  async request<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.nextId++;
    const p = invoke<RpcResponse<T>>('rpc_request', { payload: { jsonrpc: '2.0', id, method, params } });
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error('sidecar_timeout')), this.timeoutMs),
    );
    const resp = await Promise.race([p, timeout]);
    if (resp.error) throw new Error(`${resp.error.code}:${resp.error.message}`);
    if (resp.result === undefined) throw new Error('missing_result');
    return resp.result;
  }

  ping() {
    return this.request<string>('ping', {});
  }
  openSurvey(path: string) {
    return this.request<SurveyMeta>('open_survey', { path });
  }
  getSweepInline(handle: number, index: number, maxPoints = 2000) {
    return this.request<SweepInline>('get_sweep_inline', {
      handle,
      index,
      max_points: maxPoints,
    });
  }
  closeHandle(handle: number) {
    return this.request<{ closed: number }>('close_handle', { handle });
  }
  getWorkspaceOverview(handle: number) {
    return this.request<WorkspaceOverview>('get_workspace_overview', { handle });
  }
  getSourceSweep(handle: number, index: number, maxPoints = 4000) {
    return this.request<SourceSweep>('get_source_sweep', {
      handle,
      index,
      max_points: maxPoints,
    });
  }
  getCalibrationView(handle: number) {
    return this.request<CalibrationView>('get_calibration_view', { handle });
  }
  cutCalibrationSegment(handle: number, raMin: number, raMax: number) {
    return this.request<{ removed: number; overview: WorkspaceOverview }>(
      'cut_calibration_segment',
      { handle, ra_min: raMin, ra_max: raMax },
    );
  }
  selectCalibrationDeclination(
    handle: number,
    decMin: number,
    decMax: number,
    bracket: 'initial' | 'terminal',
  ) {
    return this.request<{ removed: number; overview: WorkspaceOverview }>(
      'select_calibration_declination',
      { handle, dec_min: decMin, dec_max: decMax, bracket },
    );
  }
  undoCalibrationCut(handle: number) {
    return this.request<{ undone: boolean; overview: WorkspaceOverview }>(
      'undo_calibration_cut',
      { handle },
    );
  }
  applyGainCalibration(handle: number) {
    return this.request<WorkspaceOverview>('apply_gain_calibration', { handle });
  }
  setBracketEnabled(handle: number, bracket: 'initial' | 'terminal', enabled: boolean) {
    return this.request<WorkspaceOverview>('set_bracket_enabled', {
      handle,
      bracket,
      enabled,
    });
  }
  smooth(handle: number, width = 5, workspaceHandle?: number | null) {
    return this.request<ReductionResult>('smooth', this._reductionParams(handle, { width }, workspaceHandle));
  }
  baseline(handle: number, degree = 1, workspaceHandle?: number | null) {
    return this.request<ReductionResult>(
      'baseline',
      this._reductionParams(handle, { degree }, workspaceHandle),
    );
  }
  align(handle: number, factor = 0.5, workspaceHandle?: number | null) {
    return this.request<ReductionResult>(
      'align',
      this._reductionParams(handle, { factor }, workspaceHandle),
    );
  }
  private _reductionParams(
    handle: number,
    extra: Record<string, unknown>,
    workspaceHandle?: number | null,
  ): Record<string, unknown> {
    // When a workspace handle is supplied, the engine applies the reduction
    // to the workspace's source sweeps so the next `make_image` reflects it.
    // The survey handle is still passed as a fallback the engine ignores.
    const params: Record<string, unknown> = { handle, ...extra };
    if (workspaceHandle !== undefined && workspaceHandle !== null) {
      params.workspace_handle = workspaceHandle;
    }
    return params;
  }
  makeImage(handle: number, pix = 1, workspaceHandle?: number | null) {
    // When `workspaceHandle` is provided, the engine builds the pre-image
    // from the workspace's source sweeps only (cal brackets excluded) and
    // uses calibrated flux if `apply_gain_calibration` has run. The survey
    // handle is sent unconditionally as the fallback path.
    const params: Record<string, unknown> = { handle, pix };
    if (workspaceHandle !== undefined && workspaceHandle !== null) {
      params.workspace_handle = workspaceHandle;
    }
    return this.request<ImageMeta>('make_image', params);
  }
  getImagePixels(handle: number, maxDim = 400) {
    return this.request<ImagePixels>('get_image_pixels', { handle, max_dim: maxDim });
  }
  applyPalette(imageHandle: number, paletteHandle: number) {
    return this.request('apply_palette', {
      image_handle: imageHandle,
      palette_handle: paletteHandle,
    });
  }
  loadPalette(path: string) {
    return this.request('open_palette', { path });
  }
  savePalette(handle: number, path: string) {
    return this.request('save_palette', { handle, path });
  }
  // ─── Scan pipeline (Scan menu → New Scan… → MD1)
  openScan(path: string) {
    return this.request<ScanMeta>('open_scan', { path });
  }
  getScanOverview(handle: number) {
    return this.request<ScanOverview>('get_scan_overview', { handle });
  }
  getScanView(handle: number) {
    return this.request<ScanViewPayload>('get_scan_view', { handle });
  }
  getScanCalibrationView(handle: number) {
    return this.request<ScanCalibrationView>('get_scan_calibration_view', { handle });
  }
  cutScanCalibrationSegment(handle: number, raMin: number, raMax: number) {
    return this.request<{ removed: number; overview: ScanOverview }>(
      'cut_scan_calibration_segment',
      { handle, ra_min: raMin, ra_max: raMax },
    );
  }
  selectScanCalibrationDeclination(
    handle: number,
    decMin: number,
    decMax: number,
    bracket: 'initial' | 'terminal',
  ) {
    return this.request<{ removed: number; overview: ScanOverview }>(
      'select_scan_calibration_declination',
      { handle, dec_min: decMin, dec_max: decMax, bracket },
    );
  }
  applyScanCalibration(handle: number) {
    return this.request<ScanOverview>('apply_scan_calibration', { handle });
  }
  setScanBracketEnabled(handle: number, bracket: 'initial' | 'terminal', enabled: boolean) {
    return this.request<ScanOverview>('set_scan_bracket_enabled', {
      handle,
      bracket,
      enabled,
    });
  }
  selectScanDeclination(handle: number, decMin: number, decMax: number) {
    return this.request<{ removed: number; overview: ScanOverview }>(
      'select_scan_declination',
      { handle, dec_min: decMin, dec_max: decMax },
    );
  }
  cutScanSegment(handle: number, raMin: number, raMax: number) {
    return this.request<{ removed: number; overview: ScanOverview }>('cut_scan_segment', {
      handle,
      ra_min: raMin,
      ra_max: raMax,
    });
  }
  baselineScanSource(
    handle: number,
    ra0: number,
    flux0: number,
    ra1: number,
    flux1: number,
  ) {
    return this.request<{ overview: ScanOverview }>('baseline_scan_source', {
      handle,
      ra0,
      flux0,
      ra1,
      flux1,
    });
  }
  determineScanPeak(handle: number, flux: number) {
    return this.request<{ peak_flux: number; overview: ScanOverview }>('determine_scan_peak', {
      handle,
      flux,
    });
  }
  undoScan(handle: number) {
    return this.request<{ undone: boolean; overview: ScanOverview }>('undo_scan', { handle });
  }
  saveScan(handle: number, path: string) {
    return this.request<{ path: string; bytes_written: number }>('save_scan', { handle, path });
  }
  saveSurvey(handle: number, path: string) {
    return this.request<{ path: string; bytes_written: number }>('save_survey', { handle, path });
  }
  // ─── Flux calibration (Calibration menu in the legacy UI)
  fluxCalReadFile(path: string) {
    return this.request<FluxCalReadResult>('flux_cal_read_file', { path });
  }
  fluxCalWriteFile(path: string, caption: string, entries: FluxCalEntry[]) {
    return this.request<FluxCalWriteResult>('flux_cal_write_file', {
      path,
      caption,
      entries,
    });
  }
  fluxCalFit(caption: string, entries: FluxCalEntry[]) {
    return this.request<FluxCalFitResult>('flux_cal_fit', { caption, entries });
  }
  fluxCalReadScnPeak(path: string) {
    return this.request<FluxCalScnPeakResult>('flux_cal_read_scn_peak', { path });
  }
  fluxCalDefaultKnownJy(name: string) {
    return this.request<{ name: string; default_known_jy: number }>(
      'flux_cal_default_known_jy',
      { name },
    );
  }
  fluxCalApplyToSurvey(handle: number, slope: number) {
    return this.request<WorkspaceOverview>('flux_cal_apply_to_survey', { handle, slope });
  }
  fluxCalRevertFromSurvey(handle: number) {
    return this.request<WorkspaceOverview>('flux_cal_revert_from_survey', { handle });
  }
  fluxCalApplyToScan(handle: number, slope: number) {
    return this.request<ScanOverview>('flux_cal_apply_to_scan', { handle, slope });
  }
  fluxCalRevertFromScan(handle: number) {
    return this.request<ScanOverview>('flux_cal_revert_from_scan', { handle });
  }
}

export const rpcClient = new RpcClient();
