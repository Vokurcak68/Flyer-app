# Deployment Guide - Flyer Management System v3.1.2

## PYehled zmn od poslední verze

### Zmny v databázi (Prisma Schema)
Od poslední verze doalo k následujícím zmnám v databázovém schématu:

1. **Brand Model** - PYidán nový model pro správu znaek/brando
   - `id` (String, UUID)
   - `name` (String)
   - `color` (String, optional) - Hex kód barvy brandu
   - Vztah 1:N s produkty

2. **Product Model** - RozaíYení
   - `brandId` (String, optional) - Vazba na brand
   - `brand` (Brand, optional) - Vztah na brand

3. **Approval Model** - PYidány nové stavy pro pre-approval workflow
   - `preApprovalStatus` (PreApprovalStatus, optional)
   - `preApprovedAt` (DateTime, optional)

4. **ApprovalWorkflow Model** - RozaíYení pro pre-approval
   - `requiredPreApprovers` (Int, default: 1)
   - `currentPreApprovals` (Int, default: 0)
   - `isPreApprovalComplete` (Boolean, default: false)

5. **PromoImage Model** - Nové pole
   - `fillDate` (Boolean, default: false) - Uruje, zda se má do patiky vyplHovat datum

### Nové funkce

#### 1. Správa brando a barev
- Mo~nost vytváYet a spravovat brandy s vlastními barvami
- Produkty mohou být pYiYazeny k brandom
- Barevné zvýraznní produkto podle brandu v letácích
- erné hlaviky pro end usery (bez barevného zvýraznní)

#### 2. Pre-approval workflow
- Nová role `pre_approver` pro pYedschválení letáko
- DvoustupHový schvalovací proces:
  1. Pre-approver provede první kontrolu
  2. Approver provede finální schválení
- Tracking stavu pre-approval v approval workflow

#### 3. Zlepaení PDF generování
- 100% shodné rozlo~ení s frontendem
- Pou~ití Vodafone Rg fontu
- Správné zobrazení brando (tun) a názvo produkto
- Lepaí Yádkování a spacing
- Podpora a~ 16 vizuálních Yádko v popisech produkto
- erné hlaviky pro end usery v PDF

#### 4. Footer promo s automatickým datem
- Mo~nost nastavit `fillDate` flag u footer promo obrázko
- Automatické vyplnní data platnosti do pravého horního rohu footeru
- Zobrazení v eském formátu (DD.MM.YYYY)

#### 5. Koncový u~ivatel - Zjednoduaené vytváYení letáko
- Skrytý výbr akce z MSSQL pro end usery
- Automatické nastavení "datum od" na datum vytvoYení
- Automatický výpoet "datum do" podle nejni~aího data z aktivních letáko obsahujících stejné produkty
- Posuvník pro filtrování produkto podle cenového rozptí
- Dual-handle slider pro min/max cenu

### Backend zmny

#### Nové endpointy a úpravy:
1. **Brands Management** (`/api/brands`)
   - `GET /api/brands` - Seznam vaech brando
   - `POST /api/brands` - VytvoYení nového brandu
   - `PATCH /api/brands/:id` - Aktualizace brandu
   - `DELETE /api/brands/:id` - Smazání brandu

2. **Products** - RozaíYení odpovdí
   - PYidáno pole `brandName` a `brandColor` do odpovdí

3. **Flyers** - Auto-kalkulace validTo
   - Pro end usery se automaticky vypoítá `validTo` z aktivních source letáko

4. **Approvals** - Pre-approval workflow
   - `POST /api/approvals/:id/pre-approve` - PYedschválení
   - `POST /api/approvals/:id/pre-reject` - Zamítnutí pYedschválení
   - RozaíYené query pro zobrazení pre-approval informací

5. **PDF Generation** - Vylepaení
   - Nový endpoint `GET /api/flyers/:id/pdf` s query parametrem `?blackHeaders=true`
   - 1:1 layout s frontendem
   - Podpora brand barev vs erných hlaviek

### Frontend zmny

#### Nové komponenty a stránky:
1. **BrandsManagementPage** - Správa brando
2. **ProductFlyerLayout** - Vylepaené zobrazení produkto s brand barvami
3. Vylepaený **FlyerEditorPage** pro end usery:
   - Cenový filtr s dual-handle sliderem
   - Skrytý výbr akce
   - Auto-nastavení dat

#### Stylingové zmny:
- Konzistentní pou~ití Vodafone Rg fontu
- Lepaí line-height a spacing v popisech produkto
- Podpora brand barev vs erných hlaviek

---

## Deployment instrukce pro IIS

### PYedpoklady
- Windows Server s IIS
- Node.js nainstalován na serveru
- PostgreSQL databáze
- PM2 nebo jiný process manager pro Node.js

### Krok 1: PYíprava souboro

1. **Frontend (build slo~ka)**
   - Zkopírovat celou slo~ku `build` do `C:\inetpub\wwwroot\flyer-app` (nebo jiné cesty podle vaaeho nastavení)

2. **Backend (celá backend slo~ka)**
   - Zkopírovat celou slo~ku `backend` do `C:\Apps\flyer-app-backend` (nebo jiné cesty)
   - Slo~ka musí obsahovat:
     - `dist` (zkompilovaný kód)
     - `node_modules` (pokud nejsou na serveru, spustit `npm install --production`)
     - `prisma` (schema a migrace)
     - `.env` (konfiguraní soubor)
     - `package.json`

### Krok 2: Konfigurace prostYedí

#### Backend .env soubor
VytvoYte nebo aktualizujte soubor `backend/.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/flyer_db"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=4000
NODE_ENV=production
API_URL=http://your-domain.com
CORS_ORIGIN=http://your-domain.com
```

