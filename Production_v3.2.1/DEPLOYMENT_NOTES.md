# Deployment Notes - v3.2.1

**Release Date:** 12. listopadu 2025
**Type:** Feature Release
**Severity:** Low
**Downtime Required:** ~2 minutes (restart services only)

---

## Executive Summary

Verze 3.2.1 je **feature release** rozšiřující funkce pro správu produktů a uživatelů, **včetně odstranění testovacích účtů z přihlašovací stránky**.

**Klíčové body:**
- ✅ Produkty v letácích přístupné pro schvalovatele
- ✅ Zobrazení stavu vyprodáno v databázi
- ✅ Změna hesla uživatele (admin)
- ✅ Zobrazení poznámky dodavatele
- ✅ Změna značky produktu při editaci
- ✅ **Odebrání testovacích účtů z přihlašovací stránky**
- ✅ ŽÁDNÉ databázové změny
- ✅ Zpětně kompatibilní s v3.2.0

---

## What's Changed

### ✨ New Features

**Feature #1:** Produkty v letácích pro schvalovatele
- Schvalovatelé mají přístup k "Produkty v letácích"
- Přidána položka menu pro role 'approver'
- Backend endpointy rozšířeny o 'approver' role
- Možnost synchronizace stavu vyprodáno

**Feature #2:** Zobrazení stavu vyprodáno
- Nový sloupec "Vyprodáno" v tabulce produktů
- Zobrazuje stav soldOut z databáze
- Ikony: ✅ (označeno) | ⚪ (neoznačeno)
- Nový filtr "Označené vyprodáno" (4. karta)

**Feature #3:** Rozšířená nápověda
- Modré informační pole s vysvětlením
- Popis sloupců "Stav v ERP" a "Vyprodáno"
- Vysvětlení funkce synchronizace

**Feature #4:** Změna hesla uživatele
- Admin může měnit hesla uživatelů v user management
- Heslo je volitelné při editaci (pouze pro změnu)
- Backend správně hashuje do passwordHash pole

**Feature #5:** Zobrazení poznámky dodavatele
- supplierNote se zobrazuje jako druhý řádek v product list
- Šedivá barva, truncate pro dlouhé texty
- TypeScript interface Product rozšířeno

**Feature #6:** Změna značky produktu
- UpdateProductDto nyní umožňuje změnu brandId
- Frontend posílá brandId i při editaci
- Administrátor/dodavatel může přeřadit produkt jinému dodavateli

**Feature #7:** Odebrání testovacích účtů z přihlašovací stránky
- Odstraněna celá sekce "Testovací účty" z LoginPage
- Odstraněno pole `demoAccounts` (řádky 44-49)
- Odstraněno zobrazení testovacích účtů (řádky 103-118)
- Odstraněno automatické ukládání hesel do localStorage (bezpečnostní zlepšení)
- Odstraněn useEffect pro načítání uložených credentials
- Čistší, profesionálnější přihlašovací stránka

---

## Changed Files

### Frontend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `src/App.tsx` | Modified | 109 | Add 'approver' to allowedRoles for active-flyers-products route |
| `src/layouts/MainLayout.tsx` | Modified | 59 | Add "Produkty v letácích" menu item for approver |
| `src/pages/admin/ActiveFlyersProductsPage.tsx` | Modified | 102-109, 173-174, 214-227 | Add help box, "Vyprodáno" column, soldOut filter |
| `src/pages/admin/UserFormPage.tsx` | Modified | 51-116 | Add optional password field for edit |
| `src/pages/products/ProductsListPage.tsx` | Modified | 235-239 | Display supplierNote under product name |
| `src/pages/products/ProductFormPage.tsx` | Modified | 352 | Include brandId for both create and edit |
| `src/types/index.ts` | Modified | 78 | Add supplierNote field to Product interface |
| `src/pages/LoginPage.tsx` | **Modified** | 1, 18-31, 98-118 | **Remove demo accounts, remove localStorage password saving, clean UI** |
| `src/components/layout/AppFooter.tsx` | Modified | 19 | Update version to 3.2.1 |
| `public/UZIVATELSKY_NAVOD.html` | Modified | 462 | Update version to 3.2.1 |

### Backend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `backend/src/products/products.controller.ts` | Modified | 156, 163 | Add 'approver' role to endpoints |
| `backend/src/products/dto/update-product.dto.ts` | Modified | 7 | Remove brandId from excluded fields |
| `backend/src/users/users.service.ts` | Modified | 108-109 | Fix password hash field mapping |
| `backend/package.json` | Modified | 3 | Update version to 3.2.1 |

---

## Database Changes

**ŽÁDNÉ** - v3.2.1 neobsahuje databázové změny

---

## Deployment Steps

