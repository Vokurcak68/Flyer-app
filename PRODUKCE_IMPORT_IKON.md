# Instrukce pro Import Ikon na Produkčním Serveru

## Přehled
Tento dokument obsahuje instrukce pro import 404 SVG ikon do produkční databáze.

---

## Import Ikon

### Co potřebuješ
- Složka `Ikony_zdroj/` s 404 SVG soubory
- Script `backend/scripts/import-icons.js`

### Postup

#### Krok 1: Přejdi do složky backend
```bash
cd backend
```

#### Krok 2: Spusť import script
```bash
node scripts/import-icons.js
```

### Očekávaný výstup
```
🔍 Načítám SVG ikony ze složky Ikony_zdroj...
✅ Nalezeno 404 SVG souborů
✅ Import: 6 smysl
✅ Import: Active Oxygen
✅ Import: AdaptTech
...
✅ Import: Zona - trojita

✅ Import dokončen!

📋 Shrnutí:
   - Celkem souborů: 404
   - Naimportováno: 404
   - Přeskočeno (již existuje): 0
   - Chyby: 0
```

### Co script dělá
- Načte všechny `.svg` soubory ze složky `Ikony_zdroj/`
- Pro každý soubor:
  - Odstraní příponu `.svg` a použije jako název ikony
  - Načte SVG jako binární buffer
  - Zkontroluje, zda ikona s tímto názvem už existuje (přeskočí duplicity)
  - Vytvoří záznam v databázi s:
    - **name**: název bez přípony (např. "Active Oxygen", "Energie A++")
    - **imageData**: binární data SVG souboru
    - **imageMimeType**: "image/svg+xml"
    - **isEnergyClass**: `true` pokud název obsahuje "ENERG" nebo začíná "Energie "

---

## Ověření Importu

Po dokončení importu ověř, že ikony jsou v databázi:

```sql
-- Spočítej ikony (mělo by být 404)
SELECT COUNT(*) as total_icons FROM icons;

-- Zobraz energetické štítky
SELECT name FROM icons
WHERE is_energy_class = true
ORDER BY name;

-- Zobraz prvních 20 ikon
SELECT id, name, image_mime_type, is_energy_class
FROM icons
ORDER BY name
LIMIT 20;
```

---

## Testování v Aplikaci

### Test 1: Zobrazení ikon v seznamu
1. Přihlaš se do aplikace
2. Přejdi na detail nějakého produktu
3. V sekci "Ikony" by se měly zobrazit všechny importované ikony (404 ikon)
4. Ikony by měly být seřazené podle názvu

### Test 2: Přiřazení ikony k produktu
1. Vyber nějakou ikonu (např. "Active Oxygen")
2. Přiřaď ji k produktu
3. Ulož produkt
4. Zkontroluj, že se ikona zobrazuje u produktu v seznamu produktů

### Test 3: Energetický štítek
1. Přiřaď produktu ikonu s energetickým štítkem (např. "Energie A+++")
2. Zkus přidat produkt do letáku - mělo by fungovat
3. Odeber energetický štítek od produktu
4. Zkus znovu přidat do letáku - mělo by zobrazit varování: "❌ Produkt nelze vložit do letáku! Produkt musí mít přiřazenou ikonu s energetickým štítkem."

---

## Řešení Problémů

### Problém: Script nenašel složku Ikony_zdroj
**Řešení:**
- Zkontroluj, že složka `Ikony_zdroj` je ve správném umístění (v root složce projektu, vedle složky `backend`)
- Script očekává cestu: `C:\Projekty\flyer-app\Ikony_zdroj\` (nebo ekvivalent na Linuxu)

### Problém: Ikony se nezobrazují v aplikaci
**Řešení:**
1. Zkontroluj počet ikon v databázi: `SELECT COUNT(*) FROM icons;`
2. Restartuj backend:
   ```bash
   pm2 restart flyer-api
   ```
3. Vyčisti cache prohlížeče (Ctrl+Shift+Del)
4. Zkontroluj browser console pro chyby

### Problém: Import selhal s chybou "Argument imageData is missing"
**Řešení:**
- Zkontroluj, že používáš správnou verzi scriptu `import-icons.js`
- Script **MUSÍ** obsahovat:
  ```javascript
  imageData: svgBuffer,  // SPRÁVNĚ
  ```
  **NE:**
  ```javascript
  svgContent: svgContent,  // ŠPATNĚ
  ```

### Problém: Některé ikony mají nesprávně nastavený isEnergyClass
**Řešení:**
Uprav ručně v databázi:
```sql
-- Nastav všechny energetické štítky na true
UPDATE icons SET is_energy_class = true
WHERE name LIKE '%Energie%' OR name LIKE '%ENERG%';

-- Zkontroluj výsledek
SELECT name, is_energy_class FROM icons
WHERE is_energy_class = true
ORDER BY name;
```

### Problém: Import se zasekl nebo běží velmi pomalu
**Řešení:**
- Import 404 ikon by měl trvat cca 1-2 minuty
- Pokud trvá déle než 5 minut, přeruš script (Ctrl+C) a spusť znovu
- Zkontroluj připojení k databázi
- Zkontroluj volné místo na disku

---

## Rollback (smazání importovaných ikon)

Pokud potřebuješ smazat importované ikony:

```sql
BEGIN;

-- Nejdřív smaž vazby na produkty
DELETE FROM product_icons WHERE icon_id IN (
  SELECT id FROM icons WHERE created_at >= '2025-11-07'
);

-- Pak smaž ikony
DELETE FROM icons WHERE created_at >= '2025-11-07';

COMMIT;
```

**⚠️ POZOR:** Toto smaže všechny ikony importované po 7. listopadu 2025!

---

## Seznam Importovaných Ikon

### Energetické štítky (isEnergyClass = true)
- ENERG-STITEK_Energie A, B, C, D, E, F, G
- ENERG_STITEK_Energie DA, DAA, DAAA, DAAAA, DB, DC, DD
- Energie A, A+, A++, A+++, A++++, B, C, D, E, F
- Energie A -10, A -20, A -30, A -60
- Energie A+++ -10, A+++ -20, A+++ -30, A+++ -40

### Příklady ostatních ikon
- Active Oxygen, AdaptTech, Add Dish
- AI recepty, AI sensor, AI sonda
- AquaStop, AutoPilot
- Booster 1x, 2x, 3x, 4x
- Cashback 500, 1000, 1500, 2000, 3000, 7000, 8000
- Design - Absolute, Retro, Starck, atd.
- No Frost, No Frost Plus
- Wi-Fi, Wi-Fi + Bluetooth
- A mnoho dalších...

**Celkem: 404 ikon**

---

## Důležité poznámky

1. **Script je idempotentní** - můžeš ho spustit vícekrát, duplicitní ikony budou přeskočeny
2. **Názvy ikon jsou z názvů souborů** - "Energie A++.svg" → "Energie A++"
3. **Energetické štítky** jsou automaticky detekovány podle názvu
4. **SVG jsou uložena jako binární data** - ne jako text
5. **MIME type** je nastaven na "image/svg+xml"

---

**Verze dokumentu:** 1.0
**Datum:** 7. listopadu 2025
**Aplikace:** Flyer Management System v3.1.2

## Checklist

- [ ] Složka `Ikony_zdroj` je zkopírována na produkční server
- [ ] Přešel jsem do složky `backend`
- [ ] Spustil jsem `node scripts/import-icons.js`
- [ ] Import proběhl úspěšně (404 ikon naimportováno)
- [ ] Ověřil jsem počet ikon v databázi SQL dotazem
- [ ] Restartoval jsem backend
- [ ] Otestoval jsem zobrazení ikon v aplikaci
- [ ] Otestoval jsem přiřazení ikony k produktu
- [ ] Otestoval jsem validaci energetického štítku
