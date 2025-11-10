# Instrukce pro Import na Produkčním Serveru

## Přehled
Tento dokument obsahuje kompletní instrukce pro import kategorií, podkategorií a ikon na produkční server.

---

## 1. Import Kategorií a Podkategorií

### Soubor k importu
- `backend/categories-export.sql` - SQL soubor s 16 kategoriemi a 48 podkategoriemi

### Postup importu

#### Metoda A: Pomocí psql (doporučeno)
```bash
# Přejdi do složky backend
cd backend

# Spusť import do produkční databáze
psql -U postgres -d flyer_production -f categories-export.sql
```

#### Metoda B: Pomocí PowerShell
```powershell
cd backend
$env:PGPASSWORD="tvoje_heslo"
psql -h localhost -U postgres -d flyer_production -f "categories-export.sql"
```

### Ověření importu
Po importu ověř data:
```sql
-- Spočítej kategorie (mělo by být 16)
SELECT COUNT(*) as total_categories FROM categories;

-- Spočítej podkategorie (mělo by být 48)
SELECT COUNT(*) as total_subcategories FROM subcategories;

-- Zkontroluj vazby
SELECT
  c.name as category,
  COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

### Poznámky
- SQL soubor používá transakci (BEGIN/COMMIT), takže v případě chyby se automaticky vrátí
- Používá `ON CONFLICT DO UPDATE`, takže je bezpečné spustit vícekrát
- Zachovává UUID z vývojové databáze pro konzistenci

---

## 2. Import Ikon

### Složka s ikonami
- `Ikony_zdroj/` - obsahuje 404 SVG ikon

### Postup importu

#### Krok 1: Spusť import script
```bash
# Přejdi do složky backend
cd backend

# Spusť import script
node scripts/import-icons.js
```

### Co script dělá
- Načte všechny `.svg` soubory ze složky `Ikony_zdroj/`
- Pro každý soubor:
  - Odstraní příponu `.svg` a použije jako název ikony
  - Načte SVG jako binární buffer
  - Zkontroluje, zda ikona s tímto názvem už existuje (přeskočí duplicity)
  - Vytvoří záznam v databázi s:
    - `name`: název bez přípony
    - `imageData`: binární data SVG
    - `imageMimeType`: "image/svg+xml"
    - `isEnergyClass`: `true` pokud název obsahuje "ENERG" nebo začíná "Energie "

### Očekávaný výstup
```
🔍 Načítám SVG ikony ze složky Ikony_zdroj...
✅ Nalezeno 404 SVG souborů
✅ Import: 6 smysl
✅ Import: Active Oxygen
...
✅ Import: Zona - trojita

✅ Import dokončen!

📋 Shrnutí:
   - Celkem souborů: 404
   - Naimportováno: 404
   - Přeskočeno (již existuje): 0
   - Chyby: 0
```

### Ověření importu ikon
```sql
-- Spočítej ikony (mělo by být 404)
SELECT COUNT(*) as total_icons FROM icons;

-- Zobraz energetické štítky
SELECT name FROM icons WHERE is_energy_class = true ORDER BY name;

-- Zobraz prvních 10 ikon
SELECT id, name, image_mime_type, is_energy_class FROM icons LIMIT 10;
```

---

## 3. Instalace Vodafone Fontů

### Důležité!
Pro správné generování PDF letáků je nutné nainstalovat Vodafone fonty.

### Postup
Viz soubor `FONTS_INSTALLATION.md` pro detailní instrukce.

### Rychlý přehled
1. Zkopíruj fonty z vývojového PC:
   - `VodafoneRg.ttf`
   - `VodafoneRgBd.ttf`
   - `VodafoneLt.ttf`

2. Na produkčním serveru:
   - Klikni pravým tlačítkem na každý `.ttf` soubor
   - Vyber "Install for all users"
   - Nebo zkopíruj do `C:\Windows\Fonts\`

3. Restartuj backend:
   ```bash
   pm2 restart flyer-api
   ```

---

## 4. Restart Backend po Importech

Po dokončení všech importů restartuj backend:

```bash
# Pokud používáš PM2
pm2 restart flyer-api

# Pokud používáš Windows Service
net stop "Flyer Management API"
net start "Flyer Management API"

# Nebo restartuj celý server
shutdown /r /t 0
```

---

## 5. Kontrola Logů

Po restartu zkontroluj logy:

```bash
# PM2 logy
pm2 logs flyer-api

