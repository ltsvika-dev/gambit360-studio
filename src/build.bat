@echo off
rem Builds "Gambit360 Studio.html" in the folder above from the pieces in this folder, then checks it (check.py).
cd /d "%~dp0"
set PY=
where py >nul 2>nul && set PY=py
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (echo Python was not found. Install it from https://www.python.org/ and run this again. & goto :end)
%PY% build.py %*
if "%~1"=="" %PY% check.py
:end
pause
