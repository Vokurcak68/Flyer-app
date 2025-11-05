# Deployment Guide - Flyer Management System

Tento průvodce vysvětluje, jak nasadit aplikaci z vývojového prostředí do produkce.

## 📋 Obsah

1. [Přehled](#přehled)
2. [Požadavky](#požadavky)
3. [První nasazení](#první-nasazení)
4. [Běžné aktualizace](#běžné-aktualizace)
5. [Rollback](#rollback)
6. [Troubleshooting](#troubleshooting)

---

## Přehled

### Architektura prostředí

**Vývojové prostředí (Váš lokální PC):**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000/api`
- Databáze: PostgreSQL lokálně

**Produkční prostředí (Windows Server + IIS):**
- URL: `https://eflyer.kuchyneoresi.eu`
- Backend API: `https://eflyer.kuchyneoresi.eu/api` (proxy na localhost:4000)
- Backend služba: Windows Service (NSSM) na portu 4000
- Databáze: PostgreSQL `flyer_app_production`
- Frontend: IIS static files v `C:\inetpub\flyer-app\frontend`
- Backend: Node.js v `C:\inetpub\flyer-app\backend`

### Environment Variables

Aplikace používá environment variables pro konfiguraci:

**Frontend:**
- `.env.development` - Lokální vývoj (používá `http://localhost:4000/api`)
- `.env.production` - Produkce (používá `https://eflyer.kuchyneoresi.eu/api`)

**Backend:**
- `backend/.env` - Lokální vývoj
- `backend/.env.production` - Produkce (musí být vytvořen ručně na serveru)

---

## Požadavky

### Na lokálním PC:
- ✅ Node.js 18+
- ✅ Git
- ✅ PowerShell s právy administrátora
- ✅ Přístup na produkční server (RDP nebo vzdálená správa)

### Na produkčním serveru:
- ✅ Windows Server 2016+ s IIS
- ✅ Node.js 18+
- ✅ PostgreSQL
- ✅ NSSM (Non-Sucking Service Manager)
- ✅ Backend služba `FlyerBackend` nakonfigurovaná

---

## První nasazení

Pokud ještě aplikace na produkčním serveru není, použijte podrobný průvodce v `DEPLOYMENT_WINDOWS_IIS.md`.

Po dokončení první instalace:

### 1. Vytvořte produkční .env soubor na serveru

```powershell
# Na produkčním serveru:
cd C:\inetpub\flyer-app\backend

# Zkopírujte example soubor
Copy-Item .env.production.example .env

# Upravte .env s produkčními hodnotami
notepad .env
```

**Důležité hodnoty v .env:**
```env
DATABASE_URL="postgresql://flyer_app_user:STRONG_PASSWORD@localhost:5432/flyer_app_production?schema=public"
NODE_ENV=production
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
JWT_SECRET=VYGENERUJTE_SILNY_SECRET  # Použijte: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
ERP_DB_SERVER=192.168.0.131\\sqlexpress
ERP_DB_NAME=Helios002
ERP_DB_USER=vokurka
ERP_DB_PASSWORD=YOUR_PASSWORD
```

### 2. Spusťte první deployment

Na **lokálním PC**:

```powershell
# Otevřete PowerShell jako Administrator v projektu
cd C:\Projekty\flyer-app

# Spusťte deployment script
.\.deploy.ps1
```

---

## Běžné aktualizace

### Standardní deployment (Full)

Když jste provedli změny v kódu a chcete je nasadit do produkce:

```powershell
# Na lokálním PC jako Administrator
cd C:\Projekty\flyer-app

# Build a deploy všeho
.\.deploy.ps1
```

**Co script udělá:**
1. ✅ Vytvoří backup současné verze
2. ✅ Zkompiluje frontend (`npm run build`)
3. ✅ Zkompiluje backend (`npm run build`)
4. ✅ Zastaví backend službu
5. ✅ Zkopíruje soubory na server
6. ✅ Nainstaluje produkční závislosti
7. ✅ Spustí backend službu
8. ✅ Recykluje IIS App Pool
9. ✅ Provede health check

### Deployment bez buildu

Pokud už máte build připravený (např. testuv použít):

```powershell
.\.deploy.ps1 -SkipBuild
```

### Deployment pouze frontendu

```powershell
.\.deploy.ps1 -FrontendOnly
```

### Deployment pouze backendu

```powershell
.\.deploy.ps1 -BackendOnly
```

---

## Rollback

V případě problémů můžete rychle vrátit předchozí verzi:

```powershell
# Na produkčním serveru

# 1. Zjistěte datum posledního fungujícího backupu
Get-ChildItem C:\backups\flyer-app

# 2. Zastavte službu
Stop-Service FlyerBackend

# 3. Obnovte backup (nahraďte DATUM skutečným datem)
$backupDate = "2025-11-05_143000"  # Příklad
Copy-Item "C:\backups\flyer-app\$backupDate\frontend\*" "C:\inetpub\flyer-app\frontend\" -Recurse -Force
Copy-Item "C:\backups\flyer-app\$backupDate\backend\*" "C:\inetpub\flyer-app\backend\" -Recurse -Force

# 4. Spusťte službu
Start-Service FlyerBackend

# 5. Recyklujte IIS
Restart-WebAppPool -Name "FlyerApp"
```

---

## Troubleshooting

### Backend se nespustí po deploymentu

```powershell
# Zkontrolujte logy
Get-Content "C:\inetpub\flyer-app\logs\backend-stderr.log" -Tail 50

# Zkuste ruční start pro diagnostiku
cd C:\inetpub\flyer-app\backend
node dist/main.js

# Zkontrolujte .env soubor
notepad C:\inetpub\flyer-app\backend\.env
```

**Časté problémy:**
- ❌ Chybí `.env` soubor → Vytvořte podle `.env.production.example`
- ❌ Špatné DATABASE_URL → Zkontrolujte credentials
- ❌ Špatný JWT_SECRET → Musí být nastaven
- ❌ Chybí node_modules → Spusťte `npm ci --production`

### Frontend vrací 404

```powershell
# Zkontrolujte, zda build existuje
Test-Path "C:\inetpub\flyer-app\frontend\index.html"

# Zkontrolujte IIS konfiguraci
Get-Website | Where-Object {$_.Name -like "*Flyer*"}

# Recyklujte App Pool
Restart-WebAppPool -Name "FlyerApp"
```

### API vrací CORS chyby

```powershell
# Zkontrolujte FRONTEND_URL v .env
cd C:\inetpub\flyer-app\backend
Select-String -Path .env -Pattern "FRONTEND_URL"

# Mělo by být: FRONTEND_URL=https://eflyer.kuchyneoresi.eu

# Po úpravě restartujte službu
Restart-Service FlyerBackend
```

### Deployment script selže

```powershell
# Ujistěte se, že běžíte jako Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
Write-Host "Running as Admin: $isAdmin"

# Zkontrolujte, zda je cesta správná
Test-Path "C:\inetpub\flyer-app"

# Zkontrolujte, zda služba existuje
Get-Service FlyerBackend
```

### Databázové změny (migrace)

Pokud jste změnili Prisma schéma:

```powershell
# Na produkčním serveru

# 1. Backup databáze
cd "C:\Program Files\PostgreSQL\18\bin"
.\pg_dump.exe -U postgres -d flyer_app_production -f C:\backups\db_before_migration.sql

# 2. Zastavte backend
Stop-Service FlyerBackend

# 3. Spusťte migrace
cd C:\inetpub\flyer-app\backend
npx prisma migrate deploy

# 4. Spusťte backend
Start-Service FlyerBackend
```

---

## Best Practices

### Před každým deploymentem:

1. ✅ **Testujte lokálně** - Ujistěte se, že vše funguje
2. ✅ **Commitněte změny** - `git commit && git push`
3. ✅ **Zkontrolujte verzi** - Aktualizujte `package.json` version
4. ✅ **Informujte uživatele** - Pokud půjde o výpadek
5. ✅ **Backup databáze** - Zejména při změnách schématu

### Po deploymentu:

1. ✅ **Ověřte health endpoint** - `https://eflyer.kuchyneoresi.eu/api/health`
2. ✅ **Otestujte přihlášení** - Zkuste se přihlásit
3. ✅ **Zkontrolujte logy** - První minuty po nasazení
4. ✅ **Sledujte chyby** - Dashboard nebo error monitoring

---

## Užitečné příkazy

### Lokální vývoj

```powershell
# Frontend
npm start                 # Spustit dev server (port 3000)
npm run build            # Build pro produkci

# Backend
cd backend
npm run start:dev        # Spustit dev server (port 4000)
npm run build           # Kompilace TypeScript
```

### Produkční server

```powershell
# Služba
Get-Service FlyerBackend              # Status
Restart-Service FlyerBackend          # Restart
nssm status FlyerBackend              # Detaily

# Logy
Get-Content "C:\inetpub\flyer-app\logs\backend-stdout.log" -Wait -Tail 50
Get-Content "C:\inetpub\flyer-app\logs\backend-stderr.log" -Tail 100

# IIS
Restart-WebAppPool -Name "FlyerApp"   # Recyklovat App Pool
iisreset                               # Restart celého IIS (emergency)

# Health check
Invoke-WebRequest -Uri "http://localhost:4000/api/health"
```

---

## Kontakty a podpora

- **Dokumentace projektu**: `README.md`
- **IIS Deployment Guide**: `DEPLOYMENT_WINDOWS_IIS.md`
- **Uživatelský manuál**: `USER_MANUAL.md`

---

**Důležité:** Nikdy necommitujte production `.env` soubory do Gitu! Obsahují citlivé údaje jako hesla a API klíče.
