# PowerShell deployment script pro Windows
param(
    [switch]$SkipBuild = $false,
    [switch]$Clean = $false
)

Write-Host "🚀 Starting deployment..." -ForegroundColor Green

# Funkce pro logging
function Log-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Log-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Kontrola Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Log-Error "Docker není nainstalován!"
    exit 1
}

if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Log-Error "Docker Compose není nainstalován!"
    exit 1
}

try {
    # Build aplikace (pokud není skip)
    if (-not $SkipBuild) {
        Log-Info "Building production version..."
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "Build failed" }
    }

    # Zastavení starých kontejnerů
    Log-Info "Stopping old containers..."
    docker-compose down 2>$null

    # Clean - smazání všech images
    if ($Clean) {
        Log-Info "Cleaning Docker images..."
        docker-compose down --rmi all --volumes 2>$null
    }

    # Build Docker image
    Log-Info "Building Docker image..."
    docker-compose build --no-cache
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }

    # Spuštění kontejnerů
    Log-Info "Starting containers..."
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) { throw "Container start failed" }

    # Čekání na start
    Log-Info "Waiting for application to start..."
    Start-Sleep -Seconds 10

    # Kontrola health
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Log-Info "✅ Application is healthy!"
            Log-Info "🌐 Application is running at: http://localhost:8080"
        }
    }
    catch {
        Log-Error "❌ Health check failed!"
        docker-compose logs
        exit 1
    }

    # Clean up old images
    Log-Info "Cleaning up old Docker images..."
    docker image prune -f

    Log-Info "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Host "📊 Demo účty:" -ForegroundColor Cyan
    Write-Host "  📦 Dodavatel:    dodavatel@acme.cz / admin" -ForegroundColor White
    Write-Host "  ✅ Schvalovatel: schvalovatel1@company.cz / admin" -ForegroundColor White
    Write-Host "  👤 Uživatel:     uzivatel@email.cz / admin" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 Užitečné příkazy:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs -f          # Zobrazit logy" -ForegroundColor White
    Write-Host "  docker-compose down             # Zastavit aplikaci" -ForegroundColor White
    Write-Host "  docker-compose restart          # Restartovat" -ForegroundColor White
}
catch {
    Log-Error "Deployment failed: $_"
    exit 1
}