# Hledej varování o chybějících fontech
pm2 logs flyer-api | grep -i "font"
```

---

## 6. Testování

### Test 1: Kategorie a podkategorie
1. Přihlaš se do aplikace
2. Přejdi na stránku produktů
3. Zkontroluj, že se zobrazují kategorie v selektu
4. Při výběru kategorie by se měly zobrazit správné podkategorie

### Test 2: Ikony
1. Přejdi na detail produktu
2. Zkontroluj, že se v sekci "Ikony" zobrazují všechny importované ikony
3. Přiřaď nějakou ikonu k produktu
4. Zkontroluj, že se ikona zobrazuje v seznamu produktů

### Test 3: Energetický štítek
1. Vyber produkt, který **má** energetický štítek (ikonu s `isEnergyClass = true`)
2. Zkus přidat produkt do letáku - mělo by fungovat
3. Vyber produkt, který **nemá** energetický štítek
4. Zkus přidat do letáku - mělo by zobrazit varování: "❌ Produkt nelze vložit do letáku! Produkt musí mít přiřazenou ikonu s energetickým štítkem."

### Test 4: PDF generování s fonty
1. Otevři existující leták
2. Klikni na "📄 Zobrazit PDF"
3. Zkontroluj, že produkty mají správný Vodafone font (ne Arial fallback)
4. Zkontroluj, že brand názvy jsou tučně

---

## 7. Řešení Problémů

### Problém: Kategorie nejsou vidět v aplikaci
**Řešení:**
1. Zkontroluj, že import proběhl úspěšně (viz SQL dotazy výše)
2. Restartuj backend
3. Zkontroluj browser console pro chyby
4. Vyčisti cache prohlížeče (Ctrl+Shift+Del)

### Problém: Ikony se nezobrazují
**Řešení:**
1. Zkontroluj počet ikon v databázi: `SELECT COUNT(*) FROM icons;`
2. Zkontroluj, že backend API endpoint `/icons` vrací data
3. Zkontroluj backend logy pro chyby při načítání ikon
4. Restartuj backend

### Problém: Import ikon selhal s chybou o imageData
**Řešení:**
- Zkontroluj, že používáš správnou verzi scriptu `import-icons.js`
- Script musí obsahovat: `imageData: svgBuffer` (ne `svgContent`)

### Problém: SQL import selhal
**Řešení:**
1. Zkontroluj připojení k databázi
2. Zkontroluj, že databázové tabulky existují (spusť Prisma migrace):
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
3. Zkontroluj encoding souboru (mělo by být UTF-8)

### Problém: Produkty bez energetického štítku se stále dají přidat do letáku
**Řešení:**
1. Zkontroluj, že backend běží s aktuálním kódem
2. Vyčisti browser cache
3. Zkontroluj, že ikona má správně nastavenou vlastnost `isEnergyClass`:
   ```sql
   SELECT name, is_energy_class FROM icons WHERE name LIKE '%Energie%' OR name LIKE '%ENERG%';
   ```
4. Pokud ne, uprav ručně:
   ```sql
   UPDATE icons SET is_energy_class = true
   WHERE name LIKE '%Energie%' OR name LIKE '%ENERG%';
   ```

---

## 8. Rollback (v případě problémů)

### Rollback kategorií
```sql
BEGIN;

-- Smaž podkategorie importované po určitém datu
DELETE FROM subcategories WHERE created_at >= '2025-11-07';

-- Smaž kategorie importované po určitém datu
DELETE FROM categories WHERE created_at >= '2025-11-07';

COMMIT;
```

### Rollback ikon
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

**⚠️ POZOR:** Rollback provádějte pouze v případě vážných problémů!

---

## 9. Kontakt

Při problémech s importem kontaktuj vývojový tým.

---

**Verze dokumentu:** 1.0
**Datum:** 7. listopadu 2025
**Aplikace:** Flyer Management System v3.1.2

## Checklist pro Produkční Import

- [ ] 1. Zkopírovat složku s daty na produkční server
- [ ] 2. Importovat kategorie a podkategorie (SQL)
- [ ] 3. Ověřit import kategorií (SQL dotazy)
- [ ] 4. Importovat ikony (Node.js script)
- [ ] 5. Ověřit import ikon (SQL dotazy)
- [ ] 6. Instalovat Vodafone fonty
- [ ] 7. Restartovat backend
- [ ] 8. Zkontrolovat logy
- [ ] 9. Otestovat kategorie v aplikaci
- [ ] 10. Otestovat ikony v aplikaci
- [ ] 11. Otestovat validaci energetického štítku
- [ ] 12. Otestovat PDF generování s fonty
- [ ] 13. Vyčistit cache prohlížeče
- [ ] 14. Finální kontrola funkčnosti
