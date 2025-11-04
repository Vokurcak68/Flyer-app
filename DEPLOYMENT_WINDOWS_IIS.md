# Deployment Guide - Windows Server + IIS

Kompletní návod pro nasazení aplikace na Windows Server s IIS a existující PostgreSQL databází.

## Požadavky na server

### Software
- **Windows Server** (2016 nebo novější)
- **IIS 10+** s nainstalovanými komponenty:
  - URL Rewrite Module 2.1
  - Application Request Routing (ARR)
- **Node.js 18+** (LTS verze)
- **PostgreSQL 12+** (již nainstalovaný)
- **PM2** nebo **NSSM** (pro běh backendu jako služba)

### Doporučené nástroje
- Git for Windows
- Visual Studio Code nebo jiný editor
- PostgreSQL klient (pgAdmin nebo psql)

---

## Krok 1: Příprava serveru

### 1.1 Instalace Node.js
```powershell
# Stáhnout z https://nodejs.org/
# Instalovat LTS verzi (18.x nebo novější)
# Ověřit instalaci:
node --version
npm --version
```

### 1.2 Instalace PM2 (doporučeno)
```powershell
npm install -g pm2
npm install -g pm2-windows-startup

# Nastavit PM2 pro automatický start
pm2-startup install
```

### 1.3 Instalace IIS modulů
1. **URL Rewrite Module:**
   - Stáhnout z: https://www.iis.net/downloads/microsoft/url-rewrite
   - Nainstalovat pomocí Web Platform Installer nebo MSI

2. **Application Request Routing (ARR):**
   - Stáhnout z: https://www.iis.net/downloads/microsoft/application-request-routing
   - Po instalaci zapnout proxy v IIS:
     - Otevřít IIS Manager
     - Kliknout na server (root level)
     - Otevřít "Application Request Routing Cache"
     - Kliknout "Server Proxy Settings"
     - Zaškrtnout "Enable proxy"

---

## Krok 2: Příprava databáze

### 2.1 Vytvoření nové databáze
```sql
-- Připojit se k PostgreSQL jako admin
psql -U postgres

-- Vytvořit databázi pro aplikaci
CREATE DATABASE flyer_app_production;

-- Vytvořit uživatele (volitelné, nebo použít existujícího)
CREATE USER flyer_app_user WITH PASSWORD 'silne_heslo_123';

-- Přidělit oprávnění
GRANT ALL PRIVILEGES ON DATABASE flyer_app_production TO flyer_app_user;

-- Připojit se k nové databázi
\c flyer_app_production

-- Přidělit schema oprávnění
GRANT ALL ON SCHEMA public TO flyer_app_user;
```

### 2.2 Connection string
```
postgresql://flyer_app_user:silne_heslo_123@localhost:5432/flyer_app_production
```

---

## Krok 3: Nasazení aplikace

### 3.1 Struktura složek na serveru
```
C:\inetpub\
├── flyer-app\
│   ├── frontend\          # Build frontendu
│   ├── backend\           # Backend aplikace
│   └── logs\              # Logy aplikace
```

### 3.2 Příprava složek
```powershell
# Vytvořit strukturu složek
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\frontend"
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\backend"
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\logs"
```

---

## Krok 4: Nasazení backendu

### 4.1 Zkopírování souborů
```powershell
# Zkopírovat celý backend folder na server
# Nebo použít Git:
cd C:\inetpub\flyer-app
git clone <repository-url> temp
Move-Item temp\backend backend
Remove-Item -Recurse temp
```

### 4.2 Konfigurace prostředí
Vytvořit `C:\inetpub\flyer-app\backend\.env`:

```env
# Database
DATABASE_URL=postgresql://flyer_app_user:silne_heslo_123@localhost:5432/flyer_app_production

# Server
NODE_ENV=production
PORT=4000

# JWT
JWT_SECRET=vygeneruj_silny_nahodny_secret_min_32_znaku_12345678901234567890
JWT_EXPIRES_IN=7d

# CORS (URL frontendu)
CORS_ORIGIN=http://vase-domena.cz

# Paths (Windows paths)
FONTS_PATH=C:\\inetpub\\flyer-app\\backend\\fonts
TEMP_PATH=C:\\inetpub\\flyer-app\\backend\\temp

# Logging
LOG_LEVEL=info
```

