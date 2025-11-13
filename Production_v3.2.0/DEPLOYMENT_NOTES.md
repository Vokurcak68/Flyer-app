# Deployment Notes - v3.2.0

**Release Date:** 12. listopadu 2025
**Type:** Feature Release
**Severity:** Low
**Downtime Required:** ~2 minutes (restart services only)

---

## Executive Summary

Verze 3.2.0 je **feature release** přidávající nové funkce pro správu produktů a uživatelů.

**Klíčové body:**
- ✅ Změna značky produktu při editaci
- ✅ Změna hesla uživatele (admin)
- ✅ Zobrazení poznámky dodavatele
- ✅ Prevence duplicitních EAN v letácích
- ✅ Rozlišení ikon podle typu
- ✅ ŽÁDNÉ databázové změny
- ✅ Zpětně kompatibilní s v3.1.9

---

## What's Changed

### ✨ New Features

**Feature #1:** Změna značky produktu při editaci
- UpdateProductDto nyní umožňuje změnu brandId
- Frontend posílá brandId i při editaci
- Administrátor může přeřadit produkt jinému dodavateli

**Feature #2:** Změna hesla uživatele
- Admin může měnit hesla uživatelů v user management
- Heslo je volitelné při editaci (pouze pro změnu)
- Backend správně hashuje do passwordHash pole

**Feature #3:** Zobrazení poznámky dodavatele
- supplierNote se zobrazuje jako druhý řádek v product list
- Šedivá barva, truncate pro dlouhé texty
- TypeScript interface Product rozšířeno

**Feature #4:** Prevence duplicitních EAN
- Frontend validace při drag-and-drop
- Backend validace v submitForVerification
- User-friendly error messages

**Feature #5:** Rozlišení ikon podle typu
- Icons s useBrandColor: bg-gray-300 (tmavší)
- Icons bez useBrandColor: bg-gray-100 (světlejší)
- Platí pro IconsListPage a IconFormPage

---

## Changed Files

### Frontend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `src/pages/products/ProductFormPage.tsx` | Modified | 352 | Include brandId for both create and edit |
| `src/pages/admin/UserFormPage.tsx` | Modified | 51-116 | Add optional password field for edit |
| `src/pages/products/ProductsListPage.tsx` | Modified | 235-239 | Display supplierNote under product name |
| `src/pages/flyers/FlyerEditorPage.tsx` | Modified | 508-517 | Validate duplicate EAN on drag-and-drop |
| `src/pages/icons/IconFormPage.tsx` | Modified | 170 | Different bg color based on useBrandColor |
| `src/pages/icons/IconsListPage.tsx` | Modified | 122 | Different bg color in icon list |
| `src/types/index.ts` | Modified | 78 | Add supplierNote field to Product interface |

### Backend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `backend/src/products/dto/update-product.dto.ts` | Modified | 7 | Remove brandId from excluded fields |
| `backend/src/users/users.service.ts` | Modified | 108-109 | Fix password hash field mapping |
| `backend/src/flyers/flyers.service.ts` | Modified | 1251-1266 | Add EAN duplicate validation |

---

## Database Changes

**ŽÁDNÉ** - v3.2.0 neobsahuje databázové změny

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

1. **Změna značky produktu** - změň brand při editaci, ověř že se uloží
2. **Změna hesla** - admin změní heslo, ověř že nové heslo funguje
3. **Poznámka dodavatele** - ověř že se zobrazuje v product list
4. **Duplicitní EAN** - zkus přidat tentýž produkt 2x do letáku
5. **Ikony - pozadí** - ověř tmavší/světlejší pozadí podle typu

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
| Brand change breaks product ownership | Low | Medium | Tested with various scenarios |
| Password change security issue | Low | High | Uses bcrypt hashing correctly |
| Duplicate EAN validation too strict | Low | Low | Both frontend and backend validation |
| Icon background colors confusing | Very Low | Low | Clear visual distinction |

**Overall Risk:** **LOW**

---

## Version History

### v3.2.0 (2025-11-12) - Feature Release
- ✨ Feature: Allow brand changes in product edit
- ✨ Feature: Admin password change functionality
- ✨ Feature: Display supplier notes in product list
- ✨ Feature: Prevent duplicate EAN codes in flyers
- ✨ Feature: Differentiate icon backgrounds by type
- 🐛 Fix: Password hash field mapping in user service

### v3.1.9 (2025-11-12) - Hotfix
- 🐛 Fix: Detect discontinued products via ERP Ukonceno field
- �� Fix: Type coercion for Ukonceno (loose vs strict equality)

### v3.1.8 (2025-11-12) - Hotfix
- 🐛 Fix: Installation type ERP auto-fill
- 🐛 Fix: PDF generation permissions for suppliers

---

**Build Completed:** 12. listopadu 2025
**Build Tool:** build-production.ps1 + npm run build
**Build Verification:** ✅ 0x localhost, 13x /api
**Documentation:** ✅ README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
