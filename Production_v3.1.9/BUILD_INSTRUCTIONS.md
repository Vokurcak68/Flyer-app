# Production Build Instructions

Univerzální instrukce pro vytvoření production buildu jakékoliv verze Flyer App.

---

## Rychlý přehled

```
1. Spusť build-production.ps1 pro frontend
2. npm run build v backend/
3. Zkopíruj do Production_v[X.X.X]: dist/, frontend/, prisma/, package.json, .env.production
4. DŮLEŽITÉ: backend/.env.production → .env (NE backend/.env!)
5. Ověř: frontend bez localhost, .env s production URLs, správná verze
```

---

## Detailní instrukce pro Clauda

Když potřebuješ vytvořit production build, zadej Claudovi tyto instrukce:

```
Proveď production build verze [X.X.X] do složky Production_v[X.X.X]:

1. Frontend build:
   - Smaž složky build/ a node_modules/.cache/
   - Spusť build-production.ps1 (nastaví REACT_APP_API_URL=/api a REACT_APP_ENV=production)
   - Zkontroluj build/static/js/main.*.js: MUSÍ obsahovat 0x "localhost:4000" a minimálně 13x "/api"
   - Pokud jsou tam localhost odkazy, build je špatně a musíš ho opakovat

2. Backend build:
   - cd backend
   - npm run build (zkompiluje do dist/)
   - Zkontroluj že dist/main.js existuje

3. Vytvoř složku Production_v[X.X.X] a zkopíruj:
   - backend/dist/ → Production_v[X.X.X]/dist/
   - build/ → Production_v[X.X.X]/frontend/
   - backend/prisma/ → Production_v[X.X.X]/prisma/
   - backend/package.json → Production_v[X.X.X]/package.json
   - backend/.env.production → Production_v[X.X.X]/.env (POZOR: .env.production, ne .env!)
   - Pokud existuje MIGRATE.sql → Production_v[X.X.X]/MIGRATE.sql
   - README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md → Production_v[X.X.X]/

4. Ověření:
   - Production_v[X.X.X]/.env MUSÍ obsahovat:
     * DATABASE_URL s flyer_app_production (NE localhost development databázi!)
     * API_URL=https://eflyer.kuchyneoresi.eu
     * FRONTEND_URL=https://eflyer.kuchyneoresi.eu
     * NODE_ENV=production
   - Production_v[X.X.X]/frontend/package.json MUSÍ mít "version": "[X.X.X]"
   - Production_v[X.X.X]/package.json MUSÍ mít "version": "[X.X.X]"
   - Frontend build NESMÍ obsahovat localhost:4000

5. Po dokončení mi vypiš report s potvrzením všech kroků.

KRITICKÁ PRAVIDLA:
- Frontend build POUZE přes build-production.ps1 (NIKDY npm run build přímo!)
- .env POUZE z backend/.env.production (NIKDY backend/.env!)
- Vždy zkontroluj že ve frontendu nejsou localhost odkazy
- Verze musí být konzistentní všude
```

---

## KRITICKÁ PRAVIDLA (MUSÍ být dodržena!)

### ❌ NIKDY:
- **NIKDY** nepoužívej `npm run build` přímo na frontend (vynechá environment variables!)
- **NIKDY** nekopíruj `backend/.env` jako production config (obsahuje development databázi!)
- **NIKDY** nevytvářej build s localhost odkazy ve frontendu
- **NIKDY** nezapomeň zkontrolovat verzi v package.json souborech

### ✅ VŽDY:
- **VŽDY** používej `build-production.ps1` pro frontend build
- **VŽDY** kopíruj `backend/.env.production` jako `.env` do production balíčku
- **VŽDY** zkontroluj že frontend neobsahuje "localhost:4000"
- **VŽDY** ověř že všechny package.json mají správnou verzi
- **VŽDY** ověř že .env obsahuje production database URL a production URLs

---

## Struktura Production balíčku

```
Production_v[X.X.X]/
├── dist/                    # Backend zkompilovaný (z backend/dist/)
├── frontend/                # Frontend zkompilovaný (z build/)
├── prisma/                  # Database schema a migrace (z backend/prisma/)
├── package.json             # Backend package.json s verzí [X.X.X]
├── .env                     # Production config (z backend/.env.production)
├── MIGRATE.sql              # SQL migrace (pokud existuje)
├── README.txt               # Quick start guide
├── DEPLOY_CHECKLIST.txt     # Deployment checklist
└── DEPLOYMENT_NOTES.md      # Detailní technická dokumentace
```

---

## Ověření buildu

### 1. Frontend ověření

```powershell
# Zkontroluj že main.js neobsahuje localhost
$mainJs = Get-ChildItem -Path "build\static\js" -Filter "main.*.js" | Select-Object -First 1
$content = Get-Content $mainJs.FullName -Raw
$localhostCount = ([regex]::Matches($content, "localhost:4000")).Count
$apiCount = ([regex]::Matches($content, '"/api"')).Count

Write-Host "localhost:4000 occurrences: $localhostCount (should be 0)"
Write-Host "/api occurrences: $apiCount (should be 13+)"
```

