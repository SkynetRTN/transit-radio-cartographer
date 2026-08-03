import numpy as np
import pytest
from radio_cartographer.image import DEFAULT_PIXEL_DEG, cell_sizes, grid_dims, make_image
from radio_cartographer.io.md2 import read_md2
from radio_cartographer.io.srv import read_srv
from radio_cartographer.models import Survey, Sweep
from tests._tolerances import IMAGE_ATOL


def test_makeimage_uses_fixed_angular_pixel(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey)

    # Grid is sized so each cell spans a fixed on-sky pixel size (1/20 of the
    # 40 ft beam = 0.06°), not the legacy fixed 399x319 canvas. Shape follows
    # `grid_dims` for the survey's own extent.
    exp_w, exp_h = grid_dims(grid.min_ra, grid.max_ra, grid.min_dec, grid.max_dec)
    assert grid.pixels.shape == (exp_h, exp_w)

    # Dec cell (cdelt2) is the pixel size in degrees; RA cell (cdelt1, seconds
    # of time) is that size scaled by 1/cos(dec) — both to ~rounding.
    cell_ra, cell_dec = cell_sizes(grid.min_dec, grid.max_dec)
    assert abs(grid.wcs.cdelt2) == pytest.approx(cell_dec, rel=0.05)
    assert abs(grid.wcs.cdelt1) == pytest.approx(cell_ra, rel=0.05)

    assert np.all(np.isfinite(grid.pixels))
    # Andromeda is a real source — the grid must carry non-trivial flux.
    assert float(np.max(grid.pixels)) > 0.0
    assert int(np.count_nonzero(grid.pixels)) > 100


