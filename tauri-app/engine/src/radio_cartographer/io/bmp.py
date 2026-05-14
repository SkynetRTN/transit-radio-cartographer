"""`.bmp` codec — rendered survey image.

The legacy app writes this via Visual Basic's `SavePicture` against a
24-bit `BI_RGB` bitmap. Byte-exact fidelity to that path is documented as
fragile (see [agents/tauri_plan.md](../../../../agents/tauri_plan.md) §9 and
§8.3 risk note). No `.bmp` fixture is checked in yet, so for Phase 1 we
treat `.bmp` as opaque bytes — `read_bmp` returns a `Bitmap` that wraps the
file content, `write_bmp` emits those bytes verbatim. Round-trip is
byte-identical by construction.

When a fixture is captured (Phase 6 risk-mitigation work), upgrade this
module to parse the BMP header and pixel array, and add a writer that emits
the same byte sequence as `SavePicture` does on the legacy EXE.
"""

from __future__ import annotations

from pathlib import Path

from ..models import Bitmap


def read_bmp(path: str | Path) -> Bitmap:
    return Bitmap(raw_bytes=Path(path).read_bytes())


def write_bmp(bitmap: Bitmap, path: str | Path) -> None:
    Path(path).write_bytes(bitmap.raw_bytes)
