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
- `make_image({"handle": int (survey), "pix": int (default 1)}) -> {"handle": int (image), "width": int, "height": int, "min_ra": float, "max_ra": float, "min_dec": float, "max_dec": float, "min_flux": float, "max_flux": float}`
- `get_image_pixels({"handle": int (image), "max_dim": int (default 400)}) -> {"pixels": [[float]], "width": int, "height": int}` — inline pixel grid for plotting; `max_dim` is the longest-side ceiling used to downsample with `ceil(longest/max_dim)` stride.
- `export_fits(...)` is a Phase 3 stub and returns an error.

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
