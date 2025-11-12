================================================================================
  FLYER MANAGEMENT SYSTEM - Production Release v3.1.8
================================================================================

Datum: 12. listopadu 2025
Verze: 3.1.8
Typ: Hotfix
Environment: Production (https://eflyer.kuchyneoresi.eu)

================================================================================
  CO JE NOVÉHO v3.1.8
================================================================================

🐛 HOTFIX - Pole "Typ spotřebiče" (installationType)

   PROBLÉM v v3.1.7:
   - V produkčním prostředí se pole "Typ spotřebiče" (installationType)
     nezaznamenávalo při kliknutí na tlačítko "ERP"
   - Pole bylo disabled i když ERP vrátil hodnotu

   ŘEŠENÍ:
   - Zjednodušena disabled logika pro pole installationType
   - Pole je nyní disabled pouze když je produkt v aktivním letáku
   - ERP auto-fill nyní funguje korektně v produkci

   ZMĚNĚNÉ SOUBORY:
   - src/pages/products/ProductFormPage.tsx (řádek 746)
     * Odstraněna složitá disabled podmínka
     * Nyní: disabled={isInActiveFlyer}
     * Pole je vždy editovatelné pokud není v aktivním schváleném letáku

   - backend/src/flyers/flyers.controller.ts (řádek 242)
     * Přidána práva pro generate-pdf endpoint
     * Nyní: @Roles('supplier', 'pre_approver', 'approver', 'admin')
     * Supplier může generovat PDF náhled při vytváření letáku

================================================================================
  ZMĚNY OD v3.1.6
================================================================================

Verze 3.1.7 přinesla:
✨ Vodotisk "VYPRODÁNO" pro ukončené produkty
✨ Synchronizace stavu vyprodáno s ERP (admin)
✨ Filtry produktů v aktivních letácích (admin)
✨ Tlačítko "Generovat PDF" pro schvalov atele
🐛 Fix: Icon image serving (res.end místo res.send)

Verze 3.1.8 přinesla:
🐛 Hotfix: Pole "Typ spotřebiče" - správné chování ERP auto-fill

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
   ☐ v3.1.8 je pouze frontend hotfix
   ☐ Databáze zůstává beze změn
   ☐ PŘESKOČ tento krok - pokračuj krokem 3 (Nasazení backendu)

3. NASAZENÍ BACKENDU
   ------------------
   ☐ pm2 stop flyer-app-backend
   ☐ cp -r dist/* /var/www/flyer-app/backend/
   ☐ cp .env /var/www/flyer-app/backend/
   ☐ cp package.json /var/www/flyer-app/backend/
   ☐ cd /var/www/flyer-app/backend && npm install --production
   ☐ pm2 start flyer-app-backend

4. NASAZENÍ FRONTENDU
   -------------------
   ☐ cp -r frontend/* /var/www/flyer-app/frontend/
   ☐ chown -R www-data:www-data /var/www/flyer-app/frontend
   ☐ chmod -R 755 /var/www/flyer-app/frontend

5. VERIFIKACE
   -----------
   ☐ pm2 status - backend běží
   ☐ pm2 logs --lines 20 - žádné errors
   ☐ API odpovídá: curl https://eflyer.kuchyneoresi.eu/api/health
   ☐ Přihlášení funguje
   ☐ TEST: Vytvoř nový produkt, klikni "ERP", ověř že typ spotřebiče se vyplnil

================================================================================
  TESTOVACÍ SCÉNÁŘE - KRITICKÉ TESTY pro v3.1.8
================================================================================

⚡ PRIORITY TEST - ERP Auto-fill Typ spotřebiče

Test: Ověření ERP auto-fill funkcionality
   1. Přihlas se jako dodavatel (supplier)
   2. Klikni "Produkty" > "Přidat produkt"
   3. Zadej EAN kód produktu který má v ERP pole "typ" (BI nebo FS)
   4. Klikni tlačítko "ERP"
   5. ✓ Pole "Typ spotřebiče" se automaticky vyplní
   6. ✓ Hodnota je "Vestavné spotřebiče" (pro BI) nebo "Volně stojící spotřebiče" (pro FS)
   7. ✓ Pole NENÍ disabled (lze ho změnit)
   8. Ulož produkt
   9. ✓ Typ spotřebiče se uložil správně
   10. Otevři produkt znovu
   11. ✓ Typ spotřebiče je správně načten

DŮLEŽITÉ:
- Tento test je kritický pro v3.1.8 hotfix
- Pokud ERP nevrací typ, pole zůstane prázdné (to je OK)
- Pole musí být vždy editovatelné (kromě produktů v aktivním letáku)

═══ KOMPLETNÍ TESTY (Regression testing) ═══

Pro kompletní test coverage viz DEPLOY_CHECKLIST.txt - obsahuje všech 26 testů.
Pro v3.1.8 je klíčový test výše + testy z v3.1.7 (vodotisky, filtry, PDF).

================================================================================
  DŮLEŽITÉ POZNÁMKY
================================================================================

⚠️  DATABÁZE:
    - Tento release NEOBSAHUJE žádné databázové změny!
    - Databáze zůstává beze změn
    - NENÍ třeba žádná migrace

⚠️  KOMPATIBILITA:
    - Hotfix je zpětně kompatibilní s v3.1.7
    - Frontend: změna v ProductFormPage (installationType field)
    - Backend: přidána práva pro generate-pdf endpoint (supplier může generovat PDF)

⚠️  ROLLBACK:
    - Pokud je problém, lze bezpečně vrátit na v3.1.7
    - ŽÁDNÉ databázové změny = žádný rollback migrací
    - Stačí zkopírovat backend/frontend soubory z v3.1.7

================================================================================
  PODPORA
================================================================================

Technická podpora: eletak@oresi.cz
Dokumentace: README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
Build: Claude Code (AI Assistant)
Build date: 12. listopadu 2025

================================================================================
