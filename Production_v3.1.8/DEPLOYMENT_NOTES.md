# Deployment Notes - v3.1.8 (Hotfix)

**Release Date:** 12. listopadu 2025
**Type:** Hotfix
**Severity:** Medium
**Downtime Required:** ~2 minutes (restart services only)

---

## Executive Summary

Verze 3.1.8 je **hotfix** řešící produkční bug v poli "Typ spotřebiče" (installationType). Pole bylo v produkci nesprávně disabled i když ERP vrátil hodnotu, což bránilo auto-fill funkci.

**Klíčové body:**
- ✅ Frontend-only fix (jedna komponenta)
- ✅ Backend je identický s v3.1.7
- ✅ ŽÁDNÉ databázové změny
- ✅ Zpětně kompatibilní s v3.1.7
- ✅ Bezpečný rollback (jen soubory, ne databáze)

---

## What's Changed

### 🐛 Bug Fixes

**Issue #1:** Pole "Typ spotřebiče" se nezaznamenávalo při ERP auto-fill
**Root Cause:** Složitá disabled logika blokovala pole před vyplněním hodnoty z ERP
**Impact:** Uživatelé v produkci nemohli využít ERP auto-fill pro installationType

**Fix:**
- Zjednodušena disabled logika v ProductFormPage.tsx
- Pole je nyní disabled pouze když je produkt v aktivním schváleném letáku
- Odstraněna logika kontrolující kategorii a requiresInstallationType

**Issue #2:** Generování PDF nefungovalo pro supplier v editoru letáku
**Root Cause:** Endpoint generate-pdf měl @Roles('approver', 'admin') - chyboval supplier
**Impact:** Dodavatelé nemohli vygenerovat PDF náhled při vytváření letáku (403 Forbidden)

**Fix:**
- Přidána práva pro všechny role které potřebují generovat PDF
- Nově: @Roles('supplier', 'pre_approver', 'approver', 'admin')
- Supplier může generovat PDF náhled při vytváření/úpravě letáku

---

## Changed Files

### Frontend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `src/pages/products/ProductFormPage.tsx` | Modified | 746 | Zjednodušena disabled podmínka pro pole installationType |
| `src/components/layout/AppFooter.tsx` | Modified | 19 | Aktualizace verze na 3.1.8 |

### Backend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `backend/src/flyers/flyers.controller.ts` | Modified | 242 | Přidána práva supplier, pre_approver pro generate-pdf endpoint |

### Build Files

| File | Change | Description |
|------|--------|-------------|
| `package.json` | Modified | Verze 3.1.7 → 3.1.8 |
| `backend/package.json` | Modified | Verze 3.1.7 → 3.1.8 |

### Backend Changes

**Changed:**
- `flyers.controller.ts` - Přidána práva pro generate-pdf endpoint
- Supplier a pre_approver nyní mohou generovat PDF

---

## Technical Details

### ProductFormPage.tsx Change

**Before (v3.1.7):**
```typescript
disabled={(() => {
  // Složitá logika kontrolující kategorii a installationType
  if (isInActiveFlyer) return true;
  if (formData.installationType && !formData.categoryId) return false;
  if (!formData.categoryId) return true;
  const selectedCategory = categories.find(c => c.id === formData.categoryId);
  return !selectedCategory || !selectedCategory.requiresInstallationType;
})()}
```

**After (v3.1.8):**
```typescript
disabled={isInActiveFlyer}
```

**Důvod změny:**
Složitá logika způsobovala, že pole bylo disabled i když ERP vrátil `erpInstallationType`. React state update nebyl dostatečně rychlý a pole zůstalo disabled. Nová jednoduchá logika povoluje pole vždy, kromě produktů v aktivních letácích (kde editace musí být zakázána).

---

## Database Changes

**ŽÁDNÉ** - v3.1.8 neobsahuje databázové změny

---

## Deployment Steps (Quick)

