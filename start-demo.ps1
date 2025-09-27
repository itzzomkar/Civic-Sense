Write-Host "🚀 =========================================" -ForegroundColor Cyan
Write-Host "🏆 SMART INDIA HACKATHON 2025" -ForegroundColor Yellow
Write-Host "🏛️ Urban Guardians - Full Stack Demo" -ForegroundColor Green
Write-Host "🚀 =========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting backend server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\Omkar\urban-guardians-main'; node backend/demo-server.cjs" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-Command", "cd 'C:\Users\Omkar\urban-guardians-main'; npm run dev:demo" -WindowStyle Normal

Write-Host ""
Write-Host "🌐 Frontend: http://localhost:8080" -ForegroundColor Blue
Write-Host "📡 Backend API: http://localhost:5001/api" -ForegroundColor Blue
Write-Host ""
Write-Host "✨ Demo Features Available:" -ForegroundColor Magenta
Write-Host "  - AI-powered issue categorization (92.5`% accuracy)" -ForegroundColor White
Write-Host "  - Real-time weather integration `& alerts" -ForegroundColor White
Write-Host "  - QR code network for physical locations" -ForegroundColor White
Write-Host "  - IoT environmental sensors dashboard" -ForegroundColor White
Write-Host "  - Gamification with points `& badges" -ForegroundColor White
Write-Host "  - Real-time Socket.IO communications" -ForegroundColor White
Write-Host ""
Write-Host "🏆 Ready for Smart India Hackathon 2025 presentation!" -ForegroundColor Yellow
Write-Host "📱 Test the API endpoints and admin dashboard now." -ForegroundColor Green