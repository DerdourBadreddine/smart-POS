$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

powershell -ExecutionPolicy Bypass -File launcher\build_exe.ps1
if ($LASTEXITCODE -ne 0) {
    throw "Executable build failed."
}

$release = Join-Path $root "release\SmartPOS-Client"
# Refresh application files without deleting writable client data.
New-Item -ItemType Directory -Force -Path $release, (Join-Path $release "backend"), (Join-Path $release "backups"), (Join-Path $release "logs") | Out-Null

Copy-Item dist\SmartPOS\SmartPOS.exe $release -Force
Copy-Item dist\SmartPOS\_internal $release -Recurse -Force
if (-not (Test-Path (Join-Path $release "config.json"))) {
    Copy-Item launcher\config.json.example (Join-Path $release "config.json")
}
New-Item -ItemType Directory -Force (Join-Path $release "launcher") | Out-Null
Copy-Item launcher\restore_backup.bat (Join-Path $release "launcher\restore_backup.bat")
Copy-Item OWNER_GUIDE.md (Join-Path $release "OWNER_GUIDE.md")
Copy-Item README.md (Join-Path $release "README.txt")

$previousDataDir = $env:SMART_POS_DATA_DIR
$env:SMART_POS_DATA_DIR = $release
python backend\manage.py migrate --noinput
$env:SMART_POS_DATA_DIR = $previousDataDir
if ($LASTEXITCODE -ne 0) {
    throw "Database migration failed."
}

Write-Host ""
Write-Host "Client package created:"
Write-Host $release
Get-Item (Join-Path $release "SmartPOS.exe") | Select-Object FullName, Length

exit 0