### 4.3 Instalace závislostí a build
```powershell
cd C:\inetpub\flyer-app\backend

# Instalace produkčních závislostí
npm ci --production=false

# Vygenerování Prisma klienta
npx prisma generate

# Build aplikace
npm run build

# Spuštění migrací
npx prisma migrate deploy

# Volitelně: Seeding databáze
npm run seed

# Instalace pouze produkčních závislostí (cleanup)
npm ci --production
```

### 4.4 Nastavení PM2
```powershell
cd C:\inetpub\flyer-app\backend

# Spustit aplikaci přes PM2
pm2 start dist/main.js --name flyer-backend --time

# Nastavit proměnné prostředí
pm2 set pm2:log-date-format "YYYY-MM-DD HH:mm:ss Z"

# Uložit konfiguraci
pm2 save

# Ověřit, že běží
pm2 status
pm2 logs flyer-backend --lines 50
```

### 4.5 Test backendu
```powershell
# Test API
curl http://localhost:4000/api/health

# Mělo by vrátit: {"status":"ok"}
```

---

## Krok 5: Nasazení frontendu

### 5.1 Build frontendu (lokálně nebo na serveru)
```powershell
cd <cesta-k-projektu>

# Nastavit API URL pro produkci
# Upravit src\services\api.ts - baseURL by měl být:
# baseURL: '/api'  (pro reverse proxy)

# Build
npm ci
npm run build
```

### 5.2 Zkopírování build složky
```powershell
# Zkopírovat obsah build\ složky do:
Copy-Item -Path .\build\* -Destination C:\inetpub\flyer-app\frontend\ -Recurse
```

### 5.3 Konfigurace IIS

#### A) Vytvoření nového Website (doporučeno)
```powershell
# PowerShell příkazy pro vytvoření site
Import-Module WebAdministration

# Vytvořit App Pool
New-WebAppPool -Name "FlyerApp"
Set-ItemProperty IIS:\AppPools\FlyerApp -Name managedRuntimeVersion -Value ""

# Vytvořit Website
New-Website -Name "FlyerApp" `
  -Port 80 `
  -PhysicalPath "C:\inetpub\flyer-app\frontend" `
  -ApplicationPool "FlyerApp" `
  -HostHeader "vase-domena.cz"
```

#### B) Nebo přidat jako aplikaci pod existující site
```powershell
# Přidat aplikaci pod Default Web Site
New-WebApplication -Name "flyer-app" `
  -Site "Default Web Site" `
  -PhysicalPath "C:\inetpub\flyer-app\frontend" `
  -ApplicationPool "FlyerApp"
```

### 5.4 Konfigurace web.config
Vytvořit `C:\inetpub\flyer-app\frontend\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
      <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
    </staticContent>

    <!-- Komprese -->
    <urlCompression doStaticCompression="true" doDynamicCompression="true" />
    <httpCompression>
      <staticTypes>
        <add mimeType="text/*" enabled="true" />
        <add mimeType="message/*" enabled="true" />
        <add mimeType="application/javascript" enabled="true" />
        <add mimeType="application/json" enabled="true" />
        <add mimeType="*/*" enabled="false" />
      </staticTypes>
    </httpCompression>

    <!-- Caching -->
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" />
    </staticContent>

    <rewrite>
      <rules>
        <!-- API Reverse Proxy -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_FOR" value="{REMOTE_ADDR}" />
            <set name="HTTP_X_FORWARDED_PROTO" value="http" />
          </serverVariables>
        </rule>

        <!-- React Router - SPA routing -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/(api)" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>

      <!-- Outbound rules pro CORS (pokud je potřeba) -->
      <outboundRules>
        <rule name="Add CORS headers">
          <match serverVariable="RESPONSE_Access_Control_Allow_Origin" pattern=".*" />
          <action type="Rewrite" value="*" />
        </rule>
      </outboundRules>
    </rewrite>

    <!-- Security headers -->
    <httpProtocol>
      <customHeaders>
        <remove name="X-Powered-By" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-XSS-Protection" value="1; mode=block" />
      </customHeaders>
    </httpProtocol>

    <!-- Error pages -->
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="/" responseMode="ExecuteURL" />
    </httpErrors>
  </system.webServer>
