@echo off
title Urban Guardians - Full Stack Launcher
echo.
echo 🚀 Starting Urban Guardians Full Stack Application
echo ================================================
echo.

echo 🔧 Setting up environment...
cd /d "%~dp0"

echo.
echo 📦 Starting Backend Server...
start "Urban Guardians Backend" cmd /k "cd backend && npm run dev"

echo.
echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting Frontend Application...
start "Urban Guardians Frontend" cmd /k "npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔗 Backend:  http://localhost:5000
echo.
echo 🧪 Test accounts:
echo    Admin: admin@urbanguardians.com / admin123
echo    User:  john@example.com / password123
echo.
echo ⚡ Your real backend with MongoDB is ready!
echo.
echo Press any key to exit this launcher window...
pause >nul