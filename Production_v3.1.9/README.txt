================================================================================
  FLYER MANAGEMENT SYSTEM - Production Release v3.1.9
================================================================================

Datum: 12. listopadu 2025
Verze: 3.1.9
Typ: Hotfix
Environment: Production (https://eflyer.kuchyneoresi.cz)

================================================================================
  CO JE NOVÉHO v3.1.9
================================================================================

🐛 HOTFIX - Detekce ukončených produktů z ERP

   PROBLÉM v v3.1.8:
   - Produkty které existovaly v ERP ale měly pole Ukonceno = 1
     nebyly detekovány jako ukončené
   - Vodotisk "VYPRODÁNO" se nezobrazoval u těchto produktů
   - Synchronizace stavu neoznačovala tyto produkty jako soldOut

   ŘEŠENÍ:
   - Metoda checkProductsExistence() nyní kontroluje pole Ukonceno z ERP view
   - SQL dotaz: SELECT DISTINCT Barcode, ISNULL(Ukonceno, 0) as Ukonceno
   - NULL hodnoty se považují za 0 (ne ukončeno)
   - Produkt je discontinued pokud:
     * BUĎTO není ve view vůbec (!exists)
     * NEBO je ve view ale má Ukonceno = 1 (pouze 1, ne 0 ani NULL)

   ZMĚNĚNÉ SOUBORY:
   - backend/src/common/mssql.service.ts (řádky 220-269)
     * SQL: ISNULL(Ukonceno, 0) - NULL se považuje za 0
     * Metoda nyní vrací { exists: boolean, discontinued: boolean }
     * Kontrola: record.Ukonceno == 1 (loose equality pro number i string)
     * DŮLEŽITÉ: Název sloupce je "Ukonceno" bez diakritiky!

   - backend/src/products/products.service.ts (řádky 976-990)
     * Upravena logika: discontinued: !erpStatus?.exists || erpStatus?.discontinued
     * Produkt je ukončený pokud není v ERP NEBO má Ukonceno = 1

================================================================================
  ZMĚNY OD v3.1.6
================================================================================

Verze 3.1.7 přinesla:
✨ Vodotisk "VYPRODÁNO" pro ukončené produkty
✨ Synchronizace stavu vyprodáno s ERP (admin)
✨ Filtry produktů v aktivních letácích (admin)
✨ Tlačítko "Generovat PDF" pro schvalovatele
🐛 Fix: Icon image serving (res.end místo res.send)

Verze 3.1.8 přinesla:
🐛 Hotfix: Pole "Typ spotřebiče" - správné chování ERP auto-fill
🐛 Hotfix: Generování PDF pro supplier - přidána práva

Verze 3.1.9 přinesla:
🐛 Hotfix: Detekce ukončených produktů - kontrola pole Ukonceno v ERP
🐛 Hotfix: Type coercion fix - loose equality (==) místo strict (===)

================================================================================
  RYCHLÝ START DEPLOYMENT
================================================================================

1. PŘÍPRAVA
   ----------
   ☐ Záloha databáze: pg_dump flyer_app_production > backup_$(date +%Y%m%d).sql
   ☐ Záloha současných souborů: cp -r /var/www/flyer-app /var/www/flyer-app_backup
   ☐ Zkontroluj že žádní uživatelé nejsou přihlášení

2. DATABÁZE
   ----------
   ☐ TENTO RELEASE NEOBSAHUJE DATABÁZOVÉ ZMĚNY!
   ☐ v3.1.9 je backend hotfix pro detekci ukončených produktů
   ☐ Databáze zůstává beze změn
   ☐ PŘESKOČ tento krok - pokračuj krokem 3 (Nasazení backendu)

3. NASAZENÍ BACKENDU (HLAVNÍ ZMĚNA)
   ------------------
   ☐ pm2 stop flyer-app-backend
   ☐ rm -rf /var/www/flyer-app/backend/dist
   ☐ cp -r dist /var/www/flyer-app/backend/
   ☐ cp .env /var/www/flyer-app/backend/
   ☐ cp package.json /var/www/flyer-app/backend/
   ☐ cd /var/www/flyer-app/backend && npm install --production
   ☐ pm2 start flyer-app-backend

4. NASAZENÍ FRONTENDU (pouze číslo verze)
   -------------------
   ☐ cp -r frontend/* /var/www/flyer-app/frontend/
   ☐ chown -R www-data:www-data /var/www/flyer-app/frontend
   ☐ chmod -R 755 /var/www/flyer-app/frontend

5. VERIFIKACE
   -----------
   ☐ pm2 status - backend běží
   ☐ pm2 logs --lines 20 - žádné errors
   ☐ API odpovídá: curl https://eflyer.kuchyneoresi.cz/api/health
   ☐ Přihlášení funguje
   ☐ TEST: Produkty v letácích - zkontroluj že ukončené produkty mají červenou ikonu
   ☐ TEST: Synchronizovat stav vyprodáno - zkontroluj že funguje

================================================================================
  TESTOVACÍ SCÉNÁŘE - KRITICKÉ TESTY pro v3.1.9
================================================================================

⚡ PRIORITY TEST - Detekce ukončených produktů z ERP

Test: Ověření detekce produktů s Ukonceno = 1 v ERP
   1. Přihlas se jako admin
   2. Klikni na "Produkty v letácích" v menu
   3. Zobrazí se seznam produktů v aktivních letácích
   4. ✓ Produkty které mají Ukonceno = 1 v ERP jsou označeny červenou ikonou
   5. ✓ Produkty které nejsou v ERP vůbec jsou také označeny červenou ikonou
   6. ✓ Produkty které jsou v ERP a mají Ukonceno = 0 jsou označeny zelenou ikonou
   7. Klikni na červený filtr "Ukončené"
   8. ✓ Zobrazí se pouze produkty s červenou ikonou
   9. Klikni "Synchronizovat stav vyprodáno"
   10. ✓ Ukončené produkty jsou označeny jako soldOut v databázi
   11. Stáhni PDF některého letáku který obsahuje ukončené produkty
   12. ✓ Vodotisk "VYPRODÁNO" se zobrazuje u ukončených produktů

DŮLEŽITÉ:
- Tento test je kritický pro v3.1.9 hotfix
- Ukončené produkty = produkty které buď nejsou v ERP, nebo mají Ukonceno = 1
- Vodotisk se má zobrazit u všech ukončených produktů
- TEST DATA: Barcode 8806094305029 (Ukonceno=0) = aktivní
             Barcode 8806094348668 (Ukonceno=1) = ukončený

═══ KOMPLETNÍ TESTY (Regression testing) ═══

Pro kompletní test coverage viz DEPLOY_CHECKLIST.txt - obsahuje všech 26 testů.
Pro v3.1.9 je klíčový test výše + testy z v3.1.7 a v3.1.8.

================================================================================
  DŮLEŽITÉ POZNÁMKY
================================================================================

⚠️  DATABÁZE:
    - Tento release NEOBSAHUJE žádné databázové změny!
    - Databáze zůstává beze změn
    - NENÍ třeba žádná migrace

⚠️  KOMPATIBILITA:
    - Hotfix je zpětně kompatibilní s v3.1.8
    - Backend: nová logika pro detekci ukončených produktů
    - Frontend: pouze změna čísla verze

⚠️  ROLLBACK:
    - Pokud je problém, lze bezpečně vrátit na v3.1.8
    - ŽÁDNÉ databázové změny = žádný rollback migrací
    - Stačí zkopírovat backend/frontend soubory z v3.1.8

⚠️  DŮLEŽITÉ PRO TESTOVÁNÍ:
    - Detekce ukončených produktů je nyní přesnější
    - Produkty s Ukonceno = 1 v ERP budou nyní správně označeny
    - Vodotisk "VYPRODÁNO" se bude zobrazovat u více produktů než v3.1.8
    - Type coercion fix: loose equality (==) místo strict (===)

================================================================================
  PODPORA
================================================================================

Technická podpora: eletak@oresi.cz
Dokumentace: README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
Build: Claude Code (AI Assistant)
Build date: 12. listopadu 2025

================================================================================
