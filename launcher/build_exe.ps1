$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Test-Path "frontend_dist\index.html")) {
    throw "frontend_dist\index.html is missing. Build the Angular frontend first."
}

$packageCheck = Start-Process -FilePath python -ArgumentList "-c", "import PyInstaller, PIL" -Wait -PassThru -WindowStyle Hidden
if ($packageCheck.ExitCode -ne 0) {
    python -m pip install pyinstaller pillow
}

if (-not (Test-Path "launcher\icon.ico")) {
    python -c "from PIL import Image, ImageDraw; image=Image.new('RGBA',(256,256),(37,99,235,255)); draw=ImageDraw.Draw(image); draw.rounded_rectangle((24,24,232,232),radius=36,fill=(255,255,255,255)); draw.text((91,60),'S',fill=(37,99,235,255),stroke_width=1); image.save('launcher/icon.ico',format='ICO',sizes=[(256,256),(64,64),(32,32),(16,16)])"
}

python backend\manage.py collectstatic --noinput
if ($LASTEXITCODE -ne 0) {
    throw "collectstatic failed."
}

Remove-Item -Recurse -Force build, dist -ErrorAction SilentlyContinue
pyinstaller `
    --noconfirm `
    --clean `
    --name SmartPOS `
    --windowed `
    --icon launcher\icon.ico `
    --paths backend `
    --add-data "backend;backend" `
    --add-data "frontend_dist;frontend_dist" `
    --add-data "staticfiles;staticfiles" `
    --hidden-import django `
    --hidden-import rest_framework `
    --hidden-import django_filters `
    --hidden-import waitress `
    launcher\launcher.py

if ($LASTEXITCODE -ne 0) {
    throw "PyInstaller build failed."
}

Copy-Item launcher\config.json.example dist\SmartPOS\config.json.example -Force
Write-Host "Created dist\SmartPOS\SmartPOS.exe"
