$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "frontend_dist\index.html")) {
    throw "frontend_dist\index.html is missing. Build the Angular frontend first."
}

python -c "import PyInstaller, PIL"
if ($LASTEXITCODE -ne 0) {
    python -m pip install pyinstaller pillow
}

if (-not (Test-Path "launcher\icon.ico")) {
    python -c "from PIL import Image, ImageDraw; image=Image.new('RGBA',(256,256),(37,99,235,255)); draw=ImageDraw.Draw(image); draw.rounded_rectangle((24,24,232,232),radius=36,fill=(255,255,255,255)); draw.text((91,60),'S',fill=(37,99,235,255),stroke_width=1); image.save('launcher/icon.ico',format='ICO',sizes=[(256,256),(64,64),(32,32),(16,16)])"
}

python backend\manage.py collectstatic --noinput
if ($LASTEXITCODE -ne 0) {
    throw "collectstatic failed."
}

$buildId = Get-Date -Format "yyyyMMdd-HHmmss-ffff"
$buildRoot = Join-Path $root ".release-build\$buildId"
New-Item -ItemType Directory -Force $buildRoot | Out-Null
python launcher\prepare_bundle.py $buildRoot
if ($LASTEXITCODE -ne 0) { throw "Source staging failed." }
pyinstaller `
    --distpath "$buildRoot\dist" `
    --workpath "$buildRoot\work" `
    --specpath "$buildRoot" `
    --noconfirm `
    --clean `
    --name SmartPOS `
    --windowed `
    --icon "$root\launcher\icon.ico" `
    --paths "$root\backend" `
    --add-data "$buildRoot\backend;backend" `
    --add-data "$root\frontend_dist;frontend_dist" `
    --add-data "$root\staticfiles;staticfiles" `
    --add-data "$root\locale;locale" `
    --hidden-import django `
    --hidden-import corsheaders `
    --collect-submodules corsheaders `
    --collect-submodules whitenoise `
    --collect-submodules rest_framework `
    --collect-submodules django_filters `
    --hidden-import config `
    --hidden-import common `
    --hidden-import catalog `
    --hidden-import inventory `
    --hidden-import customers `
    --hidden-import sales `
    --hidden-import repairs `
    --hidden-import shop `
    --hidden-import dashboard `
    --hidden-import devices `
    --hidden-import rest_framework `
    --hidden-import django_filters `
    --hidden-import waitress `
    --hidden-import restore_backup `
    launcher\launcher.py

if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller build failed."
}

New-Item -ItemType Directory -Force dist\SmartPOS | Out-Null
Copy-Item "$buildRoot\dist\SmartPOS\SmartPOS.exe" dist\SmartPOS\SmartPOS.exe -Force
Copy-Item "$buildRoot\dist\SmartPOS\_internal" dist\SmartPOS -Recurse -Force
Copy-Item launcher\config.json.example dist\SmartPOS\config.json.example -Force
Write-Host "Created dist\SmartPOS\SmartPOS.exe"

exit 0
