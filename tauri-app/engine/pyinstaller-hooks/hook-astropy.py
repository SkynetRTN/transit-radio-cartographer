# Local override of _pyinstaller_hooks_contrib's hook-astropy.py.
# The contrib hook does `collect_submodules('astropy')`, which imports every
# astropy submodule to enumerate them — including astropy.visualization.wcsaxes,
# whose __init__ calls `pytest.importorskip("matplotlib")` and raises Skipped
# when matplotlib is absent. The engine only uses astropy.io.fits, so collect
# just that subtree plus the small set of utilities it relies on.

from PyInstaller.utils.hooks import collect_submodules, collect_data_files

hiddenimports = (
    collect_submodules("astropy.io.fits")
    + collect_submodules("astropy.utils")
    + collect_submodules("astropy.units")
    + collect_submodules("astropy.constants")
    + collect_submodules("astropy.io.registry")
)

datas = collect_data_files(
    "astropy",
    includes=[
        "CITATION",
        "**/*.cfg",
        "**/*.json",
        "**/data/**",
    ],
)
