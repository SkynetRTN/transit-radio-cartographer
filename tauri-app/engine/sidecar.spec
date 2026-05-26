# PyInstaller spec for Radio Cartographer engine sidecar.
# Build example:
#   uv run pyinstaller engine/sidecar.spec --distpath app/src-tauri/binaries/
# Target-specific rename to include <target-triple> may be done by CI packaging.

import os

from PyInstaller.utils.hooks import collect_submodules

SPEC_DIR = os.path.dirname(os.path.abspath(SPEC))
hiddenimports = collect_submodules("radio_cartographer")

block_cipher = None

a = Analysis(
    ["sidecar_entry.py"],
    pathex=[os.path.join(SPEC_DIR, "src")],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[os.path.join(SPEC_DIR, "pyinstaller-hooks")],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "astropy.io.votable",
        "astropy.io.misc",
        "astropy.io.ascii",
        "astropy.cosmology",
        "astropy.visualization",
        "astropy.modeling",
        "astropy.nddata",
        "astropy.timeseries",
        "astropy.uncertainty",
        "astropy.samp",
        "astropy.stats",
        "astropy.coordinates",
        "astropy.table",
        "astropy.wcs",
        "matplotlib",
        "pytest",
        "tkinter",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)
pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="radio-cartographer-engine",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)
