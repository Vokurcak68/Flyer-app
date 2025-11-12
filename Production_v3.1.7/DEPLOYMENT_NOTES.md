# Deployment Notes - Flyer Management System v3.1.7

**Build Date:** 11. listopadu 2025
**Version:** 3.1.7
**Environment:** Production
**Previous Version:** 3.1.6

---

## Executive Summary

Verze 3.1.7 přidává pokročilé funkce pro správu vyprodaných produktů v aktivních letácích, včetně vodotisku "VYPRODÁNO", synchronizace s ERP systémem, klikacích filtrů a možnosti přegenerování PDF pro schvalovatele.

**Kritické změny:**
- ✅ Databáze: Přidáno pole `soldOut` do tabulky `Product`
- ✅ Backend: Nová metoda `updatePdfData()` která obchází permission checks
- ✅ Frontend: Vodotisk overlay, filtry, tlačítko pro generování PDF
- ✅ PDF: Rendering vodotisku "VYPRODÁNO" v generovaných PDF

**Downtime:** ~5 minut (restart backendu)

---

## Table of Contents

1. [Nové funkce](#nové-funkce)
2. [Technické změny](#technické-změny)
3. [Databázové změny](#databázové-změny)
4. [Seznam změněných souborů](#seznam-změněných-souborů)
5. [Deployment kroky](#deployment-kroky)
6. [Verifikace](#verifikace)
7. [Troubleshooting](#troubleshooting)
8. [Rollback procedura](#rollback-procedura)

---

## Nové funkce

### 1. Vodotisk "VYPRODÁNO" pro ukončené produkty

**Popis:**
Produkty označené jako `soldOut=true` zobrazují diagonální červený vodotisk "VYPRODÁNO" přes celou plochu produktu.

**Frontend implementace:**
- Komponenta: `src/components/product/ProductFlyerLayout.tsx` (řádky 32-48)
- Vodotisk: Červený text, font "Vodafone Rg", 3rem, rotace -45°, opacity 30%

**PDF implementace:**
- Služba: `backend/src/flyers/pdf.service.ts` (řádky 600-622)
- Parametry: Font 36px, šířka 240px, rotace -45°, opacity 30%, barva #DC2626

**Use case:**
Když je produkt v ERP označen jako ukončený (není v view), admin může synchronizovat stav a produkt bude automaticky označen vodotiskem ve všech aktivních letácích.

---

### 2. Synchronizace stavu vyprodáno s ERP

**Popis:**
Nové tlačítko "Synchronizovat stav vyprodáno" v sekci "Produkty v letácích" (admin).

**Funkcionalita:**
- **Bidirectional sync**: Označí ukončené produkty jako `soldOut=true`, odznačí reaktivované produkty jako `soldOut=false`
- **Confirmation dialog**: Zobrazí počty produktů před aplikací změn
- **Backend endpoint**: `POST /products/active-flyers/mark-discontinued-sold-out`

**Backend implementace:**
- Service: `backend/src/products/products.service.ts` (řádky 986-1060)
- Controller: `backend/src/products/products.controller.ts` (řádky 161-166)

**Logika:**
```typescript
// Produkty v aktivních letácích
const activeFlyersProducts = await this.getActiveFlyersProducts();

// Označit ukončené jako soldOut
const toMarkSoldOut = activeFlyersProducts.filter(p => p.discontinued && !p.soldOut);
await this.prisma.product.updateMany({
  where: { id: { in: toMarkSoldOut.map(p => p.id) } },
  data: { soldOut: true }
});

// Odznačit reaktivované
const toUnmarkSoldOut = activeFlyersProducts.filter(p => !p.discontinued && p.soldOut);
await this.prisma.product.updateMany({
  where: { id: { in: toUnmarkSoldOut.map(p => p.id) } },
  data: { soldOut: false }
});
```

---

### 3. Klikací filtry v produktech

**Popis:**
Tři velké klikací karty pro filtrování produktů podle stavu: Celkem / Aktivní / Ukončené.

**Frontend implementace:**
- Komponenta: `src/pages/admin/ActiveFlyersProductsPage.tsx`
- State: `filter: 'all' | 'active' | 'discontinued'`
- Vizuální feedback: Aktivní filtr má `ring-2` border v příslušné barvě

**Funkce:**
- **Celkem produktů** (modrá): Zobrazí všechny produkty
- **Aktivní v ERP** (zelená): Pouze produkty které nejsou ukončeny
- **Ukončené** (červená): Pouze ukončené produkty
- **Kombinace s search**: Filtry fungují společně s vyhledávacím polem

---

### 4. Přegenerování PDF pro schvalovatele

**Popis:**
Schvalovatelé (approver) a admini mohou přegenerovat PDF pro aktivní leták bez nutnosti znovu schvalovat.

**Use case:**
Po synchronizaci stavu vyprodáno admin klikne "Synchronizovat", produkty dostanou vodotisk. Poté schvalovatel klikne "Generovat PDF" a nové PDF obsahuje vodotisky.

**Frontend implementace:**
- Komponenta: `src/pages/flyers/ActiveFlyersPage.tsx` (řádky 125-139)
- Button: Zobrazuje se pouze pro `user.role === 'approver'`
- Confirmation: `window.confirm()` před generováním

**Backend implementace:**
- Endpoint: `POST /flyers/:id/generate-pdf`
- Controller: `backend/src/flyers/flyers.controller.ts` (řádky 240-261)
- Guard: `@Roles('approver', 'admin')`

**Kritický detail - Permission bypass:**
```typescript
// Nová metoda která obchází permission checks
async updatePdfData(id: string, pdfData: Buffer, pdfMimeType: string) {
  const flyer = await this.prisma.flyer.findUnique({ where: { id } });
  if (!flyer) throw new NotFoundException('Flyer not found');

  return this.prisma.flyer.update({
    where: { id },
    data: { pdfData, pdfMimeType },
  });
}
```

**Proč bypass?**
Původní metoda `update()` má strict permission check: pouze supplier/end_user kteří vlastní flyer mohou updatovat. Approver nemůže vlastnit flyer, proto potřebujeme specialized metodu která pouze aktualizuje PDF data.

---

## Technické změny

### Backend Changes

#### 1. Database Schema
```prisma
model Product {
  // ... existing fields ...
  soldOut      Boolean       @default(false)  // NEW FIELD
}
```

#### 2. New Methods

**FlyersService:**
- `updatePdfData(id, pdfData, pdfMimeType)` - Update PDF bez permission check (řádky 1957-1975)

**ProductsService:**
- `markDiscontinuedAsSoldOut()` - Bidirectional sync s ERP (řádky 986-1060)

**PdfService:**
- Enhanced `renderProduct()` s vodotiskem rendering (řádky 600-622)

#### 3. Removed Code
- Všechny debug `console.log` z `roles.guard.ts`
- Všechny debug `console.log` z `flyers.controller.ts`

### Frontend Changes

#### 1. New Components/Features

**ProductFlyerLayout.tsx:**
```tsx
{product.soldOut && (
  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
    <div className="text-red-600 font-bold opacity-30 whitespace-nowrap"
         style={{ fontSize: '3rem', transform: 'rotate(-45deg)', ... }}>
      VYPRODÁNO
    </div>
  </div>
)}
```

**ActiveFlyersProductsPage.tsx:**
- Filter state management
- Clickable filter cards
- Visual feedback for active filter

**ActiveFlyersPage.tsx:**
- Generate PDF button
- `generatePdfMutation` using React Query
- Confirmation dialog

#### 2. Type Updates

**types/index.ts:**
```typescript
export interface Product {
  // ... existing fields ...
  soldOut?: boolean;  // NEW FIELD
}
```

### Documentation Changes

**public/UZIVATELSKY_NAVOD.html:**
- Verze aktualizována na 3.1.7
- Nová sekce "Produkty v letácích" pro administrátory (řádky 770-804)
- Rozšířená sekce "Správa aktivních letáků" pro schvalovatele (řádky 1679-1707)
- Přidán popis filtrování produktů
- Přidán popis přegenerování PDF

---

## Databázové změny

### Migration: Add soldOut field to Product

**SQL:**
```sql
-- Add soldOut field to Product table
ALTER TABLE "Product" ADD COLUMN "soldOut" BOOLEAN NOT NULL DEFAULT false;
```

**Prisma command:**
```bash
npx prisma db push
```

**Poznámka:** Tento release neobsahuje separátní MIGRATE.sql soubor. Migrace se provede přes `prisma db push` který automaticky detekuje změny ve schema.

**Backwards compatibility:** ✅ Ano
- Nové pole má default hodnotu `false`
- Existující data nejsou ovlivněna
- Frontend/backend fungují i když pole chybí (optional field)

---

## Seznam změněných souborů

### Backend (8 souborů)

1. **backend/package.json**
   - Změna: Version 3.1.6 → 3.1.7

2. **backend/prisma/schema.prisma**
   - Změna: Přidáno `soldOut Boolean @default(false)` do Product model

3. **backend/src/common/guards/roles.guard.ts**
   - Změna: Odstraněny debug console.log

4. **backend/src/flyers/flyers.controller.ts**
   - Změna: Odstraněny debug console.log

5. **backend/src/flyers/flyers.service.ts**
   - Změna: Přidána metoda `updatePdfData()` (řádky 1957-1975)
   - Změna: `findOne()` a `findOneForPdf()` nyní select `soldOut: true`

6. **backend/src/flyers/pdf.service.ts**
   - Změna: Rendering vodotisku "VYPRODÁNO" v `renderProduct()` (řádky 600-622)
   - Parametry: Font 36px, width 240px, opacity 0.3, rotation -45deg

7. **backend/src/products/products.service.ts**
   - Změna: Nová metoda `markDiscontinuedAsSoldOut()` (řádky 986-1060)
   - Změna: `getActiveFlyersProducts()` select včetně `soldOut`

8. **backend/src/products/products.controller.ts**
   - Změna: Nový endpoint `POST /products/active-flyers/mark-discontinued-sold-out` (řádky 161-166)

### Frontend (5 souborů)

1. **package.json**
   - Změna: Version 3.1.6 → 3.1.7

2. **src/components/layout/AppFooter.tsx**
   - Změna: Verze zobrazení aktualizována na 3.1.7

3. **src/components/product/ProductFlyerLayout.tsx**
   - Změna: Přidán watermark overlay pro soldOut produkty (řádky 32-48)

4. **src/pages/admin/ActiveFlyersProductsPage.tsx**
   - Změna: Přidán filter state
   - Změna: Klikací filter karty (řádky 92-134)
   - Změna: Filtrování produktů před zobrazením

5. **src/pages/flyers/ActiveFlyersPage.tsx**
   - Změna: Přidáno tlačítko "Generovat PDF" (řádky 125-139)
   - Změna: `generatePdfMutation` pro volání API

6. **src/types/index.ts**
   - Změna: Přidáno `soldOut?: boolean` do Product interface

### Documentation (1 soubor)

1. **public/UZIVATELSKY_NAVOD.html**
   - Změna: Verze 3.1.6 → 3.1.7
   - Změna: Datum aktualizace
   - Přidáno: Sekce "Produkty v letácích" pro admin
   - Přidáno: Popis filtrování
   - Přidáno: Popis přegenerování PDF pro approver

---

## Deployment kroky

### 1. Pre-deployment

```bash
# Záloha databáze
pg_dump -U flyer_app_user flyer_app_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Záloha souborů
cp -r /var/www/flyer-app/backend /var/www/flyer-app/backend_backup_$(date +%Y%m%d)
cp -r /var/www/flyer-app/frontend /var/www/flyer-app/frontend_backup_$(date +%Y%m%d)

# Stop backend
pm2 stop flyer-app-backend
```

### 2. Database Migration

```bash
cd /var/www/flyer-app/backend

# Zkopírovat nové schema
cp /path/to/Production_v3.1.7/prisma/schema.prisma ./prisma/

# Spustit migration
npx prisma db push

# Ověřit změny
psql -U flyer_app_user flyer_app_production -c "\d products"
# Mělo by zobrazit soldOut boolean pole
```

### 3. Backend Deployment

```bash
# Smazat starý dist
rm -rf /var/www/flyer-app/backend/dist

# Zkopírovat nový build
cp -r /path/to/Production_v3.1.7/dist /var/www/flyer-app/backend/
cp /path/to/Production_v3.1.7/.env /var/www/flyer-app/backend/
cp /path/to/Production_v3.1.7/package.json /var/www/flyer-app/backend/

# Install dependencies
cd /var/www/flyer-app/backend
npm install --production
```

### 4. Frontend Deployment

```bash
# Smazat starý frontend
rm -rf /var/www/flyer-app/frontend/*

# Zkopírovat nový build
cp -r /path/to/Production_v3.1.7/frontend/* /var/www/flyer-app/frontend/

# Nastavit oprávnění
chown -R www-data:www-data /var/www/flyer-app/frontend
chmod -R 755 /var/www/flyer-app/frontend
```

### 5. Start Services

```bash
pm2 start flyer-app-backend
pm2 save
pm2 status
```

---

## Verifikace

### Backend Checks

```bash
# 1. Backend běží
pm2 status
# Očekáváno: flyer-app-backend | online

# 2. Logy OK
pm2 logs flyer-app-backend --lines 50
# Očekáváno: Žádné ERROR zprávy

# 3. Health check
curl https://eflyer.kuchyneoresi.eu/api/health
# Očekáváno: {"status": "ok"}

# 4. Verify soldOut field exists
psql -U flyer_app_user flyer_app_production -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'soldOut';"
# Očekáváno: soldOut | boolean
```

### Frontend Checks

```bash
# 1. Frontend načítá
curl -I https://eflyer.kuchyneoresi.eu
# Očekáváno: HTTP/1.1 200 OK

# 2. Main JS bundle existuje
curl -I https://eflyer.kuchyneoresi.eu/static/js/main.[hash].js
# Očekáváno: HTTP/1.1 200 OK
```

### Functional Tests

**Test 1: Vodotisk vyprodáno**
1. Přihlásit se jako admin
2. Navigovat na "Produkty v letácích"
3. Kliknout "Synchronizovat stav vyprodáno"
4. Ověřit: Ukončené produkty mají červený vodotisk "VYPRODÁNO"

**Test 2: Filtry produktů**
1. V sekci "Produkty v letácích"
2. Kliknout na zelený "Aktivní v ERP"
3. Ověřit: Zobrazují se jen aktivní produkty, karta má zelený border
4. Kliknout na červený "Ukončené"
5. Ověřit: Zobrazují se jen ukončené, karta má červený border

**Test 3: Generování PDF**
1. Přihlásit se jako approver
2. Navigovat na "Aktivní letáky"
3. Kliknout "Generovat PDF" u nějakého letáku
4. Potvrdit dialog
5. Ověřit: Objevila se zpráva "PDF bylo úspěšně přegenerováno"
6. Stáhnout PDF a ověřit vodotisky

---

## Troubleshooting

### Problem: "Column soldOut does not exist"

**Symptom:** Backend error při startu nebo při volání API.

**Cause:** Database migration nebyla spuštěna.

**Solution:**
```bash
cd /var/www/flyer-app/backend
npx prisma db push
pm2 restart flyer-app-backend
```

---

### Problem: Approver nemůže generovat PDF (403 Forbidden)

**Symptom:** 403 error při kliknutí na "Generovat PDF".

**Cause:**
1. Backend neběží na nové verzi
2. Role guard není správně nakonfigurována

**Solution:**
```bash
# Zkontroluj verzi backendu
pm2 logs flyer-app-backend | grep "version"

# Zkontroluj že endpoint má @Roles('approver', 'admin')
cat /var/www/flyer-app/backend/dist/src/flyers/flyers.controller.js | grep -A 5 "generate-pdf"

# Restart backendu
pm2 restart flyer-app-backend
```

---

### Problem: Vodotisk se nezobrazuje ve frontendu

**Symptom:** Vyprodané produkty nemají vodotisk.

**Cause:**
1. Frontend neběží na nové verzi
2. Produkt nemá `soldOut=true`

**Solution:**
```bash
# Zkontroluj frontend verzi
curl https://eflyer.kuchyneoresi.eu/static/js/main.[hash].js | grep -o "3.1.7"

# Zkontroluj produkt v DB
psql -U flyer_app_user flyer_app_production -c "SELECT id, name, soldOut FROM \"Product\" WHERE id='[product-id]';"

# Clear browser cache a refresh
```

---

### Problem: Filtry nefungují

**Symptom:** Kliknutí na filtr nemění zobrazené produkty.

**Cause:** Frontend state se neupdatuje.

**Solution:**
```bash
# Hard refresh v prohlížeči: Ctrl+Shift+R
# Zkontroluj console errors
# Zkontroluj že frontend je na v3.1.7
```

---

## Rollback procedura

### Kdy rollback?

Rollback proveď pokud:
- ❌ Backend nelze nastartovat
- ❌ Kritické funkce nefungují (login, vytvoření letáku, schvalování)
- ❌ Database corruption
- ❌ Více než 30% uživatelů hlásí problémy

### Rollback steps

```bash
# 1. Stop backend
pm2 stop flyer-app-backend

# 2. Restore database
psql -U flyer_app_user flyer_app_production < backup_[timestamp].sql

# 3. Restore backend
rm -rf /var/www/flyer-app/backend
cp -r /var/www/flyer-app/backend_backup_[date] /var/www/flyer-app/backend

# 4. Restore frontend
rm -rf /var/www/flyer-app/frontend
cp -r /var/www/flyer-app/frontend_backup_[date] /var/www/flyer-app/frontend

# 5. Start backend
cd /var/www/flyer-app/backend
pm2 start flyer-app-backend
pm2 save

# 6. Verify
pm2 status
curl https://eflyer.kuchyneoresi.eu/api/health
curl https://eflyer.kuchyneoresi.eu
```

### Post-rollback

```bash
# Verify version is back to 3.1.6
psql -U flyer_app_user flyer_app_production -c "\d products"
# soldOut column should NOT exist

# Check logs
pm2 logs --lines 100

# Inform users
# Investigate root cause before re-attempting deployment
```

---

## Performance Impact

**Expected:**
- Frontend bundle size: +5KB (watermark overlay component)
- Backend memory: +10MB (PDF generation s watermarkem)
- Database: +1 column (boolean, minimal impact)
- API response time: Žádný impact

**Monitoring:**
```bash
# CPU usage
pm2 monit

# Memory usage
free -h

# Database size
psql -U flyer_app_user flyer_app_production -c "SELECT pg_size_pretty(pg_database_size('flyer_app_production'));"
```

---

## Security Considerations

**Permission Bypass:**
- Nová metoda `updatePdfData()` obchází permission checks
- **Risk Assessment:** LOW
- **Mitigation:**
  - Metoda je volána pouze z `@Roles('approver', 'admin')` endpointu
  - Aktualizuje pouze `pdfData` a `pdfMimeType`, nikoliv business logiku
  - Neprovádí žádné state transitions (Draft → Approved, atd.)

**Input Validation:**
- Všechny nové endpointy používají DTO validation
- soldOut field je boolean, nelze inject

**CORS:**
- Žádné změny v CORS konfiguraci

---

## Support & Contacts

**Technical Support:** eletak@oresi.cz
**Developer:** Claude Code
**Documentation:** README.txt, UZIVATELSKY_NAVOD.html

---

**Generated:** 11. listopadu 2025
**Build Tool:** build-production.ps1
**Deployment Environment:** Production (https://eflyer.kuchyneoresi.eu)
