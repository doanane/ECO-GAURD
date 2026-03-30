@echo off
REM EcoGuard Quick Start Script
REM This script starts both backend and frontend in separate windows

echo.
echo ===============================================
echo EcoGuard Pipeline Detection System
echo Starting Backend + Frontend
echo ===============================================
echo.

REM Check if backend folder exists
if not exist "backend" (
    echo ERROR: backend folder not found!
    echo Make sure you run this script from: c:\Users\hp\OneDrive\Desktop\projects\ECOGUARD
    pause
    exit /b 1
)

if not exist "mobile" (
    echo ERROR: mobile folder not found!
    echo Make sure you run this script from: c:\Users\hp\OneDrive\Desktop\projects\ECOGUARD
    pause
    exit /b 1
)

REM Get WiFi IP
echo.
echo ===============================================
echo STEP 1: Detecting WiFi IP Address
echo ===============================================
echo.

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"Wireless LAN adapter WiFi" -A 5 ^| findstr "IPv4"') do (
    set WIFI_IP=%%a
    set WIFI_IP=!WIFI_IP:~1!
    goto found_ip
)

echo WARNING: Could not auto-detect WiFi IP
echo Please check mobile/app.json and set the IP manually
echo Run: ipconfig
echo Look for your WiFi adapter IPv4 address
pause

:found_ip
if defined WIFI_IP (
    echo Found WiFi IP: %WIFI_IP%
) else (
    echo Using localhost (for local testing only)
    set WIFI_IP=localhost
)

echo.
echo ===============================================
echo STEP 2: Starting Backend Server
echo ===============================================
echo.
echo Backend will run at: http://%WIFI_IP%:8000
echo API docs at: http://%WIFI_IP%:8000/docs
echo.

start "EcoGuard Backend (Terminal 1)" cmd /k "cd backend && python main.py"

echo.
echo ===============================================
echo STEP 3: Starting Frontend (Expo)
echo ===============================================
echo.
echo Waiting 5 seconds for backend to start...
timeout /t 5

if "%WIFI_IP%"=="localhost" (
    echo.
    echo WARNING: Using localhost IP!
    echo If running on iPhone, update mobile/app.json with your real WiFi IP:
    echo "apiUrl": "http://YOUR_WIFI_IP:8000"
    echo "wsUrl": "ws://YOUR_WIFI_IP:8000"
    echo.
    pause
)

start "EcoGuard Frontend (Terminal 2)" cmd /k "cd mobile && npx expo start --host lan"

echo.
echo ===============================================
echo STARTED!
echo ===============================================
echo.
echo [Terminal 1] Backend API: http://%WIFI_IP%:8000
echo [Terminal 1] WebSocket: ws://%WIFI_IP%:8000
echo [Terminal 2] Expo QR Code: Scan with Expo Go
echo.
echo NEXT STEPS:
echo 1. Wait for "[Terminal 1] started server process" message
echo 2. Wait for "[Terminal 2] Expo DevTools running at..." message
echo 3. Open Expo Go on iPhone XR
echo 4. Scan the QR code from Terminal 2
echo 5. App will load in ~30-60 seconds
echo.
echo To stop: Close both terminal windows
echo.
pause
