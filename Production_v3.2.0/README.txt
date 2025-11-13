================================================================================
  FLYER MANAGEMENT SYSTEM - Production Release v3.2.0
================================================================================

Datum: 12. listopadu 2025
Verze: 3.2.0
Typ: Feature Release
Environment: Production (https://eflyer.kuchyneoresi.eu)

================================================================================
  CO JE NOVÉHO v3.2.0
================================================================================

✨ NOVÉ FUNKCE

1. Změna značky produktu při editaci
   - Administrátor může nyní změnit značku (brand) produktu při editaci
   - Užitečné pro přeřazení produktů mezi dodavateli
   - Frontend i backend validace

2. Změna hesla uživatele (Admin)
   - Admin může změnit heslo jakéhokoliv uživatele
   - Heslo je volitelné při editaci (vyplňuje se pouze při změně)
   - Minimální délka 6 znaků

3. Zobrazení poznámky dodavatele
   - Poznámka dodavatele (supplierNote) se zobrazuje v seznamu produktů
   - Zobrazeno jako druhý řádek pod názvem produktu
   - Šedivá barva pro odlišení od názvu

4. Prevence duplicitních EAN kódů v letácích
   - Frontend validace při přidávání produktu drag-and-drop
   - Backend validace při odesílání letáku k verifikaci
   - Chybová hláška s detaily pokud jsou v letáku dva produkty se stejným EAN

5. Rozlišení ikon podle typu
   - Ikony s podporou brand color mají tmavší šedé pozadí (bg-gray-300)
   - Ikony bez brand color mají světlejší pozadí (bg-gray-100)
   - Platí pro seznam ikon i formulář editace ikony

🐛 OPRAVY

1. Fix: Mapping hesla v users.service.ts
   - Opraveno ukládání hesla: passwordHash místo password
   - Heslo se nyní správně hashuje a ukládá do databáze

================================================================================
  ZMĚNY OD v3.1.9
================================================================================

Verze 3.1.9 přinesla:
🐛 Hotfix: Detekce ukončených produktů - kontrola pole Ukonceno v ERP
🐛 Hotfix: Type coercion fix - loose equality (==) místo strict (===)

Verze 3.1.8 přinesla:
🐛 Hotfix: Pole "Typ spotřebiče" - správné chování ERP auto-fill
🐛 Hotfix: Generování PDF pro supplier - přidána práva

Verze 3.1.7 přinesla:
✨ Vodotisk "VYPRODÁNO" pro ukončené produkty
✨ Synchronizace stavu vyprodáno s ERP (admin)
✨ Filtry produktů v aktivních letácích (admin)
✨ Tlačítko "Generovat PDF" pro schvalovatele
🐛 Fix: Icon image serving (res.end místo res.send)

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
   ☐ v3.2.0 je feature release bez DB změn
   ☐ Databáze zůstává beze změn
   ☐ PŘESKOČ tento krok - pokračuj krokem 3 (Nasazení backendu)

3. NASAZENÍ BACKENDU
   ------------------
   ☐ pm2 stop flyer-app-backend
   ☐ rm -rf /var/www/flyer-app/backend/dist
   ☐ cp -r dist /var/www/flyer-app/backend/
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
   ☐ TEST: Změna značky produktu - zkontroluj že funguje
   ☐ TEST: Změna hesla uživatele - admin může měnit hesla
   ☐ TEST: Poznámka dodavatele se zobrazuje v seznamu produktů

================================================================================
  TESTOVACÍ SCÉNÁŘE - KRITICKÉ TESTY pro v3.2.0
================================================================================

⚡ PRIORITY TEST 1 - Změna značky produktu

Test: Ověření že lze změnit značku produktu při editaci
   1. Přihlas se jako admin nebo dodavatel
   2. Jdi na "Produkty" v menu
   3. Vyber jakýkoliv produkt a klikni "Upravit"
   4. Změň značku (Brand) v dropdown menu
   5. ✓ Dropdown není disabled a lze vybrat jinou značku
   6. Klikni "Aktualizovat produkt"
   7. ✓ Produkt se uloží bez chyby
   8. Znovu otevři produkt k editaci
   9. ✓ Značka je změněná na nově vybranou hodnotu

⚡ PRIORITY TEST 2 - Změna hesla uživatele

Test: Ověření že admin může měnit hesla uživatelů
   1. Přihlas se jako admin
   2. Jdi na "Uživatelé" v admin menu
   3. Vyber jakéhokoliv uživatele a klikni "Upravit"
   4. ✓ Vidíš pole "Nové heslo (volitelné)" s placeholderem
   5. Vyplň nové heslo (min. 6 znaků)
   6. Klikni "Aktualizovat uživatele"
   7. ✓ Uživatel se aktualizuje bez chyby
   8. Odhlásit se a přihlásit jako ten uživatel s novým heslem
   9. ✓ Přihlášení funguje s novým heslem

⚡ PRIORITY TEST 3 - Zobrazení poznámky dodavatele

Test: Ověření že se poznámka dodavatele zobrazuje
   1. Přihlas se jako dodavatel nebo admin
   2. Jdi na "Produkty" v menu
   3. Najdi produkt který má vyplněnou "Poznámku dodavatele"
   4. ✓ Pod názvem produktu vidíš poznámku dodavatele (šedivý text)
   5. Pokud produkt nemá poznámku, vytvoř nový nebo uprav existující
   6. Vyplň poznámku dodavatele (např. "Testovací poznámka")
   7. Ulož produkt
   8. ✓ V seznamu produktů vidíš poznámku pod názvem produktu

⚡ PRIORITY TEST 4 - Prevence duplicitních EAN

Test: Ověření že nelze přidat dva produkty se stejným EAN do letáku
   1. Přihlas se jako dodavatel
   2. Vytvoř nový leták nebo otevři rozpracovaný
   3. Přidej produkt s nějakým EAN kódem do letáku (drag-and-drop)
   4. Zkus přidat tentýž produkt (stejný EAN) znovu do jiného slotu
   5. ✓ Zobrazí se alert: "Produkt s EAN kódem ... už je v letáku použit"
   6. ✓ Produkt se nepřidá do letáku

⚡ PRIORITY TEST 5 - Rozlišení ikon podle typu

Test: Ověření že ikony mají různé pozadí podle typu
   1. Přihlas se jako admin
   2. Jdi na "Ikony" v admin menu
   3. ✓ Ikony s "(brand)" v názvu mají tmavší šedé pozadí
   4. ✓ Ikony bez "(brand)" mají světlejší šedé pozadí
   5. Klikni na editaci ikony s checkboxem "Použít brand color"
   6. ✓ V náhledu ikony vidíš tmavší šedé pozadí
   7. Odznač "Použít brand color"
   8. ✓ Pozadí se změní na světle šedou

═══ REGRESSION TESTS (Regression testing) ═══

Pro kompletní test coverage viz DEPLOY_CHECKLIST.txt.
Ověř že nové změny nerozbily existující funkce:
- ✅ Detekce ukončených produktů z ERP (z v3.1.9)
- ✅ ERP auto-fill typ spotřebiče (z v3.1.8)
- ✅ PDF generování pro supplier (z v3.1.8)
- ✅ Vodotisk "VYPRODÁNO" pro ukončené produkty (z v3.1.7)
- ✅ Synchronizace stavu vyprodáno (z v3.1.7)

================================================================================
  DŮLEŽITÉ POZNÁMKY
================================================================================

⚠️  DATABÁZE:
    - Tento release NEOBSAHUJE žádné databázové změny!
    - Databáze zůstává beze změn
    - NENÍ třeba žádná migrace

⚠️  KOMPATIBILITA:
    - Release je zpětně kompatibilní s v3.1.9
    - Backend: Nové API pro změnu značky produktu
    - Frontend: Nové UI prvky (heslo, poznámka, EAN validace)

⚠️  ROLLBACK:
    - Pokud je problém, lze bezpečně vrátit na v3.1.9
    - ŽÁDNÉ databázové změny = žádný rollback migrací
    - Stačí zkopírovat backend/frontend soubory z v3.1.9

⚠️  DŮLEŽITÉ PRO TESTOVÁNÍ:
    - Změna značky produktu je nyní možná - otestuj důkladně
    - Admin může měnit hesla - ověř že funguje správně
    - Poznámka dodavatele se zobrazuje - zkontroluj zobrazení
    - Duplicitní EAN validace - otestuj frontend i backend
    - Ikony mají různé pozadí - vizuální kontrola

================================================================================
  PODPORA
================================================================================

Technická podpora: eletak@oresi.cz
Dokumentace: README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
Build: Claude Code (AI Assistant)
Build date: 12. listopadu 2025

================================================================================
