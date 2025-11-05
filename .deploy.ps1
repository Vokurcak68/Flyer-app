# Flyer App Deployment Script for Windows IIS
# This script deploys the application to production server
#
# Usage:
#   .\deploy.ps1                    # Full deployment (build + deploy)
#   .\deploy.ps1 -SkipBuild         # Skip build, only deploy existing build
#   .\deploy.ps1 -BackendOnly       # Deploy only backend
#   .\deploy.ps1 -FrontendOnly      # Deploy only frontend

param(
    [switch]$SkipBuild,
    [switch]$BackendOnly,
    [switch]$FrontendOnly,
    [string]$ProductionPath = "C:\inetpub\flyer-app"
)

# ============================================
# CONFIGURATION
# ============================================
$ErrorActionPreference = "Stop"
$LocalPath = $PSScriptRoot
$BackupPath = "C:\backups\flyer-app"
$ServiceName = "FlyerBackend"

# Colors for output
function Write-Step { param($Message) Write-Host "`n>>> $Message" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }

# ============================================
# PRE-DEPLOYMENT CHECKS
# ============================================
Write-Step "Pre-deployment checks"

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Check if production path exists
if (-not (Test-Path $ProductionPath)) {
    Write-Error "Production path does not exist: $ProductionPath"
    Write-Host "Please create the directory structure first using DEPLOYMENT_WINDOWS_IIS.md guide"
    exit 1
}

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Warning "Service '$ServiceName' not found. Backend will not be restarted."
}

Write-Success "Pre-deployment checks passed"

# ============================================
# CREATE BACKUP
# ============================================
if (-not $SkipBuild) {
    Write-Step "Creating backup"

    $timestamp = Get-Date -Format "yyyy-MM-dd_HHmmss"
    $backupFolder = Join-Path $BackupPath $timestamp

    if (-not (Test-Path $BackupPath)) {
        New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    }

    New-Item -ItemType Directory -Path $backupFolder -Force | Out-Null

    if (Test-Path "$ProductionPath\frontend") {
        Copy-Item -Path "$ProductionPath\frontend" -Destination "$backupFolder\frontend" -Recurse -Force
        Write-Success "Frontend backup created"
    }

    if (Test-Path "$ProductionPath\backend") {
        Copy-Item -Path "$ProductionPath\backend" -Destination "$backupFolder\backend" -Recurse -Force
        Write-Success "Backend backup created"
    }

    Write-Success "Backup created at: $backupFolder"
}

# ============================================
# BUILD FRONTEND
# ============================================
if (-not $BackendOnly -and -not $SkipBuild) {
    Write-Step "Building frontend for production"

    Push-Location $LocalPath

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..."
        npm ci
    }

    # Build with production environment
    Write-Host "Building React application..."
    $env:NODE_ENV = "production"
    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
        Pop-Location
        exit 1
    }

    Pop-Location
    Write-Success "Frontend build completed"
}

# ============================================
# BUILD BACKEND
# ============================================
if (-not $FrontendOnly -and -not $SkipBuild) {
    Write-Step "Building backend for production"

    Push-Location "$LocalPath\backend"

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing backend dependencies..."
        npm ci --production=false
    }

    # Build TypeScript
    Write-Host "Building NestJS application..."
    npm run build

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend build failed"
        Pop-Location
        exit 1
    }

    Pop-Location
    Write-Success "Backend build completed"
}

# ============================================
# STOP BACKEND SERVICE
# ============================================
if (-not $FrontendOnly -and $service) {
    Write-Step "Stopping backend service"

    try {
        Stop-Service -Name $ServiceName -Force
        Start-Sleep -Seconds 2
        Write-Success "Backend service stopped"
    }
    catch {
        Write-Warning "Failed to stop service: $_"
    }
}

# ============================================
# DEPLOY FRONTEND
# ============================================
if (-not $BackendOnly) {
    Write-Step "Deploying frontend to production"

    $frontendDest = Join-Path $ProductionPath "frontend"

    if (-not (Test-Path $frontendDest)) {
        New-Item -ItemType Directory -Path $frontendDest -Force | Out-Null
    }

    # Copy build files
    if (Test-Path "$LocalPath\build") {
        Write-Host "Copying frontend files..."
        Copy-Item -Path "$LocalPath\build\*" -Destination $frontendDest -Recurse -Force
        Write-Success "Frontend deployed successfully"
    }
    else {
        Write-Error "Frontend build directory not found: $LocalPath\build"
        exit 1
    }
}

