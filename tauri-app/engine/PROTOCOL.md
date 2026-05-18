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
- `close_handle({"handle": int}) -> {"closed": int}`
- `echo_array({"token": string}) -> {"array": BinaryRef}` (test utility for binary side-channel)
- `export_fits({"handle": int, "path": string}) -> {"ok": true, "path": string, "shape": [int, int]}
  - `handle` must reference an open survey. The sidecar grids to a WCS-bearing image and writes FITS.

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


`export_fits` error behavior:
- `-32602`: missing/invalid params
- `1001`: invalid or wrong-type handle
- `1002`: FITS write failure
