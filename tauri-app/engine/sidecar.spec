# PyInstaller spec for Radio Cartographer engine sidecar.
# Build example:
#   uv run pyinstaller engine/sidecar.spec --distpath app/src-tauri/binaries/
# Target-specific rename to include <target-triple> may be done by CI packaging.

from PyInstaller.utils.hooks import collect_submodules

hiddenimports = collect_submodules("radio_cartographer")

block_cipher = None

a = Analysis(
    ["engine/src/radio_cartographer/rpc.py"],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["astropy.io.votable", "astropy.cosmology"],
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
