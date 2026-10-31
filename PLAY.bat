@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Python 3 is required to serve this page.
  exit /b 1
)
start "Afterimage server" /min python -m http.server 8139 --bind 127.0.0.1
timeout /t 1 >nul
start "" "http://127.0.0.1:8139/"
