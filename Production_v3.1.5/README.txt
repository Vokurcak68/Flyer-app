================================================================================
  FLYER APP - PRODUCTION PACKAGE v3.1.5
  Build Date: 2025-11-10
================================================================================

OBSAH BALÍČKU:
==============
dist/          - Zkompilovaný backend (NestJS)
frontend/      - Zkompilovaný frontend (React)
prisma/        - Database schema a migrace
package.json   - Verze 3.1.5
.env           - Production konfigurace (API_URL, FRONTEND_URL)

DOKUMENTACE:
============
DEPLOYMENT_NOTES.md  - Detailní technická dokumentace
DEPLOY_CHECKLIST.txt - Checklist pro nasazení krok za krokem
README.txt           - Tento soubor

CO BYLO OPRAVENO A PŘIDÁNO:
============================
KRITICKÁ OPRAVA: Promo obrázky zmizely po "Odeslat k autorizaci"
NOVÁ FUNKCE: Správa podkategorií přímo v admin UI
NOVÁ FUNKCE: Rozlišení vestavných a volně stojících spotřebičů v kategoriích

1. Ikony s průhledností v PDF (NOVÉ)

   Předchozí chování:
     - Všechny obrázky včetně ikon konvertovány na JPEG
     - JPEG nepodporuje průhlednost (alpha kanál)
     - Ikony ztratily průhledné pozadí ❌

   Nové chování:
     - Produktové a promo obrázky → JPEG (konfigurovatelná kvalita)
     - Ikony → PNG (zachovává průhlednost) ✓
     - Kvalita nastavitelná přes .env bez nového nasazení ✓

   Změněné soubory:
   - backend/src/flyers/pdf.service.ts
   - backend/.env (nové parametry PDF_*_QUALITY)

1a. PDF bez timestampu - úspora místa (NOVÉ)

   Předchozí chování:
     - Každé generování PDF vytvořilo nový soubor s timestampem
     - flyer-123-1234567890.pdf, flyer-123-1234567891.pdf, atd.
     - Po čase desítky/stovky duplicitních PDF ❌

   Nové chování:
     - PDF soubor se přepisuje (stejný název bez timestampu)
     - flyer-123.pdf se aktualizuje při každém generování
     - Šetří místo na serveru ✓

1b. Řazení ikon v PDF shodné s návrhem (NOVÉ)

   Předchozí chování:
     - PDF rovnoměrně rozmisťovalo ikony podle počtu
     - 1 ikona: uprostřed, 2 ikony: nahoře + dole, atd.
     - Jiné než v náhledu letáku ❌

   Nové chování:
     - PDF používá fixní 4 sloty, plní od vrchu
     - Stejné jako v náhledu letáku ✓
     - Co vidíš v editoru = co dostaneš v PDF ✓

2. Frontend: Přidáno ukládání stránek před odesláním k autorizaci

   Předchozí chování:
     - Dodavatel přidá promo obrázek do letáku
     - Klikne "Odeslat k autorizaci"
     - Frontend uloží pouze metadata (název, akce, datum)
     - Backend vygeneruje PDF z aktuálního stavu DB
     - Pokud autosave neproběhl, promo zmizí ❌

   Nové chování:
     - Dodavatel přidá promo obrázek do letáku
     - Klikne "Odeslat k autorizaci"
     - Frontend explicitně uloží VŠECHNA data včetně stránek
     - Backend vygeneruje PDF s aktuálními daty
     - Promo obrázek zůstává v letáku ✓

   Změněný soubor:
   - src/pages/flyers/FlyerEditorPage.tsx, řádek 326
   - Přidáno: pages: preparePagesForAPI(flyerData.pages)

3. Backend: Vyčištění debug loggingu

   - Odstraněny všechny console.log ladící výpisy
   - Kód je čistý a profesionální

4. Správa podkategorií v Admin UI (NOVÉ)

   Předchozí chování:
     - Podkategorie šly vytvářet pouze přímo v databázi
     - Admin neměl UI pro správu podkategorií ❌
     - Nutný přístup do databáze pro změny ❌

   Nové chování:
     - Inline správa podkategorií v editaci kategorie ✓
     - Přidání nové podkategorie (tlačítko + Enter)
     - Editace názvu (tužka → input → uložit/zrušit)
     - Mazání s potvrzením (koš → dialog)
     - Ochrana: nelze smazat podkategorii s produkty ✓
     - Real-time aktualizace pomocí React Query ✓

   Backend API endpointy (pouze admin):
   - POST /categories/:id/subcategories
   - PUT /categories/subcategories/:id
   - DELETE /categories/subcategories/:id

   Změněné soubory:
   - backend/src/categories/dto/subcategory.dto.ts (NOVÝ)
   - backend/src/categories/categories.service.ts (3 metody)
   - backend/src/categories/categories.controller.ts (3 endpointy)
   - src/pages/categories/CategoryFormPage.tsx (UI management)
   - src/services/categoriesService.ts (frontend metody)

