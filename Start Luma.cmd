@echo off
cd /d "%~dp0"
if not exist node_modules\electron\dist\electron.exe (
  echo Installing Luma TV dependencies...
  call npm ci
  if errorlevel 1 (pause & exit /b 1)
  node node_modules\electron\install.js
  if errorlevel 1 (pause & exit /b 1)
)
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
