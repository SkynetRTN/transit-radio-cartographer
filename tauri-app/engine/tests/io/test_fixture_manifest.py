"""Phase 0b artifact: `fixtures/MANIFEST.sha256` must match reality.

This catches accidental fixture edits (or accidental manifest desync) before
the codec round-trip tests do — a fixture edit otherwise looks like a codec
regression, which is much harder to debug.
"""

from __future__ import annotations

import hashlib
from pathlib import Path


def test_manifest_matches_fixtures(fixtures_dir: Path) -> None:
    manifest_path = fixtures_dir / "MANIFEST.sha256"
    manifest_text = manifest_path.read_text(encoding="ascii")
    failures: list[str] = []
    for line in manifest_text.splitlines():
        line = line.strip()
        if not line:
            continue
        expected_hash, rel_path = line.split(None, 1)
        target = fixtures_dir / rel_path
        if not target.exists():
            failures.append(f"missing: {rel_path}")
            continue
        actual = hashlib.sha256(target.read_bytes()).hexdigest()
        if actual != expected_hash:
            failures.append(
                f"hash mismatch: {rel_path} (expected {expected_hash[:12]}…, got {actual[:12]}…)"
            )
    assert not failures, "MANIFEST.sha256 out of sync:\n  " + "\n  ".join(failures)
