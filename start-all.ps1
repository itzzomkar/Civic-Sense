# Urban Guardians Full Stack Launcher
$Host.UI.RawUI.WindowTitle = "Urban Guardians - Full Stack Launcher"

Write-Host ""
Write-Host "🚀 Starting Urban Guardians Full Stack Application" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "🔧 Setting up environment..." -ForegroundColor Yellow
Write-Host "📍 Working directory: $ScriptDir" -ForegroundColor Gray

Write-Host ""
Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
$BackendPath = Join-Path $ScriptDir "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location '$BackendPath'; Write-Host '🔗 Backend Server Starting...' -ForegroundColor Green; npm run dev}" -WindowStyle Normal

Write-Host ""
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🌐 Starting Frontend Application..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& {Set-Location '$ScriptDir'; Write-Host '🌐 Frontend Application Starting...' -ForegroundColor Green; npm run dev}" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:8080" -ForegroundColor White
Write-Host "🔗 Backend:  " -NoNewline -ForegroundColor Cyan  
Write-Host "http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Test accounts:" -ForegroundColor Magenta
Write-Host "   Admin: " -NoNewline -ForegroundColor Gray
Write-Host "admin@urbanguardians.com / admin123" -ForegroundColor White
Write-Host "   User:  " -NoNewline -ForegroundColor Gray
Write-Host "john@example.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Your real backend with MongoDB is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Keep this window open to see startup status" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this launcher window..."
$Host.UI.RawUI.ReadKey() | Out-Null