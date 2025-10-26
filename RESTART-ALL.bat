@echo off
echo ========================================
echo  Restart flyer-app (backend + frontend)
echo ========================================
echo.

echo [1/4] Zastavuji vsechny Node procesy...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo    - Node procesy zastaveny
) else (
    echo    - Zadne Node procesy nebezi
)

echo.
echo [2/4] Cekam 3 sekundy...
timeout /t 3 /nobreak >nul

echo.
echo [3/4] Spoustim backend...
cd backend
start "Flyer Backend" cmd /k "npm run start:dev"
cd ..

echo.
echo [4/4] Cekam 10 sekund pred spustenim frontendu...
timeout /t 10 /nobreak >nul

echo.
echo Spoustim frontend...
start "Flyer Frontend" cmd /k "npm start"

echo.
echo ========================================
echo  Hotovo!
echo  Backend: http://localhost:4000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
pause
