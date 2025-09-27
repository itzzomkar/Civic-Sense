@echo off
title Urban Guardians - Full Stack Application

echo.
echo 🏙️  Starting Urban Guardians...
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

echo.
echo 🚀 Starting Urban Guardians Full Stack Application...
echo    📡 Server will run on: http://localhost:5000
echo    🌐 Client will run on: http://localhost:8080
echo.
echo Press Ctrl+C to stop both services
echo ===============================================
echo.

REM Start the application
call npm run urban-guardians

pause