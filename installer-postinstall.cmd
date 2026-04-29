@echo off
setlocal
cd /d "%~dp0"
python -m pip install -q -r requirements.txt 2>nul
if errorlevel 1 py -3 -m pip install -q -r requirements.txt 2>nul
exit /b 0
