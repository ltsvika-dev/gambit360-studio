@echo off
rem Builds "Gambit360 Studio.html" in the folder above from the pieces in this folder.
cd /d "%~dp0"
where py >nul 2>nul && (py build.py %* & goto :end)
where python >nul 2>nul && (python build.py %* & goto :end)
echo Python was not found. Install it from https://www.python.org/ and run this again.
:end
pause
