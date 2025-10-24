# 🚀 Deployment Guide - Flyer Management App

## 📋 Obsah
- [Rychlý Start](#rychlý-start)
- [Deployment Metody](#deployment-metody)
- [Produkční Nasazení](#produkční-nasazení)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Rychlý Start

### Prerekvizity
- Node.js 20+ a npm
- Docker & Docker Compose
- Git

### Lokální vývoj
```bash
# 1. Instalace závislostí
npm install

# 2. Spuštění dev serveru
npm start

# Aplikace běží na http://localhost:3000
```

### Demo účty
```
📦 Dodavatel:    dodavatel@acme.cz / admin
✅ Schvalovatel: schvalovatel1@company.cz / admin
👤 Uživatel:     uzivatel@email.cz / admin
```

---

## 🐳 Deployment Metody

### Metoda 1: Docker (DOPORUČENO)

#### Windows
```powershell
# Spuštění deployment scriptu
.\deploy.ps1

# S parametry
.\deploy.ps1 -SkipBuild      # Přeskočit build
.\deploy.ps1 -Clean          # Vyčistit staré images
```

#### Linux/Mac
```bash
# Nastavit executable
chmod +x deploy.sh

# Spuštění
./deploy.sh
```

#### Manuálně
```bash
# 1. Build aplikace
npm run build

# 2. Build Docker image
docker-compose build

# 3. Spuštění kontejnerů
docker-compose up -d

# 4. Kontrola stavu
docker-compose ps
docker-compose logs -f
```

### Metoda 2: Statický Web Server

```bash
# 1. Build
npm run build

# 2. Instalace serve
npm install -g serve

# 3. Spuštění
serve -s build -l 8080
```

### Metoda 3: Nginx (produkce)

```bash
# 1. Build
npm run build

# 2. Kopírování do nginx
sudo cp -r build/* /var/www/html/

# 3. Konfigurace nginx
sudo cp nginx.conf /etc/nginx/sites-available/flyer-app
sudo ln -s /etc/nginx/sites-available/flyer-app /etc/nginx/sites-enabled/

# 4. Restart nginx
sudo systemctl restart nginx
```

---

## 🌐 Produkční Nasazení

### 1. Cloud Hosting (AWS/Azure/Google Cloud)

#### AWS EC2 + Docker
```bash
# Připojení na EC2
ssh -i your-key.pem ubuntu@your-instance-ip

# Instalace Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone repository
git clone https://github.com/your-repo/flyer-app.git
cd flyer-app

# Deployment
./deploy.sh
```

#### AWS S3 + CloudFront (static hosting)
```bash
# Build
npm run build

# Upload do S3
aws s3 sync build/ s3://your-bucket-name --delete

# Invalidace CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

### 2. Netlify
```bash
# Instalace Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=build
```

### 3. Vercel
```bash
# Instalace Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 4. Kubernetes

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: flyer-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: flyer-app
  template:
    metadata:
      labels:
        app: flyer-app
    spec:
      containers:
      - name: flyer-app
        image: your-registry/flyer-app:latest
        ports:
        - containerPort: 80
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
```

Deploy:
```bash
kubectl apply -f kubernetes/
kubectl rollout status deployment/flyer-app
```

---

## 📊 Monitoring

### Docker Logs
```bash
# Zobrazit logy
docker-compose logs -f

# Logy konkrétního kontejneru
docker-compose logs -f flyer-app

# Poslední 100 řádků
docker-compose logs --tail=100
```

### Health Check
```bash
# HTTP check
curl http://localhost:8080/health

# Docker health
docker inspect --format='{{.State.Health.Status}}' flyer-app-frontend
```

### Metriky
```bash
# Docker stats
docker stats flyer-app-frontend

# Disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Problem: Port 8080 je obsazený
```bash
# Zjistit, co běží na portu
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080

# Změnit port v docker-compose.yml
ports:
  - "8081:80"  # Změnit 8080 na 8081
```

### Problem: Docker build selhává
```bash
# Vyčistit Docker cache
docker system prune -a

# Build bez cache
docker-compose build --no-cache

# Zkontrolovat logy
docker-compose logs
```

### Problem: Aplikace nereaguje
```bash
# Restart kontejnerů
docker-compose restart

# Úplné zastavení a start
docker-compose down
docker-compose up -d

# Zkontrolovat health
curl -v http://localhost:8080/health
```

### Problem: Nedostatek paměti
```bash
# Zvýšit limit v docker-compose.yml
services:
  flyer-app:
    mem_limit: 1g
    mem_reservation: 512m
```

### Problem: CSS se nenačítá
```bash
# Vyčistit cache prohlížeče
# Ctrl+Shift+R (Windows)
# Cmd+Shift+R (Mac)

# Zkontrolovat Tailwind v index.html
# <script src="https://cdn.tailwindcss.com"></script>
```

---

## 🔒 Bezpečnost

### Production checklist
- [ ] Změnit demo hesla
- [ ] Nastavit HTTPS
- [ ] Konfigurovat CORS
- [ ] Nastavit rate limiting
- [ ] Zálohovat data
- [ ] Nastavit monitoring
- [ ] Konfigurovat firewall
- [ ] Pravidelné security updaty

### HTTPS Setup (Nginx + Let's Encrypt)
```bash
# Instalace Certbot
sudo apt install certbot python3-certbot-nginx

# Získání certifikátu
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔄 Update Procedure

### Rolling Update
```bash
# 1. Pull změny
git pull origin main

# 2. Build nové verze
npm run build
docker-compose build

# 3. Zero-downtime update
docker-compose up -d --no-deps --build flyer-app

# 4. Ověření
curl http://localhost:8080/health
```

### Rollback
```bash
# Rollback na předchozí verzi
docker-compose down
git checkout <previous-commit>
./deploy.sh
```

---

## 📈 Performance Optimization

### Build Optimization
```json
// package.json
{
  "scripts": {
    "build": "GENERATE_SOURCEMAP=false react-scripts build"
  }
}
```

### Nginx Cache
```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Compression
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
```

---

## 📞 Support

Pro další pomoc:
- 📧 Email: support@flyer-app.com
- 📚 Dokumentace: https://docs.flyer-app.com
- 🐛 Issues: https://github.com/your-repo/flyer-app/issues

---

## 📝 Changelog

### v1.0.0 (2025-10-20)
- ✨ Inicální release
- 🎨 Kompletní UI pro 3 role
- 🚀 Docker deployment
- 📦 Produktová databáze
- 📄 Editor letáků
- ✅ Workflow schvalování

---

Vytvořeno s ❤️ pro efektivní správu marketingových materiálů