def test_makeimage_pixel_size_controls_shape(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")

    fine = make_image(survey, pixel_deg=DEFAULT_PIXEL_DEG)
    # A larger pixel_deg is a coarser grid with fewer cells; halving the pixel
    # size roughly quadruples the cell count (2x per axis).
    coarse = make_image(survey, pixel_deg=DEFAULT_PIXEL_DEG * 2)
    assert coarse.pixels.size < fine.pixels.size
    assert fine.pixels.size / coarse.pixels.size == pytest.approx(4.0, rel=0.25)


def test_makeimage_pixel_scale_inverts_correctly(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey)
    w = grid.wcs

    assert w.ctype1 == "RA---TAN"
    assert w.ctype2 == "DEC--TAN"
    # FITS-standard sky-projected image: RA decreases with the sample axis,
    # Dec increases with the line axis. Phase 4's FITS exporter assumes this.
    assert w.cdelt1 < 0.0
    assert w.cdelt2 > 0.0

    # Brightest sample in the survey must land within one pixel of the
    # brightest pixel in the grid when projected through the WCS the grid
    # itself advertises. This is the round-trip the plan's "guards the FITS
    # export" requirement asks for.
    ras = np.concatenate([s.ra for s in survey.sweeps])
    decs = np.concatenate([s.dec for s in survey.sweeps])
    fluxes = np.concatenate([s.flux for s in survey.sweeps])
    peak = int(np.argmax(fluxes))
    px = w.crpix1 + (ras[peak] - w.crval1) / w.cdelt1
    py = w.crpix2 + (decs[peak] - w.crval2) / w.cdelt2

    brow, bcol = np.unravel_index(int(np.argmax(grid.pixels)), grid.pixels.shape)
    distance_px = float(np.hypot(bcol - (px - 1), brow - (py - 1)))
    assert distance_px <= 1.0

    # Reference-pixel sanity: CRPIX is the array centre, CRVAL is the centre
    # of the RA/Dec extent, so the inverse projection at CRPIX returns CRVAL
    # to machine precision regardless of the data.
    ra_at_centre = w.crval1 + (w.crpix1 - w.crpix1) * w.cdelt1
    dec_at_centre = w.crval2 + (w.crpix2 - w.crpix2) * w.cdelt2
    assert abs(ra_at_centre - w.crval1) < IMAGE_ATOL
    assert abs(dec_at_centre - w.crval2) < IMAGE_ATOL


def _make_synthetic_survey(sweep_ras: list, sweep_decs: list) -> Survey:
    """Build a minimal Survey from per-sweep (ra, dec) arrays."""
    sweeps = tuple(
        Sweep(
            ra=np.asarray(ra, dtype=np.float64),
            dec=np.asarray(dec, dtype=np.float64),
            flux=np.ones(len(ra), dtype=np.float64),
        )
        for ra, dec in zip(sweep_ras, sweep_decs)
    )
    return Survey(
        label1="test",
        label2="synthetic",
        sweep_count=len(sweeps),
        swp=len(sweeps),
        sweep0=sweeps[0],
        sweeps=sweeps,
    )


def test_makeimage_unwraps_ra_across_midnight() -> None:
    # FEAT-009: a survey whose samples cluster at the end of one sidereal
    # day (e.g. 23h-24h) and the start of the next (0h-1h) must NOT
    # produce a 24h-wide grid with an empty 22h gap. Detect the wrap and
    # shift early-side samples by +86400 so the grid spans the real
    # ~2-hour arc.
    rng = np.random.default_rng(42)
    sweep_ras: list = []
    sweep_decs: list = []
    for i in range(8):
        dec_center = 45.0 + i * 1.5
        # 30 samples per sweep, split between late-night and early-morning.
        ra_late = rng.uniform(82800.0, 86400.0, 15)
        ra_early = rng.uniform(0.0, 3600.0, 15)
        ras = np.concatenate([ra_late, ra_early])
        decs = np.full(30, dec_center) + rng.uniform(-0.4, 0.4, 30)
        sweep_ras.append(ras)
        sweep_decs.append(decs)
    survey = _make_synthetic_survey(sweep_ras, sweep_decs)
    grid = make_image(survey)

    # Naive min/max would have given ~0 and ~86400 (a 24h span). After
    # unwrap, early-side samples shift into [86400, 90000], so the
    # contiguous bounds span only ~2 hours (~7200s).
    assert grid.min_ra >= 82000.0, f"min_ra={grid.min_ra}, expected >~82800"
    assert grid.max_ra <= 90400.0, f"max_ra={grid.max_ra}, expected <~90000"
    span = grid.max_ra - grid.min_ra
    assert span < 9000.0, f"unwrapped span={span}s, expected <~7200 (2h)"


def test_makeimage_does_not_unwrap_contiguous_survey() -> None:
    # Regression: a normal survey covering a few hours of RA with no wrap
    # must keep naive min/max bounds, NOT trip the unwrap heuristic.
    rng = np.random.default_rng(7)
    sweep_ras: list = []
    sweep_decs: list = []
    for i in range(5):
        dec_center = 30.0 + i * 2.0
        ras = rng.uniform(10000.0, 18000.0, 25)
        decs = np.full(25, dec_center) + rng.uniform(-0.4, 0.4, 25)
        sweep_ras.append(ras)
        sweep_decs.append(decs)
    survey = _make_synthetic_survey(sweep_ras, sweep_decs)
    grid = make_image(survey)

    assert 9000.0 <= grid.min_ra <= 11000.0
    assert 17000.0 <= grid.max_ra <= 19000.0


def test_makeimage_unwraps_real_cassiopeia_survey(inputs_dir) -> None:
    # Smoke test against the real cassioa fixture. Cassiopeia A is at
    # RA ~23h 23m and the survey observations cluster around it, crossing
    # midnight. The saved cassio_a.img on disk has unwrapped bounds
    # (min_ra=79208, max_ra=98166, ~5.27h arc); the new make_image should
    # land in the same neighbourhood — emphatically not the full 24h grid
    # that naive min/max produces.
    survey = read_md2(inputs_dir / "cassioa.md2")
    grid = make_image(survey)
    span = grid.max_ra - grid.min_ra
    assert span < 25000.0, (
        f"cassio make_image span={span}s — wrap not detected; "
        f"expected ~5h arc, got close to 24h"
    )
    assert grid.min_ra > 70000.0, f"unwrapped min_ra={grid.min_ra}, expected ~79000"


def test_makeimage_fills_between_adjacent_sweeps(intermediates_dir) -> None:
    # vb/survform.frm:1651-1799 — the legacy Pre-Image walks the region
    # *between* adjacent sweeps and paints each cell with interpolated flux.
    # A bare-bin grid leaves most cells at 0; the strip-fill must produce a
    # substantially denser coverage, otherwise the pre-image renders as a
    # mostly-black sweep map rather than the filled mosaic in
    # docs/legacy_ui_reference/screenshots/preimagecygnus.png.
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey)
    nonzero = int(np.count_nonzero(grid.pixels))
    total = int(grid.pixels.size)
    # At pix=2 the grid is ~160x200 cells; the swept region should cover at
    # least ~25% after strip-fill, far above what binning alone would yield.
    assert nonzero / total > 0.25, (
        f"strip-fill only covered {nonzero}/{total} cells "
        f"(expected >25% — legacy pre-image fills most of the swept region)"
    )
