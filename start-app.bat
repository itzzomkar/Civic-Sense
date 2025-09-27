@echo off
echo 🚀 Starting Urban Guardians Application
echo =====================================

echo.
echo 1. Starting Backend Server...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm run dev"

echo.
echo 2. Waiting 3 seconds for backend to initialize...
timeout /t 3

echo.
echo 3. Starting Frontend Application...
start "Frontend App" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ✅ Both servers are starting!
echo.
echo 🌐 Frontend: http://localhost:8080
echo 🔗 Backend:  http://localhost:5000
echo.
echo Test accounts:
echo - Admin: admin@urbanguardians.com / admin123
echo - User: john@example.com / password123
echo.
echo Press any key to exit this window...
pause >nul