</configuration>
```

---

## Krok 6: Konfigurace fontů

### 6.1 Zkopírování fontů
```powershell
# Vytvořit fonts složku
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\backend\fonts"

# Zkopírovat Vodafone fonty
Copy-Item -Path .\backend\fonts\* -Destination C:\inetpub\flyer-app\backend\fonts\
```

### 6.2 Ověření cest
Ujistit se, že v `.env` je správná cesta:
```env
FONTS_PATH=C:\\inetpub\\flyer-app\\backend\\fonts
```

---

## Krok 7: Konfigurace oprávnění

### 7.1 NTFS oprávnění
```powershell
# App Pool identity potřebuje přístup k aplikaci
$appPoolUser = "IIS APPPOOL\FlyerApp"

# Frontend - Read & Execute
icacls "C:\inetpub\flyer-app\frontend" /grant "${appPoolUser}:(OI)(CI)RX" /T

# Backend logs - Write
icacls "C:\inetpub\flyer-app\logs" /grant "${appPoolUser}:(OI)(CI)M" /T

# Backend temp - Write
icacls "C:\inetpub\flyer-app\backend\temp" /grant "${appPoolUser}:(OI)(CI)M" /T
```

---

## Krok 8: Testování

### 8.1 Test backendu
```powershell
# Test health endpoint
curl http://localhost:4000/api/health

# Test přes proxy
curl http://vase-domena.cz/api/health

# Zkontrolovat logy
pm2 logs flyer-backend
```

### 8.2 Test frontendu
```powershell
# Otevřít v prohlížeči
Start-Process "http://vase-domena.cz"

# Testovat:
# 1. Přihlášení
# 2. Načítání produktů
# 3. Vytvoření letáku
# 4. Generování PDF
```

### 8.3 Zkontrolovat IIS logy
```powershell
# HTTP logy
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 50

# Failed Request Tracing (pokud je zapnutý)
```

---

## Krok 9: SSL/HTTPS (doporučeno)

### 9.1 Získání SSL certifikátu
- **Let's Encrypt** (zdarma) - použít Win-ACME
- **Komerční certifikát** - od poskytovatele

### 9.2 Instalace certifikátu
```powershell
# Import certifikátu do Windows Certificate Store
# Přes IIS Manager > Server Certificates > Import

# Přidat HTTPS binding
New-WebBinding -Name "FlyerApp" `
  -Protocol https `
  -Port 443 `
  -HostHeader "vase-domena.cz" `
  -SslFlags 1
```

### 9.3 Aktualizace web.config
Přidat pravidlo pro HTTPS redirect:
```xml
<rule name="HTTPS Redirect" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
</rule>
```

### 9.4 Aktualizace .env
```env
CORS_ORIGIN=https://vase-domena.cz
```

---

## Krok 10: Monitoring a údržba

### 10.1 PM2 monitoring
```powershell
# Status
pm2 status

# Detailní info
pm2 info flyer-backend

# Real-time monitoring
pm2 monit

# Restart po změnách
pm2 restart flyer-backend

# Zobrazit logy
pm2 logs flyer-backend --lines 100
```

### 10.2 Automatické restarty
PM2 automaticky restartuje aplikaci při pádu. Pro pravidelné restarty:
```powershell
# Restart každý den ve 3:00
# Použít Windows Task Scheduler:
schtasks /create /tn "PM2 Restart Flyer Backend" `
  /tr "pm2 restart flyer-backend" `
  /sc daily /st 03:00 `
  /ru "SYSTEM"
```

### 10.3 Rotace logů
PM2 má vestavěnou rotaci logů:
```powershell
pm2 install pm2-logrotate

# Konfigurace
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 10.4 Backup databáze
```powershell
# Vytvořit Windows Task pro denní backup
$backupScript = @"
`$date = Get-Date -Format "yyyy-MM-dd_HHmmss"
`$backupFile = "C:\backups\flyer-app_`$date.sql"
& "C:\Program Files\PostgreSQL\<verze>\bin\pg_dump.exe" `
  -U flyer_app_user `
  -h localhost `
  -d flyer_app_production `
  -f `$backupFile
"@

$backupScript | Out-File "C:\scripts\backup-flyer-db.ps1"

# Naplánovat task
schtasks /create /tn "Backup Flyer Database" `
  /tr "powershell.exe -File C:\scripts\backup-flyer-db.ps1" `
  /sc daily /st 02:00 `
  /ru "SYSTEM"
