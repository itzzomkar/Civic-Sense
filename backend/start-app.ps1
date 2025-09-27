# Urban Guardians Startup Script
Write-Host "🚀 Starting Urban Guardians Application" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

Write-Host ""
Write-Host "1. Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Write-Host ""
Write-Host "2. Waiting 5 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "3. Starting Frontend Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:8080" -ForegroundColor Cyan
Write-Host "🔗 Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Test accounts:" -ForegroundColor Magenta
Write-Host "   Admin: admin@urbanguardians.com / admin123" -ForegroundColor Gray
Write-Host "   User:  john@example.com / password123" -ForegroundColor Gray
Write-Host ""
Write-Host "⚡ Your real backend with MongoDB is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to exit this window..."
$Host.UI.RawUI.ReadKey() | Out-Null