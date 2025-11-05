# 🚀 Quick Start - Deployment

Rychlý průvodce pro nasazení aplikace do produkce.

## ⚡ Rychlé nasazení (3 kroky)

### 1. Připravte produkční prostředí (První nasazení)

Pokud ještě nemáte nastavený server, postupujte podle `DEPLOYMENT_WINDOWS_IIS.md`.

**Na produkčním serveru vytvořte `.env`:**

```powershell
cd C:\inetpub\flyer-app\backend
Copy-Item .env.production.example .env
notepad .env  # Vyplňte správné hodnoty
```

### 2. Spusťte deployment script (Lokální PC)

```powershell
# Otevřete PowerShell jako Administrator
cd C:\Projekty\flyer-app

# Nasaďte do produkce
.\.deploy.ps1
```

### 3. Ověřte nasazení

Otevřete prohlížeč a jděte na: **https://eflyer.kuchyneoresi.eu**

---

## 📋 Deployment Options

```powershell
# Plné nasazení (build + deploy)
.\.deploy.ps1

# Pouze frontend
.\.deploy.ps1 -FrontendOnly

# Pouze backend
.\.deploy.ps1 -BackendOnly

# Přeskočit build (použít existující)
.\.deploy.ps1 -SkipBuild
```

---

## 🔧 Typické scénáře

### Změnili jste CSS/UI

```powershell
.\.deploy.ps1 -FrontendOnly
```

### Změnili jste API/Backend logiku

```powershell
.\.deploy.ps1 -BackendOnly
```

### Změnili jste oboje

```powershell
.\.deploy.ps1
```

---

## 🆘 Rychlá pomoc

### Backend nefunguje?

```powershell
# Na serveru - zkontrolujte logy
Get-Content "C:\inetpub\flyer-app\logs\backend-stderr.log" -Tail 50

# Restartujte službu
Restart-Service FlyerBackend
```

### Frontend se nenačítá?

```powershell
# Recyklujte IIS App Pool
Restart-WebAppPool -Name "FlyerApp"
```

### Potřebujete rollback?

```powershell
# Obnovte poslední backup
$backup = "2025-11-05_143000"  # Nahraďte skutečným datem
Copy-Item "C:\backups\flyer-app\$backup\*" "C:\inetpub\flyer-app\" -Recurse -Force
Restart-Service FlyerBackend
Restart-WebAppPool -Name "FlyerApp"
```

---

## 📚 Další dokumentace

- **Podrobný průvodce**: `DEPLOYMENT_GUIDE.md`
- **První instalace**: `DEPLOYMENT_WINDOWS_IIS.md`
- **Uživatelský manuál**: `USER_MANUAL.md`

---

## ✅ Checklist před deploymentem

- [ ] Vše funguje lokálně
- [ ] Změny jsou committnuté v Gitu
- [ ] Testovali jste build (`npm run build`)
- [ ] Zkontrolovali jste verzi v `package.json`
- [ ] Informovali jste uživatele (pokud půjde o výpadek)

---

## 🎯 Environment Variables

**Frontend** (automaticky při buildu):
- Development: `.env.development` → `http://localhost:4000/api`
- Production: `.env.production` → `https://eflyer.kuchyneoresi.eu/api`

**Backend** (manuálně na serveru):
- Development: `backend/.env` (lokální)
- Production: `C:\inetpub\flyer-app\backend\.env` (server)

**⚠️ NIKDY necommitujte production .env do Gitu!**
