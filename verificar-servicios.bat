@echo off
echo ========================================
echo    🔍 Verificando Servicios CobroFacil
echo ========================================
echo.

echo 📡 Verificando puertos...
echo.

REM Verificar puerto del backend (3001)
netstat -ano | findstr :3001 > nul
if %errorlevel% equ 0 (
    echo ✅ Backend (puerto 3001): FUNCIONANDO
) else (
    echo ❌ Backend (puerto 3001): NO FUNCIONA
)

REM Verificar puerto del frontend (3002)
netstat -ano | findstr :3002 > nul
if %errorlevel% equ 0 (
    echo ✅ Frontend (puerto 3002): FUNCIONANDO
) else (
    echo ❌ Frontend (puerto 3002): NO FUNCIONA
)

echo.
echo 🌐 URLs de acceso:
echo    • Frontend: http://localhost:3002
echo    • Backend:  http://localhost:3001
echo.
echo ========================================

pause 