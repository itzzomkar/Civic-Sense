# PowerShell script to test Users and Analytics APIs

$baseUrl = "http://localhost:5000/api"

Write-Host "Testing Urban Guardians API Endpoints" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# First, let's login to get a token
Write-Host "`n1. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "rahul@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

if ($token) {
    Write-Host "✓ Login successful. Token obtained." -ForegroundColor Green
} else {
    Write-Host "✗ Login failed" -ForegroundColor Red
    exit
}

# Create headers with token
$headers = @{
    "Authorization" = "Bearer $token"
}

# Test Users API
Write-Host "`n2. Testing Users API..." -ForegroundColor Yellow

# Get user profile
Write-Host "`n   a. Get Current User Profile:" -ForegroundColor Cyan
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/users/profile" -Method Get -Headers $headers
    Write-Host "      ✓ Name: $($profile.user.name)" -ForegroundColor Green
    Write-Host "      ✓ Email: $($profile.user.email)" -ForegroundColor Green
    Write-Host "      ✓ Role: $($profile.user.role)" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get user stats
Write-Host "`n   b. Get User Statistics:" -ForegroundColor Cyan
try {
    $stats = Invoke-RestMethod -Uri "$baseUrl/users/stats" -Method Get -Headers $headers
    Write-Host "      ✓ Total Reports: $($stats.stats.totalReports)" -ForegroundColor Green
    Write-Host "      ✓ Pending: $($stats.stats.pendingReports)" -ForegroundColor Green
    Write-Host "      ✓ In Progress: $($stats.stats.inProgressReports)" -ForegroundColor Green
    Write-Host "      ✓ Resolved: $($stats.stats.resolvedReports)" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get top contributors (public route)
Write-Host "`n   c. Get Top Contributors:" -ForegroundColor Cyan
try {
    $contributors = Invoke-RestMethod -Uri "$baseUrl/users/top-contributors?limit=5" -Method Get
    Write-Host "      ✓ Found $($contributors.contributors.Count) top contributors" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Test Analytics API
Write-Host "`n3. Testing Analytics API..." -ForegroundColor Yellow

# Get overall stats
Write-Host "`n   a. Overall Platform Statistics:" -ForegroundColor Cyan
try {
    $overall = Invoke-RestMethod -Uri "$baseUrl/analytics/overall" -Method Get -Headers $headers
    Write-Host "      ✓ Total Users: $($overall.stats.users.total)" -ForegroundColor Green
    Write-Host "      ✓ Total Reports: $($overall.stats.reports.total)" -ForegroundColor Green
    Write-Host "      ✓ Resolution Rate: $($overall.stats.reports.resolutionRate)%" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get category statistics
Write-Host "`n   b. Reports by Category:" -ForegroundColor Cyan
try {
    $categories = Invoke-RestMethod -Uri "$baseUrl/analytics/categories" -Method Get -Headers $headers
    Write-Host "      ✓ Found $($categories.categories.Count) categories" -ForegroundColor Green
    foreach ($cat in $categories.categories) {
        Write-Host "        - $($cat.category): $($cat.total) reports" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get location statistics
Write-Host "`n   c. Reports by Location:" -ForegroundColor Cyan
try {
    $locations = Invoke-RestMethod -Uri "$baseUrl/analytics/locations?groupBy=city" -Method Get -Headers $headers
    Write-Host "      ✓ Found $($locations.locations.Count) locations" -ForegroundColor Green
    foreach ($loc in $locations.locations) {
        Write-Host "        - $($loc.location): $($loc.total) reports" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get priority distribution
Write-Host "`n   d. Priority Distribution:" -ForegroundColor Cyan
try {
    $priorities = Invoke-RestMethod -Uri "$baseUrl/analytics/priorities" -Method Get -Headers $headers
    Write-Host "      ✓ Priority breakdown:" -ForegroundColor Green
    foreach ($pri in $priorities.priorities) {
        Write-Host "        - $($pri.priority): $($pri.total) reports" -ForegroundColor Gray
    }
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get engagement metrics
Write-Host "`n   e. Engagement Metrics:" -ForegroundColor Cyan
try {
    $engagement = Invoke-RestMethod -Uri "$baseUrl/analytics/engagement?days=30" -Method Get -Headers $headers
    Write-Host "      ✓ Active Users: $($engagement.metrics.activeUsers)" -ForegroundColor Green
    Write-Host "      ✓ Engagement Rate: $($engagement.metrics.engagementRate)%" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

# Get time-based analytics
Write-Host "`n   f. Time-based Analytics:" -ForegroundColor Cyan
try {
    $timeSeries = Invoke-RestMethod -Uri "$baseUrl/analytics/time-series?period=day`&days=7" -Method Get -Headers $headers
    Write-Host "      ✓ Found $($timeSeries.reports.Count) days of report data" -ForegroundColor Green
    Write-Host "      ✓ Found $($timeSeries.users.Count) days of user signup data" -ForegroundColor Green
} catch {
    Write-Host "      ✗ Failed: $_" -ForegroundColor Red
}

Write-Host "`n======================================" -ForegroundColor Green
Write-Host "API Testing Complete!" -ForegroundColor Green