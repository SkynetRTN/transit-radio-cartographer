from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def four1_real(signal: NDArray[np.float64]) -> NDArray[np.complex128]:
    """Test-only faithful oracle wrapper using NumPy complex FFT semantics.

    Kept under `_legacy` per Phase 2 plan; production code should use
    `radio_cartographer.scan.fft_spectrum`.
    """
    return np.fft.fft(signal.astype(np.float64))
