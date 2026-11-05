@echo off
title Clinic Management System Launcher
echo ====================================================
echo Starting Clinic Management System (Backend + Frontend)
echo ====================================================
echo.

REM Start Backend Server
echo [1/2] Starting Node.js Backend API on port 5000...
start "Clinic Backend API (Port 5000)" cmd /k "cd /d %~dp0server && npm start"

REM Wait 2 seconds for backend to initialize
timeout /t 2 /nobreak >nul

REM Start Frontend Vite Server
echo [2/2] Starting React Frontend Client on port 5173...
start "Clinic Frontend (Port 5173)" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo ====================================================
echo All services started!
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:5000
echo Database: %~dp0database\clinic.sqlite
echo ====================================================
echo.
pause
