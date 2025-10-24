@echo off
echo ========================================
echo   PostgreSQL Setup pro Flyer App
echo ========================================
echo.
echo Tento skript pomůže nastavit PostgreSQL databázi.
echo.
echo KROK 1: Nastavte heslo pro uživatele postgres
echo ------------------------------------------------
echo.
echo Otevřete SQL Shell (psql) a spusťte:
echo   ALTER USER postgres WITH PASSWORD 'postgres';
echo.
echo NEBO vytvoříte nového uživatele:
echo   CREATE USER flyer_user WITH PASSWORD 'flyer_password';
echo   CREATE DATABASE flyer_app OWNER flyer_user;
echo   GRANT ALL PRIVILEGES ON DATABASE flyer_app TO flyer_user;
echo.
echo ========================================
echo.
pause
echo.
echo Zadejte CONNECTION STRING pro .env soubor:
echo Příklad: postgresql://postgres:postgres@localhost:5432/flyer_app?schema=public
echo.
set /p DB_URL="DATABASE_URL="
echo.
echo Aktualizuji .env soubor...
echo # Database - PostgreSQL > .env.tmp
echo DATABASE_URL="%DB_URL%" >> .env.tmp
echo. >> .env.tmp
type .env | findstr /v "DATABASE_URL" | findstr /v "# Database" >> .env.tmp
move /y .env.tmp .env
echo.
echo ✓ .env soubor aktualizován
echo.
echo ========================================
echo KROK 2: Generuji Prisma Client...
echo ========================================
call npx prisma generate
echo.
echo ========================================
echo KROK 3: Vytvářím databázi a tabulky...
echo ========================================
call npx prisma migrate dev --name init
echo.
echo ========================================
echo KROK 4: Naplňuji databázi daty...
echo ========================================
call npm run seed
echo.
echo ========================================
echo ✓ PostgreSQL setup dokončen!
echo ========================================
echo.
pause
