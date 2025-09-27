# Test Urban Guardians Backend
Write-Host "🧪 Testing Urban Guardians Backend" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Test health endpoint
Write-Host "`n1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing
    Write-Host "✅ Health endpoint working!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Cyan
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API base
Write-Host "`n2. Testing API Base..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Message -like "*404*") {
        Write-Host "✅ API base responding (404 is expected for GET /api)" -ForegroundColor Green
    } else {
        Write-Host "❌ API base failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test auth endpoint
Write-Host "`n3. Testing Auth Endpoints..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Auth endpoint working!" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Auth endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Backend Test Complete!" -ForegroundColor Green
Write-Host ""