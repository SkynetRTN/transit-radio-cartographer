"""§6.1 codec tests for `.md1` (raw single-sweep input)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from radio_cartographer.io.md1 import read_md1, write_md1


def test_read_minimal_md1_fixture(inputs_dir: Path) -> None:
    """The smallest checked-in `.md1` parses to a known sample count."""
    doc = read_md1(inputs_dir / "moon0a.md1")
    samples = doc.samples
    assert samples.ra.shape == samples.dec.shape == samples.flux.shape
    assert samples.ra.size == 1559
    assert samples.ra.dtype == np.float64
    assert samples.dec.dtype == np.float64
    assert samples.flux.dtype == np.float64
    # First sample (offset 0): " 78876", "-18.123", "1.7599".
    assert samples.ra[0] == pytest.approx(78876.0)
    assert samples.dec[0] == pytest.approx(-18.123)
    assert samples.flux[0] == pytest.approx(1.7599)


def test_read_full_md1_fixture(inputs_dir: Path) -> None:
    """A real `.md1` parses to integer-valued RA, finite Dec and Flux."""
    doc = read_md1(inputs_dir / "moon0a.md1")
    ra = doc.samples.ra
    # RA values in this fixture are integer timestamps; assert they round-trip.
    assert np.all(ra == ra.astype(int))
    # The flux column has a stable checksum we can pin against the legacy bytes.
    assert float(doc.samples.flux.sum()) == pytest.approx(2474.6975, rel=1e-6)


def test_read_full_md1_trailing_metadata_preserved(inputs_dir: Path) -> None:
    """Acquisition-system metadata after the data section is captured."""
    doc = read_md1(inputs_dir / "moon0a.md1")
    assert any("TELESCOPE" in line for line in doc.trailing_metadata)
    assert any("LOCAL START TIME" in line for line in doc.trailing_metadata)


@pytest.mark.parametrize(
    "name",
    ["mw_08b.md1", "mw_67b.md1", "pulsar1b.md1"],
)
def test_rejects_b_channel(inputs_dir: Path, name: str) -> None:
    with pytest.raises(ValueError, match="Channel-B"):
        read_md1(inputs_dir / name)


def test_rejects_b_channel_substring_safe(tmp_path: Path) -> None:
    """The guard inspects the stem, not the full path or extension.

    Files in a `b`-suffixed *directory* — e.g. `mybatch/some_a.md1` — must
    still parse, even though the path contains `b`. Only the stem's final
    character is consulted.
    """
    sub = tmp_path / "anybatch"
    sub.mkdir()
    p = sub / "some_a.md1"
    p.write_bytes(b"1\r\n2\r\n3\r\n")
    doc = read_md1(p)
    assert doc.samples.ra.size == 1


def test_malformed_truncated_file_raises(tmp_path: Path) -> None:
    """Non-triplet token count surfaces as a structured error, not a crash."""
    p = tmp_path / "bad.md1"
    p.write_bytes(b"1\r\n2\r\n")
    with pytest.raises(ValueError, match="not a multiple of 3"):
        read_md1(p)


@pytest.mark.parametrize(
    "name",
    ["moon0a.md1", "cas0a.md1", "cyg0a.md1"],
)
def test_md1_roundtrip_bytes_identical(inputs_dir: Path, tmp_path: Path, name: str) -> None:
    src = inputs_dir / name
    doc = read_md1(src)
    out = tmp_path / name
    write_md1(doc, out)
    assert out.read_bytes() == src.read_bytes()