```

---

## Krok 11: Update aplikace

### 11.1 Postup pro update
```powershell
# 1. Zazálohovat databázi
pg_dump -U flyer_app_user -d flyer_app_production -f backup_pred_update.sql

# 2. Zastavit backend
pm2 stop flyer-backend

# 3. Stáhnout novou verzi
cd C:\inetpub\flyer-app
git pull origin main

# 4. Update backendu
cd backend
npm ci --production=false
npx prisma generate
npx prisma migrate deploy
npm run build
npm ci --production

# 5. Update frontendu (build lokálně a zkopírovat)
# nebo build na serveru:
cd ..\frontend-source
npm ci
npm run build
Copy-Item -Path .\build\* -Destination C:\inetpub\flyer-app\frontend\ -Recurse -Force

# 6. Restartovat backend
pm2 restart flyer-backend

# 7. Recyklovat IIS App Pool
Restart-WebAppPool -Name "FlyerApp"

# 8. Ověřit funkčnost
pm2 logs flyer-backend --lines 50
```

---

## Troubleshooting

### Backend nefunguje
```powershell
# Zkontrolovat, zda PM2 běží
pm2 status

# Zkontrolovat logy
pm2 logs flyer-backend --err

# Zkontrolovat port
netstat -ano | findstr :4000

# Restart backendu
pm2 restart flyer-backend
```

### Frontend vrací 500 Error
```powershell
# Zkontrolovat IIS logy
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\*.log" -Tail 20

# Zkontrolovat Failed Request Tracing
# IIS Manager > site > Failed Request Tracing

# Recyklovat App Pool
Restart-WebAppPool -Name "FlyerApp"
```

### API calls nefungují (CORS errors)
1. Zkontrolovat `.env` - `CORS_ORIGIN`
2. Zkontrolovat web.config - proxy pravidla
3. Zkontrolovat ARR je zapnutý v IIS
4. Zkontrolovat backend logy pro CORS errors

### PDF generování selhává
```powershell
# Zkontrolovat fonty
Test-Path "C:\inetpub\flyer-app\backend\fonts\Vodafone-Rg.ttf"

# Zkontrolovat FONTS_PATH v .env
# Zkontrolovat oprávnění k temp složce
icacls "C:\inetpub\flyer-app\backend\temp"
```

### Databázové chyby
```powershell
# Test připojení
psql -U flyer_app_user -h localhost -d flyer_app_production -c "SELECT 1"

# Zkontrolovat connection string v .env
# Zkontrolovat, zda PostgreSQL služba běží
Get-Service -Name postgresql*
```

---

## Bezpečnostní doporučení

1. **Firewall:**
   - Povolit pouze porty 80, 443 (HTTP/HTTPS)
   - Port 4000 (backend) by neměl být přístupný z internetu

2. **Databáze:**
   - Použít silná hesla
   - Omezit připojení jen z localhost
   - Pravidelné zálohy

3. **Aplikace:**
   - Pravidelně aktualizovat závislosti
   - Monitorovat bezpečnostní zranitelnosti
   - Používat environment variables pro citlivé údaje

4. **IIS:**
   - Zakázat directory browsing
   - Odstranit X-Powered-By header
   - Nastavit security headers

5. **Windows:**
   - Pravidelné Windows Update
   - Antivirus/antimalware
   - Monitoring logů

---

## Kontakty a podpora

- **Aplikace:** Flyer Management System v3.1.0
- **Vývojář:** NetMate CZ
- **Design:** Oresi

---

## Changelog

### v3.1.0
- Přidáno pole "Poznámka dodavatele" (100 znaků, oranžový badge)
- Funkce kopírování produktů a letáků
- Ochrana produktů v aktivních letácích
- Automatické vyplnění data v patičce
- Klikatelné statistiky na dashboardu s filtrováním
- Udržení fokusu při návratu ze stránky editace
- Parametrická verze v přihlašovací obrazovce
