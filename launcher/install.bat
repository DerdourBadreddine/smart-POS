@echo off
setlocal
cd /d "%~dp0\.."
where py >nul 2>nul
if errorlevel 1 (
  echo Python 3.12 or newer is required. Please install Python and try again.
  exit /b 1
)
py -3 -c "import sys; raise SystemExit(0 if sys.version_info >= (3,12) else 1)"
if errorlevel 1 (
  echo Python 3.12 or newer is required.
  exit /b 1
)
if not exist .venv py -3 -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install -r backend\requirements.txt
python backend\manage.py migrate
python backend\manage.py collectstatic --noinput
if not exist launcher\config.json copy /Y launcher\config.json.example launcher\config.json >nul
powershell -ExecutionPolicy Bypass -File launcher\create_shortcut.ps1
echo Smart POS installation completed.
pause
