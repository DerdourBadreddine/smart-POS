@echo off
setlocal
cd /d "%~dp0\.."
if not exist backups (
  echo No backups folder found.
  pause
  exit /b 1
)
dir /b backups\db-*.sqlite3
set /p FILE=Enter the backup filename to restore:
if not exist "backups\%FILE%" (
  echo Backup not found.
  pause
  exit /b 1
)
copy /Y backend\db.sqlite3 "backend\db-before-restore.sqlite3" >nul
copy /Y "backups\%FILE%" backend\db.sqlite3 >nul
echo Backup restored. Safety copy: backend\db-before-restore.sqlite3
pause
