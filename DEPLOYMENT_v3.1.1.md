# Návod pro nasazení verze 3.1.1 do produkce

## Co obsahuje tato verze:

### Nové funkce:
1. **Kompletní správa ikon s kategoriemi a značkami**
   - Administrace ikon s přiřazením kategorií a značek (many-to-many)
   - Filtrování ikon v produktovém editoru podle značky A kategorie
   - Záložkové rozhraní pro výběr ikon (Ostatní ikony / Energetické štítky)
   - Energetické štítky se zobrazují vždy, běžné ikony podle značky+kategorie

2. **Databázové změny:**
   - Nové junction tabulky: `icon_categories` a `icon_brands`
   - Rozšířený Icon model o relace s Category a Brand

## DŮLEŽITÉ: Postup nasazení

### Krok 1: Záloha databáze (KRITICKÉ!)
```bash
# Vytvoř zálohu produkční databáze PŘED jakýmkoliv dalším krokem!
# Toto je nezbytné kvůli migraci databáze
pg_dump $DATABASE_URL > backup_before_v3.1.1_$(date +%Y%m%d_%H%M%S).sql
```

### Krok 2: Stáhni nejnovější verzi z Gitu
```bash
cd /path/to/flyer-app
git fetch origin
git checkout master
git pull origin master
```

### Krok 3: Zkontroluj aktuální verzi
```bash
# Měla by zobrazit 3.1.1
cat package.json | grep version
cat backend/package.json | grep version
```

### Krok 4: Backend - Instalace závislostí a migrace

```bash
cd backend

# Instalace nových/aktualizovaných dependencies
npm install

# DŮLEŽITÉ: Vygeneruj Prisma Client s novými modely
npx prisma generate

# Aplikuj databázovou migraci
# Tato migrace vytvoří tabulky icon_categories a icon_brands
npx prisma migrate deploy

# ZKONTROLUJ: Migrace by měla být úspěšná
# Měl bys vidět: "1 migration applied: 20251105200000_add_icon_categories_and_brands"
```

### Krok 5: Backend - Build a restart

```bash
# Build backendu
npm run build

# Restart backend služby (podle tvého setupu)
# Příklad pro PM2:
pm2 restart flyer-backend

# Příklad pro systemd:
sudo systemctl restart flyer-backend

# Zkontroluj, že backend běží:
pm2 logs flyer-backend --lines 50
# nebo
sudo systemctl status flyer-backend
```

### Krok 6: Frontend - Build a deploy

```bash
cd ..  # zpět do root složky

# Instalace dependencies
npm install

# Build produkční verze
npm run build

# Deploy buildu (podle tvého setupu)
# Příklad: zkopíruj build do nginx složky
# sudo cp -r build/* /var/www/flyer-app/

# Restartuj nginx/webserver pokud je třeba
# sudo systemctl restart nginx
```

### Krok 7: Ověření nasazení

1. **Zkontroluj backend API:**
```bash
# Test API endpointu
curl https://tvoje-domena.cz/api/health

# Nebo zkontroluj logy:
pm2 logs flyer-backend --lines 100
```

2. **Zkontroluj frontend:**
   - Otevři https://tvoje-domena.cz v prohlížeči
   - Zkontroluj verzi v konzoli (pokud je zobrazena)
   - Přihlaš se jako admin

3. **Ověř nové funkce:**
   - Jdi do Administrace → Ikony
   - Měl bys vidět nový seznam ikon s kategoriemi a značkami
   - Zkus vytvořit novou ikonu s přiřazením kategorie a značky
   - Jdi do editace produktu
   - Otevři modal pro výběr ikon
   - Měl bys vidět 2 záložky: "Ostatní ikony" a "Energetické štítky"

### Krok 8: Řešení problémů

**Pokud migrace selže:**
```bash
# Zkontroluj status migrací
cd backend
npx prisma migrate status

# Pokud je problém, obnov ze zálohy:
psql $DATABASE_URL < backup_before_v3.1.1_TIMESTAMP.sql

# A kontaktuj vývojáře
```

**Pokud backend nenaběhne:**
```bash
# Zkontroluj logy
pm2 logs flyer-backend --err --lines 100

# Často pomůže regenerovat Prisma Client:
cd backend
npx prisma generate
npm run build
pm2 restart flyer-backend
```

**Pokud frontend nezobrazuje změny:**
```bash
# Vyčisti cache a rebuild:
rm -rf node_modules build
npm install
npm run build

# Vyčisti browser cache nebo použij Ctrl+Shift+R
```

## Databázová migrace - Detail

### Co přesně migrace dělá:
1. Vytvoří tabulku `icon_categories` s:
   - `id` (UUID, primary key)
   - `icon_id` (foreign key na `icons`)
   - `category_id` (foreign key na `categories`)
   - `created_at` (timestamp)
   - Unique constraint na `(icon_id, category_id)`
   - Cascade delete

2. Vytvoří tabulku `icon_brands` s:
   - `id` (UUID, primary key)
   - `icon_id` (foreign key na `icons`)
   - `brand_id` (foreign key na `brands`)
   - `created_at` (timestamp)
   - Unique constraint na `(icon_id, brand_id)`
   - Cascade delete

### Rollback (pokud je potřeba):
```bash
cd backend

# Vrať migraci zpět
npx prisma migrate resolve --rolled-back 20251105200000_add_icon_categories_and_brands

# Obnov databázi ze zálohy
psql $DATABASE_URL < backup_before_v3.1.1_TIMESTAMP.sql
```

## Změny v kódu které ovlivňují produkci:

### API Endpointy:
- **Nové/změněné:**
  - `PUT /api/icons/:id` (změněno z PATCH)
  - `POST /api/icons` - nyní přijímá `categoryIds[]` a `brandIds[]`
  - `PUT /api/icons/:id` - nyní přijímá `categoryIds[]` a `brandIds[]`
  - `GET /api/icons` - nyní vrací relace s kategoriemi a značkami

### Frontend routes:
- `/admin/icons` - nový seznam ikon
- `/admin/icons/new` - vytvoření nové ikony
- `/admin/icons/:id/edit` - editace ikony

## Monitoring po nasazení

Po nasazení sleduj:
1. **Backend logy** - první 30 minut po nasazení
2. **Databázové chyby** - zkontroluj, že migrace proběhla správně
3. **Frontend errory** - zkontroluj console v prohlížeči
4. **API response times** - měly by být stejné jako před nasazením

## Kontakt v případě problémů

Pokud narazíš na jakýkoliv problém:
1. **NEMAZEJ ZÁLOHU** databáze!
2. Pošli logy z backendu
3. Pošli screenshot z frontendu (pokud je visual problém)
4. Uveď přesný krok, na kterém nasazení selhalo

---

**Verzace:**
- Frontend: 3.1.1
- Backend: 3.1.1
- Datum nasazení: [VYPLŇ PO NASAZENÍ]
- Nasazeno Claudem: [VYPLŇ]
- Git commit: cd961664
