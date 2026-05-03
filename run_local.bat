@echo off
echo Starting Sylvex Local Server...
echo Opening browser at http://localhost:8000
start http://localhost:8000
python -m http.server 8000
pause
