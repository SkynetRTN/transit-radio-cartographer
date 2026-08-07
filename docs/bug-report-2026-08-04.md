# Bug Report — 2026-08-04

Codebase review of the modern port (`tauri-app/`): Python engine, Rust Tauri shell, and React UI.
The legacy `vb/` tree was treated as the read-only behavior oracle and was not reviewed for bugs.
Intentional VB-oracle quirks (byte-for-byte codec behavior, `Format$` semantics, etc.) were excluded.

Findings are ordered by priority. The P0 items were hand-verified against the source; all others
were verified by re-reading the code path during review.

---

## P0 — Data corruption or app-breaking, core workflow

> **Status: all four P0 items were fixed on 2026-08-04.** #1: the recursive call is now
> `setError(...)`. #2: pending RFI edits are dropped when `calibrated`/`flux_calibrated`
> changes. #3: `serve()` now returns `-32700`/`-32600` structured errors and keeps serving
> (regression test: `engine/tests/rpc/test_rpc_malformed_input.py`). #4: stderr is drained
> on a background thread and forwarded to the parent's stderr with a `[sidecar]` prefix.

### 1. `handleRpcError` infinitely recurses on every non-stale-handle error
**Files:** [survey-context.tsx:216](../tauri-app/app/src/state/survey-context.tsx#L216), [scan-context.tsx:107](../tauri-app/app/src/state/scan-context.tsx#L107)

The centralised catch-block helper handles the stale-handle (code 1001) case, then for **every
other error** calls itself instead of `setError(...)`:

```ts
const handleRpcError = useCallback((e: unknown) => {
  if (isStaleHandleError(e)) { ... return; }
  handleRpcError(e);   // ← should be setError(String(e)) or similar
}, [resetForEngineRestart]);
```

Any engine validation error, transport error (`sidecar_eof`, `write_failed`), or client timeout
recurses to `RangeError: Maximum call stack size exceeded` inside the catch block. No toast is
shown, cleanup statements after the call are skipped (leaving inconsistent context state), and the
promise rejection is unhandled.

**Trigger:** Survey → New Survey… on a channel-B `.md2` (which the engine rejects per the tutorial
rule), or any other engine error. The UI silently does nothing. Existing tests only exercise the
code-1001 branch, which is why CI passes.

### 2. Pending RFI edits are not invalidated when flux calibration rescales the sweep
**File:** [SurveyView.tsx:116](../tauri-app/app/src/views/SurveyView.tsx#L116)

`removedBySweep`/`historyBySweep` are only cleared when `workspaceHandle` changes. Loading a `.cal`
rescales the whole workspace from GCU to Jy and re-fetches the sweep in Jy, but pending removal
deltas — computed in GCU — are kept and applied against the Jy-scaled flux.

**Trigger:** Draw Remove-RFI segments on a sweep, then load a calibration (slope ~800 Jy/GCU)
before clicking Accept Sweep. The plot shows wrong corrected flux, and Accept Sweep commits
corrupted flux (Jy values minus GCU-scale deltas) via `setSourceSweepFlux` — which propagates into
the saved `.srv` and the gridded image. **Silent data corruption in the documented workflow.**

### 3. Malformed JSON on stdin kills the RPC server — all loaded data lost
**File:** [rpc.py:1955](../tauri-app/engine/src/radio_cartographer/rpc.py#L1955)

`serve()` calls `json.loads(line)` with no exception handling, and `handle_request` dereferences
`request.get(...)` before its `try` block. Invalid JSON raises `JSONDecodeError`; valid-but-non-object
JSON (`[1]`, `42`) raises `AttributeError`. Both terminate the sidecar process, dropping every open
handle. `PROTOCOL.md` explicitly requires the sidecar to "return structured errors … and continue
serving requests" (JSON-RPC defines `-32700 Parse Error` for exactly this case).

**Trigger:** Any garbled/partial line reaching engine stdin — a truncated write from the Rust
bridge, stray output, or a client bug. The engine dies mid-session; all loaded surveys/scans/images
are gone.

### 4. Sidecar stderr is piped but never drained — engine and app can deadlock permanently
**File:** [sidecar.rs:118](../tauri-app/app/src-tauri/src/sidecar.rs#L118)

`build_command()` sets `cmd.stderr(Stdio::piped())`, but `child.stderr` is never taken or read
anywhere. Once the child fills the OS pipe buffer (numpy `RankWarning`s from polyfit, astropy
warnings, tracebacks, or `uv run` progress output in dev), the Python process blocks mid-write and
never produces its stdout response. The Rust side then blocks forever in `read_line` — on the main
thread (see #5) — and `stop()` subsequently hangs in `child.wait()` (see #10). The app is
permanently hung with no recovery path short of Task Manager.

---

## P1 — High: crash, hang, or wrong results in common paths

> **Status: all four P1 items were fixed on 2026-08-04.** #5: `rpc_request` is now an
> async command that runs the bridge call via `spawn_blocking`, keeping the event loop
> free. #6: a decode failure now resets the stream, and response ids are validated
> against the request id (null-id structured errors excepted, per JSON-RPC). #7:
> `formatDec` now uses `deg * 3600`. #8: reductions clear `raw_bytes`, recompute
> per-sweep flux bounds (oracle: vb/survform.frm:2182, 2449), and shift dec bounds on
> align (oracle: vb/survform.frm:2734).

### 5. Synchronous `rpc_request` command blocks the Tauri main thread on every engine call
**File:** [lib.rs:51](../tauri-app/app/src-tauri/src/lib.rs#L51)

`rpc_request` is a non-async `#[tauri::command]`, so Tauri runs it on the event-loop thread. It
performs blocking work: sidecar spawn (a cold `uv run` in dev can take seconds), stdin write, and
an unbounded `read_line` with no read timeout. While any RPC is in flight the window cannot
repaint or process close events. On a long Make Image, the window shows "Not Responding" and the
close button does nothing. The frontend's 15 s timeout only abandons the JS promise — the Rust
thread stays blocked. Fix: mark the command `async` and/or move the bridge call off the main thread,
and add a read timeout.

### 6. Stream desynchronization after `decode_failed`; response ids never validated
**File:** [sidecar.rs:165](../tauri-app/app/src-tauri/src/sidecar.rs#L165)

When a stdout line fails to parse as JSON, `send()` returns `decode_failed` but — unlike the
write/EOF/read-error paths — does **not** reset `self.io`. If the stray line was extra output
injected before a real response, every subsequent RPC reads the *previous* request's response,
off-by-one for the life of the process. Neither the Rust side nor `client.ts` checks that
`resp.id` matches the request id, so wrong payloads are silently delivered to the wrong calls
(e.g. one sweep's flux array rendered or saved as another's).

### 7. Dec readout in Calibrate Survey view is wrong by a factor of 60
**File:** [CalibrateSurveyView.tsx:17](../tauri-app/app/src/views/CalibrateSurveyView.tsx#L17)

```ts
const totalArcSec = deg * 60;   // ← arc-minutes, not arc-seconds; should be deg * 3600
```

The value is then decomposed as if it were arc-seconds, shifting every field: Dec = 38.5° displays
as `00:38:30` instead of `38:30:00`. The sibling `formatDec` implementations in `SurveyView.tsx`,
`ScanView.tsx`, and `CalibrateScanView.tsx` are correct; this one is the odd one out. Display-only,
but it feeds the core Calibrate Survey step where the user judges bracket points.

### 8. Reduced surveys keep the original `raw_bytes` — serializing writes the pre-reduction file
**File:** [survey.py:41](../tauri-app/engine/src/radio_cartographer/survey.py#L41)

`align_survey` and `apply_to_survey` build the reduced Survey with
`dataclasses.replace(survey, sweeps=...)`, which carries over `raw_bytes`. The codec contract is
that `write_srv` short-circuits to `raw_bytes` verbatim when set ([srv.py:159](../tauri-app/engine/src/radio_cartographer/io/srv.py#L159)).
So a Survey loaded from `.srv` and then smoothed/baselined/aligned serializes back as the
**original untouched bytes** — every reduction silently discarded. The same `replace()` calls also
leave per-sweep `min_dec`/`max_dec`/`min_flux`/`max_flux` stale (the VB oracle shifts them on
align, `vb/survform.frm:2734`). The workspace path used by the UI avoids this, but the RPC
`_reduce` non-workspace path hits it directly.

---

## P2 — Medium: wrong behavior, leaks, and reliability issues

> **Status: all eight P2 items (#9–#16) were fixed on 2026-08-04**, plus one
> tester-reported bug found during the fix (#27 below) and the adjacent P3 #24.
> #9: `makeImage` clears RGB state and closes its handle. #10: `stop()` closes stdin,
> waits up to 3 s, then kills and reaps. #11: long-running methods (opens, saves,
> gridding, composition, reductions) get a 300 s timeout; the timer is cleared on
> completion and the error message names the method. #12: all ra/dec/flux payloads now
> route through `_array_to_jsonable_list`. #13: the binary store is bounded at 64 MB
> with oldest-first eviction. #14: PreImageView closes the previous preview handle on
> each rebuild and the last one on unmount. #15: both gain-calibration paths reject
> opposite-sign Cal1/Cal2 (and zero interpolated cal) with a clear error. #16:
> `apply_gain_to_sweep` preserves dec bounds and scales flux bounds, keeping the
> calibrated Survey serializable.

### 27. "Back to Pre Image" forgets that reductions were already applied *(fixed)*
**Files:** [PreImageView.tsx](../tauri-app/app/src/views/PreImageView.tsx), [survey-context.tsx](../tauri-app/app/src/state/survey-context.tsx)

*(Reported by the user during this session.)* The `didSmooth`/`didBaseline`/`didAlign`
flags gating Make Image were component-local state, wiped whenever PreImageView
unmounted. Returning from the Image view via "Back to Pre Image" therefore disabled
Make Image until the user re-ran all three reductions — and re-running them applied
them a **second time** to the workspace (double-smoothing the data). Fixed by moving
the flags into the survey context (`reductionsDone`), reset on open/close/engine
restart and on Apply Gain Calibration (which drops reductions engine-side).

### 9. `makeImage` doesn't clear/close an existing RGB composite image
**File:** [survey-context.tsx:393](../tauri-app/app/src/state/survey-context.tsx#L393)

Every other image-installing action clears the opposite-kind image state and closes its engine
handle; `makeImage` leaves `rgbImage`/`rgbImagePixels` untouched, breaking the "only one of
image/rgbImage is non-null" invariant and leaking the RGB handle. After "Back to Pre Image" →
"Make Image", the stale bi-color's unused channel makes `Make Tri-Color Image…` take the
tricolor-from-rgb path and extend the discarded bi-color instead of the current image.

### 10. `stop()` waits indefinitely; nothing ever kills the sidecar
**File:** [sidecar.rs:230](../tauri-app/app/src-tauri/src/sidecar.rs#L230)

`stop()` writes a shutdown request (result discarded with `let _`) then calls `child.wait()` with
no timeout and no `Child::kill()` fallback — `kill` is never called anywhere. If the engine is
wedged, the `WindowEvent::Destroyed` handler blocks forever: window gone, app process and
`radio-cartographer-engine.exe` both live on until manually killed.

### 11. Fixed 15 s RPC timeout reports false failures on long operations
**File:** [client.ts:294](../tauri-app/app/src/ipc/client.ts#L294)

Every invoke races a fixed 15 s timeout, but the Rust command has no cancellation — the operation
keeps running and its eventual result is discarded. Make Image on a large survey at pix=1 can
exceed 15 s: the UI reports `sidecar_timeout`, the user retries, and the retry queues behind the
still-running call. For `save_survey`/`save_scan` the user is told the save failed when the file
was actually written. The success-path timer is also never cleared.

### 12. NaN/Inf in sweep and calibration payloads silently drops the RPC reply
**File:** [rpc.py:677](../tauri-app/engine/src/radio_cartographer/rpc.py#L677) (also lines ~1172, ~1228, ~1435)

`_array_to_jsonable_list` exists precisely because `json.dumps` emits bareword `NaN` that
serde_json rejects, discarding the whole reply — but `_get_sweep_inline`, `_get_source_sweep`,
`_get_calibration_view`, `_get_scan_view`, and `_get_scan_calibration_view` serialize with raw
`.tolist()`. The md1/md2/scn/srv parsers accept `float("nan")`, so a NaN dropout in an acquisition
file flows through and the affected view request hangs/errors with no diagnostic.

### 13. `BinaryChannel` frames are never freed — unbounded engine memory growth
**File:** [rpc.py:385](../tauri-app/engine/src/radio_cartographer/rpc.py#L385)

`put_array` stores a full `.npy` copy per token; nothing ever removes entries — `get_array`
doesn't pop, there's no release RPC method, and `close_handle` only clears the `HandleRegistry`.
Each `get_sweep` permanently retains three array copies; a long sweep-walking session accumulates
hundreds of MB that can only be reclaimed by killing the sidecar.

### 14. Pre-image preview handles are never closed
**File:** [PreImageView.tsx:43](../tauri-app/app/src/views/PreImageView.tsx#L43)

`generateImage` allocates a new engine image handle on mount and after every
Smooth/Baseline/Align/flux-cal flip; no `closeHandle` call exists anywhere in the file (including
unmount). Each leaked handle pins a full gridded image in engine memory for the session.

### 15. Gain calibration can divide by an interpolated cal voltage that crosses zero
**File:** [workspace.py:306](../tauri-app/engine/src/radio_cartographer/workspace.py#L306)

`apply_gain_calibration` validates `Cal1 != 0` and `Cal2 != 0` individually, then divides by the
per-sweep interpolation `(1-t)*cal1 + t*cal2`. Opposite-sign brackets (possible after aggressive
Cut Segment edits invert an on/off mean) make some sweep's divisor ≈ 0, yielding Inf/NaN or wildly
amplified flux with no warning — which then flows into `make_image` and `.srv` saves.
`scan_workspace.apply_scan_calibration` ([scan_workspace.py:338](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L338)) has the same hazard.

### 16. `apply_gain_to_sweep` discards Sweep metadata, making a calibrated Survey unserializable
**File:** [calibration.py:17](../tauri-app/engine/src/radio_cartographer/calibration.py#L17)

The rebuilt Sweep drops `min_dec`/`max_dec`/`min_flux`/`max_flux` (required by the `.srv` writer,
which raises `ValueError` on `None`) and stamps `calib=gain` on every sweep, destroying the legacy
per-sweep bracket-voltage convention (Cal1 on first sweep, 0.0 middle, Cal2 last).
`read_srv → apply_calibration → write_srv` fails at the first sweep.

---

## P3 — Low: edge cases, dev-experience, and polish

> **Status: all P3 items were fixed on 2026-08-04** (#24 was fixed alongside the P2
> batch). #17: names are validated at rename time (`_validate_vb_name` rejects
> non-ASCII and CR/LF with a clear message) in both rename RPCs and the `.img` save
> path. #18: `RgbGriddedImage` now records `unused_channel` at compose time;
> `extend_rgb_compose` prefers it (heuristic kept as fallback), and the RPC meta +
> frontend menu logic use the authoritative value. #19: guard is `< 241` with a clear
> ValueError. #20: `apply_palette` raises "palette has no stops". #21: the srv
> serializer raises ValueError instead of asserting. #22: both CalibrationView flows
> surface engine errors via alert instead of unhandled rejections. #23:
> `RADIO_CART_SIDECAR_CMD` is tokenized quote-aware (unit-tested). #25: broken
> streams go through `discard_io()`, which kills and reaps the child — no more Unix
> zombies. #26: `bundle.targets` lists per-platform targets (nsis/app/dmg/deb/rpm/
> appimage); Windows output is unchanged, macOS/Linux `just package` produce bundles
> again.

### 17. Non-ASCII workspace/scan names make every save fail with an opaque error
**File:** [_vb_format.py:76](../tauri-app/engine/src/radio_cartographer/io/_vb_format.py#L76)

`vb_print_string` encodes strict-ASCII, but the rename RPCs accept any Unicode. A user who renames
their survey "Orión" completes the whole reduction and then can never save — every attempt fails
with a generic `ERR_IO` until they guess to rename in ASCII. Validate at rename time or surface a
clear message. Same for the `.img` writer's `write_prefixed_string` ([img.py:150](../tauri-app/engine/src/radio_cartographer/io/img.py#L150)).

### 18. `extend_rgb_compose` misdetects a populated-but-flat channel as unused
**File:** [image_compose.py:369](../tauri-app/engine/src/radio_cartographer/image_compose.py#L369)

The unused-channel heuristic treats `nanmax == 0.0` as empty, but `_normalize01` maps a constant-
flux channel to all-zeros — indistinguishable from the bicolor filler. A tri-color extension can
overwrite a real (flat) channel while a truly empty one exists later in `r,g,b` order.

### 19. `calibrate_scan` off-by-one: exactly 240 samples crashes with IndexError
**File:** [scan.py:166](../tauri-app/engine/src/radio_cartographer/scan.py#L166)

The guard rejects `< 240` but admits `== 240`, leaving zero source samples; `src_ra[-1]` then
raises `IndexError` instead of the intended `ValueError`. Guard should be `< 241` (matching
`build_scan_workspace`'s `CAL_TOTAL + 1`).

### 20. `apply_palette` crashes unhelpfully on a zero-stop palette
**File:** [palette.py:19](../tauri-app/engine/src/radio_cartographer/palette.py#L19)

A `.pal` whose header count is 0 parses successfully to `Palette(stops=())`; `anchors.max()` then
raises "zero-size array to reduction operation" surfaced as a generic internal error in the
bitmap-export path instead of "palette has no stops".

### 21. `assert` used as validation in the `.srv` serializer
**File:** [srv.py:167](../tauri-app/engine/src/radio_cartographer/io/srv.py#L167)

`assert survey.sweeps` is stripped under `python -O` (or an optimized PyInstaller build), turning
an empty-sweeps Survey into a raw `IndexError`. Use a `ValueError`.

### 22. Unhandled promise rejection when reading a `.scn` peak fails
**File:** [CalibrationView.tsx:56](../tauri-app/app/src/views/CalibrationView.tsx#L56)

`handleAddFromFile` awaits `fluxCalReadScnPeak` with no try/catch and is invoked as
`void handleAddFromFile()`. Picking a corrupt/non-`.scn` file (the dialog offers "All files")
silently does nothing. `handleAddCurrentScan` has the same gap.

### 23. `RADIO_CART_SIDECAR_CMD` parsed with `split_whitespace` — breaks on Windows paths with spaces
**File:** [sidecar.rs:65](../tauri-app/app/src-tauri/src/sidecar.rs#L65)

No quoting support: `C:\Program Files\Python313\python.exe …` becomes program `C:\Program`.
Dev/test-harness only.

### 24. `shutdown()` silently skips `stop()` when the mutex is poisoned
**File:** [sidecar.rs:271](../tauri-app/app/src-tauri/src/sidecar.rs#L271)

`if let Ok(...) = self.inner.lock()` does nothing on poison, while `rpc()` correctly recovers via
`poisoned.into_inner()`. A prior panic in the RPC path leaves the engine unreaped on window close.

### 25. Crashed sidecar children are dropped without `wait()` — zombies on macOS/Linux
**File:** [sidecar.rs:159](../tauri-app/app/src-tauri/src/sidecar.rs#L159)

The `send()` error paths and `ensure_started_internal`'s error arm set `self.io = None` without
reaping; each crashed engine leaves a `<defunct>` process for the app's lifetime on Unix.

### 26. `bundle.targets` is NSIS-only, contradicting cross-platform packaging
**File:** [tauri.conf.json:26](../tauri-app/app/src-tauri/tauri.conf.json#L26)

`"targets": ["nsis"]` is Windows-only, yet the config sets a macOS `signingIdentity` and the repo
claims packaged builds on all three platforms. `just package` on macOS/Linux produces no
installable bundle.

---

---

# Second pass — 2026-08-04, after merging origin/main

A second review of the post-merge tree (`bug-sweep-2026-08-04` = the 27 fixes above +
~20 upstream tester-feedback commits). Focus: the newly merged upstream code (never
previously reviewed) and the merge seams. Four reviewers, including one adversarially
attacking the first-pass fixes. Findings numbered from 28, priority order.

> **Status (2026-08-04): every second-pass finding is resolved.** #30 is **by
> design** (see below); #48 was **resolved** (Virgo A = 230.8 per the user); all
> others are **fixed**:
> #28: FITS RA converts sec-of-time ↔ degrees at the codec boundary (regression
> test added; the two tests pinning the old unit-mismatch guard now assert that
> FITS+img compose works). #29: pairwise append uses `np.fmax`, superimpose uses a
> NaN-aware blend. #33: the N-way mean only counts finite cells as coverage.
> #31/#46: stdout is read on a dedicated thread so `send()` times out at 330 s
> (frees the mutex when the engine wedges); `shutdown()` uses `try_lock` and kills
> the engine by pid when an in-flight RPC holds the lock; post-shutdown RPCs get a
> structured error instead of respawning the engine.
> #32: scalar payload fields (cal1/cal2, peak_flux, fit grids, slope/error) route
> through `_json_float` (non-finite → null). #34: RgbImagePlot pushes magnifier-box
> changes via a shapes-only relayout (zoom survives). #35: the multi-compose
> methods joined LONG_RUNNING_METHODS. #36: sweep shortcuts are inert while any
> `[role="dialog"]` is open. #37: the `.scn` peak regex accepts VB's sub-unity
> `.456` format (test added). #38: `generateImage` has a generation guard and
> tracks the preview handle before the pixel fetch. #39: the timeout race's losing
> invoke gets a no-op catch. #40: `makeImage` drops and closes the pre-compose
> scalar stash. #41: bracket toggles in both calibrate views surface RPC failures.
> #42: `_open_image_path` wraps file errors in ERR_IO and compose param casts are
> validated (−32602). #43: `_block_downsample` keeps an axis shorter than the
> stride. #44: unknown/evicted binary tokens raise a structured error. #45:
> non-object `params` returns −32602. #47: quotes only open at token start, so
> apostrophes in unquoted paths stay literal (test added).

## High

### 28. FITS export writes RA WCS in seconds-of-time — the app cannot reopen its own FITS files
**Files:** [io/fits.py:127](../tauri-app/engine/src/radio_cartographer/io/fits.py#L127), [image.py:318](../tauri-app/engine/src/radio_cartographer/image.py#L318)

The rewritten `make_image` builds WCS with `crval1`/`cdelt1` in RA **seconds-of-time**
(cdelt1 ≈ −17 for the default 0.06° pixel), and `write_fits` emits those values verbatim
under `CTYPE1='RA---TAN'`, which the FITS standard defines as **degrees**. The upstream
BUG-009 validation in `read_fits` rejects |CDELT| > 10°/px and out-of-range RA bounds, so
`Save Image As FITS` → `Open Image` on the same file always fails ("CDELT exceeds 10
deg/pixel"), Append/Superimpose can't use exported FITS, and DS9/Aladin show garbage
coordinates. *Empirically verified.* The round-trip test uses a synthetic degrees-based
WCS, so CI never exercises the real path. Fix at the FITS boundary: ÷240 on write, ×240
on read.

### 29. Pairwise Append/Superimpose erase new data falling on a composite's no-data cells
**File:** [image_compose.py:422](../tauri-app/engine/src/radio_cartographer/image_compose.py#L422)

`_compose` combines overlap cells with `np.maximum` (append) / weighted sum
(superimpose); both propagate NaN. Coverage masks are bounding-box rectangles, and a
composite primary carries NaN "no data" cells *inside* its bbox — so building a mosaic
one file at a time (the UI's single-file flow) blanks any region where the new map falls
over a previous composite's gap: `max(NaN, x) = NaN`. The N-way `append_images_multi`
uses NaN-aware `np.fmax` precisely to avoid this and claims pairwise folding is
"result-equivalent" — it isn't. *Independently found and execution-verified by two
reviewers.* Silent data loss baked into saved mosaics.

### 30. ~~RFI edits on non-current sweeps are never committed to the engine~~ — BY DESIGN

> **Resolution (user, 2026-08-04): not a bug.** Edits must be explicitly accepted on
> the sweep being viewed — nothing should save without being told to. Accept All
> (Ctrl+Shift+A) is a development shortcut for reaching the Pre-Image screen quickly
> and will not be used in production.
**File:** [SurveyView.tsx:453](../tauri-app/app/src/views/SurveyView.tsx#L453)

`commitPendingEdits()` only syncs the **current** sweep, but `removedBySweep` persists
per-sweep across navigation. Draw Remove-RFI edits on a sweep, navigate away
(Prev/Next/GoTo), then Accept All (Ctrl+Shift+A) or accept elsewhere: those edits are
never written via `setSourceSweepFlux`, yet the UI keeps rendering the corrected trace —
the on-screen plots diverge from what Make Image grids and Save Survey serializes. RFI
the user believes removed is baked into the `.srv` and image.

### 31. Window close blocks on the bridge mutex held by an in-flight RPC — kill fallback unreachable
**Files:** [lib.rs:37](../tauri-app/app/src-tauri/src/lib.rs#L37), [sidecar.rs:202](../tauri-app/app/src-tauri/src/sidecar.rs#L202)

Making `rpc_request` async (fix #5) means the window can now close *while an RPC is in
flight* — and that RPC holds the bridge mutex for the full duration of an unbounded
`read_line`. The Destroyed handler's `shutdown()` waits on that mutex with no timeout,
so the 3-second grace-then-kill added in fix #10 never runs in exactly the wedged-engine
scenario it was built for. Root enabler: `send()` still has no read timeout, so one
wedged engine call also queues every later RPC forever (medium, same cluster). Also:
a queued RPC can respawn the engine after `shutdown()` already stopped it (low).

## Medium

### 32. Scalar NaN fields bypass the NaN-safe JSON boundary — dropped replies, unopenable surveys
**File:** [rpc.py:1288](../tauri-app/engine/src/radio_cartographer/rpc.py#L1288) (and _get_calibration_view, _scan_overview, determine_scan_peak_*, flux_cal_read_file)

The array payloads are NaN-safe, but scalars — `cal1`/`cal2`, `peak_flux`,
`fit_ra`/`fit_flux`, `slope`/`error` — are emitted with bare `float()`. A `nan` token in
a cal bracket makes the whole `open_survey` reply undecodable (serde_json rejects
bareword NaN), so the survey can't be opened at all; a NaN peak poisons every later
scan overview reply.

### 33. `superimpose_images_multi`: NaN in the primary poisons the per-cell mean
**File:** [image_compose.py:324](../tauri-app/engine/src/radio_cartographer/image_compose.py#L324)

Same root cause as #29 in the N-way path: `pixels_sum[mask] += resampled[mask]` adds NaN
into the accumulator wherever the composite primary has interior no-data cells.
`append_images_multi` handles this with `np.fmax`; the superimpose variant doesn't.

### 34. RGB magnifier destroys an active zoom
**File:** [RgbImagePlot.tsx:377](../tauri-app/app/src/lib/plots/RgbImagePlot.tsx#L377)

`boxOverlay` is in the full-rebuild effect deps, so opening/moving the magnifier purges
and rebuilds the plot with autoranged axes. `ImagePlot` deliberately routes overlay
changes through a shapes-only relayout with stable `uirevision` (BUG-025); the RGB
counterpart missed that treatment — zoom + magnifier are unusable together on composites.

### 35. `append_image_multi` / `superimpose_image_multi` missing from LONG_RUNNING_METHODS
**File:** [client.ts:319](../tauri-app/app/src/ipc/client.ts#L319)

The new N-way compose methods — the slowest compose path — race the default 15 s
timeout, resurfacing the false-timeout/retry-pileup failure that fix #11 removed.

### 36. Sweep keyboard shortcuts fire behind open modal dialogs
**File:** [SurveyView.tsx:465](../tauri-app/app/src/views/SurveyView.tsx#L465)

The window-level keydown handler only guards input-like targets. With the "Discard
current work?" confirmation (or any modal) open, ArrowRight still navigates and
Ctrl+Shift+A accepts every sweep and flips to Pre-Image behind the dialog — even if the
user then cancels it.

### 37. `.scn` peak parser can't read legacy sub-unity peaks — and destroys them on re-save
**File:** [scan_workspace.py:784](../tauri-app/engine/src/radio_cartographer/scan_workspace.py#L784)

VB's `Format$(x, "#.###")` writes `Peak Flux: .456` (no leading zero); the regex requires
a digit before the decimal, so such peaks parse to `None` — and saving the scan then
writes an **empty** peak line, permanently destroying the recorded peak. The sibling
parser in flux_calibration.py handles these fine.

## Low

### 38. `generateImage` races: stale preview displayed, fresh handle closed; handle leak on pixel-fetch failure ([PreImageView.tsx:150](../tauri-app/app/src/views/PreImageView.tsx#L150))
### 39. Timeout-race loser has no rejection handler — unhandled rejection when a timed-out call later fails ([client.ts:360](../tauri-app/app/src/ipc/client.ts#L360))
### 40. `makeImage` leaves the pre-compose scalar stash and its engine handle behind ([survey-context.tsx:446](../tauri-app/app/src/state/survey-context.tsx#L446))
### 41. Pre/Post bracket toggles: unhandled rejection, silent checkbox snap-back ([CalibrateSurveyView.tsx:525](../tauri-app/app/src/views/CalibrateSurveyView.tsx#L525), CalibrateScanView.tsx ~472)
### 42. Compose endpoints return −32603 internal errors for ordinary file/param problems instead of structured ERR_IO/−32602 ([rpc.py:1038](../tauri-app/engine/src/radio_cartographer/rpc.py#L1038))
### 43. `_block_downsample` returns a 0×0 grid for extreme aspect ratios — image renders blank ([rpc.py:194](../tauri-app/engine/src/radio_cartographer/rpc.py#L194))
### 44. `BinaryChannel.get_array` raises bare KeyError for unknown/evicted tokens ([rpc.py:475](../tauri-app/engine/src/radio_cartographer/rpc.py#L475))
### 45. Non-object `params` crashes to −32603 instead of −32602 ([rpc.py:490](../tauri-app/engine/src/radio_cartographer/rpc.py#L490))
### 46. Queued RPC respawns the engine after `shutdown()` during window close ([sidecar.rs:265](../tauri-app/app/src-tauri/src/sidecar.rs#L265))
### 47. Tokenizer treats an apostrophe in an unquoted path as a quote delimiter ([sidecar.rs:61](../tauri-app/app/src-tauri/src/sidecar.rs#L61))

### Resolved during review
**#48 — Default known-Jy table disagreed with its docstring and test** (and both with the
VB oracle: 213/942/1581). Per the user, Virgo A = 230.8 Jy is correct; the table now
matches the docstring/test trio (VIR 230.8, TAU 846.3, CYG 1605.9) with a comment noting
these intentionally supersede the legacy defaults. The pre-existing test failure is fixed.

---

## Cross-cutting observations

- **The hang cluster (#4, #5, #10) compounds:** undrained stderr wedges the engine → the sync
  command wedges the main thread → `stop()` with no kill fallback wedges shutdown. Fixing #4
  (drain or null stderr) removes the most likely trigger; #5 and #10 remove the blast radius.
- **The error-reporting cluster (#1, #3, #12, #22)** means that today, most failure modes are
  invisible to the user: engine errors recurse to stack overflow, parse errors kill the engine,
  NaN payloads vanish, and some rejections are simply unhandled. Fixing #1 alone would surface
  the rest as visible errors.
- **Test gaps:** the error-path recursion (#1) survives CI because tests only cover the
  stale-handle branch; the flat-channel heuristic (#18) is explicitly worked around in its own
  test suite.
