@echo off
echo ========================================
echo   SPUSTENI BACKENDU - Flyer App
echo ========================================
echo.
echo POZOR: Před spuštěním je potřeba nastavit PostgreSQL!
echo --------------------------------------------------------
echo.
echo 1. Otevřete SQL Shell (psql) nebo pgAdmin
echo 2. Spusťte: ALTER USER postgres WITH PASSWORD 'postgres';
echo 3. Nebo vytvořte nového uživatele (viz NASTAVENI-POSTGRESQL.md)
echo.
echo Aktuální nastavení v .env:
type backend\.env | findstr DATABASE_URL
echo.
echo Pokračovat? (Stiskněte libovolnou klávesu)
pause
echo.

cd backend

echo [1/5] Generuji Prisma Client...
call npx prisma generate

echo.
echo [2/5] Vytvářím databázi a tabulky...
call npx prisma migrate dev --name init

echo.
echo [3/5] Naplňuji databázi daty...
call npm run seed

echo.
echo [4/5] Spouštím backend server...
echo.
echo Backend běží na: http://localhost:4000
echo API endpoint: http://localhost:4000/api
echo.
call npm run start:dev

pause
