import numpy as np
from radio_cartographer.scan import run_tutorial_scan_pipeline


def test_tutorial_pipeline_scan(inputs_dir):
    got = run_tutorial_scan_pipeline(inputs_dir / "cyg0a.md1")
    assert got.total > 1000
    assert got.ra.shape == got.dec.shape == got.flux.shape
    assert np.isfinite(got.flux).all()
