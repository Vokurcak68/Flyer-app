# Git-Based Deployment Workflow

Doporučený postup pro deployment změn do produkce pomocí Gitu.

## Proč Git workflow?

- Čistý a trackovatelný deployment
- Žádné manuální kopírování souborů
- Verzování všech změn
- Možnost rollbacku na předchozí verzi
- Týmová spolupráce

---

## Rychlý přehled

```
Lokální PC (vývoj)  →  Git Repository  →  Produkční server
     │                       │                    │
   Změny             git push                 git pull
   git commit                              npm run build
```

---

## Deployment workflow - Krok za krokem

### 1. Vývoj na lokálním PC

Pracujete normálně ve složce `C:\Projekty\flyer-app`:

```bash
# Frontend změny
npm start

# Backend změny
cd backend
npm run start:dev
```

### 2. Testování lokálně

Otestujte všechny změny lokálně před commitnutím:

```bash
# Test frontend build
npm run build

# Test backend build
cd backend
npm run build
```

### 3. Commit změn do Gitu

```bash
# Zkontrolujte změny
git status

# Přidejte změny
git add .

# Commit s popisem
git commit -m "feat: Popis vaší změny"

# Push do remote repository
git push origin master
```

**Důležité:** Nikdy necommitujte:
- `build/` (frontend build)
- `backend/dist/` (backend build)
- `backend/.env` (citlivé údaje)
- `node_modules/`

Tyto složky jsou v `.gitignore` a buildy se generují na cílovém serveru.

### 4. Deployment na produkční server

**Na serveru** (přes RDP nebo SSH):

```powershell
# Přejděte do deployment složky (ne do C:\inetpub!)
cd C:\Projekty\flyer-app

# Stáhněte nejnovější změny
git pull origin master

# Zastavte backend službu
Stop-Service FlyerBackend

# Backend - Nainstalujte dependencies (pokud se změnily)
cd backend
npm install

# Backend - Build
npm run build

# Zkopírujte nový build na produkci
$backendDest = "C:\inetpub\flyer-app\backend"

# Zkopírujte dist
if (Test-Path "$backendDest\dist") {
    Remove-Item "$backendDest\dist" -Recurse -Force
}
Copy-Item "dist" "$backendDest\dist" -Recurse -Force

# Zkopírujte package.json (pokud se změnil)
Copy-Item "package.json" "$backendDest\package.json" -Force
Copy-Item "package-lock.json" "$backendDest\package-lock.json" -Force

# Zkopírujte prisma (pokud se změnil schema)
if (Test-Path "prisma") {
    if (Test-Path "$backendDest\prisma") {
        Remove-Item "$backendDest\prisma" -Recurse -Force
    }
    Copy-Item "prisma" "$backendDest\prisma" -Recurse -Force
}

# Pokud se změnil package.json, reinstalujte dependencies v produkci
cd $backendDest
npm install --production

# Spusťte službu
Start-Service FlyerBackend

# Frontend - Build
cd C:\Projekty\flyer-app
npm install  # pokud se změnily dependencies
npm run build

# Zastavte IIS App Pool
Stop-WebAppPool -Name "FlyerApp"

# Zkopírujte frontend build
$frontendDest = "C:\inetpub\flyer-app\frontend"
Remove-Item "$frontendDest\*" -Recurse -Force
Copy-Item "build\*" "$frontendDest\" -Recurse -Force

# Spusťte IIS App Pool
Start-WebAppPool -Name "FlyerApp"

# Ověřte deployment
Invoke-WebRequest -Uri "http://localhost:4000/api/health"
Start-Process "https://eflyer.kuchyneoresi.eu"
```

---

## Automatizovaný deployment script

Pro zjednodušení můžete vytvořit script `deploy-from-git.ps1` na serveru:

```powershell
# deploy-from-git.ps1
param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly
)

$ErrorActionPreference = "Stop"
$DevPath = "C:\Projekty\flyer-app"
$ProdPath = "C:\inetpub\flyer-app"

Write-Host ">>> Git pull latest changes" -ForegroundColor Cyan
cd $DevPath
git pull origin master

if (-not $FrontendOnly) {
    Write-Host ">>> Building backend" -ForegroundColor Cyan
    cd "$DevPath\backend"
    npm run build

    Write-Host ">>> Deploying backend" -ForegroundColor Cyan
    Stop-Service FlyerBackend

    Remove-Item "$ProdPath\backend\dist" -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "dist" "$ProdPath\backend\dist" -Recurse -Force
    Copy-Item "package*.json" "$ProdPath\backend\" -Force

    if (Test-Path "prisma") {
        Remove-Item "$ProdPath\backend\prisma" -Recurse -Force -ErrorAction SilentlyContinue
        Copy-Item "prisma" "$ProdPath\backend\prisma" -Recurse -Force
    }

    cd "$ProdPath\backend"
    npm install --production

    Start-Service FlyerBackend
    Start-Sleep -Seconds 3

    Write-Host "[OK] Backend deployed" -ForegroundColor Green
}

if (-not $BackendOnly) {
    Write-Host ">>> Building frontend" -ForegroundColor Cyan
    cd $DevPath
    npm run build

    Write-Host ">>> Deploying frontend" -ForegroundColor Cyan
    Stop-WebAppPool -Name "FlyerApp"

    Remove-Item "$ProdPath\frontend\*" -Recurse -Force
    Copy-Item "build\*" "$ProdPath\frontend\" -Recurse -Force

    Start-WebAppPool -Name "FlyerApp"

    Write-Host "[OK] Frontend deployed" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETED" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Production URL: https://eflyer.kuchyneoresi.eu"
```

