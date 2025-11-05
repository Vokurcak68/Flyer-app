# Server Setup Checklist

Checklist pro nastavení produkčního prostředí na serveru před prvním deploymentem.

## ✅ Pre-installation Checklist

### 1. Software Requirements

- [ ] Windows Server 2016+ nainstalován
- [ ] IIS 10+ nainstalován a spuštěn
- [ ] IIS URL Rewrite Module nainstalován
- [ ] IIS Application Request Routing (ARR) nainstalován
- [ ] Node.js 18+ LTS nainstalován
- [ ] PostgreSQL 12+ nainstalován a běží
- [ ] NSSM (Non-Sucking Service Manager) nainstalován
- [ ] Git for Windows nainstalován (volitelné, pro git pull na serveru)

### 2. Directory Structure

Vytvořte adresářovou strukturu:

```powershell
# Vytvořte hlavní složky
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app" -Force
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\frontend" -Force
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\backend" -Force
New-Item -ItemType Directory -Path "C:\inetpub\flyer-app\logs" -Force
New-Item -ItemType Directory -Path "C:\backups\flyer-app" -Force
```

- [ ] Složka `C:\inetpub\flyer-app` vytvořena
- [ ] Složka `C:\inetpub\flyer-app\frontend` vytvořena
- [ ] Složka `C:\inetpub\flyer-app\backend` vytvořena
- [ ] Složka `C:\inetpub\flyer-app\logs` vytvořena
- [ ] Složka `C:\backups\flyer-app` vytvořena

### 3. Database Setup

```powershell
# Připojte se k PostgreSQL
psql -U postgres

# V psql konzoli:
CREATE DATABASE flyer_app_production;
CREATE USER flyer_app_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE flyer_app_production TO flyer_app_user;
\q
```

- [ ] Databáze `flyer_app_production` vytvořena
- [ ] Uživatel `flyer_app_user` vytvořen
- [ ] Oprávnění udělena
- [ ] Heslo zaznamenáno v bezpečném úložišti (např. KeePass)

### 4. Backend Environment File

```powershell
cd C:\inetpub\flyer-app\backend

# Po prvním deploymentu vytvořte .env soubor
notepad .env
```

Vyplňte tyto hodnoty:

```env
DATABASE_URL="postgresql://flyer_app_user:YOUR_PASSWORD@localhost:5432/flyer_app_production?schema=public"
NODE_ENV=production
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
JWT_SECRET=GENERATE_STRONG_SECRET_HERE
JWT_EXPIRATION=7d
ERP_DB_SERVER=192.168.0.131\\sqlexpress
ERP_DB_NAME=Helios002
ERP_DB_USER=vokurka
ERP_DB_PASSWORD=YOUR_ERP_PASSWORD
ENFORCE_UNIQUE_EAN=true
PORT=4000
```

**Vygenerujte JWT_SECRET:**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- [ ] `.env` soubor vytvořen
- [ ] `DATABASE_URL` vyplněno správnými credentials
- [ ] `JWT_SECRET` vygenerován a vyplněn
- [ ] `FRONTEND_URL` nastaveno na produkční doménu
- [ ] `ERP_DB_PASSWORD` vyplněno

### 5. IIS Configuration

**Vytvořte IIS website:**

```powershell
# Vytvořte App Pool
New-WebAppPool -Name "FlyerApp"
Set-ItemProperty "IIS:\AppPools\FlyerApp" -Name "managedRuntimeVersion" -Value ""

# Vytvořte Website
New-Website -Name "FlyerApp" `
  -PhysicalPath "C:\inetpub\flyer-app\frontend" `
  -ApplicationPool "FlyerApp" `
  -Port 80 `
  -HostHeader "eflyer.kuchyneoresi.eu"
```

- [ ] App Pool `FlyerApp` vytvořen
- [ ] Website `FlyerApp` vytvořen a běží
- [ ] Binding na doménu `eflyer.kuchyneoresi.eu` nastaven

**Nakonfigurujte URL Rewrite:**

Vytvořte `web.config` v `C:\inetpub\flyer-app\frontend\web.config`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- API Proxy Rule -->
        <rule name="API Proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
        </rule>

        <!-- React Router Rule -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>

    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

- [ ] `web.config` vytvořen a nakonfigurován

### 6. SSL Certificate

```powershell
# Pokud používáte Let's Encrypt
# 1. Nainstalujte win-acme
# 2. Získejte certifikát:
wacs.exe --target manual --host eflyer.kuchyneoresi.eu
```

