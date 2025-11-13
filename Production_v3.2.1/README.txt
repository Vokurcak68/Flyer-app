================================================================================
  FLYER MANAGEMENT SYSTEM - Production Build v3.2.1
  Release Date: 12. listopadu 2025
================================================================================

DŮLEŽITÉ UPOZORNĚNÍ:
- Tento build obsahuje změny ve frontendové přihlašovací stránce
- Byly odstraněny testovací účty, které byly viditelné při přihlášení
- Backend a databáze nejsou změněny

================================================================================
  OBSAH BALÍČKU
================================================================================

Production_v3.2.1/
├── dist/                     # Backend zkompilovaný (NestJS → JavaScript)
├── frontend/                 # Frontend zkompilovaný (React)
├── prisma/                   # Database schema a migrace
├── package.json              # Backend dependencies (verze 3.2.1)
├── .env                      # Production environment konfigurace
├── README.txt                # Tento soubor
├── DEPLOY_CHECKLIST.txt      # Deployment checklist krok za krokem
└── DEPLOYMENT_NOTES.md       # Detailní technické poznámky

================================================================================
  CO JE NOVÉHO v3.2.1
================================================================================

✨ Feature #1: Produkty v letácích pro schvalovatele
- Schvalovatelé mají nově přístup k "Produkty v letácích"
- Přidána položka menu pro role 'approver'
- Backend endpointy rozšířeny o 'approver' role
- Možnost synchronizace stavu vyprodáno

✨ Feature #2: Zobrazení stavu vyprodáno
- Nový sloupec "Vyprodáno" v tabulce produktů
- Zobrazuje stav soldOut z databáze
- Ikony: ✅ (označeno) | ⚪ (neoznačeno)
- Nový filtr "Označené vyprodáno" (4. karta)

✨ Feature #3: Rozšířená nápověda
- Modré informační pole s vysvětlením
- Popis sloupců "Stav v ERP" a "Vyprodáno"
- Vysvětlení funkce synchronizace

✨ Feature #4: Změna hesla uživatele (Admin)
- Admin může měnit hesla uživatelů v user management
- Heslo je volitelné při editaci (pouze pro změnu)
- Backend správně hashuje do passwordHash pole

✨ Feature #5: Zobrazení poznámky dodavatele
- supplierNote se zobrazuje jako druhý řádek v product list
- Šedivá barva, truncate pro dlouhé texty

✨ Feature #6: Změna značky produktu
- UpdateProductDto nyní umožňuje změnu brandId
- Frontend posílá brandId i při editaci
- Administrátor/dodavatel může přeřadit produkt jinému dodavateli

✨ Feature #7: Odebrání testovacích účtů
- Odstraněna sekce "Testovací účty" z přihlašovací stránky
- Odstraněno automatické ukládání hesel do localStorage (bezpečnostní zlepšení)
- Čistší přihlašovací stránka pouze s formulářem

================================================================================
  RYCHLÝ START - DEPLOYMENT
================================================================================

1. ZÁLOHA (KRITICKÉ!)
   ----------------------
   cp -r /var/www/flyer-app/backend /var/www/flyer-app/backend_backup_$(date +%Y%m%d)
   cp -r /var/www/flyer-app/frontend /var/www/flyer-app/frontend_backup_$(date +%Y%m%d)

2. STOP SLUŽBY
   ----------------------
   pm2 stop flyer-app-backend

3. DEPLOY BACKEND
   ----------------------
   rm -rf /var/www/flyer-app/backend/dist
   cp -r dist /var/www/flyer-app/backend/
   cp .env /var/www/flyer-app/backend/
   cp package.json /var/www/flyer-app/backend/
   cp -r prisma /var/www/flyer-app/backend/
   cd /var/www/flyer-app/backend && npm install --production

4. DEPLOY FRONTEND
   ----------------------
   rm -rf /var/www/flyer-app/frontend/*
   cp -r frontend/* /var/www/flyer-app/frontend/
   chown -R www-data:www-data /var/www/flyer-app/frontend
   chmod -R 755 /var/www/flyer-app/frontend

5. START SLUŽBY
   ----------------------
   pm2 start flyer-app-backend
   pm2 save

6. OVĚŘENÍ
   ----------------------
   pm2 status
   pm2 logs flyer-app-backend --lines 20
   curl https://eflyer.kuchyneoresi.eu/api/health

7. TESTOVÁNÍ
   ----------------------
   ✓ Přihlásit se - ověřit že testovací účty nejsou vidět
   ✓ Schvalovatel - ověřit přístup k "Produkty v letácích"
   ✓ Zobrazení sloupce "Vyprodáno"
   ✓ Filtry - otestovat všechny 4 filtry
   ✓ Admin - změna hesla uživatele
   ✓ Zobrazení poznámky dodavatele v product list
   ✓ Změna značky při editaci produktu

================================================================================
  DŮLEŽITÉ POZNÁMKY
================================================================================

⚠️  ŽÁDNÉ DATABÁZOVÉ ZMĚNY
   - Tato verze NEOBSAHUJE databázové změny
   - Není potřeba spouštět migrace
   - Zpětně kompatibilní s v3.2.0

⚠️  DOWNTIME
   - Očekávaný downtime: ~2 minuty
   - Pouze restart PM2 služeb

⚠️  ROLLBACK
   - V případě problémů obnovte ze zálohy
   - NENÍ potřeba rollback databáze

⚠️  TESTOVÁNÍ PO DEPLOYMENTU
   - KRITICKÉ: Otestovat přihlášení
   - Ověřit že schvalovatel vidí nové menu
   - Zkontrolovat všechny filtry v "Produkty v letácích"

================================================================================
  KONTAKT A PODPORA
================================================================================

Designed by: Oresi (https://oresi.cz)
Developed by: NetMate CZ (https://netmate.cz)
Support: eletak@oresi.cz

Pro detailní technické informace viz DEPLOYMENT_NOTES.md
Pro deployment checklist viz DEPLOY_CHECKLIST.txt

================================================================================
  BUILD INFORMACE
================================================================================

Build Date: 12. listopadu 2025
Build Method: build-production.ps1 + npm run build
Frontend Verification: ✅ 0x localhost, 13x /api
Backend Build: ✅ NestJS production build
Version: 3.2.1

================================================================================
