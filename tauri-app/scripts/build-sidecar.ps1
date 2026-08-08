# Build the standalone engine sidecar via PyInstaller and rename it to the
# target-triple convention Tauri's externalBin expects, then smoke-test it.
#
# Run from the `tauri-app/` directory (the justfile `sidecar` recipe does this).
# This lives in a real .ps1 file rather than an inline `just` shebang recipe
# because `just` writes shebang recipes to an extensionless temp file, and
# `pwsh -File` refuses any script that does not end in `.ps1`.
$ErrorActionPreference = "Stop"

uv run pyinstaller engine/sidecar.spec --distpath app/src-tauri/binaries/ --noconfirm
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$warn = "build/sidecar/warn-sidecar.txt"
if (Test-Path $warn) {
    $missing = Select-String -Path $warn -Pattern '^missing module named (astropy|numpy) -'
    if ($missing) {
        [Console]::Error.WriteLine("error: sidecar is missing a runtime dependency:")
        $missing | ForEach-Object { [Console]::Error.WriteLine("  " + $_.Line) }
        [Console]::Error.WriteLine("hint: run 'just sync', then rebuild.")
        exit 1
    }
}

$bin = "app/src-tauri/binaries/radio-cartographer-engine-x86_64-pc-windows-msvc.exe"
Move-Item -Force app/src-tauri/binaries/radio-cartographer-engine.exe $bin

$out = '{"jsonrpc":"2.0","id":1,"method":"ping","params":{}}' | & $bin 2>&1 | Out-String
if ($out -notmatch '"pong"') {
    [Console]::Error.WriteLine("error: sidecar built but did not answer ping:")
    [Console]::Error.WriteLine($out)
    exit 1
}
Write-Host "sidecar ok: $bin"
