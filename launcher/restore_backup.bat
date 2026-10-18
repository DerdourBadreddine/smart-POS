@echo off
setlocal
cd /d "%~dp0\.."
if exist SmartPOS.exe (
  start /wait "" SmartPOS.exe --restore-backup
) else (
  python launcher\restore_backup.py
)
pause
