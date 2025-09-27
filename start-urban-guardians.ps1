#!/usr/bin/env pwsh

# Urban Guardians Startup Script
# This script starts both the backend server and frontend client

Write-Host "🏙️  Starting Urban Guardians..." -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🚀 Starting Urban Guardians Full Stack Application..." -ForegroundColor Green
Write-Host "   📡 Server will run on: http://localhost:5000" -ForegroundColor Blue
Write-Host "   🌐 Client will run on: http://localhost:8080" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop both services" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Start the application
try {
    npm run urban-guardians
} catch {
    Write-Host ""
    Write-Host "❌ Failed to start Urban Guardians" -ForegroundColor Red
    Write-Host "Try running: npm run urban-guardians" -ForegroundColor Yellow
    exit 1
}