**Výsledek MUSÍ být:**
- localhost:4000 = **0**
- /api = **13 nebo více**

### 2. Backend ověření

```powershell
# Zkontroluj že dist/main.js existuje
Test-Path "backend\dist\main.js"
```

**Musí vrátit:** `True`

### 3. .env ověření

```powershell
# Zkontroluj .env v production balíčku
Get-Content "Production_v[X.X.X]\.env" | Select-String "DATABASE_URL", "API_URL", "FRONTEND_URL", "NODE_ENV"
```

**Musí obsahovat:**
```
DATABASE_URL="postgresql://flyer_app_user:...@localhost:5432/flyer_app_production"
API_URL=https://eflyer.kuchyneoresi.eu
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
NODE_ENV=production
```

### 4. Verze ověření

```powershell
# Zkontroluj verzi ve frontendu
Get-Content "Production_v[X.X.X]\frontend\package.json" | Select-String "version"

# Zkontroluj verzi v backendu
Get-Content "Production_v[X.X.X]\package.json" | Select-String "version"

# Zkontroluj verzi v AppFooter
Get-Content "src\components\layout\AppFooter.tsx" | Select-String "Verze:"
```

**Všechny MUSÍ mít stejnou verzi [X.X.X]**

---

## Troubleshooting

### Problem: Frontend obsahuje localhost:4000

**Příčina:** Použil jses `npm run build` místo `build-production.ps1`

**Řešení:**
```powershell
# Smaž špatný build
Remove-Item -Recurse -Force build
Remove-Item -Recurse -Force node_modules\.cache

# Spusť správný build
.\build-production.ps1
```

---

### Problem: .env obsahuje development databázi

**Příčina:** Zkopíroval jsi `backend/.env` místo `backend/.env.production`

**Řešení:**
```powershell
# Zkopíruj správný soubor
Copy-Item "backend\.env.production" "Production_v[X.X.X]\.env"
```

---

### Problem: Verze nesedí

**Příčina:** Zapomněl jsi změnit verzi před buildem

**Řešení:**
1. Změň verzi v `package.json` (root)
2. Změň verzi v `backend/package.json`
3. Změň verzi v `src/components/layout/AppFooter.tsx`
4. Opakuj build

---

## Checklist před buildem

Před spuštěním buildu zkontroluj:

- [ ] Verze je změněna v `package.json` (root)
- [ ] Verze je změněna v `backend/package.json`
- [ ] Verze je změněna v `src/components/layout/AppFooter.tsx`
- [ ] Všechny změny jsou commitnuty do git
- [ ] `backend/.env.production` obsahuje správné production URLs
- [ ] Database migrace (pokud existují) jsou připraveny v MIGRATE.sql

---

## Dokumentační soubory

Po buildu MUSÍ být vytvořeny/aktualizovány tyto soubory v Production balíčku:

### README.txt
- Quick start guide
- Stručný popis změn ve verzi
- Instrukce pro nasazení
- Test scénáře

### DEPLOY_CHECKLIST.txt
- Krok-za-krokem checklist pro nasazení
- Pre-deployment úkoly
- Deployment úkoly
- Post-deployment verifikace
- Deployment log template

### DEPLOYMENT_NOTES.md
- Detailní technická dokumentace
- Popis všech změn
- Database migrace
- Seznam změněných souborů
- Troubleshooting guide
- Rollback procedura

### MIGRATE.sql (pokud jsou DB změny)
- Všechny SQL migrace pro tuto verzi
- Komentáře vysvětlující každou migraci
- Seřazeno podle pořadí aplikace

---

## Po dokončení buildu

1. **Ověř strukturu:**
   ```powershell
   Get-ChildItem "Production_v[X.X.X]" -Recurse | Select-Object FullName
   ```

2. **Zkontroluj velikost:**
   ```powershell
   $size = (Get-ChildItem "Production_v[X.X.X]" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
   Write-Host "Total size: $([Math]::Round($size, 2)) MB"
   ```

3. **Vytvoř ZIP archiv (volitelné):**
   ```powershell
   Compress-Archive -Path "Production_v[X.X.X]\*" -DestinationPath "Production_v[X.X.X].zip"
   ```

4. **Vypiš report:**
   - ✅ Frontend build: 0x localhost, 13x /api
   - ✅ Backend build: dist/main.js existuje
   - ✅ .env: production URLs
   - ✅ Verze: [X.X.X] všude konzistentní
   - ✅ Dokumentace: všechny soubory vytvořeny
   - ✅ Celková velikost: XX MB

---

## Příklad použití

**Scénář:** Vytvoření buildu verze 3.1.7

```
Proveď production build verze 3.1.7 do složky Production_v3.1.7:

[... zkopíruj celé instrukce výše s nahrazeným [X.X.X] za 3.1.7 ...]
```

---

## Poznámky

- Tento proces je určen pro Windows prostředí (PowerShell)
- Build se provádí na development stroji, ne na production serveru
- Production balíček se pak zkopíruje na server a nasadí podle DEPLOY_CHECKLIST.txt
- Vždy vytvoř backup před nasazením nové verze na production

---

**Verze těchto instrukcí:** 1.0 (2025-11-10)
