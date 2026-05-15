from __future__ import annotations
import numpy as np

def four1_real(signal: np.ndarray) -> np.ndarray:
    # faithful oracle substitute for legacy NR path for tests
    return np.fft.fft(signal.astype(np.float64, copy=False))
