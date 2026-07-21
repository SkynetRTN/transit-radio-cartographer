import type { Site as BaseSite } from 'skynet-sdk';

/** A telescope leaf in the legend. Informational only — the chart draws one
 *  trace per `Site` (which now corresponds to an observatory), so individual
 *  telescopes can't be independently toggled. */
export interface SiteTelescopeChild {
  id: number;
  uid: string;
  slug: string;
  name: string;
}

/** Chart `Site`. With the flat 2-layer rework (plan §3, 2026-05-26), each
 *  `Site` represents an **observatory** — the chart draws one altitude curve
 *  per Site using its lat/long/elevation, and the flat legend toggles those
 *  curves by observatory. Telescopes that share an observatory collapse into
 *  one Site; orphan telescopes (no observatory FK, or unresolved FK) emit
 *  their own Site (the telescope IS the observatory). */
export interface Site extends BaseSite {
  /** Stable cross-table identity for this chart Site. Required because the
   *  `observatory` and `telescope` numeric-id spaces overlap, so the legend
   *  and adapter need a collision-free string. Conventional values:
   *  `'obs:<id>'` or `'tel:<id>'`. Falls back to `id` / `slug` when absent. */
  key?: string;
  /** Telescopes attached to this observatory. Always present (may be empty in
   *  exotic cases, but the helper currently emits ≥ 1 for every Site). The
   *  legend's telescope view stacks these slugs in input order. */
  telescopes?: SiteTelescopeChild[];
}

export type ObservabilitySeriesKind =
  | 'visible'
  | 'sunElevation'
  | 'minSunElevationDeg'
  | 'sunSeparation'
  | 'maxSunSeparation'
  | 'earth'
  | 'moon'
  | 'moonPhase'
  | 'minElevationDeg'
  | 'maxElevationDeg';

/** A single bucketised series for one (site, kind) pair.
 *  Lengths of `xs`, `ys`, `airmass` are always equal. `NaN` ys mark gaps; the
 *  `xs` axis itself is gap-free (every sample contributes to exactly one kind). */
export interface ObservabilitySeries {
  kind: ObservabilitySeriesKind;
  xs: Date[];
  /** Altitude in degrees; `NaN` where this kind doesn't apply at that step. */
  ys: number[];
  /** Airmass (sec(z)) at each step; `NaN` where altitude is `NaN`. */
  airmass: number[];
}

export interface ObservabilityDataset {
  site: Site;
  series: Record<ObservabilitySeriesKind, ObservabilitySeries>;
  /** Max non-NaN altitude across `visible`, `sunElevation`, `earth` for this site. */
  maxAltitude: number;
}

export interface ObservabilityConstraints {
  /** Degrees. Steps with target altitude below this are categorised as
   *  `minElevationDeg` (the target is violating the min-elevation constraint). */
  minTargetAltitude: number;
  /** Degrees. Steps with target altitude above this are categorised as
   *  `maxElevationDeg`. Default of 90 effectively disables the upper gate. */
  maxTargetAltitude: number;
  /** Degrees. Steps with sun above this are categorised as `sunElevation`. */
  maxSunAltitude: number;
  /** Degrees. Steps with sun below this are categorised as `minSunElevationDeg`
   *  — used by daytime observations of bright targets where some sky
   *  brightness is required. Default of -90 disables. */
  minSunAltitude: number;
  /** Degrees of angular separation. */
  minMoonSeparationDeg: number;
  /** Degrees of angular separation. */
  minSunSeparationDeg: number;
  /** Degrees of angular separation. Steps where the sun is farther from the
   *  target than this go to `maxSunSeparation`. Default of 180 disables. */
  maxSunSeparation: number;
  /** Moon illumination fraction in [0, 1]. Steps with moon phase below this
   *  are categorised as `moonPhase`. Default of 0 disables. */
  minMoonPhaseFraction: number;
  /** Moon illumination fraction in [0, 1]. Steps with moon phase above this
   *  are categorised as `moonPhase`. Default of 1 disables. */
  maxMoonPhaseFraction: number;
}

export interface ObservabilityRange {
  /** Inclusive start (Julian day, UTC). */
  startJd: number;
  /** Exclusive stop (Julian day, UTC). */
  stopJd: number;
  /** Optional step size in Julian days. Derived from the range when omitted. */
  stepJd?: number;
}

// ─── Gantt / time-block types ──────────────────────────────────────────────
//
// The Gantt chart consumes a normalised `TimeBlock[]` regardless of upstream
// shape — consumers project their own wire payloads into this shape and use
// `requestTypeToKind` from `internal/timeblocks/` to pick the kind.
// Accessibility constraint: the chart MUST encode `kind` with both colour
// AND pattern (see `internal/gantt/palette.ts`).

export type TimeBlockKind =
  | 'optical-imaging'
  | 'radio-tracking'
  | 'radio-mapping'
  /** Dark / flat / bias / focus / pointing. */
  | 'calibration'
  /** SkyNode shutdown / startup windows. */
  | 'maintenance'
  /** Scheduled-task block on the tasks Gantt — a single blue, kept distinct
   *  from the observability view's green/red so the two sources never read
   *  as the same thing. */
  | 'task'
  /** Observability-window view: the target *can* be observed (green). */
  | 'observable'
  /** Observability-window view: the target *can't* be observed (red). */
  | 'unobservable'
  | 'other';

export interface TimeBlock {
  /** Stable id — request id for tasks, deterministic hash for obs-windows.
   *  Used both as a React key and as the click-decode lookup key. */
  id: string;
  /** Inclusive start (UTC). */
  start: Date;
  /** Exclusive stop (UTC). */
  stop: Date;
  /** Which lane this block belongs on — matches `Lane.key`. */
  laneKey: string;
  /** Drives colour + pattern. Accessibility: NEVER colour alone. */
  kind: TimeBlockKind;
  /** Free-form label shown inside the bar when there's room (Gantt-style). */
  label?: string;
  /** Overrides the tooltip's "type" line. When omitted the tooltip uses
   *  the kind's palette label. The observability-window view sets this to
   *  the request type (e.g. `radio tracking`) so the type line stays
   *  meaningful even though `kind` is the observable/unobservable colour. */
  typeLabel?: string;
  /** Free-form payload surfaced by the tooltip. */
  detail?: Record<string, string | number>;
}

export interface Lane {
  /** Stable identity across renders. Format: `'inst:<id>'`. */
  key: string;
  /** Display label, e.g. `Prompt2`. */
  label: string;
  /** Telescope grouping label, e.g. `PROMPT`. Adjacent same-telescope lanes
   *  get a left-edge tint so the grouping is visible. */
  telescopeLabel?: string;
  /** Observatory grouping label, e.g. `CTIO`. Adjacent same-observatory
   *  lanes get a stronger background tint. */
  observatoryLabel?: string;
}
