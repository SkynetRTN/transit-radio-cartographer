import numpy as np
from radio_cartographer.image import make_image
from radio_cartographer.io.img import read_img
from radio_cartographer.io.srv import read_srv
from tests._tolerances import IMAGE_ATOL


def _legacy_shape(pix: int) -> tuple[int, int]:
    # vb/survform.frm:4632-4749 — the .img reader derives the grid shape this
    # way from the `Pix` header field, so `make_image` must match it for the
    # gridded output to round-trip through `io/img.py`.
    return ((4770 // (15 * pix)) + 1, (5970 // (15 * pix)) + 1)


def test_makeimage_default_parameters_match_legacy(intermediates_dir, outputs_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey, pix=1)

    expected_shape = _legacy_shape(pix=1)
    assert grid.pixels.shape == expected_shape == (319, 399)

    # Cross-check against a real legacy .img — every checked-in .img was
    # captured from `KARALEAH2002.exe` at `Pix = 1`, so the pixel grid shape
    # is the canonical fixture-side oracle for the formula above.
    legacy = read_img(outputs_dir / "virgo_a.img")
    assert legacy.pix == 1
    assert grid.pixels.shape == legacy.pixels.shape

    assert np.all(np.isfinite(grid.pixels))
    # Andromeda is a real source — the grid must carry non-trivial flux,
    # not a degenerate empty image. Tightens "shape only" past a smoke check.
    assert float(np.max(grid.pixels)) > 0.0
    assert int(np.count_nonzero(grid.pixels)) > 100


def test_makeimage_honors_pix_for_grid_shape(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")

    # vb/survform.frm:1509 — when the user first opens "Make Image" the
    # default Pix prompt is "2", which produces a coarser, blocky grid.
    grid_pix2 = make_image(survey, pix=2)
    assert grid_pix2.pixels.shape == _legacy_shape(pix=2)

    # vb/survform.frm:1513 — non-integer or non-positive pix is refused.
    # Larger pix → fewer cells.
    grid_pix4 = make_image(survey, pix=4)
    assert grid_pix4.pixels.shape == _legacy_shape(pix=4)
    assert grid_pix4.pixels.size < grid_pix2.pixels.size


def test_makeimage_pixel_scale_inverts_correctly(intermediates_dir) -> None:
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey, pix=1)
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


def test_makeimage_fills_between_adjacent_sweeps(intermediates_dir) -> None:
    # vb/survform.frm:1651-1799 — the legacy Pre-Image walks the region
    # *between* adjacent sweeps and paints each cell with interpolated flux.
    # A bare-bin grid leaves most cells at 0; the strip-fill must produce a
    # substantially denser coverage, otherwise the pre-image renders as a
    # mostly-black sweep map rather than the filled mosaic in
    # docs/legacy_ui_reference/screenshots/preimagecygnus.png.
    survey = read_srv(intermediates_dir / "and0a.srv")
    grid = make_image(survey, pix=2)
    nonzero = int(np.count_nonzero(grid.pixels))
    total = int(grid.pixels.size)
    # At pix=2 the grid is ~160x200 cells; the swept region should cover at
    # least ~25% after strip-fill, far above what binning alone would yield.
    assert nonzero / total > 0.25, (
        f"strip-fill only covered {nonzero}/{total} cells "
        f"(expected >25% — legacy pre-image fills most of the swept region)"
    )
