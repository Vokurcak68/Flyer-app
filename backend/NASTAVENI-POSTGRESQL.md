# Nastavení PostgreSQL pro Flyer App

## Problém
Nemůžu se připojit k PostgreSQL databázi - potřebuji znát správné heslo pro uživatele `postgres`.

## Řešení

### Možnost 1: Nastavit heslo v PostgreSQL

1. Otevřete SQL Shell (psql) nebo pgAdmin
2. Přihlaste se jako postgres
3. Spusťte tento příkaz:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
```

### Možnost 2: Vytvořit nového uživatele

```sql
CREATE USER flyer_user WITH PASSWORD 'flyer_password';
CREATE DATABASE flyer_app OWNER flyer_user;
GRANT ALL PRIVILEGES ON DATABASE flyer_app TO flyer_user;
```

Pak změňte v `.env`:
```
DATABASE_URL="postgresql://flyer_user:flyer_password@localhost:5432/flyer_app?schema=public"
```

### Možnost 3: Zjistit aktuální heslo

1. Podívejte se do souboru `pg_hba.conf` (obvykle v `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`)
2. Zkontrolujte metodu autentizace pro localhost
3. Pokud je `trust`, změňte heslo příkazem výše
4. Pokud je `md5` nebo `scram-sha-256`, potřebujete znát původní heslo nastavené při instalaci

### Možnost 4: Reset hesla (pokud jste zapomněli)

1. Editujte `pg_hba.conf`
2. Změňte metodu pro localhost na `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
3. Restartujte PostgreSQL service
4. Připojte se bez hesla a změňte ho
5. Vraťte metodu zpět na `scram-sha-256`
6. Znovu restartujte service

## Co je potřeba

**Aktualizujte soubor `.env` se správným heslem:**

```env
DATABASE_URL="postgresql://postgres:VASE_HESLO@localhost:5432/flyer_app?schema=public"
```

Poté spusťte:
```bash
npx prisma migrate dev --name init
```
