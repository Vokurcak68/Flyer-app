-- Export kategorií a podkategorií z vývojové databáze
-- Tento SQL script vygeneruje INSERT příkazy pro import do produkční databáze

-- Export kategorií
SELECT
    'INSERT INTO categories (id, name, mssql_code, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    COALESCE('''' || mssql_code || '''', 'NULL') || ', ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || '''' ||
    ') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, mssql_code = EXCLUDED.mssql_code;'
FROM categories
ORDER BY created_at;

-- Prázdný řádek pro oddělení
SELECT '';

-- Export podkategorií (s vazbou na kategorie)
SELECT
    'INSERT INTO subcategories (id, category_id, name, created_at, updated_at) VALUES (' ||
    '''' || id || ''', ' ||
    '''' || category_id || ''', ' ||
    '''' || REPLACE(name, '''', '''''') || ''', ' ||
    '''' || created_at || ''', ' ||
    '''' || updated_at || '''' ||
    ') ON CONFLICT (id) DO UPDATE SET category_id = EXCLUDED.category_id, name = EXCLUDED.name;'
FROM subcategories
ORDER BY created_at;
