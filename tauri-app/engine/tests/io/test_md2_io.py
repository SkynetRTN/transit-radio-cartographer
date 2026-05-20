"""§6.1 codec tests for `.md2` (raw multi-sweep survey input)."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import pytest
from radio_cartographer.io.md2 import read_md2, write_md2


def test_read_minimal_md2_parses(inputs_dir: Path) -> None:
    """The smallest checked-in `.md2` parses into multiple sweeps."""
    doc = read_md2(inputs_dir / "and0a.md2")
    assert len(doc.sweeps) >= 1
    for sweep in doc.sweeps:
        assert sweep.ra.shape == sweep.dec.shape == sweep.flux.shape


def test_read_full_tutorial_md2(inputs_dir: Path) -> None:
    """The Andromeda fixture parses to a known sweep count and total samples."""
    doc = read_md2(inputs_dir / "and0a.md2")
    assert len(doc.sweeps) == 65
    total_samples = sum(int(s.ra.size) for s in doc.sweeps)
    assert total_samples == 15642
    # First sample of the first sweep: " 794", "31.3437", "2.1685".
    assert doc.sweeps[0].ra[0] == pytest.approx(794.0)
    assert doc.sweeps[0].dec[0] == pytest.approx(31.3437)
    assert doc.sweeps[0].flux[0] == pytest.approx(2.1685)


def test_cube_dtype_is_float64(inputs_dir: Path) -> None:
    """Guards against silent precision loss in the sweep arrays."""
    doc = read_md2(inputs_dir / "and0a.md2")
    for sweep in doc.sweeps:
        assert sweep.ra.dtype == np.float64
        assert sweep.dec.dtype == np.float64
        assert sweep.flux.dtype == np.float64


def test_metadata_preserved(inputs_dir: Path) -> None:
    doc = read_md2(inputs_dir / "and0a.md2")
    assert any("TELESCOPE" in line for line in doc.trailing_metadata)


def test_b_channel_md2_loads(inputs_dir: Path) -> None:
    """B-channel `.md2` files load through the same path as A-channel ones.

    The earlier `reject_b_channel` gate has been removed — the legacy app
    accepted these files and the `SurveyWorkspace` pipeline is channel-
    agnostic, so blocking them was stricter than the original.
    """
    doc = read_md2(inputs_dir / "morningb.md2")
    assert len(doc.sweeps) >= 1
    for sweep in doc.sweeps:
        assert sweep.ra.shape == sweep.dec.shape == sweep.flux.shape


@pytest.mark.parametrize(
    "name",
    [
        "and0a.md2",
        "cassioa.md2",
        "centera.md2",
        "cygnus1a.md2",
        "cygnus2a.md2",
        "jupiter00a.md2",
    ],
)
def test_md2_roundtrip_bytes_identical(inputs_dir: Path, tmp_path: Path, name: str) -> None:
    src = inputs_dir / name
    doc = read_md2(src)
    out = tmp_path / name
    write_md2(doc, out)
    assert out.read_bytes() == src.read_bytes()