# ============================================
# DEPLOY BACKEND
# ============================================
if (-not $FrontendOnly) {
    Write-Step "Deploying backend to production"

    $backendDest = Join-Path $ProductionPath "backend"

    if (-not (Test-Path $backendDest)) {
        New-Item -ItemType Directory -Path $backendDest -Force | Out-Null
    }

    # Copy dist folder
    if (Test-Path "$LocalPath\backend\dist") {
        Write-Host "Copying backend dist files..."
        if (Test-Path "$backendDest\dist") {
            Remove-Item -Path "$backendDest\dist" -Recurse -Force
        }
        Copy-Item -Path "$LocalPath\backend\dist" -Destination "$backendDest\dist" -Recurse -Force
    }
    else {
        Write-Error "Backend dist directory not found: $LocalPath\backend\dist"
        exit 1
    }

    # Copy package.json and package-lock.json
    Copy-Item -Path "$LocalPath\backend\package.json" -Destination "$backendDest\package.json" -Force
    Copy-Item -Path "$LocalPath\backend\package-lock.json" -Destination "$backendDest\package-lock.json" -Force

    # Copy prisma folder
    if (Test-Path "$LocalPath\backend\prisma") {
        if (Test-Path "$backendDest\prisma") {
            Remove-Item -Path "$backendDest\prisma" -Recurse -Force
        }
        Copy-Item -Path "$LocalPath\backend\prisma" -Destination "$backendDest\prisma" -Recurse -Force
    }

    # Install production dependencies
    Write-Host "Installing production dependencies..."
    Push-Location $backendDest
    npm ci --production
    Pop-Location

    # Check if .env exists
    if (-not (Test-Path "$backendDest\.env")) {
        Write-Warning "Production .env file not found at: $backendDest\.env"
        Write-Warning "Please create it based on .env.production.example"
        Write-Host "You can find the example at: $LocalPath\backend\.env.production.example"
    }

    Write-Success "Backend deployed successfully"
}

# ============================================
# START BACKEND SERVICE
# ============================================
if (-not $FrontendOnly -and $service) {
    Write-Step "Starting backend service"

    try {
        Start-Service -Name $ServiceName
        Start-Sleep -Seconds 3

        $serviceStatus = Get-Service -Name $ServiceName
        if ($serviceStatus.Status -eq 'Running') {
            Write-Success "Backend service started successfully"
        }
        else {
            Write-Error "Backend service failed to start. Status: $($serviceStatus.Status)"
            Write-Host "Check logs at: C:\inetpub\flyer-app\logs\backend-stderr.log"
        }
    }
    catch {
        Write-Error "Failed to start service: $_"
        Write-Host "Check logs at: C:\inetpub\flyer-app\logs\backend-stderr.log"
        exit 1
    }
}

# ============================================
# RECYCLE IIS APP POOL
# ============================================
if (-not $BackendOnly) {
    Write-Step "Recycling IIS Application Pool"

    try {
        $appPoolName = "FlyerApp"
        $appPool = Get-IISAppPool -Name $appPoolName -ErrorAction SilentlyContinue

        if ($appPool) {
            Restart-WebAppPool -Name $appPoolName
            Write-Success "IIS App Pool recycled"
        }
        else {
            Write-Warning "App Pool '$appPoolName' not found. Skipping recycle."
        }
    }
    catch {
        Write-Warning "Failed to recycle App Pool: $_"
    }
}

# ============================================
# POST-DEPLOYMENT CHECKS
# ============================================
Write-Step "Post-deployment checks"

# Check backend health
if (-not $FrontendOnly) {
    Write-Host "Checking backend health..."
    Start-Sleep -Seconds 2

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/api/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Backend is responding correctly"
        }
    }
    catch {
        Write-Warning "Backend health check failed: $_"
        Write-Host "Check logs at: C:\inetpub\flyer-app\logs\backend-stderr.log"
    }
}

# ============================================
# DEPLOYMENT SUMMARY
# ============================================
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETED SUCCESSFULLY" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Production URL: https://eflyer.kuchyneoresi.eu"
Write-Host "Backend API: https://eflyer.kuchyneoresi.eu/api"
Write-Host ""
Write-Host "Useful commands:"
Write-Host "  - View backend logs: Get-Content C:\inetpub\flyer-app\logs\backend-stdout.log -Wait -Tail 50"
Write-Host "  - Check service status: Get-Service $ServiceName"
Write-Host "  - Restart service: Restart-Service $ServiceName"
Write-Host ""

if (-not $SkipBuild) {
    Write-Host "Backup location: $backupFolder"
    Write-Host ""
}
