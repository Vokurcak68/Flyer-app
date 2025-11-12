================================================================================
  FLYER MANAGEMENT SYSTEM - PRODUCTION BUILD v3.1.7
================================================================================

Datum buildu: 11. listopadu 2025
Build pro: Production Server (https://eflyer.kuchyneoresi.eu)

================================================================================
  ZMĚNY VE VERZI 3.1.7
================================================================================

Nové funkce:
------------

1. Vodotisk "VYPRODÁNO" pro ukončené produkty
   - Produkty označené jako vyprodané zobrazují vodotisk "VYPRODÁNO"
   - Vodotisk zobrazen šikmo přes produkt s 30% průhledností
   - Viditelný jak ve frontendu tak v PDF

2. Admin: Synchronizace stavu vyprodáno
   - Nové tlačítko "Synchronizovat stav vyprodáno" v sekci "Produkty v letácích"
   - Obousměrná synchronizace s ERP systémem
   - Automaticky označí ukončené produkty a odznačí reaktivované

3. Admin: Klikací filtry v produktech
   - Tři filtrovací karty: Celkem/Aktivní/Ukončené
   - Vizuální zvýraznění aktivního filtru (barevný rámeček)
   - Kombinace filtrů s vyhledáváním

4. Schvalovatel: Přegenerování PDF pro aktivní letáky
   - Nové tlačítko "Generovat PDF" v seznamu aktivních letáků
   - Umožňuje aktualizovat PDF s novými vodotisky vyprodaných produktů
   - Pouze pro role: approver, admin

Technické změny:
----------------
- Přidáno pole soldOut do Product modelu
- Nová metoda updatePdfData() v FlyersService (obchází permission checks)
- Optimalizace velikosti vodotisku v PDF (36px, šířka 240px)
- Odstraněny debug console.log z guards a controllers
- Aktualizovaný uživatelský manuál na v3.1.7

================================================================================
  RYCHLÝ START - NASAZENÍ
================================================================================

1. PŘÍPRAVA
   -----------
   ☐ Záloha databáze: pg_dump flyer_app_production > backup_$(date +%Y%m%d).sql
   ☐ Záloha současných souborů: cp -r /var/www/flyer-app /var/www/flyer-app_backup
   ☐ Zkontroluj že žádní uživatelé nejsou přihlášení

2. DATABÁZE
   ----------
   ☐ cd Production_v3.1.7
   ☐ Tento release obsahuje DB změny (soldOut field)

   MOŽNOST A - Přes SQL soubor (doporučeno pro production):
   ☐ psql -U flyer_app_user -d flyer_app_production -f MIGRATE.sql

   MOŽNOST B - Přes Prisma:
   ☐ Zkopíruj prisma/schema.prisma do /var/www/flyer-app/backend/prisma/
   ☐ cd /var/www/flyer-app/backend
   ☐ npx prisma db push

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
   ☐ rm -rf /var/www/flyer-app/frontend/*
   ☐ cp -r frontend/* /var/www/flyer-app/frontend/
   ☐ Zkontroluj Nginx konfiguraci (try_files pro SPA routing)

5. VERIFIKACE
   -----------
   ☐ Backend běží: pm2 status
   ☐ Backend logy OK: pm2 logs flyer-app-backend --lines 50
   ☐ Frontend načítá: curl https://eflyer.kuchyneoresi.eu
   ☐ API odpovídá: curl https://eflyer.kuchyneoresi.eu/api/health
   ☐ Přihlášení funguje
   ☐ Vodotisk "VYPRODÁNO" se zobrazuje u vyprodaných produktů
   ☐ Admin: Synchronizace stavu funguje
   ☐ Admin: Filtry produktů fungují
   ☐ Schvalovatel: Generování PDF funguje

================================================================================
  TESTOVACÍ SCÉNÁŘE - KOMPLETNÍ FUNKČNOST
================================================================================

═══ ZÁKLADNÍ FUNKCE (Všichni uživatelé) ═══

Test 1: Přihlášení a dashboard
   1. Otevři https://eflyer.kuchyneoresi.eu
   2. Přihlas se s platnými credentials
   3. ✓ Dashboard načte bez chyb
   4. ✓ Vidíš příslušné menu položky podle role
   5. ✓ Footer zobrazuje "Verze 3.1.7"

Test 2: Ikony a obrázky
   1. Otevři libovolnou stránku s ikonami (produkty, letáky)
   2. ✓ Všechny ikony se načtou správně (bez broken images)
   3. ✓ Promo obrázky se zobrazují
   4. ✓ Loga značek se načítají

═══ DODAVATEL - Vytvoření a správa letáku ═══

Test 3: Vytvoření nového letáku
   1. Přihlas se jako dodavatel (supplier)
   2. Klikni "Vytvořit leták"
   3. Vyplň:
      - Název letáku
      - Značka
      - Akce (z ERP)
      - Datum platnosti (od-do)
      - Šablona (např. 8 stránek)
   4. Klikni "Vytvořit"
   5. ✓ Leták se vytvoří se stavem "Draft"
   6. ✓ Přesměrování na detail letáku

Test 4: Přidání produktů do letáku
   1. V detailu letáku klikni na stránku
   2. Klikni na prázdný slot
   3. Vyhledej produkt (podle názvu nebo EAN)
   4. ✓ Filtrování produktů podle značky funguje
   5. ✓ Zobrazují se ikony podle typu instalace z ERP
   6. Vyber produkt a přidej do slotu
   7. ✓ Produkt se zobrazí ve slotu
   8. ✓ Cena, obrázek a ikony jsou správně

Test 5: Přidání promo obrázků
   1. Klikni na slot "Patička" nebo "Celá stránka"
   2. Vyber promo obrázek ze seznamu
   3. ✓ Promo obrázek se zobrazí
   4. ✓ Pokud je patička s datem, datum se vyplní automaticky

Test 6: Drag & Drop produktů
   1. Přetáhni produkt z jednoho slotu do druhého
   2. ✓ Produkty si vymění místo
   3. ✓ Pozice se uloží

Test 7: Odeslání ke schválení
   1. Vyplň všechny povinné sloty
   2. Klikni "Odeslat k ověření"
   3. ✓ Leták změní stav na "Pending Verification"
   4. ✓ Dodavatel už nemůže leták editovat

═══ PŘEDSCHVALOVATEL - První kontrola ═══

Test 8: Předschválení letáku
   1. Přihlas se jako předschvalovatel (pre_approver)
   2. Jdi na "Ověření letáků"
   3. ✓ Vidíš letáky ve stavu "Pending Verification"
   4. Otevři detail letáku
   5. Zkontroluj stránky a produkty
   6. Klikni "Náhled PDF"
   7. ✓ PDF se vygeneruje s barvami značky
   8. Klikni "Schválit"
   9. ✓ Leták změní stav na "Pre-Approved"

Test 9: Zamítnutí letáku (předschvalovatel)
   1. U letáku s chybou klikni "Zamítnout"
   2. Napiš důvod zamítnutí
   3. ✓ Leták se vrátí dodavateli se stavem "Rejected"
   4. ✓ Dodavatel vidí důvod zamítnutí

═══ SCHVALOVATEL - Finální schválení ═══

Test 10: Schválení letáku
   1. Přihlas se jako schvalovatel (approver)
   2. Jdi na "Schvalování"
   3. ✓ Vidíš jen letáky ve stavu "Pre-Approved"
   4. Otevři detail letáku
   5. Zkontroluj všechny stránky
   6. Klikni "Schválit"
   7. ✓ Leták změní stav na "Approved"
   8. ✓ Pokud je v období platnosti, stav se změní na "Active"

Test 11: Aktivní letáky - Zobrazení
   1. Jako schvalovatel jdi na "Aktivní letáky"
   2. ✓ Vidíš všechny aktivní letáky
   3. Klikni "Zobrazit PDF"
   4. ✓ PDF se stáhne a otevře správně

═══ NOVÉ FUNKCE v3.1.7 - Vyprodáno a synchronizace ═══

Test 12: Admin - Synchronizace stavu vyprodáno
   1. Přihlas se jako admin
   2. Jdi na "Produkty v letácích" (admin sekce)
   3. ✓ Vidíš přehled všech produktů v aktivních letácích
   4. ✓ Sloupec "Stav" zobrazuje ikonu (zelená=aktivní, červená=ukončené)
   5. ✓ Produkty ukončené v ERP mají červenou ikonu
   6. Klikni "Synchronizovat stav vyprodáno"
   7. ✓ Zobrazí se dialog: "X ukončených produktů bude označeno..."
   8. Potvrď
   9. ✓ Úspěšná zpráva o synchronizaci
   10. ✓ U ukončených produktů se v aktivních letácích zobrazí vodotisk "VYPRODÁNO"

Test 13: Admin - Filtry produktů v aktivních letácích
   1. V sekci "Produkty v letácích"
   2. ✓ Nahoře vidíš 3 velké obdélníky: Celkem/Aktivní/Ukončené
   3. Klikni na "Aktivní v ERP" (zelený obdélník)
   4. ✓ Obdélník se zvýrazní zeleným rámečkem
   5. ✓ Tabulka zobrazuje jen aktivní produkty
   6. Klikni na "Ukončené" (červený obdélník)
   7. ✓ Obdélník se zvýrazní červeným rámečkem
   8. ✓ Tabulka zobrazuje jen ukončené produkty
   9. Vyhledej produkt v poli "Hledat..."
   10. ✓ Filtr a vyhledávání fungují společně

Test 14: Vodotisk "VYPRODÁNO" ve frontendu
   1. Jako koncový uživatel nebo admin otevři aktivní leták
   2. Jdi na stránku s vyprodaným produktem
   3. ✓ Přes produkt je šikmo červený vodotisk "VYPRODÁNO"
   4. ✓ Vodotisk má 30% průhlednost
   5. ✓ Rotace -45 stupňů
   6. ✓ Text je čitelný a nepřekrývá důležité info

Test 15: Schvalovatel - Přegenerování PDF
   1. Jako schvalovatel jdi na "Aktivní letáky"
   2. ✓ U každého letáku vidíš tlačítko "Generovat PDF" (modrá ikona refresh)
   3. Klikni "Generovat PDF"
   4. ✓ Zobrazí se potvrzovací dialog
   5. Potvrď
   6. ✓ Zpráva "PDF bylo úspěšně přegenerováno"
   7. Stáhni PDF
   8. ✓ PDF obsahuje vodotisk "VYPRODÁNO" u vyprodaných produktů
   9. ✓ Vodotisk je šikmo, červený, font Vodafone Rg

Test 16: Vodotisk v PDF - Detailní kontrola
   1. Otevři PDF s vyprodaným produktem
   2. ✓ Vodotisk "VYPRODÁNO" je viditelný
   3. ✓ Text NENÍ zalomený na více řádků
   4. ✓ Velikost a pozice jsou správné
   5. ✓ Neruší čitelnost ostatních informací
   6. ✓ Barva je červená (#DC2626)

═══ KONCOVÝ UŽIVATEL - Zobrazení aktivních letáků ═══

Test 17: Koncový uživatel - Aktivní letáky
   1. Přihlas se jako koncový uživatel (end_user)
   2. ✓ Automaticky vidíš "Aktivní letáky"
   3. ✓ Zobrazují se pouze schválené letáky v období platnosti
   4. ✓ Filtrování podle značky funguje (pokud máš více značek)
   5. Klikni "Zobrazit PDF"
   6. ✓ PDF se otevře a je správně zobrazeno
   7. ✓ Vodotisky "VYPRODÁNO" jsou viditelné kde mají být

═══ ADMIN - Správa systému ═══

Test 18: Admin - Správa uživatelů
   1. Přihlas se jako admin
   2. Jdi na "Uživatelé"
   3. Klikni "Přidat uživatele"
   4. Vyplň údaje (jméno, email, heslo, role)
   5. Přiřaď značky (pro supplier/pre_approver/end_user)
   6. ✓ Uživatel se vytvoří
   7. Edituj uživatele (změň roli nebo značky)
   8. ✓ Změny se uloží

Test 19: Admin - Správa ikon
   1. Jdi na "Ikony"
   2. Klikni "Přidat ikonu"
   3. Nahraj PNG/SVG ikonu
   4. Zaškrtni "Ikona energetické třídy" (pokud je to energy label)
   5. Zaškrtni "Použít barvu značky" (pokud má mít background)
   6. ✓ Ikona se nahraje
   7. ✓ Ikona se zobrazuje v produktech správně
   8. ✓ Background se přizpůsobí barvě značky

Test 20: Admin - Správa značek
   1. Jdi na "Značky"
   2. Klikni "Přidat značku"
   3. Vyplň název, barvu, nahraj logo
   4. ✓ Značka se vytvoří
   5. ✓ Barva značky se používá v letácích (header, patička)
   6. ✓ Logo se zobrazuje správně

Test 21: Admin - Správa promo obrázků
   1. Jdi na "Promo obrázky"
   2. Klikni "Přidat promo obrázek"
   3. Vyber značku, typ (Jeden/Horizontální/Čtverec/Celá stránka/Patička)
   4. Zaškrtni "Zobrazit koncovým uživatelům" (pokud má být dostupný)
   5. Pro "Patička": zaškrtni "Vyplnit datum" (auto-datum)
   6. Nahraj obrázek
   7. ✓ Promo obrázek se vytvoří
   8. ✓ Obrázek je dostupný při vytváření letáků

═══ REGRESNÍ TESTY - Ověření že nic nerozbilo ═══

Test 22: Workflow kompletního letáku (end-to-end)
   1. Dodavatel: Vytvoř leták, přidej produkty, odešli ke schválení
   2. Předschvalovatel: Zkontroluj a předschval
   3. Schvalovatel: Zkontroluj a schval
   4. ✓ Leták se stane aktivním v období platnosti
   5. Koncový uživatel: Zobrazí si PDF
   6. ✓ Celý workflow funguje bez chyb

Test 23: Validace ERP dat
   1. Dodavatel vytvoří leták s akcí z ERP
   2. Přidá produkty, odešle ke schválení
   3. Předschvalovatel klikne "Validovat produkty"
   4. ✓ Systém zkontroluje produkty proti ERP view
   5. ✓ Chyby se zobrazí pokud produkt není v akci
   6. ✓ Validace funguje správně

Test 24: PDF generování s barvami značky
   1. Vytvoř leták pro značku s definovanou barvou
   2. Vygeneruj PDF
   3. ✓ Header má barvu značky
   4. ✓ Patička má barvu značky
   5. ✓ Barvy jsou konzistentní v celém PDF

═══ PERFORMANCE & STABILITA ═══

Test 25: Výkon a načítání
   1. Otevři stránku s velkým počtem produktů
   2. ✓ Načte se do 3 sekund
   3. Filtruj produkty
   4. ✓ Filtrování je okamžité
   5. Otevři leták s 8 stránkami
   6. ✓ Všechny stránky se načtou rychle
   7. ✓ Žádné memory leaky v konzoli

Test 26: Error handling
   1. Zkus přistoupit k letáku bez oprávnění
   2. ✓ 403 Forbidden nebo přesměrování
   3. Zkus vytvořit produkt s neplatnými daty
   4. ✓ Validační chyby se zobrazí
   5. Odpoj internet a klikni na tlačítko
   6. ✓ Rozumná chybová zpráva

═══ POZNÁMKY K TESTOVÁNÍ ═══

⚡ PRIORITY TESTY (musí fungovat):
   - Test 1, 3, 7, 10 (základní workflow)
   - Test 12, 13, 15, 16 (nové funkce v3.1.7)

🔍 DŮKLADNÁ KONTROLA:
   - Vodotisky "VYPRODÁNO" (frontend i PDF)
   - Filtry v "Produkty v letácích"
   - Tlačítko "Generovat PDF" jen pro approver/admin
   - Ikony se načítají správně (změna res.end)

📊 METRIKY ÚSPĚCHU:
   - 0 console errors po přihlášení
   - Všechny ikony načtené (žádné broken images)
   - PDF generování < 5 sekund
   - Vodotisk viditelný a čitelný

================================================================================
  DŮLEŽITÉ POZNÁMKY
================================================================================

⚠️  DATABÁZE:
    - Tento release přidává pole soldOut do Product modelu
    - Spusť db push před startem backendu!

⚠️  PERMISSION BYPASS:
    - Nová metoda updatePdfData() obchází permission checks
    - Umožňuje schvalovatelům regenerovat PDF
    - Používá se pouze pro POST /flyers/:id/generate-pdf endpoint

✅  KOMPATIBILITA:
    - Zpětně kompatibilní s existujícími daty
    - Nové pole soldOut má výchozí hodnotu false

================================================================================
  PODPORA
================================================================================

Technická podpora: eletak@oresi.cz
Dokumentace: /public/UZIVATELSKY_NAVOD.html
Více informací: DEPLOYMENT_NOTES.md

================================================================================
