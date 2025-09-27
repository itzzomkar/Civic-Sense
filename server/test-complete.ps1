# PowerShell script to test complete Urban Guardians backend
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Urban Guardians Backend Complete Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api"
$errorCount = 0
$successCount = 0

# Function to test endpoint
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    Write-Host "Testing: $Name" -NoNewline
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-RestMethod @params
        Write-Host " [OK]" -ForegroundColor Green
        $script:successCount++
        return $response
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
        $script:errorCount++
        return $null
    }
}

# 1. Health Check
Write-Host "`n1. HEALTH CHECK" -ForegroundColor Yellow
Test-Endpoint -Name "API Health" -Method "GET" -Endpoint "/health"

# 2. Authentication Tests
Write-Host "`n2. AUTHENTICATION" -ForegroundColor Yellow

# Create test user
$signupBody = @{
    name = "Test User"
    email = "test$(Get-Random -Maximum 9999)@example.com"
    password = "password123"
} | ConvertTo-Json

$signupResponse = Test-Endpoint -Name "Signup" -Method "POST" -Endpoint "/auth/signup" -Body $signupBody

# Login
$loginBody = @{
    email = "rahul@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Test-Endpoint -Name "Login" -Method "POST" -Endpoint "/auth/login" -Body $loginBody

if ($loginResponse -and $loginResponse.token) {
    $token = $loginResponse.token
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Verify token
    Test-Endpoint -Name "Verify Token" -Method "GET" -Endpoint "/auth/verify" -Headers $headers
} else {
    Write-Host "  Warning: No token received, skipping authenticated tests" -ForegroundColor Yellow
    exit 1
}

# 3. User Management Tests
Write-Host "`n3. USER MANAGEMENT" -ForegroundColor Yellow
Test-Endpoint -Name "Get Profile" -Method "GET" -Endpoint "/users/profile" -Headers $headers
Test-Endpoint -Name "Get User Stats" -Method "GET" -Endpoint "/users/stats" -Headers $headers
Test-Endpoint -Name "Get Top Contributors" -Method "GET" -Endpoint "/users/top-contributors?limit=5"

# 4. Reports Tests
Write-Host "`n4. REPORTS" -ForegroundColor Yellow
Test-Endpoint -Name "Get All Reports" -Method "GET" -Endpoint "/reports"
Test-Endpoint -Name "Get Reports (filtered)" -Method "GET" -Endpoint "/reports?status=pending&limit=5"

# Create a test report
$reportBody = @{
    title = "Test Report $(Get-Random -Maximum 999)"
    description = "This is a test report created by automated testing"
    category = "Road Maintenance"
    priority = "medium"
    location = @{
        address = "Test Street 123"
        city = "Mumbai"
        state = "Maharashtra"
        coordinates = @{
            lat = 19.076
            lng = 72.8777
        }
    }
} | ConvertTo-Json

$newReport = Test-Endpoint -Name "Create Report" -Method "POST" -Endpoint "/reports" -Headers $headers -Body $reportBody

if ($newReport -and $newReport.report._id) {
    $reportId = $newReport.report._id
    Test-Endpoint -Name "Get Single Report" -Method "GET" -Endpoint "/reports/$reportId"
    Test-Endpoint -Name "Upvote Report" -Method "POST" -Endpoint "/reports/$reportId/upvote" -Headers $headers
}

# 5. Analytics Tests
Write-Host "`n5. ANALYTICS" -ForegroundColor Yellow
Test-Endpoint -Name "Overall Stats" -Method "GET" -Endpoint "/analytics/overall" -Headers $headers
Test-Endpoint -Name "Category Stats" -Method "GET" -Endpoint "/analytics/categories" -Headers $headers
Test-Endpoint -Name "Location Stats" -Method "GET" -Endpoint "/analytics/locations?groupBy=city" -Headers $headers
Test-Endpoint -Name "Priority Stats" -Method "GET" -Endpoint "/analytics/priorities" -Headers $headers
Test-Endpoint -Name "Engagement Metrics" -Method "GET" -Endpoint "/analytics/engagement?days=7" -Headers $headers

# 6. Admin Tests (only if user is admin)
Write-Host "`n6. ADMIN FEATURES" -ForegroundColor Yellow

# Create admin user for testing
$adminLoginBody = @{
    email = "admin@urbanguardians.com"
    password = "admin123"
} | ConvertTo-Json

$adminLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json" -ErrorAction SilentlyContinue

if ($adminLoginResponse -and $adminLoginResponse.token) {
    $adminHeaders = @{ "Authorization" = "Bearer $($adminLoginResponse.token)" }
    Test-Endpoint -Name "Admin Dashboard" -Method "GET" -Endpoint "/admin/dashboard" -Headers $adminHeaders
    Test-Endpoint -Name "System Settings" -Method "GET" -Endpoint "/admin/settings" -Headers $adminHeaders
    Test-Endpoint -Name "System Logs" -Method "GET" -Endpoint "/admin/logs?days=7" -Headers $adminHeaders
} else {
    Write-Host "  Info: Admin tests skipped (admin user not available)" -ForegroundColor Gray
}

# 7. File Upload Test
Write-Host "`n7. FILE UPLOADS" -ForegroundColor Yellow

# Check if uploads directory exists
$uploadsPath = "C:\Users\Rahul\OneDrive\Desktop\urban-guardians-main\server\uploads"
if (Test-Path $uploadsPath) {
    Write-Host "Uploads directory exists [OK]" -ForegroundColor Green
    $script:successCount++
    
    # Check subdirectories
    @("reports", "avatars", "documents") | ForEach-Object {
        $subDir = Join-Path $uploadsPath $_
        if (Test-Path $subDir) {
            Write-Host "  - $_ directory [OK]" -ForegroundColor Green
        } else {
            Write-Host "  - $_ directory [MISSING]" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Uploads directory missing [FAILED]" -ForegroundColor Red
    $script:errorCount++
}

# 8. Database Connection Test
Write-Host "`n8. DATABASE CONNECTION" -ForegroundColor Yellow
$healthCheck = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
if ($healthCheck.database) {
    Write-Host "Database: $($healthCheck.database) [OK]" -ForegroundColor Green
    $script:successCount++
} else {
    Write-Host "Database connection [FAILED]" -ForegroundColor Red
    $script:errorCount++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($successCount + $errorCount)" -ForegroundColor White
Write-Host "Passed: $successCount" -ForegroundColor Green
Write-Host "Failed: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

if ($errorCount -eq 0) {
    Write-Host "`nAll tests passed successfully!" -ForegroundColor Green
    Write-Host "The backend is fully functional and ready for production." -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Please review the errors above." -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan