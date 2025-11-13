# Deployment Notes - v3.1.9 (Hotfix)

**Release Date:** 12. listopadu 2025
**Type:** Hotfix
**Severity:** Medium
**Downtime Required:** ~2 minutes (restart services only)

---

## Executive Summary

Verze 3.1.9 je **hotfix** opravující logiku detekce ukončených produktů. Předchozí verze kontrolovaly pouze existenci EAN v ERP, ale nekontrolovaly pole `Ukonceno` v ERP view. Navíc byl problém s type coercion (strict vs loose equality).

**Klíčové body:**
- ✅ Backend fix (kontrola pole Ukonceno v ERP + type coercion fix)
- ✅ Frontend beze změn (kromě čísla verze)
- ✅ ŽÁDNÉ databázové změny
- ✅ Zpětně kompatibilní s v3.1.8
- ✅ Bezpečný rollback (jen soubory, ne databáze)

---

## What's Changed

### 🐛 Bug Fixes

**Issue #3:** Produkty s `Ukonceno = 1` v ERP nebyly detekovány jako ukončené
**Root Cause:**
1. Metoda `checkProductsExistence()` kontrolovala pouze existenci EAN v ERP, ale ignorovala pole `Ukonceno`
2. Type coercion issue - strict equality `===` nefungovala když SQL Server vrací string "1" místo number 1

**Impact:** Produkty které existovaly v ERP ale měly `Ukonceno = 1` nebyly označeny jako discontinued a nezobrazoval se u nich vodotisk "VYPRODÁNO"

**Fix:**
- Metoda `checkProductsExistence()` nyní vrací `{ exists: boolean, discontinued: boolean }`
- SQL dotaz SELECT nyní obsahuje pole `Ukonceno`: `SELECT DISTINCT Barcode, ISNULL(Ukonceno, 0) as Ukonceno FROM hvw_vok_Oresi_EletakNew_NC`
- Produkt je discontinued pokud:
  - BUĎTO není ve view vůbec (`!exists`)
  - NEBO je ve view ale má `Ukonceno = 1`
- Type coercion fix: Změna z `record.Ukonceno === 1` na `record.Ukonceno == 1` (loose equality)
- DŮLEŽITÉ: Název sloupce je "Ukonceno" bez diakritiky (ne "Ukončeno")!

**Fixes from v3.1.8:**
- Fix #1: Pole "Typ spotřebiče" - ERP auto-fill nyní funguje správně
- Fix #2: Generování PDF pro supplier - přidána práva pro generate-pdf endpoint

---

## Changed Files

### Backend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `backend/src/common/mssql.service.ts` | Modified | 220-269 | Přidána kontrola pole Ukonceno z ERP view + type coercion fix |
| `backend/src/products/products.service.ts` | Modified | 976-990 | Upravena logika pro detekci discontinued produktů |

### Frontend

| File | Change | Lines | Description |
|------|--------|-------|-------------|
| `src/components/layout/AppFooter.tsx` | Modified | 19 | Aktualizace verze na 3.1.9 |

### Build Files

| File | Change | Description |
|------|--------|-------------|
| `package.json` | Modified | Verze 3.1.8 → 3.1.9 |
| `backend/package.json` | Modified | Verze 3.1.8 → 3.1.9 |

---

## Technical Details

### mssql.service.ts Changes

**Before (v3.1.8):**
```typescript
async checkProductsExistence(eanCodes: string[]): Promise<Map<string, boolean>> {
  const query = `SELECT DISTINCT Barcode FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode IN (${eanList})`;
  // Vrací pouze true/false pro existenci EAN
}
```

**After (v3.1.9):**
```typescript
async checkProductsExistence(eanCodes: string[]): Promise<Map<string, { exists: boolean; discontinued: boolean }>> {
  // Use ISNULL to treat NULL as 0 (not discontinued)
  const query = `SELECT DISTINCT Barcode, ISNULL(Ukonceno, 0) as Ukonceno FROM hvw_vok_Oresi_EletakNew_NC WHERE Barcode IN (${eanList})`;

  // Pro každý EAN vrací:
  // - exists: zda EAN existuje v ERP
  // - discontinued: zda má Ukonceno = 1 (pouze 1, ne 0 ani NULL)

  return existenceMap.set(record.Barcode, {
    exists: true,
    discontinued: record.Ukonceno == 1, // Loose equality - handles both number 1 and string "1"
  });
}
```

**DŮLEŽITÉ ZMĚNY:**
1. SQL: `ISNULL(Ukonceno, 0)` - NULL se považuje za 0 (ne ukončeno)
2. Název sloupce: `Ukonceno` (bez háčku nad e) - ne `Ukončeno`!
3. Type coercion: `==` místo `===` (loose equality pro number i string)

### products.service.ts Changes

**Before (v3.1.8):**
```typescript
return products.map(product => ({
  ...product,
  discontinued: !existenceMap.get(product.eanCode), // Pouze kontrola existence
}));
```

**After (v3.1.9):**
```typescript
return products.map(product => {
  const erpStatus = existenceMap.get(product.eanCode);
  return {
    ...product,
    discontinued: !erpStatus?.exists || erpStatus?.discontinued, // Kontrola existence A Ukonceno
  };
});
```

---

## Database Changes

**ŽÁDNÉ** - v3.1.9 neobsahuje databázové změny

---

## Deployment Steps (Quick)

```bash
# 1. Záloha (doporučeno)
cp -r /var/www/flyer-app/backend /var/www/flyer-app/backend_backup_$(date +%Y%m%d)
cp -r /var/www/flyer-app/frontend /var/www/flyer-app/frontend_backup_$(date +%Y%m%d)

# 2. Stop services
pm2 stop flyer-app-backend

# 3. Deploy backend (HLAVNÍ ZMĚNA)
rm -rf /var/www/flyer-app/backend/dist
cp -r Production_v3.1.9/dist /var/www/flyer-app/backend/
cp Production_v3.1.9/.env /var/www/flyer-app/backend/
cp Production_v3.1.9/package.json /var/www/flyer-app/backend/
cd /var/www/flyer-app/backend && npm install --production

# 4. Deploy frontend (pouze změna verze)
rm -rf /var/www/flyer-app/frontend/*
cp -r Production_v3.1.9/frontend/* /var/www/flyer-app/frontend/
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

### Critical Test - Ukončené produkty v ERP

**Priority:** HIGH
**Duration:** 3 min

1. Přihlas se jako admin
2. Jdi na "Produkty v letácích"
3. Zkontroluj seznam produktů
4. ✅ Produkty které mají `Ukonceno = 1` v ERP jsou označeny červenou ikonou
5. ✅ Produkty které nejsou v ERP vůbec jsou také označeny červenou ikonou
6. ✅ Produkty které jsou v ERP a mají `Ukonceno = 0` jsou označeny zelenou ikonou
7. Klikni "Synchronizovat stav vyprodáno"
8. ✅ Ukončené produkty jsou označeny jako soldOut
9. ✅ Vodotisk "VYPRODÁNO" se zobrazuje u ukončených produktů v PDF

**Expected Results:**
- Detekce ukončených produktů funguje správně
- Vodotisk se zobrazuje u všech ukončených produktů
- Synchronizace stavu funguje

**Test Data:**
- Barcode `8806094305029` (Ukonceno = 0) → má být aktivní (zelená ikona)
- Barcode `8806094348668` (Ukonceno = 1) → má být ukončený (červená ikona)

### Regression Tests

Ověř že nové změny nerozbily existující funkce:
- ✅ ERP auto-fill typ spotřebiče (z v3.1.8)
- ✅ PDF generování pro supplier (z v3.1.8)
- ✅ Vytvoření produktu funguje
- ✅ Editace produktu funguje
- ✅ Filtry produktů fungují

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

**DŮLEŽITÉ:** ŽÁDNÝ databázový rollback není třeba - v3.1.9 nemá DB změny!

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|--------------|
| Špatná detekce ukončených produktů | Low | Medium | Testováno s produkčními daty z ERP |
| Změna struktury existenceMap | Low | Medium | Type-safe TypeScript, zkompilováno bez errors |
| Type coercion problémy | Very Low | Low | Loose equality (==) funguje pro number i string |
| Regression v jiných částech | Very Low | Medium | Změna je izolovaná na ERP kontrolu |
| Databázové problémy | None | N/A | Žádné DB změny |

**Overall Risk:** **LOW**
**Recommended Deployment Window:** Kdykoli (preferovaně mimo špičku)

---

## Known Issues

Žádné známé problémy v této verzi.

---

## Version History

### v3.1.9 (2025-11-12) - Hotfix
- 🐛 Fix: Detekce ukončených produktů - nyní kontroluje pole Ukonceno v ERP view
- 🐛 Fix: Type coercion - loose equality (==) místo strict (===)
- 📝 Produkty jsou discontinued pokud: !exists NEBO Ukonceno = 1
- 📝 Název sloupce je "Ukonceno" (bez diakritiky)

### v3.1.8 (2025-11-12) - Hotfix
- 🐛 Fix: Pole "Typ spotřebiče" - ERP auto-fill nyní funguje správně
- 🐛 Fix: Generování PDF pro supplier - přidána práva pro generate-pdf endpoint

### v3.1.7 (2025-11-11)
- ✨ Vodotisk "VYPRODÁNO" pro ukončené produkty
- ✨ Synchronizace stavu vyprodáno s ERP (admin)
- ✨ Filtry produktů v aktivních letácích (admin)
- ✨ Tlačítko "Generovat PDF" pro schvalovatele
- 🐛 Fix: Icon image serving (res.end místo res.send)

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
- [ ] Critical test: Detekce ukončených produktů passed
- [ ] Regression tests: ERP auto-fill, PDF, vodotisky fungují

---

**Build Completed:** 12. listopadu 2025
**Build Tool:** build-production.ps1 + npm run build
**Build Verification:** ✅ 0x localhost, 13x /api
**Documentation:** ✅ README.txt, DEPLOY_CHECKLIST.txt, DEPLOYMENT_NOTES.md