5. Typ kategorie - Vestavné vs Volně stojící spotřebiče (NOVÉ)

   Předchozí chování:
     - Žádné rozlišení mezi vestavnými a volně stojícími spotřebiči
     - Kategorie neměly pole pro typ spotřebiče ❌

   Nové chování:
     - Zaškrtávátko "Vestavné spotřebiče" v editaci kategorie ✓
     - Sloupec "Typ" v seznamu kategorií s barevnými badgy:
       - Fialový badge: "Vestavné" (vestavné spotřebiče)
       - Modrý badge: "Volně stojící" (volně stojící spotřebiče)
     - Všechny existující kategorie defaultně nastaveny na "Volně stojící" ✓
     - Snadná identifikace typu kategorie na první pohled ✓

   Database migrace:
   - Nové pole: is_built_in (boolean, default: false)
   - Migrace: 20251110100718_add_is_built_in_to_category

   Změněné soubory:
   - backend/prisma/schema.prisma (přidáno pole isBuiltIn)
   - backend/prisma/migrations/.../migration.sql (SQL migrace)
   - backend/src/categories/dto/*.dto.ts (DTOs aktualizovány)
   - backend/src/categories/categories.service.ts (create/update)
   - src/pages/categories/CategoryFormPage.tsx (zaškrtávátko)
   - src/pages/categories/CategoriesListPage.tsx (sloupec Typ + badgy)
   - src/services/categoriesService.ts (interface + metody)

KONFIGURACE V .ENV:
====================
Nové parametry pro nastavení kvality PDF obrázků (lze změnit bez nového nasazení):

PDF_PRODUCT_JPEG_QUALITY=100    # Kvalita produktových obrázků (1-100)
PDF_PROMO_JPEG_QUALITY=100      # Kvalita promo obrázků (1-100)
PDF_ICON_PNG_COMPRESSION=9      # PNG komprese ikon s průhledností (0-9)

Pokud potřebuješ zmenšit velikost PDF:
- Sniž PDF_PRODUCT_JPEG_QUALITY na 85-95 (doporučeno: 90)
- Sniž PDF_PROMO_JPEG_QUALITY na 85-95 (doporučeno: 90)
- Ikony nech na 9 (maximální komprese, zachovává průhlednost)

BUILD VERIFICATION:
===================
✓ Backend version: 3.1.5
✓ Frontend version: 3.1.5 (footer)
✓ Backend fix verified: 4x hasAccessToBrand (z v3.1.4)
✓ Frontend fix verified: pages: preparePagesForAPI v submit mutation
✓ Frontend URLs verified: 0x localhost:4000, 13x /api
✓ Debug logging removed: clean code

QUICK START:
============
1. Stop-Service FlcyManagementAPI
2. Backup: Copy C:\inetpub\flyer-app\backend to backup folder
3. Copy all files from this folder to C:\inetpub\flyer-app\backend\
4. Verify .env has correct URLs
5. DŮLEŽITÉ: Spusť databázovou migraci: npx prisma migrate deploy
6. Start-Service FlcyManagementAPI
7. Check footer shows "Verze: 3.1.5"
8. Test: Create flyer with promo → Submit for verification → Check promo persists

DŮLEŽITÉ:
=========
Po nasazení MUSÍ být v patičce aplikace verze 3.1.5!
Pokud vidíš starší verzi, deployment nefungoval správně.

TESTOVÁNÍ:
==========
Test 1 - Kritický workflow promo obrázků:
1. Admin vytvoří promo s brandId
2. Dodavatel s tímto brandem přidá promo do letáku
3. Dodavatel klikne "Odeslat k autorizaci"
4. Ověř, že promo je v letáku po reloadu
5. Ověř, že promo je v PDF u předschvalovatele
6. Ověř, že promo je v PDF u schvalovatele

Test 2 - Správa podkategorií (NOVÉ):
1. Admin přejde do Správa kategorií
2. Klikne Upravit na kategorii
3. Scrolluj dolů na sekci "Podkategorie"
4. Přidej novou podkategorii (input + Přidat)
5. Edituj podkategorii (tužka → změň → Enter/zaškrtnout)
6. Smaž podkategorii (koš → potvrď)
7. Test validace: zkus smazat podkategorii s produkty → chyba ✓

Test 3 - Typ kategorie (NOVÉ):
1. Admin přejde do Správa kategorií
2. Ověř, že všechny kategorie mají badge v sloupci "Typ" (modrý = Volně stojící)
3. Vytvoř novou kategorii s "Vestavné spotřebiče" zaškrtnuté
4. Ověř, že kategorie má fialový badge "Vestavné" v seznamu ✓
5. Edituj kategorii a změň typ (zaškrtni/odškrtni checkbox)
6. Ověř, že badge se změnil podle typu ✓

PRO DETAILY:
============
Viz DEPLOYMENT_NOTES.md a DEPLOY_CHECKLIST.txt

================================================================================
