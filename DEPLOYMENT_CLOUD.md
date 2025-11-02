# 🌐 Nasazení do Cloud - Kompletní průvodce

## 📋 Obsah
- [Architektura aplikace](#architektura-aplikace)
- [Doporučené řešení](#doporučené-řešení)
- [Vercel + Railway (DOPORUČENO)](#vercel--railway-doporučeno)
- [Render (All-in-One)](#render-all-in-one)
- [AWS](#aws-deployment)
- [Checklist před nasazením](#checklist-před-nasazením)

---

## 🏗️ Architektura aplikace

```
┌─────────────────┐
│   Frontend      │  React (Create React App)
│   (Vercel)      │  Port: 3000
└────────┬────────┘
         │
         │ API volání
         ↓
┌─────────────────┐
│   Backend       │  NestJS
│   (Railway)     │  Port: 4000
└────────┬────────┘
         │
         │ Prisma
         ↓
┌─────────────────┐
│  PostgreSQL     │  Databáze
│   (Railway)     │  Port: 5432
└─────────────────┘
         │
         │ MSSQL Connection
         ↓
┌─────────────────┐
│   ERP System    │  Vaše interní ERP
│   (On-premise)  │
└─────────────────┘
```

---

## 🎯 Doporučené řešení

### Railway + Vercel
- ✅ **Nejjednodušší setup** (30 minut)
- ✅ **Automatické HTTPS**
- ✅ **GitHub auto-deploy**
- ✅ **Zadarmo pro začátek** (Railway $5/měsíc po free tieru)
- ✅ **Vestavěný monitoring**
- ✅ **Zero-config deployment**

### Alternativy
- **Render**: All-in-one, free tier dostupný, ale pomalejší cold start
- **Fly.io**: Skvělé pro EU region, více kontroly
- **AWS/Azure**: Nejvíc flexibilní, ale složitější setup

---

## 🚂 Vercel + Railway (DOPORUČENO)

### Krok 1: Příprava projektu

#### 1.1 Přesun frontendu do samostatné složky (volitelné)

Pokud chcete mít čistší strukturu:
```bash
# Aktuální struktura:
flyer-app/
├── backend/          # NestJS API
├── src/              # React frontend
├── public/
└── package.json      # Frontend

# Doporučená struktura pro cloud:
flyer-app/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
└── README.md
```

**Můžete přeskočit**, pokud necháte frontend v root - Vercel s tím pracuje dobře.

#### 1.2 Vytvoření `.env` souborů

**Backend `.env.example` (už máte):**
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
PORT=4000
NODE_ENV=production

# ERP Connection
ERP_DB_SERVER=your-erp-server.com
ERP_DB_NAME=your-database
ERP_DB_USER=your-username
ERP_DB_PASSWORD=your-password
```

**Frontend `.env.production`:**
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

---

### Krok 2: Railway - Databáze a Backend

#### 2.1 Vytvoření PostgreSQL databáze

1. Přejděte na [railway.app](https://railway.app) a přihlaste se přes GitHub
2. Klikněte **"New Project"**
3. Vyberte **"Provision PostgreSQL"**
4. Railway automaticky vytvoří databázi

5. **Získejte connection string:**
   - Klikněte na PostgreSQL service
   - Přejděte na **"Connect"** tab
   - Zkopírujte **"Postgres Connection URL"**
   - Vypadá jako: `postgresql://postgres:password@containers-us-west-123.railway.app:7890/railway`

#### 2.2 Nasazení backendu na Railway

1. V Railway projektu klikněte **"New"** → **"GitHub Repo"**
2. Propojte váš GitHub účet a vyberte repozitář `flyer-app`
3. Railway začne automaticky deployovat

4. **Konfigurace backendu:**
   - Klikněte na backend service
   - Přejděte na **"Settings"**

5. **Nastavte Root Directory:**
   ```
   Root Directory: backend
   ```

6. **Přidejte Environment Variables** (Settings → Variables → "Raw Editor"):
   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secure-random-string-min-32-chars-CHANGE-THIS
   PORT=4000
   NODE_ENV=production

   # ERP credentials
   ERP_DB_SERVER=your-erp-server.com
   ERP_DB_NAME=your_database
   ERP_DB_USER=your_username
   ERP_DB_PASSWORD=your_password
   ```

   **Tip:** `${{Postgres.DATABASE_URL}}` automaticky načte URL z PostgreSQL service

7. **Nastavte Build & Start Commands** (Settings):
   - **Build Command:**
     ```bash
     npm install && npx prisma generate && npm run build
     ```
   - **Start Command:**
     ```bash
     npx prisma migrate deploy && npm run start:prod
     ```

8. **Spusťte deploy:**
   - Railway automaticky začne deployment
   - Sledujte logy v "Deployments" tabu
   - Počkejte na "Success" ✅

9. **Získejte URL backendu:**
   - V Settings → "Public Networking"
   - Klikněte **"Generate Domain"**
   - Dostanete URL jako: `https://your-app.up.railway.app`
   - **Zkopírujte tuto URL** - budete ji potřebovat pro frontend!

#### 2.3 Testování backendu

```bash
# Test API
curl https://your-backend.railway.app/api/health

# Mělo by vrátit: {"status": "ok"}
```

---

### Krok 3: Vercel - Frontend

#### 3.1 Nasazení na Vercel

1. Přejděte na [vercel.com](https://vercel.com) a přihlaste se přes GitHub
2. Klikněte **"Add New"** → **"Project"**
3. Vyberte váš `flyer-app` repozitář
4. Klikněte **"Import"**

#### 3.2 Konfigurace projektu

**Framework Preset:** Create React App (auto-detect)

**Build Settings:**
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

**Root Directory:**
- Ponechte prázdné (pokud je frontend v root)
- Nebo nastavte `frontend` (pokud jste ho přesunuli)

#### 3.3 Environment Variables

Přidejte tyto proměnné (Settings → Environment Variables):

```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

**Důležité:** Nahraďte `your-backend.railway.app` vaší skutečnou Railway URL z kroku 2.9!

#### 3.4 Deploy

1. Klikněte **"Deploy"**
2. Vercel začne build a deployment (2-3 minuty)
3. Po dokončení získáte URL: `https://your-app.vercel.app`

---

### Krok 4: Konfigurace CORS

Backend musí povolit requesty z Vercel domény.

#### 4.1 Upravte `backend/src/main.ts`

Najděte sekci s `enableCors` a aktualizujte:

```typescript
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'https://your-custom-domain.com', // pokud máte vlastní doménu
    'http://localhost:3000', // pro lokální vývoj
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

#### 4.2 Commit a push změny

```bash
git add backend/src/main.ts
git commit -m "fix: Update CORS for production domains"
git push origin main
```

Railway i Vercel automaticky spustí nový deployment!

---

### Krok 5: Databázové migrace a seed

#### 5.1 Spuštění migrací (Railway CLI)

```bash
# Instalace Railway CLI
npm install -g @railway/cli

# Login
railway login

# Propojení s projektem
railway link

# Spuštění migrací
railway run --service backend npx prisma migrate deploy

# Seed databáze (volitelné)
railway run --service backend npm run seed
```

#### 5.2 Alternativa: Railway dashboard

1. V Railway projektu klikněte na backend service
2. Přejděte na "Settings" → "Service Variables"
3. Otevřete "Console" (ikona terminálu)
4. Spusťte:
   ```bash
   npx prisma migrate deploy
   npm run seed
   ```

---

### Krok 6: Ověření nasazení

#### 6.1 Test backendu

```bash
# Health check
curl https://your-backend.railway.app/api/health

# Test login
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.cz","password":"admin123"}'
```

#### 6.2 Test frontendu

1. Otevřete `https://your-app.vercel.app` v prohlížeči
2. Zkuste se přihlásit testovacím účtem:
   - Email: `dodavatel@acme.cz`
   - Heslo: `admin123`

---

### Krok 7: Vlastní doména (volitelné)

#### 7.1 Frontend (Vercel)

1. V Vercel projektu přejděte na **Settings → Domains**
2. Přidejte vaši doménu (např. `flyer.yourcompany.cz`)
3. Nastavte DNS záznamy dle instrukcí Vercel
4. Vercel automaticky vygeneruje SSL certifikát

#### 7.2 Backend (Railway)

1. V Railway projektu → Settings → Public Networking
2. Přidejte custom domain (např. `api.yourcompany.cz`)
3. Nastavte DNS CNAME záznam
4. Railway automaticky vygeneruje SSL

#### 7.3 Aktualizace CORS a env vars

Po nastavení custom domén:

**Backend `main.ts`:**
```typescript
origin: [
  'https://flyer.yourcompany.cz',
  'http://localhost:3000',
],
```

**Frontend env vars na Vercel:**
```env
REACT_APP_API_URL=https://api.yourcompany.cz/api
```

---

## 🎨 Render (All-in-One alternativa)

### Výhody Render
- Všechno na jednom místě
- Free tier pro malé projekty
- Automatické backupy databáze (paid)
- Jednoduchá konfigurace

### Nevýhody
- Pomalejší cold start než Railway/Vercel
- Free tier má omezení (service usíná po 15 min neaktivity)

### Nasazení na Render

#### 1. Databáze

1. Přejděte na [render.com](https://render.com)
2. Vytvořte **"New PostgreSQL"**
3. Zkopírujte "Internal Database URL"

#### 2. Backend

1. **"New Web Service"**
2. Připojte GitHub repo
3. **Konfigurace:**
   - Name: `flyer-api`
   - Root Directory: `backend`
   - Build Command: `npm install && npx prisma generate && npm run build`
   - Start Command: `npx prisma migrate deploy && npm run start:prod`
   - Instance Type: Free (nebo Standard - $7/měsíc)

4. **Environment Variables:**
   ```env
   DATABASE_URL=<internal-database-url>
   JWT_SECRET=your-secret
   NODE_ENV=production
   PORT=4000
   ```

#### 3. Frontend

1. **"New Static Site"**
2. Připojte stejný repo
3. **Konfigurace:**
   - Build Command: `npm run build`
   - Publish Directory: `build`

4. **Environment Variables:**
   ```env
   REACT_APP_API_URL=https://flyer-api.onrender.com/api
   ```

---

## ☁️ AWS Deployment

### Architektura AWS

```
┌─────────────────────────┐
│    CloudFront (CDN)     │  Frontend distribuce
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│    S3 Bucket            │  Static hosting
│    (React build)        │
└─────────────────────────┘

┌─────────────────────────┐
│    Elastic Beanstalk    │  Backend (NestJS)
│    nebo ECS/Fargate     │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────┐
│    RDS PostgreSQL       │  Databáze
└─────────────────────────┘
```

### Postup (stručně)

#### 1. RDS PostgreSQL
```bash
aws rds create-db-instance \
  --db-instance-identifier flyer-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourPassword123 \
  --allocated-storage 20
```

#### 2. Elastic Beanstalk (Backend)
```bash
# Instalace EB CLI
pip install awsebcli

# Inicializace
cd backend
eb init -p node.js-18 flyer-backend

# Create environment
eb create production-env

# Deploy
eb deploy
```

#### 3. S3 + CloudFront (Frontend)
```bash
# Build
npm run build

# Upload do S3
aws s3 sync build/ s3://flyer-frontend-bucket

# Vytvořit CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name flyer-frontend-bucket.s3.amazonaws.com
```

---

## ✅ Checklist před nasazením

### Bezpečnost
- [ ] Změňte `JWT_SECRET` na náhodný 32+ znakový string
  ```bash
  # Vygenerovat náhodný secret:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Nastavte silné heslo pro databázi
- [ ] Zkontrolujte CORS - pouze povolené domény
- [ ] Odstraňte nebo změňte testovací účty v seed.ts
- [ ] Ověřte, že `.env` soubory NEJSOU v git repozitáři (v `.gitignore`)

### Databáze
- [ ] Spusťte migrace: `npx prisma migrate deploy`
- [ ] (Volitelně) Seed data: `npm run seed`
- [ ] Nastavte automatické backupy (Railway/Render to dělají automaticky)
- [ ] Testujte connection string lokálně:
  ```bash
  DATABASE_URL="postgresql://..." npx prisma studio
  ```

### Environment Variables
- [ ] Backend: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
- [ ] Backend: ERP credentials (`ERP_DB_SERVER`, `ERP_DB_NAME`, `ERP_DB_USER`, `ERP_DB_PASSWORD`)
- [ ] Frontend: `REACT_APP_API_URL` (s /api na konci!)
- [ ] Ověřte, že env vars jsou nastavené správně:
  ```bash
  # Railway
  railway variables

  # Vercel
  vercel env ls
  ```

### Funkční testy
- [ ] Backend health check funguje: `curl https://api/health`
- [ ] Přihlášení funguje (testovací účet)
- [ ] API vrací data (produkty, letáky)
- [ ] Upload obrázků funguje
- [ ] PDF generování funguje
- [ ] ERP integrace funguje (validace EAN kódů)

### Monitoring
- [ ] Nastavte monitoring (Railway/Vercel mají built-in)
- [ ] Zkontrolujte logy po nasazení:
  ```bash
  # Railway
  railway logs

  # Vercel
  vercel logs
  ```
- [ ] Nastavte alerts pro chyby
- [ ] Sledujte metriky výkonu

---

## 🚨 Řešení častých problémů

### CORS Error v produkci

**Problém:** `Access to fetch blocked by CORS policy`

**Řešení:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    process.env.FRONTEND_URL, // Přidejte do env vars
    'https://your-app.vercel.app',
  ],
  credentials: true,
});
```

### Database connection timeout

**Problém:** `Can't reach database server`

**Řešení:**
1. Ověřte `DATABASE_URL` env var
2. Zkontrolujte, že Railway PostgreSQL běží
3. Zkuste connection string lokálně:
   ```bash
   psql "postgresql://user:pass@host:port/db"
   ```

### Build fails na Vercel

**Problém:** `Error: Cannot find module`

**Řešení:**
```bash
# Zkuste build lokálně
npm run build

# Smaže node_modules a reinstaluje
rm -rf node_modules package-lock.json
npm install
```

### Backend vrací 500 errors

**Řešení:**
```bash
# Zkontrolujte Railway logy
railway logs --service backend

# Běžné příčiny:
# - Chybí env vars
# - Migrace neproběhly
# - Port mismatch (nastavte PORT=4000)
```

### ERP connection fails

**Problém:** `Can't connect to MSSQL server`

**Řešení:**
1. Ověřte ERP credentials v env vars
2. Zkontrolujte, že Railway server má přístup k ERP (firewall, VPN?)
3. Možná budete potřebovat VPN nebo VPC peering pro přístup k on-premise ERP

---

## 💰 Odhad nákladů

### Railway + Vercel (doporučeno)
- **Vercel**: Zdarma (Hobby tier)
- **Railway**:
  - Free tier: $5 credit/měsíc (stačí na malou aplikaci)
  - Starter: $5/měsíc po vyčerpání
  - PostgreSQL: Zahrnutý
- **Celkem**: $0-5/měsíc pro začátek

### Render
- **Free tier**: Zdarma (s omezeními - cold start)
- **Starter**: $7/měsíc backend + $7/měsíc databáze = $14/měsíc

### AWS
- **Minimum**: ~$30-50/měsíc
  - RDS t3.micro: ~$15/měsíc
  - Elastic Beanstalk t3.micro: ~$8/měsíc
  - S3 + CloudFront: ~$1-5/měsíc (dle trafficu)

---

## 🔄 Continuous Deployment

Railway a Vercel automaticky deployují z GitHub!

### Doporučený workflow

```bash
# 1. Vytvořte feature branch
git checkout -b feature/new-feature

# 2. Commit changes
git add .
git commit -m "feat: Add new feature"

# 3. Push
git push origin feature/new-feature

# 4. Create Pull Request na GitHubu

# 5. Po review a merge do main:
git checkout main
git pull origin main

# Railway a Vercel automaticky deploynou! 🚀
```

### Preview Deployments (Vercel)

Vercel automaticky vytváří preview URL pro každý pull request!

```
https://flyer-app-git-feature-new-feature-yourteam.vercel.app
```

---

## 📞 Podpora

**Railway:**
- Dokumentace: https://docs.railway.app
- Discord: https://discord.gg/railway
- Support: help@railway.app

**Vercel:**
- Dokumentace: https://vercel.com/docs
- Support: https://vercel.com/support

**Render:**
- Dokumentace: https://render.com/docs
- Discord: https://render.com/discord

---

## 🎓 Další zdroje

- [Railway Template Gallery](https://railway.app/templates)
- [Vercel Examples](https://vercel.com/templates)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment)
- [NestJS Deployment Guide](https://docs.nestjs.com/faq/serverless)

---

**Doporučení pro váš projekt:**

✅ **Začněte s Railway + Vercel** - nejjednodušší a nejrychlejší setup

✅ **Využijte free tiery** - stačí pro testování a malý provoz

✅ **Monitorujte náklady** - Railway i Vercel mají dashboardy s usage

✅ **Nastavte vlastní doménu** - vypadá profesionálněji

✅ **Automatizujte backupy** - Railway má automatické denní backupy

---

Máte otázky? Kontaktujte vývojáře nebo konzultujte dokumentaci platformy! 🚀