- [ ] SSL certifikát získán
- [ ] HTTPS binding přidán do IIS
- [ ] HTTP -> HTTPS redirect nakonfigurován

### 7. Backend Service (NSSM)

```powershell
cd C:\inetpub\flyer-app\backend

# Nainstalujte službu
nssm install FlyerBackend "C:\Program Files\nodejs\node.exe" "C:\inetpub\flyer-app\backend\dist\main.js"

# Nakonfigurujte službu
nssm set FlyerBackend AppDirectory "C:\inetpub\flyer-app\backend"
nssm set FlyerBackend AppStdout "C:\inetpub\flyer-app\logs\backend-stdout.log"
nssm set FlyerBackend AppStderr "C:\inetpub\flyer-app\logs\backend-stderr.log"
nssm set FlyerBackend AppRotateFiles 1
nssm set FlyerBackend AppRotateBytes 10485760
nssm set FlyerBackend AppExit Default Restart
nssm set FlyerBackend AppRestartDelay 5000
nssm set FlyerBackend DependOnService postgresql-x64-14
nssm set FlyerBackend Description "Flyer Management System - Backend API"
nssm set FlyerBackend DisplayName "Flyer Backend"

# Po prvním deploymentu spusťte službu
nssm start FlyerBackend
```

- [ ] NSSM služba `FlyerBackend` vytvořena
- [ ] Služba nakonfigurována pro automatický restart
- [ ] Log rotace nastavena
- [ ] Závislost na PostgreSQL nastavena

### 8. Firewall & Networking

```powershell
# Pokud je potřeba otevřít porty
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
```

- [ ] Port 80 (HTTP) otevřen
- [ ] Port 443 (HTTPS) otevřen
- [ ] DNS záznam pro `eflyer.kuchyneoresi.eu` směřuje na server

### 9. Permissions

```powershell
# Ujistěte se, že IIS má práva ke čtení ve frontend složce
$acl = Get-Acl "C:\inetpub\flyer-app\frontend"
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($rule)
Set-Acl "C:\inetpub\flyer-app\frontend" $acl

# Ujistěte se, že backend service má plná práva
$aclBackend = Get-Acl "C:\inetpub\flyer-app\backend"
$ruleBackend = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM","FullControl","ContainerInherit,ObjectInherit","None","Allow")
$aclBackend.SetAccessRule($ruleBackend)
Set-Acl "C:\inetpub\flyer-app\backend" $aclBackend
```

- [ ] IIS má práva ke čtení frontendu
- [ ] Backend služba má práva k backend složce
- [ ] Backend má práva k logs složce

### 10. Initial Data Import (Optional)

Pokud potřebujete importovat data z developmentu:

```powershell
# Na dev PC exportujte data
pg_dump -U postgres -d flyer_app -f C:\temp\flyer_export.sql

# Zkopírujte na server a importujte
psql -U postgres -d flyer_app_production -f C:\temp\flyer_export.sql
```

- [ ] Data importována (pokud potřeba)
- [ ] Databázové migrace aplikovány

---

## 🚀 Ready for First Deployment

Po dokončení všech kroků výše můžete provést první deployment:

```powershell
# Na lokálním PC jako Administrator
cd C:\Projekty\flyer-app
.\.deploy.ps1
```

---

## 📋 Post-Deployment Verification

Po prvním deploymentu ověřte:

```powershell
# Backend health check
Invoke-WebRequest -Uri "http://localhost:4000/api/health"

# Frontend přes IIS
Start-Process "https://eflyer.kuchyneoresi.eu"

# Služba běží
Get-Service FlyerBackend

# Logy jsou vytvořeny
Get-Content "C:\inetpub\flyer-app\logs\backend-stdout.log" -Tail 20
```

- [ ] Backend API odpovídá na health endpoint
- [ ] Frontend se načítá přes HTTPS
- [ ] Login funguje
- [ ] Služba běží a je ve stavu "Running"
- [ ] Logy se zapisují

---

## 📞 Support

Pokud narazíte na problémy:

1. Zkontrolujte logy: `C:\inetpub\flyer-app\logs\backend-stderr.log`
2. Přečtěte si Troubleshooting v `DEPLOYMENT_GUIDE.md`
3. Zkontrolujte IIS logy: `C:\inetpub\logs\LogFiles\`

---

**Poznámka:** Tento checklist je založen na `DEPLOYMENT_WINDOWS_IIS.md`. Pro detailní pokyny se vraťte k tomuto dokumentu.
