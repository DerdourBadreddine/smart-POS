$root = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'Smart POS.lnk'
$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = Join-Path $root '.venv\Scripts\pythonw.exe'
$shortcut.Arguments = '"' + (Join-Path $root 'launcher\launcher.py') + '"'
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = Join-Path $root 'launcher\icon.ico'
$shortcut.Save()
Write-Host "Shortcut created at $shortcutPath"