```bash
# 1. Záloha
cp -r /var/www/flyer-app/backend /var/www/flyer-app/backend_backup_$(date +%Y%m%d)
cp -r /var/www/flyer-app/frontend /var/www/flyer-app/frontend_backup_$(date +%Y%m%d)

# 2. Stop services
pm2 stop flyer-app-backend

# 3. Deploy backend
rm -rf /var/www/flyer-app/backend/dist
cp -r dist /var/www/flyer-app/backend/
cp .env /var/www/flyer-app/backend/
cp package.json /var/www/flyer-app/backend/
cp -r prisma /var/www/flyer-app/backend/
cd /var/www/flyer-app/backend && npm install --production

# 4. Deploy frontend
rm -rf /var/www/flyer-app/frontend/*
cp -r frontend/* /var/www/flyer-app/frontend/
chown -R www-data:www-data /var/www/flyer-app/frontend
chmod -R 755 /var/www/flyer-app/frontend

# 5. Start services
pm2 start flyer-app-backend
pm2 save

# 6. Verify
pm2 status
pm2 logs flyer-app-backend --lines 20
curl https://eflyer.kuchyneoresi.eu/api/health
```

---

## Testing

### Critical Tests

1. **Přihlášení** - otevřít login page, ověřit že testovací účty NEJSOU viditelné
2. **Schvalovatel přístup** - přihlásit se jako schvalovatel, ověřit menu "Produkty v letácích"
3. **Zobrazení vyprodáno** - ověřit sloupec "Vyprodáno" a ikony
4. **Filtry** - otestovat všechny 4 filtry (All, Aktivní, Ukončené, Vyprodáno)
5. **Změna hesla** - admin změní heslo, ověřit že nové heslo funguje
6. **Poznámka dodavatele** - ověřit že se zobrazuje v product list
7. **Změna značky** - změnit brand při editaci, ověřit že se uloží

### Regression Tests

- ERP detection of discontinued products (v3.1.9)
- ERP auto-fill installation type (v3.1.8)
- PDF generation for suppliers (v3.1.8)
- Sold-out watermark (v3.1.7)

---

## Rollback Procedure

```bash
# 1. Stop services
pm2 stop flyer-app-backend

# 2. Restore files (NO DATABASE ROLLBACK NEEDED!)
rm -rf /var/www/flyer-app/backend
cp -r /var/www/flyer-app/backend_backup_YYYYMMDD /var/www/flyer-app/backend

rm -rf /var/www/flyer-app/frontend
cp -r /var/www/flyer-app/frontend_backup_YYYYMMDD /var/www/flyer-app/frontend

# 3. Start services
pm2 start flyer-app-backend
pm2 save
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Approver role permission issues | Low | Medium | Tested with various roles |
| SoldOut filter performance | Very Low | Low | Query optimized, indexed field |
| Password change security issue | Low | High | Uses bcrypt hashing correctly |
| Brand change breaks ownership | Low | Medium | Tested with various scenarios |
| **Login page changes break auth** | **Very Low** | **Medium** | **Only UI changes, auth logic unchanged** |

**Overall Risk:** **LOW**

---

## Security Improvements in v3.2.1

🔒 **Removed localStorage password caching**
- Předchozí verze ukládala hesla do localStorage (bezpečnostní riziko)
- V 3.2.1 jsou hesla pouze v paměti během session
- Po odhlášení/zavření prohlížeče jsou hesla zapomenuta

🔒 **Removed demo account exposure**
- Testovací účty již nejsou viditelné na login page
- Snižuje riziko neautorizovaného přístupu

---

## Version History

### v3.2.1 (2025-11-12) - Feature Release
- ✨ Feature: Produkty v letácích pro schvalovatele
- ✨ Feature: Zobrazení stavu vyprodáno v databázi
- ✨ Feature: Rozšířená nápověda v ActiveFlyersProductsPage
- ✨ Feature: Admin password change functionality
- ✨ Feature: Display supplier notes in product list
- ✨ Feature: Allow brand changes in product edit
- ✨ Feature: Remove demo accounts from login page
- 🔒 Security: Remove localStorage password caching

### v3.2.0 (2025-11-12) - Feature Release
- ✨ Feature: Allow brand changes in product edit
- ✨ Feature: Admin password change functionality
- ✨ Feature: Display supplier notes in product list
- ✨ Feature: Prevent duplicate EAN codes in flyers
- ✨ Feature: Differentiate icon backgrounds by type
- 🐛 Fix: Password hash field mapping in user service

### v3.1.9 (2025-11-12) - Hotfix
- 🐛 Fix: Detect discontinued products via ERP Ukonceno field
- 🐛 Fix: Type coercion for Ukonceno (loose vs strict equality)

---

**Build Completed:** 12. listopadu 2025
**Build Tool:** build-production.ps1 + npm run build
**Build Verification:** ✅ 0x localhost, 13x /api
**Documentation:** ✅ README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
