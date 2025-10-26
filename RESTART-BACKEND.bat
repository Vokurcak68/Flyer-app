@echo off
echo Zastavuji backend...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo Spoustim backend...
cd backend
start "Flyer Backend" cmd /k "npm run start:dev"
cd ..

echo Backend se spousti v novem okne...
pause
