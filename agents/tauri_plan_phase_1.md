# Tauri Phase 1 Progress — Codecs

## Scope
Implement **8.3 Phase 1 — Codecs** from `agents/tauri_plan.md` by adding initial legacy format codec modules and fixture-backed round-trip tests.

## Progress Log
- [x] Added codec module package: `radio_cartographer.io`.
- [x] Implemented baseline read/write codecs for `.md1`, `.md2`, `.scn`, `.srv`, `.img`, `.cal`, `.pal`.
- [x] Added channel-B filename guardrails for `.md1` and `.md2` readers.
- [x] Added fixture-backed byte-identity round-trip tests for all implemented codecs.
- [ ] Implement `.bmp` writer compatibility tests.
- [ ] Implement FITS writer and validation tests.
- [ ] Expand parsers from raw round-trip wrappers into structured typed models.

## Notes
Current Phase 1 implementation prioritizes lossless fixture round-tripping and safety checks first, consistent with the phase gate.
