from __future__ import annotations

import numpy as np
from numpy.typing import NDArray


def four1_real(signal: NDArray[np.float64]) -> NDArray[np.complex128]:
    # Faithful oracle path for tests; delegates to high-precision DFT definition.
    x = np.asarray(signal, dtype=np.float64)
    n = x.size
    k = np.arange(n)
    m = k.reshape((n, 1))
    mat = np.exp(-2j * np.pi * m * k / n)
    return mat @ x
