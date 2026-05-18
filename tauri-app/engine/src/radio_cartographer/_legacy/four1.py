"""Test-only oracle: faithful port of the legacy `four1` FFT routine.

Mirrors the Cooley-Tukey radix-2 algorithm from `vb/survform.frm:2981-3031`:
bit-reversal permutation followed by in-place butterflies that advance the
twiddle factor via the Numerical Recipes trigonometric recurrence
(`wpr = -2 sin^2(theta/2)`, `wpi = sin(theta)`).

The VB caller stores complex samples in a 1-indexed real/imag-interleaved
array `dat!(1..2N)` and passes `isign% = 1` for the "forward" transform and
`isign% = -1` for the "inverse". The legacy `isign = +1` convention computes
the *unnormalised inverse* DFT (`sum x[n] exp(+2 pi i k n / N)`), which is
opposite to `numpy.fft.fft` (`sum x[n] exp(-2 pi i k n / N)`). To match
numpy's forward FFT the public `four1_real` helper invokes the algorithm with
`isign = -1`.
"""

from __future__ import annotations

import math

import numpy as np
from numpy.typing import NDArray


def _four1(data: NDArray[np.complex128], isign: int) -> None:
    n = data.size
    if n & (n - 1) != 0 or n == 0:
        raise ValueError(f"four1 requires power-of-two length, got {n}")

    # Bit-reversal permutation. Translated verbatim from
    # `vb/survform.frm:2985-3002`. VB indices are 1-based and step over
    # interleaved (real, imag) pairs; here we work directly on the complex
    # array so the stride is 1 and only the offset arithmetic shifts.
    j = 0
    for i in range(n):
        if j > i:
            data[j], data[i] = data[i], data[j]
        m = n >> 1
        while m >= 1 and j >= m:
            j -= m
            m >>= 1
        j += m

    # Cooley-Tukey butterflies. Translated from `vb/survform.frm:3003-3030`.
    # VB advances the twiddle by `mmax` complex samples each outer step; we
    # advance by `mmax` here as well (the VB `mmax%` counts interleaved slots,
    # so its loop bound `n% > mmax%` divides out exactly).
    mmax = 1
    while mmax < n:
        istep = mmax << 1
        # VB's `theta = 2 pi / (isign * mmax_VB)` where `mmax_VB` counts
        # interleaved real/imag slots, so it equals `2 * mmax` in complex-array
        # terms — hence the divisor `istep`, not `mmax`, here.
        theta = (2.0 * math.pi) / (isign * istep)
        wpr = -2.0 * math.sin(0.5 * theta) ** 2
        wpi = math.sin(theta)
        wr = 1.0
        wi = 0.0
        for m in range(mmax):
            for i in range(m, n, istep):
                k = i + mmax
                tempr = wr * data[k].real - wi * data[k].imag
                tempi = wr * data[k].imag + wi * data[k].real
                data[k] = (data[i].real - tempr) + 1j * (data[i].imag - tempi)
                data[i] = (data[i].real + tempr) + 1j * (data[i].imag + tempi)
            wtemp = wr
            wr = wr * wpr - wi * wpi + wr
            wi = wi * wpr + wtemp * wpi + wi
        mmax = istep


def four1_real(signal: NDArray[np.float64]) -> NDArray[np.complex128]:
    """Forward DFT of a real signal via the legacy `four1` algorithm.

    Returns the same value as `numpy.fft.fft(signal)`. Requires
    `signal.size` to be a power of two; this matches the legacy caller, which
    pads sweeps to `N = 512` before invoking `four1`.
    """
    x = np.asarray(signal, dtype=np.float64)
    data = x.astype(np.complex128, copy=True)
    _four1(data, isign=-1)
    return data
