# Radio Cartographer Engine RPC Protocol (Phase 3)

Transport:
- JSON-RPC 2.0 over newline-delimited UTF-8 messages on stdin/stdout.
- stdout MUST contain protocol JSON only.
- stderr is reserved for diagnostics.

Handshake:
- Request: `{ "jsonrpc":"2.0", "id":1, "method":"ping", "params":{} }`
- Response: `{ "jsonrpc":"2.0", "id":1, "result":"pong" }`
- Local benchmark target: cold start `ping -> pong` within 1 second.

## Methods

- `ping(params={}) -> "pong"`
- `shutdown(params={}) -> {"ok": true}`
- `open_survey({"path": string}) -> {"handle": int, "metadata": {"sweep_count": int, "path": string}}`
- `get_sweep({"handle": int, "index": int}) -> {"ra": BinaryRef, "dec": BinaryRef, "flux": BinaryRef, "sample_count": int}`
- `get_sweep_inline({"handle": int, "index": int, "max_points": int (default 2000)}) -> {"ra": [float], "dec": [float], "flux": [float], "sample_count": int, "returned_count": int}` — inline (non-binary-channel) sweep payload for plotting; `max_points <= 0` disables downsampling.
- `close_handle({"handle": int}) -> {"closed": int}`
- `echo_array({"token": string}) -> {"array": BinaryRef}` (test utility for binary side-channel)
- `smooth({"handle": int (survey), "width": int (default 5)}) -> {"handle": int, "sweep_count": int, "op": "smooth"}`
- `baseline({"handle": int (survey), "degree": int (default 1)}) -> {"handle": int, "sweep_count": int, "op": "baseline"}`
- `align({"handle": int (survey), "factor": float (default 0.5)}) -> {"handle": int, "sweep_count": int, "op": "align"}`
- `make_image({"handle": int (survey), "pix": float (on-sky pixel size in degrees, default 0.06 = 1/20 of the 1.2° 40 ft beam)}) -> {"handle": int (image), "width": int, "height": int, "min_ra": float, "max_ra": float, "min_dec": float, "max_dec": float, "min_flux": float, "max_flux": float}` — the grid is sized so each cell spans `pix` degrees on-sky (RA cell = `pix / cos(dec)` in angle); `width`/`height` follow the survey's extent. NOTE: for the compose calls below, `pix` keeps its legacy meaning — an integer subdivision factor of the primary's native cell (default = native), not degrees.
- `get_image_pixels({"handle": int (image), "max_dim": int (default 400)}) -> {"pixels": [[float]], "width": int, "height": int}` — inline pixel grid for plotting; `max_dim` is the longest-side ceiling used to downsample with `ceil(longest/max_dim)` stride.
- `open_image({"path": string}) -> ImageMeta` (same shape as `make_image`, plus optional `"palette": [{"anchor": float, "r": float, "g": float, "b": float}, ...]` when the file is a legacy `.img`). Dispatch is by extension — `.img` uses the legacy reader, `.fits`/`.fit` uses astropy.
- `save_image({"handle": int (image), "path": string, "palette"?: [...], "flux_min"?: float, "flux_max"?: float, "name"?: string, "pix"?: int}) -> {"path": string, "bytes_written": int}`. Extension routes to `.img` or `.fits` writer; `.img` packs Int16 indices via the supplied palette + flux range, `.fits` writes a single-HDU FITS with a minimal WCS header.
- `save_bitmap({"handle": int (image), "path": string, "palette"?: [...], "flux_min"?: float, "flux_max"?: float}) -> {"path": string, "bytes_written": int}` — renders RGB through the palette and writes a 24-bit BI_RGB BMP.
- `append_image({"handle": int (image), "other_path": string, "ra_shift_seconds"?: float, "dec_shift_degrees"?: float, "pix"?: int, "force_calibrated"?: bool}) -> ImageMeta` — composes the second image into the current one. Overlap cells take the per-cell max.
- `append_image_multi({"handle": int (image), "other_paths": [string, ...], "pix"?: int, "force_calibrated"?: bool}) -> ImageMeta` — N-way append: composes the primary with every listed on-disk image onto a single union grid, resampling each source exactly once (result-equivalent to folding `append_image` left-to-right, but without the per-step regrid error of appending files one at a time). Overlap cells take the per-cell max.
- `superimpose_image({"handle": int (image), "other_path": string, "weight"?: float (0..1, default 0.5), "ra_shift_seconds"?: float, "dec_shift_degrees"?: float, "pix"?: int, "force_calibrated"?: bool}) -> ImageMeta` — overlap cells = `weight * primary + (1 - weight) * secondary`.
- `superimpose_image_multi({"handle": int (image), "other_paths": [string, ...], "pix"?: int, "force_calibrated"?: bool}) -> ImageMeta` — N-way superimpose: blends the primary with every listed on-disk image onto a single union grid, resampling each source exactly once, with every image weighted equally (overlap cell = mean of the covering inputs). No per-image weight — unequal weights are only meaningful when folding images in pairwise (`superimpose_image` one at a time).

  For all four compose calls: the composite carries flux calibration (`unit: "Jy"`, `flux_calibrated: true`) when every input is already flux-calibrated (inferred from each `.img`'s unit suffix). `force_calibrated: true` marks the result calibrated regardless — set when the user attests all inputs are flux-calibrated, since legacy `.img` files carry no unit suffix to infer from.
- `bicolor_image({"handle": int (image), "other_path": string, "primary_channel": "r"|"g"|"b", "secondary_channel": "r"|"g"|"b", "ra_shift_seconds"?: float, "dec_shift_degrees"?: float, "pix"?: int}) -> {"handle": int (rgb image), "kind": "rgb", "width", "height", "min_ra", "max_ra", "min_dec", "max_dec"}`. Each input occupies its assigned R/G/B channel; the third channel is zero. Channels are independently normalized to [0,1].
- `tricolor_image({"handle": int (image), "second_path": string, "third_path": string, "ra_shift_seconds"?: float, "dec_shift_degrees"?: float, "pix"?: int}) -> RgbImageMeta` — R = primary, G = second, B = third, each independently normalized.
- `extend_rgb_image({"handle": int (rgb image), "other_path": string, "ra_shift_seconds"?: float, "dec_shift_degrees"?: float}) -> RgbImageMeta` — fills the unused (all-zero) channel of a bi-color RGB image with the supplied image, resampled onto the existing RGB grid. Used by Tri-Color when extending a bi-color result.
- `get_rgb_image_pixels({"handle": int (rgb image), "max_dim": int (default 400)}) -> {"r": [[float]], "g": [[float]], "b": [[float]], "width", "height"}` — three normalized [0,1] channel grids.
- `open_palette({"path": string}) -> {"stops": [{"anchor": float, "r": float, "g": float, "b": float}, ...], "path": string}`.
- `save_palette({"path": string, "stops": [...]}) -> {"path": string, "bytes_written": int}`.
- `export_fits(...)` now forwards to `save_image` when the path's extension is `.fits`/`.fit` (kept as a legacy alias).

Reduction calls (`smooth` / `baseline` / `align`) register a NEW survey handle for the reduced result; the previous handle remains valid until the client closes it with `close_handle`. `make_image` produces a distinct handle type — passing an image handle to a reduction method, or a survey handle to `get_image_pixels`, surfaces an `1001` `invalid_handle` error.

`BinaryRef` format:
- `{ "token": "bin-N", "size": <npy_payload_size_bytes> }`

## Binary channel framing

Phase 3 implementation stores binary payloads in-memory behind tokens to keep JSON messages small and stable for the future Tauri bridge.

Frame format (little-endian):
1. `uint64 payload_len`
2. `payload_len` bytes of a NumPy `.npy` blob (`np.save(..., allow_pickle=False)`).

Decoding steps:
1. Resolve token to frame bytes.
2. Read first 8 bytes as `payload_len`.
3. Read the following bytes into `np.load(BytesIO(...), allow_pickle=False)`.

## Error model

JSON-RPC error object fields:
- `code` (stable integer)
- `message` (human-readable)
- `data` (optional object)

Error codes:
- `-32601` unknown method
- `-32602` invalid params
- `-32603` internal error
- `1001` invalid handle
- `1002` I/O or parse failure opening files

The sidecar should return structured errors for ordinary user/file problems and continue serving requests.