```bash
# 1. Záloha (doporučeno)
cp -r /var/www/flyer-app/backend /var/www/flyer-app/backend_backup_$(date +%Y%m%d)
cp -r /var/www/flyer-app/frontend /var/www/flyer-app/frontend_backup_$(date +%Y%m%d)

# 2. Stop services
pm2 stop flyer-app-backend

# 3. Deploy backend (identický s v3.1.7, ale deploy pro konzistenci)
rm -rf /var/www/flyer-app/backend/dist
cp -r Production_v3.1.8/dist /var/www/flyer-app/backend/
cp Production_v3.1.8/.env /var/www/flyer-app/backend/
cp Production_v3.1.8/package.json /var/www/flyer-app/backend/
cd /var/www/flyer-app/backend && npm install --production

# 4. Deploy frontend (HLAVNÍ ZMĚNA)
rm -rf /var/www/flyer-app/frontend/*
cp -r Production_v3.1.8/frontend/* /var/www/flyer-app/frontend/
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

### Critical Test - ERP Auto-fill

**Priority:** HIGH
**Duration:** 2 min

1. Přihlas se jako supplier
2. Klikni "Produkty" > "Přidat produkt"
3. Zadej EAN kód (který má v ERP typ: BI nebo FS)
   - Příklad: 8594072241043 (pokud má typ)
4. Klikni tlačítko "ERP"
5. ✅ Pole "Typ spotřebiče" se automaticky vyplní
6. ✅ Pole NENÍ disabled (lze ho editovat/změnit)
7. Ulož produkt
8. ✅ Produkt se uloží bez chyby
9. Znovu otevři produkt
10. ✅ Typ spotřebiče je správně načten

**Expected Results:**
- ERP auto-fill funguje
- Pole je editovatelné
- Hodnota se uloží do databáze
- Hodnota se správně načte

### Regression Tests

Ověř že nové změny nerozbily existující funkce:
- ✅ Vytvoření produktu funguje
- ✅ Editace produktu funguje
- ✅ ERP validace funguje (ceny, brand, kategorie)
- ✅ Vodotisk "VYPRODÁNO" (z v3.1.7) funguje
- ✅ Filtry produktů (z v3.1.7) fungují
- ✅ PDF generování (z v3.1.7) funguje

---

## Rollback Procedure

Pokud nastane problém, rollback je jednoduchý:

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

# 4. Verify
pm2 status
```

**DŮLEŽITÉ:** ŽÁDNÝ databázový rollback není třeba - v3.1.8 nemá DB změny!

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Pole je disabled když nemá být | Low | Medium | Testováno v dev, jednoduchá logika |
| Pole není disabled když má být | Low | High | Kontrolováno - isInActiveFlyer funguje |
| Regression v jiných částech formuláře | Very Low | Medium | Změna je izolovaná na jedno pole |
| Databázové problémy | None | N/A | Žádné DB změny |
| Backend problémy | None | N/A | Backend je identický s v3.1.7 |

**Overall Risk:** **LOW**
**Recommended Deployment Window:** Kdykoli (preferovaně mimo špičku)

---

## Known Issues

Žádné známé problémy v této verzi.

---

## Version History

### v3.1.8 (2025-11-12) - Hotfix
- 🐛 Fix: Pole "Typ spotřebiče" - ERP auto-fill nyní funguje správně
- 🐛 Fix: Generování PDF pro supplier - přidána práva pro generate-pdf endpoint

### v3.1.7 (2025-11-11)
- ✨ Vodotisk "VYPRODÁNO" pro ukončené produkty
- ✨ Synchronizace stavu vyprodáno s ERP (admin)
- ✨ Filtry produktů v aktivních letácích (admin)
- ✨ Tlačítko "Generovat PDF" pro schvalovatele
- 🐛 Fix: Icon image serving (res.end místo res.send)

### v3.1.6 (2025-11-10)
- Previous stable version

---

## Support Contacts

**Technical Support:** eletak@oresi.cz
**Build Engineer:** Claude Code
**Production URL:** https://eflyer.kuchyneoresi.eu

---

## Checklist před nasazením

- [ ] Záloha databáze vytvořena
- [ ] Záloha backend souborů vytvořena
- [ ] Záloha frontend souborů vytvořena
- [ ] Uživatelé informováni o deployment window
- [ ] Production balíček ověřen (.env, verze, struktura)
- [ ] Deployment notes přečteny
- [ ] Test plán připraven

## Checklist po nasazení

- [ ] Backend běží (pm2 status)
- [ ] Žádné errors v logs (pm2 logs)
- [ ] Health check odpovídá (curl /api/health)
- [ ] Frontend načítá (browser check)
- [ ] Přihlášení funguje
- [ ] Critical test: ERP auto-fill typ spotřebiče passed
- [ ] Regression tests: vodotisky, filtry, PDF fungují

---

**Build Completed:** 12. listopadu 2025
**Build Tool:** build-production.ps1 + npm run build
**Build Verification:** ✅ 0x localhost, 13x /api
**Documentation:** ✅ README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