**Dole~ité**: Ujistte se, ~e `DATABASE_URL` odkazuje na produkní databázi.

### Krok 3: Migrace databáze

  **KRITICKÝ KROK** - Spusete Prisma migrace pro aktualizaci databázového schématu:

```bash
cd C:\Apps\flyer-app-backend
npx prisma migrate deploy
```

Tento pYíkaz aplikuje vaechny nové migrace na produkní databázi, vetn:
- PYidání Brand modelu
- RozaíYení Product modelu o brandId
- RozaíYení Approval modelu o pre-approval pole
- RozaíYení ApprovalWorkflow o pre-approval tracking
- PYidání fillDate do PromoImage

**OvYení migrace:**
```bash
npx prisma migrate status
```

**Vygenerování Prisma Clienta:**
```bash
npx prisma generate
```

### Krok 4: Konfigurace IIS pro Frontend

1. OtevYete IIS Manager
2. VytvoYte nový website nebo aktualizujte existující:
   - **Site name**: Flyer App
   - **Physical path**: `C:\inetpub\wwwroot\flyer-app`
   - **Binding**: HTTP/HTTPS na portu 80/443

3. **URL Rewrite pro React Router** (dole~ité pro SPA):
   - Nainstalujte URL Rewrite module pro IIS (pokud jeat není)
   - VytvoYte `web.config` v root slo~ce frontendu:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
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
    </rewrite>
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
    </staticContent>
  </system.webServer>
</configuration>
```

4. Nastavte správná oprávnní:
   - IIS_IUSRS musí mít Read & Execute práva na slo~ku

### Krok 5: Spuatní Backend serveru

#### Mo~nost A: Pomocí PM2 (doporueno)

1. Nainstalujte PM2 globáln (pokud jeat není):
```bash
npm install -g pm2
```

2. VytvoYte PM2 ecosystem soubor `backend/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'flyer-api',
    script: 'dist/main.js',
    cwd: 'C:/Apps/flyer-app-backend',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
}
```

3. Spusete aplikaci:
```bash
cd C:\Apps\flyer-app-backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Mo~nost B: Pomocí Windows Service (node-windows)

1. VytvoYte service wrapper script `backend/service.js`:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Flyer Management API',
  description: 'Backend API pro Flyer Management System',
  script: 'C:\\Apps\\flyer-app-backend\\dist\\main.js',
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

svc.on('install', function() {
  svc.start();
});

svc.install();
```

2. Spusete:
```bash
npm install -g node-windows
node service.js
```

### Krok 6: Konfigurace IIS jako Reverse Proxy pro Backend

1. Nainstalujte ARR (Application Request Routing) a URL Rewrite moduly
2. V IIS vytvoYte nový site nebo pou~ijte existující pro API
3. PYidejte URL Rewrite pravidlo pro reverse proxy:

```xml
<rewrite>
  <rules>
    <rule name="ReverseProxyInboundRule1" stopProcessing="true">
      <match url="api/(.*)" />
      <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
    </rule>
  </rules>
</rewrite>
```

### Krok 7: OvYení deployment

1. **Zkontrolujte backend API**:
   - OtevYete `http://your-domain.com/api/health` (nebo podobný endpoint)
   - Mla by vrátit 200 OK

2. **Zkontrolujte frontend**:
   - OtevYete `http://your-domain.com`
   - Mla by se naíst pYihlaaovací stránka

3. **Zkontrolujte databázové pYipojení**:
   - PYihlaste se do aplikace
   - VytvoYte testovací produkt nebo brand

4. **Zkontrolujte PDF generování**:
   - OtevYete existující leták
   - Vygenerujte PDF a zkontrolujte formátování

### Krok 8: Monitoring a logs

#### PM2 logs:
```bash
pm2 logs flyer-api
pm2 monit
```

#### Windows Event Viewer:
- Zkontrolujte Application logs pro Node.js service

#### IIS logs:
- Najdete v `C:\inetpub\logs\LogFiles`

---

## Rollback plán

Pokud deployment sel~e:

1. **Databáze rollback**:
```bash
cd C:\Apps\flyer-app-backend
npx prisma migrate resolve --rolled-back [migration-name]
```

2. **Backend rollback**:
   - Obnovte pYedchozí verzi `backend` slo~ky
   - Restartujte service: `pm2 restart flyer-api`

3. **Frontend rollback**:
   - Obnovte pYedchozí verzi `build` slo~ky

---

## asté problémy a Yeaení

### Problém: Databázové pYipojení selhává
**Xeaení**:
- Zkontrolujte DATABASE_URL v .env
- OvYte, ~e PostgreSQL b~í: `services.msc`
- Zkontrolujte firewall pravidla

### Problém: PDF generování nefunguje
**Xeaení**:
- Zkontrolujte, ~e fonty jsou správn nainstalovány na serveru
- OvYte write permissions pro temp slo~ku

### Problém: CORS errors
**Xeaení**:
- Zkontrolujte CORS_ORIGIN v backend .env
- OvYte, ~e frontend volá správnou API URL

### Problém: React routing nefunguje (404 pYi refresh)
**Xeaení**:
- Zkontrolujte, ~e web.config obsahuje URL Rewrite pravidla
- OvYte, ~e URL Rewrite module je nainstalován v IIS

---

## Kontakt a podpora

PYi problémech s deploymentem kontaktujte vývojový tým.

**Verze**: 3.1.2
**Datum buildu**: 2025-11-06
**Node.js verze**: 16.x nebo vyaaí
**PostgreSQL verze**: 12.x nebo vyaaí
