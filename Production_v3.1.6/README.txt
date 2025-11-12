================================================================================
  FLYER APP - PRODUCTION PACKAGE v3.1.6
  Build Date: 2025-11-10
================================================================================

OBSAH BALÍČKU:
==============
dist/          - Zkompilovaný backend (NestJS)
frontend/      - Zkompilovaný frontend (React)
prisma/        - Database schema a migrace
package.json   - Verze 3.1.6
.env           - Production konfigurace (API_URL, FRONTEND_URL)
MIGRATE.sql    - SQL migrace pro v3.1.6

DOKUMENTACE:
============
DEPLOYMENT_NOTES.md  - Detailní technická dokumentace
DEPLOY_CHECKLIST.txt - Checklist pro nasazení krok za krokem
README.txt           - Tento soubor

CO BYLO PŘIDÁNO VE VERZI 3.1.6:
================================

1. TYP INSTALACE PRODUKTŮ (NOVÉ)

   Předchozí chování:
     - Kategorie měla pole is_built_in (true/false)
     - Produkty neměly žádné pole pro typ instalace
     - Nebylo možné rozlišit vestavné/volně stojící produkty ❌

   Nové chování:
     - Kategorie má pole requires_installation_type (boolean)
     - Pokud true, produkt MUSÍ mít vybraný typ instalace
     - Produkty mají nové pole installation_type (BUILT_IN/FREESTANDING)
     - Conditional dropdown - zobrazí se pouze pokud kategorie to vyžaduje ✓
     - Validace: pokud kategorie vyžaduje typ, nelze uložit bez výběru ✓

   Database migrace:
   - Migration 1: Přejmenování sloupce is_built_in → requires_installation_type
   - Migration 2: Vytvoření ENUM InstallationType (BUILT_IN, FREESTANDING)
   - Migration 2: Přidání sloupce installation_type do products

   Změněné soubory:
   Backend:
   - backend/prisma/schema.prisma (nový ENUM, přejmenování pole)
   - backend/prisma/migrations/20251110101500_*/migration.sql
   - backend/prisma/migrations/20251110102000_*/migration.sql
   - backend/src/categories/dto/*.dto.ts (requiresInstallationType)
   - backend/src/products/dto/*.dto.ts (installationType)

   Frontend:
   - src/pages/products/ProductFormPage.tsx (conditional dropdown)
   - src/services/productsService.ts (interface s installationType)
   - src/services/categoriesService.ts (interface s requiresInstallationType)

2. BAREVNÉ POZADÍ IKON PODLE ZNAČKY (NOVÉ)

   Předchozí chování:
     - Všechny ikony zobrazeny s bílým pozadím
     - Nebylo možné mít ikony s barevným pozadím značky ❌

   Nové chování:
     - Ikony mají nové pole use_brand_color (boolean, default: false)
     - Pokud true, ikona se zobrazí s pozadím v barvě značky ✓
     - Funguje v náhledu letáku i v PDF ✓
     - Barevné pozadí přebírá brand.color z produktu ✓

   Database migrace:
   - Migration 3: Přidání sloupce use_brand_color do icons (boolean)

   Změněné soubory:
   Backend:
   - backend/prisma/schema.prisma (přidáno pole useBrandColor)
   - backend/prisma/migrations/20251110120000_*/migration.sql
   - backend/src/icons/dto/*.dto.ts (useBrandColor)
   - backend/src/flyers/pdf.service.ts (renderování barevného pozadí)

   Frontend:
   - src/pages/icons/IconFormPage.tsx (checkbox "Použít barvu značky")
   - src/components/flyer/ProductFlyerLayout.tsx (zobrazení barevného pozadí)
   - src/services/iconsService.ts (interface s useBrandColor)

3. ŠEDÉ POZADÍ U BÍLÝCH IKON (Z v3.1.5, součástí v3.1.6)

   Funkce:
     - Bílé nebo průhledné ikony automaticky dostanou šedé pozadí
     - Zajišťuje viditelnost ikon na bílém pozadí letáku
     - Funguje v náhledu i v PDF

4. 46 PLACEHOLDERŮ PRO SCREENSHOTY V UŽIVATELSKÉ NÁPOVĚDĚ (NOVÉ)

   Změněné soubory:
   - UZIVATELSKY_NAVOD.html (46 šedých placeholderů s 📸 emoji)
   - SCREENSHOTY_TODO.md (guide pro vytvoření screenshotů)

   Každý placeholder má:
   - Šedý rámeček s border
   - 📸 emoji a popis "Screenshot: [co má být na obrázku]"
   - Připraveno pro nahrazení skutečnými screenshoty

5. AKTUALIZACE KONTAKTŮ (NOVÉ)

   Změny:
   - Email změněn na: eletak@oresi.cz (bez diakritiky)
   - Telefon odstraněn

   Změněné soubory:
   - UZIVATELSKY_NAVOD.html (sekce kontaktů)

6. ZMENŠENÁ MEZERA V PATIČCE (NOVÉ)

   Předchozí: mt-12 pt-6 (velká mezera nad patičkou)
   Nové: mt-3 pt-1.5 (menší mezera, úspora místa)

   Změněné soubory:
   - src/components/layout/AppFooter.tsx

KONFIGURACE V .ENV:
====================
Production konfigurace v .env je převzata z backend/.env.production:

DATABASE_URL="postgresql://..."
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://eflyer.kuchyneoresi.eu
API_URL=https://eflyer.kuchyneoresi.eu
JWT_SECRET=...
JWT_EXPIRATION=7d

PDF kvalita (lze změnit bez nového nasazení):
PDF_PRODUCT_JPEG_QUALITY=100
PDF_PROMO_JPEG_QUALITY=100
PDF_ICON_PNG_COMPRESSION=9

BUILD VERIFICATION:
===================
✓ Backend version: 3.1.6 (package.json)
✓ Frontend version: 3.1.6 (package.json, AppFooter.tsx)
✓ Frontend URLs verified: 0x localhost:4000, 13x /api
✓ Production .env: correct (from backend/.env.production)
✓ Database migrations: 3 migrations included in MIGRATE.sql

QUICK START:
============
1. Stop-Service FlcyManagementAPI
2. Backup: Copy C:\inetpub\flyer-app\backend to backup folder
3. Copy all files from this folder to C:\inetpub\flyer-app\backend\
4. Verify .env has correct URLs
5. KRITICKÉ: Spusť databázové migrace:
   cd C:\inetpub\flyer-app\backend
   npx prisma migrate deploy
6. Start-Service FlcyManagementAPI
7. Check footer shows "Verze: 3.1.6"
8. Test nové funkce (viz TESTOVÁNÍ níže)

DŮLEŽITÉ:
=========
Po nasazení MUSÍ být v patičce aplikace verze 3.1.6!
Pokud vidíš starší verzi, deployment nefungoval správně.

TESTOVÁNÍ:
==========
Test 1 - Typ instalace produktů:
1. Admin přejde do Správa kategorií
2. Edituj kategorii, zaškrtni "Vyžaduje typ instalace"
3. Ulož kategorii
4. Přejdi do Správa produktů → Přidat produkt
5. Vyber kategorii s požadovaným typem instalace
6. Ověř, že se objevil dropdown "Typ instalace" ✓
7. Vyber BUILT_IN nebo FREESTANDING
8. Ulož produkt
9. Edituj produkt, ověř že typ zůstal zachován ✓

Test 2 - Barevné pozadí ikon:
1. Admin přejde do Správa ikon
2. Vytvoř nebo edituj ikonu
3. Zaškrtni "Použít barvu značky jako pozadí"
4. Ulož ikonu
5. Vytvoř leták s produktem, přidej tuto ikonu
6. Ověř, že ikona má barevné pozadí v náhledu ✓
7. Vygeneruj PDF
8. Ověř, že ikona má barevné pozadí v PDF ✓

Test 3 - Šedé pozadí u bílých ikon:
1. Použij ikonu s bílým/průhledným obsahem
2. Neškrtávej "Použít barvu značky"
3. Přidej ikonu do letáku
4. Ověř, že ikona má šedé pozadí (viditelnost) ✓

Test 4 - Screenshoty v nápovědě:
1. Otevři UZIVATELSKY_NAVOD.html v prohlížeči
2. Ověř, že obsahuje 46 placeholderů s 📸 emoji ✓
3. Pro vytvoření screenshotů viz SCREENSHOTY_TODO.md

Test 5 - Kontakty a patička:
1. Ověř, že email je eletak@oresi.cz (bez diakritiky) ✓
2. Ověř, že telefon byl odstraněn ✓
3. Ověř, že mezera nad patičkou je menší ✓

PRO DETAILY:
============
Viz DEPLOYMENT_NOTES.md a DEPLOY_CHECKLIST.txt

================================================================================
