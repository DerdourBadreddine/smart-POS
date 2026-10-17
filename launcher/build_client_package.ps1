$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

powershell -ExecutionPolicy Bypass -File launcher\build_exe.ps1
if ($LASTEXITCODE -ne 0) {
    throw "Executable build failed."
}

$release = Join-Path $root "SmartPOS-Client"
Remove-Item -LiteralPath $release -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $release, (Join-Path $release "backend"), (Join-Path $release "backups"), (Join-Path $release "logs") | Out-Null

Copy-Item dist\SmartPOS\* $release -Recurse -Force
Copy-Item launcher\config.json.example (Join-Path $release "config.json")
Copy-Item OWNER_GUIDE.md (Join-Path $release "OWNER_GUIDE.md")
Copy-Item README.md (Join-Path $release "README.txt")

$env:SMART_POS_DATA_DIR = $release
python backend\manage.py migrate --noinput
if ($LASTEXITCODE -ne 0) {
    throw "Database migration failed."
}

Write-Host ""
Write-Host "Client package created:"
Write-Host $release
Get-ChildItem $release -Recurse -File | Select-Object FullName, Length
