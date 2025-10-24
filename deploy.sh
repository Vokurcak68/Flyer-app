#!/bin/bash

# Deployment script pro Flyer App
set -e

echo "🚀 Starting deployment..."

# Barvy pro output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funkce pro logging
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrola Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker není nainstalován!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose není nainstalován!"
    exit 1
fi

# Build aplikace
log_info "Building production version..."
npm run build

# Zastavení starých kontejnerů
log_info "Stopping old containers..."
docker-compose down || true

# Build Docker image
log_info "Building Docker image..."
docker-compose build --no-cache

# Spuštění kontejnerů
log_info "Starting containers..."
docker-compose up -d

# Čekání na health check
log_info "Waiting for application to be healthy..."
sleep 10

# Kontrola health
if curl -f http://localhost:8080/health &> /dev/null; then
    log_info "✅ Application is healthy!"
    log_info "🌐 Application is running at: http://localhost:8080"
else
    log_error "❌ Health check failed!"
    docker-compose logs
    exit 1
fi

# Clean up old images
log_info "Cleaning up old Docker images..."
docker image prune -f

log_info "🎉 Deployment completed successfully!"
echo ""
echo "📊 Demo účty:"
echo "  📦 Dodavatel:    dodavatel@acme.cz / admin"
echo "  ✅ Schvalovatel: schvalovatel1@company.cz / admin"
echo "  👤 Uživatel:     uzivatel@email.cz / admin"
