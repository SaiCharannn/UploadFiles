@echo off
REM ================================================================
REM  IIAP UploadFiles — Load Test Runner
REM  Run from project ROOT: S:\UploadFiles\
REM    S:\UploadFiles> run_loadtest.bat
REM ================================================================

echo.
echo  UploadFiles Load Test Runner
echo  ==============================

REM ── Check we are in the right folder ──────────────────────
if not exist "backend\manage.py" (
    echo ERROR: Run this from the UploadFiles root folder.
    echo        You should see backend\ and locustfile.py here.
    pause & exit /b 1
)

REM ── Install dependencies ───────────────────────────────────
echo  Installing dependencies...
pip install locust python-decouple -q
if errorlevel 1 (
    echo ERROR: pip install failed.
    pause & exit /b 1
)

REM ── Ensure reports folder exists ──────────────────────────
if not exist "backend\loadtest\reports" mkdir "backend\loadtest\reports"

echo.
echo  Select scenario:
echo  ─────────────────────────────────────────────
echo  1. Smoke Test      10 users  · 60 seconds
echo  2. Exam Light      50 users  · 5 minutes
echo  3. Exam Full      350 users  · 10 minutes   ← real exam
echo  4. Stress Test    500 users  · 10 minutes
echo  5. Open UI        Manual control at localhost:8089
echo  ─────────────────────────────────────────────
echo.
set /p choice="Enter 1-5: "

if "%choice%"=="1" goto :smoke
if "%choice%"=="2" goto :light
if "%choice%"=="3" goto :full
if "%choice%"=="4" goto :stress
if "%choice%"=="5" goto :ui
echo Invalid. & pause & exit /b

:smoke
locust -f locustfile.py --host http://localhost:8000 ^
  --headless --users 10 --spawn-rate 2 --run-time 60s ^
  --html backend\loadtest\reports\smoke_test.html ^
  --csv  backend\loadtest\reports\smoke_test
echo.
echo Report: backend\loadtest\reports\smoke_test.html
start backend\loadtest\reports\smoke_test.html
goto :done

:light
locust -f locustfile.py --host http://localhost:8000 ^
  --headless --users 50 --spawn-rate 5 --run-time 5m ^
  --html backend\loadtest\reports\exam_light.html ^
  --csv  backend\loadtest\reports\exam_light
echo.
echo Report: backend\loadtest\reports\exam_light.html
start backend\loadtest\reports\exam_light.html
goto :done

:full
locust -f locustfile.py --host http://localhost:8000 ^
  --headless --users 350 --spawn-rate 20 --run-time 10m ^
  --html backend\loadtest\reports\exam_full.html ^
  --csv  backend\loadtest\reports\exam_full
echo.
echo Report: backend\loadtest\reports\exam_full.html
start backend\loadtest\reports\exam_full.html
goto :done

:stress
locust -f locustfile.py --host http://localhost:8000 ^
  --headless --users 500 --spawn-rate 25 --run-time 10m ^
  --html backend\loadtest\reports\stress_test.html ^
  --csv  backend\loadtest\reports\stress_test
echo.
echo Report: backend\loadtest\reports\stress_test.html
start backend\loadtest\reports\stress_test.html
goto :done

:ui
echo  Opening Locust UI...
echo  Go to http://localhost:8089 in your browser.
locust -f locustfile.py --host http://localhost:8000
goto :done

:done
echo.
pause
