# Import Kategorií a Podkategorií do Produkční Databáze

## Přehled

Tento dokument popisuje proces přenosu kategorií a podkategorií z vývojové databáze do produkční databáze.

## Export z Vývojové Databáze

### Automatický export (doporučeno)

Použijte připravený Node.js script:

```bash
cd backend
node scripts/export-categories.js
```

Script vytvoří soubor `backend/categories-export.sql` s kompletním exportem.

**Výstup scriptu:**
- ✅ 16 kategorií
- ✅ 48 podkategorií
- 📄 SQL soubor s INSERT příkazy

### Ruční export (alternativa)

Pokud preferujete ruční export:

```bash
cd backend
psql -U username -d development_db -f export-categories.sql > categories-export.sql
```

## Import do Produkční Databáze

### Metoda 1: Pomocí psql (Command Line)

```bash
# Připojte se k produkční databázi a spusťte SQL script
psql -U username -d production_db -f categories-export.sql
```

**Příklad pro konkrétní produkční databázi:**
```bash
psql -U postgres -d flyer_production -f categories-export.sql
```

### Metoda 2: Pomocí pgAdmin

1. Otevřete pgAdmin
2. Připojte se k produkční databázi
3. Klikněte pravým tlačítkem na databázi → Query Tool
4. Otevřete soubor `categories-export.sql` (File → Open)
5. Spusťte SQL (F5 nebo tlačítko Execute)

### Metoda 3: Pomocí psql z Windows

```powershell
# Z PowerShell na produkčním serveru
$env:PGPASSWORD="your_password"
psql -h localhost -U postgres -d flyer_production -f "C:\path\to\categories-export.sql"
```

## Struktura SQL Souboru

SQL soubor obsahuje:

```sql
BEGIN;  -- Začátek transakce

-- INSERT příkazy pro kategorie
INSERT INTO categories (id, name, mssql_code, created_at, updated_at)
VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...;

-- INSERT příkazy pro podkategorie
INSERT INTO subcategories (id, category_id, name, created_at, updated_at)
VALUES (...)
ON CONFLICT (id) DO UPDATE SET ...;

COMMIT; -- Konec transakce
```

**Výhody:**
- ✅ Používá transakci (buď vše nebo nic)
- ✅ `ON CONFLICT` zajišťuje, že existující záznamy se aktualizují
- ✅ Zachovává ID z vývojové databáze (konzistence napříč prostředími)
- ✅ Zachovává vazby mezi kategoriemi a podkategoriemi

## Ověření Importu

Po importu ověřte data:

```sql
-- Spočítejte kategorie
SELECT COUNT(*) as total_categories FROM categories;
-- Mělo by vrátit: 16

-- Spočítejte podkategorie
SELECT COUNT(*) as total_subcategories FROM subcategories;
-- Mělo by vrátit: 48

-- Zkontrolujte vazby
SELECT
  c.name as category,
  COUNT(s.id) as subcategory_count
FROM categories c
LEFT JOIN subcategories s ON s.category_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

## Rollback v Případě Problému

Pokud import selže nebo potřebujete vrátit změny:

```sql
-- Import používá transakci, takže pokud něco selže, automaticky se rollbackne
-- Pokud chcete manuálně smazat importovaná data:

BEGIN;

-- Smazat podkategorie
DELETE FROM subcategories
WHERE id IN (SELECT id FROM categories WHERE created_at >= '2025-10-29');

-- Smazat kategorie
DELETE FROM categories
WHERE created_at >= '2025-10-29';

COMMIT;
```

**⚠️ POZOR:** Toto smaže všechny kategorie vytvořené po daném datu!

## Časté Problémy

### Problém: "relation does not exist"
**Řešení:** Ujistěte se, že jste spustili Prisma migrace:
```bash
cd backend
npx prisma migrate deploy
```

### Problém: "duplicate key value violates unique constraint"
**Řešení:** SQL script používá `ON CONFLICT`, takže by k tomuto nemělo dojít. Pokud ano, zkontrolujte, zda nevkládáte duplicitní hodnoty.

### Problém: Foreign key constraint violation
**Řešení:** SQL script vkládá nejdřív kategorie, pak podkategorie, takže by k tomuto nemělo dojít. Pokud ano, zkontrolujte pořadí INSERT příkazů.

## Produkty a Vazby

**⚠️ DŮLEŽITÉ:**
- Import přepíše/aktualizuje kategorie a podkategorie
- Existující produkty si zachovají vazby na kategorie (přes ID)
- Pokud změníte ID kategorií, budete muset aktualizovat i produkty

## Backup Před Importem

**DŮRAZNĚ DOPORUČENO** vytvořit backup produkční databáze před importem:

```bash
# Backup celé databáze
pg_dump -U postgres -d flyer_production > backup_before_categories.sql

# Nebo pouze tabulky kategorií
pg_dump -U postgres -d flyer_production -t categories -t subcategories > backup_categories.sql
```

## Kontakt

Při problémech s importem kontaktujte vývojový tým.

---

**Verze dokumentu:** 1.0
**Datum:** 7. listopadu 2025
**Export obsahuje:** 16 kategorií, 48 podkategorií
