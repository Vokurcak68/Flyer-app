# 🎯 Moderní SaaS Platforma pro Správu Letáků

**Profesionální full-stack aplikace pro vytváření, schvalování a správu produktových letáků**

---

## 📋 OBSAH

1. [Přehled](#přehled)
2. [Technologie](#technologie)
3. [Funkce](#funkce)
4. [Instalace](#instalace)
5. [Spuštění](#spuštění)
6. [API Dokumentace](#api-dokumentace)
7. [Databáze](#databáze)
8. [Konfigurace](#konfigurace)

---

## 🚀 PŘEHLED

Kompletní SaaS platforma umožňující:
- **Dodavatelům**: Vytvářet produktové letáky s drag & drop editorem
- **Schvalovatelům**: Kontrolovat a schvalovat letáky (dual-approval workflow)
- **Koncovým uživatelům**: Vytvářet vlastní letáky z aktivních produktů
- **ERP Integrace**: Automatická verifikace EAN kódů a cen proti MSSQL databázi
- **PDF Export**: Generování profesionálních A4 PDF letáků

---

## 💻 TECHNOLOGIE

### Backend (NestJS)
- **Framework**: NestJS 10
- **Database**: PostgreSQL 16+ (Prisma ORM)
- **Auth**: JWT + Passport
- **ERP**: MSSQL driver pro verifikaci
- **PDF**: Puppeteer pro generování
- **Upload**: Multer pro správu souborů

### Frontend (React)
- **Framework**: React 19 + TypeScript
- **Routing**: React Router v6
- **State**: Zustand + TanStack Query
- **Styling**: TailwindCSS
- **DnD**: @dnd-kit
- **Forms**: React Hook Form + Zod

---

## ✨ FUNKCE

### 1. Správa Produktů
- ✅ CRUD operace s produkty
- ✅ EAN kód validace
- ✅ Až 4 ikony na produkt (energetické třídy, funkce)
- ✅ Ceny (akční + původní)
- ✅ Upload obrázků
- ✅ Live preview produktu v letáku

### 2. Vizuální Leták Editor
- ✅ **Drag & Drop**: Přetahování produktů na stránky
- ✅ **8 Layout typů**: 1, 2, 4, 8 produktů + promo varianty
- ✅ **Multi-page**: Libovolný počet stránek
- ✅ **Auto-save**: Automatické ukládání každých 30s
- ✅ **Completion %**: Ukazatel dokončení letáku
- ✅ **Visual preview**: Náhled A4 stránky
- ✅ **Rozpracované letáky**: Ukládání drafts

### 3. Verifikace & Schvalování
- ✅ **ERP Verifikace**:
  - Kontrola EAN kódů v MSSQL
  - Ověření cen produktů
  - Kontrola aktivního statusu
- ✅ **Dual-Approval**:
  - Schvalování 2 schvalov ateli
  - Workflow tracking
  - Komentáře a historie

### 4. Role-Based Access
- ✅ **Dodavatel** (`supplier`):
  - Správa produktů své značky
  - Vytváření letáků
  - Odeslání ke schválení
- ✅ **Schvalovatel** (`approver`):
  - Zobrazení pending letáků
  - Schválení/zamítnutí
  - Komentáře
- ✅ **Koncový uživatel** (`end_user`):
  - Prohlížení aktivních letáků
  - Vytváření vlastních letáků
  - PDF export

### 5. PDF Generace
- ✅ A4 formát (210×297mm)
- ✅ Profesionální layout
- ✅ Grid layout (1-8 produktů)
- ✅ Promo obrázky
- ✅ Cenové značky
- ✅ Ikony produktů

### 6. Upload Souborů
- ✅ Obrázky produktů
- ✅ Promo obrázky
- ✅ Ikony
- ✅ Brand loga
- ✅ Validace typu a velikosti (max 5MB)
- ✅ Formáty: JPG, PNG, WebP, GIF

---

## 📦 INSTALACE

### Předpoklady
- Node.js 18+
- PostgreSQL 16+
- MSSQL Server (pro ERP verifikaci)

### 1. Clone Repository
```bash
cd c:\Projekty\flyer-app
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ..
npm install
```

### 4. Databáze Setup

**PostgreSQL:**
```sql
CREATE DATABASE flyer_app;
```

**Spusť migrace:**
```bash
cd backend
npx prisma migrate dev
npx prisma generate
npm run seed  # Vytvoří testovací data
```

---

## 🚀 SPUŠTĚNÍ

### Development Mode

**Backend:**
```powershell
cd c:\Projekty\flyer-app\backend
npm run start:dev
```
Běží na: `http://localhost:4000`

**Frontend:**
```powershell
cd c:\Projekty\flyer-app
npm start
```
Běží na: `http://localhost:3000`

### Production Build

**Frontend:**
```bash
npm run build
serve -s build -l 3000
```

**Backend:**
```bash
cd backend
npm run build
npm run start:prod
```

---

## 📚 API DOKUMENTACE

### Base URL
```
http://localhost:4000/api
```

### Autentizace
```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/profile
GET  /api/auth/validate
```

### Produkty
```http
POST   /api/products              # Vytvoř produkt
GET    /api/products              # Seznam produktů (+ filtry)
GET    /api/products/:id          # Detail produktu
PATCH  /api/products/:id          # Aktualizuj produkt
DELETE /api/products/:id          # Smaž produkt
POST   /api/products/:id/icons    # Přidej ikonu
DELETE /api/products/icons/:id    # Odstraň ikonu
```

### Letáky
```http
POST   /api/flyers                          # Vytvoř leták
GET    /api/flyers                          # Seznam letáků
GET    /api/flyers/:id                      # Detail letáku
PATCH  /api/flyers/:id                      # Aktualizuj leták
DELETE /api/flyers/:id                      # Smaž leták
POST   /api/flyers/:id/pages                # Přidej stránku
DELETE /api/flyers/pages/:pageId            # Odstraň stránku
POST   /api/flyers/pages/:pageId/products   # Přidej produkt na stránku
DELETE /api/flyers/pages/products/:id       # Odstraň produkt
PATCH  /api/flyers/pages/products/:id/position  # Přesuň produkt
POST   /api/flyers/:id/submit-for-verification  # Odešli k verifikaci
POST   /api/flyers/:id/auto-save            # Auto-save
POST   /api/flyers/:id/generate-pdf         # Vygeneruj PDF
GET    /api/flyers/:id/preview              # Náhled letáku
```

### Upload
```http
POST /api/upload/product    # Upload obrázku produktu
POST /api/upload/promo      # Upload promo obrázku
POST /api/upload/icon       # Upload ikony
POST /api/upload/brand      # Upload brand loga
```

### Schvalování
```http
POST /api/approvals/:flyerId/approve  # Schval leták
POST /api/approvals/:flyerId/reject   # Zamítni leták
```

### Verifikace
```http
GET /api/verification/test-erp  # Test ERP připojení
```

---

## 🗄️ DATABÁZE

### PostgreSQL (Hlavní databáze)

**Schema:**
- `users` - Uživatelé (dodavatelé, schvalovatelé, end users)
- `brands` - Značky produktů
- `products` - Produkty s EAN kódy
- `product_icons` - Ikony produktů (max 4)
- `promo_images` - Promo obrázky (4 velikosti)
- `flyers` - Letáky
- `flyer_pages` - Stránky letáků
- `flyer_page_products` - Produkty na stránkách
- `approvals` - Schválení letáků
- `approval_workflow` - Workflow schvalování
- `verification_logs` - Logy ERP verifikace
- `flyer_versions` - Verze letáků
- `flyer_edit_history` - Historie editací
- `user_flyers` - Letáky koncových uživatelů
- `audit_logs` - Audit log

### MSSQL (ERP Systém)

**Očekávaná struktura:**
```sql
TABLE Products (
  EAN VARCHAR(13) PRIMARY KEY,
  Price DECIMAL(10,2),
  Name NVARCHAR(255),
  IsActive BIT
)
```

---

## ⚙️ KONFIGURACE

### Backend (.env)
```env
# PostgreSQL
DATABASE_URL="postgresql://postgres:heslo@localhost:5432/flyer_app"

# Server
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# ERP Database (MSSQL)
ERP_DB_SERVER=localhost
ERP_DB_NAME=ERP
ERP_DB_USER=sa
ERP_DB_PASSWORD=YourPassword
ERP_DB_ENCRYPT=false
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:4000/api
```

---

## 👥 DEMO ÚČTY

Po spuštění `npm run seed`:

```
Dodavatel:
  Email: dodavatel@acme.cz
  Password: admin123

Schvalovatel 1:
  Email: schvalovatel1@company.cz
  Password: admin123

Schvalovatel 2:
  Email: schvalovatel2@company.cz
  Password: admin123

Koncový uživatel:
  Email: uzivatel@email.cz
  Password: admin123
```

---

## 📁 STRUKTURA PROJEKTU

```
flyer-app/
├── backend/
│   ├── src/
│   │   ├── auth/           # Autentizace (JWT)
│   │   ├── products/       # Správa produktů
│   │   ├── brands/         # Správa značek
│   │   ├── promo-images/   # Promo obrázky
│   │   ├── flyers/         # Letáky + PDF
│   │   ├── approvals/      # Schvalování
│   │   ├── verification/   # ERP verifikace
│   │   ├── common/         # Upload, guards, decorators
│   │   └── prisma/         # DB service
│   ├── prisma/
│   │   └── schema.prisma   # DB schema
│   └── uploads/            # Nahrané soubory
│
├── src/
│   ├── components/
│   │   ├── ui/            # UI komponenty
│   │   ├── product/       # Produktové komponenty
│   │   └── flyer/         # Flyer editor komponenty
│   ├── pages/
│   │   ├── products/      # Správa produktů
│   │   ├── flyers/        # Flyer editor
│   │   ├── approvals/     # Schvalování
│   │   └── user-flyers/   # Uživatelské letáky
│   ├── services/          # API services
│   ├── store/             # Zustand stores
│   ├── hooks/             # Custom hooks
│   ├── layouts/           # Layouts
│   ├── types/             # TypeScript types
│   └── utils/             # Utility funkce
│
└── public/                # Static assets
```

---

## 🔧 KLÍČOVÉ SOUBORY

### Backend
- `backend/src/flyers/pdf.service.ts` - PDF generace s Puppeteer
- `backend/src/verification/verification.service.ts` - ERP verifikace
- `backend/src/common/upload.service.ts` - Upload souborů
- `backend/prisma/schema.prisma` - DB schema

### Frontend
- `src/pages/flyers/FlyerEditorPage.tsx` - Drag & Drop editor
- `src/components/flyer/FlyerPageView.tsx` - Vizuální náhled stránky
- `src/hooks/useAutoSave.ts` - Auto-save hook
- `src/services/flyersService.ts` - Flyer API calls

---

## 🎯 WORKFLOW

### Vytvoření Letáku (Dodavatel)
1. Login jako dodavatel
2. **Produkty** → Vytvoř produkty s EAN, cenou, obrázky
3. **Letáky** → Nový leták
4. **Editor**:
   - Přidej stránky
   - Vyber layout (1-8 produktů)
   - Drag & drop produkty
   - Auto-save běží automaticky
5. **Odeslat k verifikaci** → ERP kontrola
6. **Odeslat ke schválení**

### Schválení (Schvalovatelé)
1. Login jako schvalovatel
2. **Schvalování** → Pending letáky
3. Otevři leták → Náhled
4. Schval nebo Zamítni (s komentářem)
5. Když schválí oba → Leták aktivní

### Koncový Uživatel
1. Login jako end_user
2. **Dashboard** → Aktivní letáky
3. **Moje letáky** → Vytvoř vlastní
4. Vyber produkty z aktivních letáků
5. Vygeneruj PDF

---

## 🧪 TESTOVÁNÍ

### API Test (curl)
```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dodavatel@acme.cz","password":"admin"}'

# Seznam produktů
curl http://localhost:4000/api/products \
  -H "Authorization: Bearer <token>"
```

### ERP Test
```bash
curl http://localhost:4000/api/verification/test-erp \
  -H "Authorization: Bearer <token>"
```

---

## 📊 API ENDPOINTS (Kompletní Seznam)

**Celkem: 50+ endpointů**

| Modul | Počet Endpointů |
|-------|-----------------|
| Auth | 4 |
| Products | 7 |
| Brands | 3 |
| Promo Images | 5 |
| Flyers | 14 |
| Upload | 4 |
| Approvals | 3 |
| Verification | 1 |

---

## 🚨 TROUBLESHOOTING

### Port 4000 už používán
```bash
# Najdi proces
netstat -ano | findstr :4000

# Zabij proces
taskkill /PID <PID> /F
```

### PostgreSQL connection failed
- Zkontroluj že PostgreSQL běží
- Ověř heslo v `.env`
- Zkontroluj DATABASE_URL

### ERP verifikace selhává
- Zkontroluj MSSQL server běží
- Ověř credentials v `.env`
- Test: `GET /api/verification/test-erp`

---

## 📝 POZNÁMKY

- **Auto-save**: Interval 30s, pouze pro drafts
- **Max produktů**: 8 na stránku (layout dependent)
- **Max ikony**: 4 na produkt
- **Max upload**: 5MB per file
- **PDF formát**: A4 (210×297mm)
- **ERP tabulka**: Musí obsahovat `EAN`, `Price`, `IsActive`

---

## 🎉 HOTOVO!

Máte nyní kompletní profesionální SaaS platformu pro správu letáků!

**Vytvořeno s ❤️ pro IT ředitele**
