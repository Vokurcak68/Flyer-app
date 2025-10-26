@echo off
echo ========================================
echo  Zastaveni vsech Node procesu
echo ========================================
echo.

echo Zastavuji vsechny Node.js procesy...
taskkill /F /IM node.exe 2>nul

if %errorlevel% == 0 (
    echo.
    echo [OK] Vsechny Node procesy zastaveny
) else (
    echo.
    echo [INFO] Zadne Node procesy nebezely
)

echo.
echo Kontrola portu 3000 a 4000...
netstat -ano | findstr ":3000 " | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo [!] Port 3000 je stale obsazeny
) else (
    echo [OK] Port 3000 je volny
)

netstat -ano | findstr ":4000 " | findstr LISTENING >nul
if %errorlevel% == 0 (
    echo [!] Port 4000 je stale obsazeny
) else (
    echo [OK] Port 4000 je volny
)

echo.
echo ========================================
echo  Hotovo!
echo ========================================
pause