**Použití:**

```powershell
# Na serveru jako Administrator
cd C:\Projekty\flyer-app

# Full deployment
.\deploy-from-git.ps1

# Pouze frontend
.\deploy-from-git.ps1 -FrontendOnly

# Pouze backend
.\deploy-from-git.ps1 -BackendOnly
```

---

## Běžné scénáře

### Změna frontendu (CSS, React komponenty)

```bash
# Lokální PC
git add .
git commit -m "feat: Update product card styling"
git push

# Server
.\deploy-from-git.ps1 -FrontendOnly
```

### Změna backendu (API, services)

```bash
# Lokální PC
git add .
git commit -m "feat: Add new product filtering endpoint"
git push

# Server
.\deploy-from-git.ps1 -BackendOnly
```

### Změna databáze (Prisma schema)

```bash
# Lokální PC
# 1. Upravte backend/prisma/schema.prisma
# 2. Vygenerujte migraci
cd backend
npx prisma migrate dev --name add_new_field

# 3. Commitněte změny
git add .
git commit -m "feat: Add new field to Product model"
git push

# Server
cd C:\Projekty\flyer-app
git pull

# Spusťte migraci na produkci
cd backend
npx prisma migrate deploy

# Pak deploy backend
cd ..
.\deploy-from-git.ps1 -BackendOnly
```

---

## Rollback na předchozí verzi

Pokud deployment selže nebo najdete bug:

```powershell
# Na serveru
cd C:\Projekty\flyer-app

# Zjistěte hash předchozího commitu
git log --oneline

# Rollback na předchozí verzi
git checkout <commit-hash>

# Rebuild a redeploy
.\deploy-from-git.ps1
```

Nebo použijte automatický backup z `C:\backups\flyer-app\`.

---

## Výhody Git workflow

1. **Verzování** - Každá změna je trackovatelná
2. **Rollback** - Snadný návrat k fungující verzi
3. **Týmová práce** - Více vývojářů může spolupracovat
4. **Audit trail** - Historie všech změn
5. **Čistota** - Žádné manuální kopírování souborů
6. **Automatizace** - Možnost CI/CD v budoucnu

---

## Co necommitovat

Nikdy necommitujte do Gitu:

```gitignore
# Build artifacts
/build
/backend/dist
/backend/node_modules

# Environment files s citlivými údaji
backend/.env
backend/.env.production

# User uploads
backend/uploads/
public/assets/

# Logs
*.log
```

Tyto soubory jsou již v `.gitignore`.

---

## Další kroky (volitelné)

### 1. Git hooks pro automatické testování

Vytvořte `.git/hooks/pre-push`:

```bash
#!/bin/bash
npm test
cd backend && npm test
```

### 2. GitHub Actions / GitLab CI

Automatický deployment při push do master branch.

### 3. Staging environment

Vytvořte separátní branch `staging` pro testování před produkcí.

---

## Troubleshooting

### "Git not found"

Nainstalujte Git for Windows na server:
```powershell
winget install Git.Git
```

### "Permission denied"

Spusťte PowerShell jako Administrator.

### "Service won't start after deployment"

Zkontrolujte logy:
```powershell
Get-Content C:\inetpub\flyer-app\logs\backend-stderr.log -Tail 50
```

---

## Souhrn

**Lokální PC:**
1. Vývoj a testování
2. `git commit` + `git push`

**Server:**
1. `git pull`
2. `npm run build` (backend + frontend)
3. Zkopírovat buildy do `C:\inetpub\flyer-app`
4. Restart služeb

**Nebo jednoduše:**
```powershell
.\deploy-from-git.ps1
```

---

**Pro více informací viz:**
- `DEPLOYMENT_QUICK_START.md` - Rychlý průvodce
- `DEPLOYMENT_GUIDE.md` - Kompletní deployment guide
- `README.md` - Obecné info o projektu
