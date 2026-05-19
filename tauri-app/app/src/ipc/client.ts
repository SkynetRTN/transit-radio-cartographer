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
  unit: 'volts' | 'gain';
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
}

export const rpcClient = new RpcClient();
