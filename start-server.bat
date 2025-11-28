@echo off
echo Starting Music Player Server...
echo.
echo Server will run on: http://localhost:5500
echo.
echo Press Ctrl+C to stop the server
echo.
python -m http.server 5500
