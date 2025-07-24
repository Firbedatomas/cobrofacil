@echo off
echo ========================================
echo    🚀 Iniciando CobroFacil POS
echo ========================================
echo.

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: Ejecute este script desde el directorio raíz del proyecto
    pause
    exit /b 1
)

REM Verificar dependencias del frontend
if not exist "node_modules" (
    echo ⚠️  No se encontraron node_modules. Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del frontend
        pause
        exit /b 1
    )
)

REM Verificar dependencias del backend
if not exist "backend\node_modules" (
    echo ⚠️  No se encontraron node_modules del backend. Instalando dependencias...
    cd backend
    npm install
    if errorlevel 1 (
        echo ❌ Error instalando dependencias del backend
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Verificaciones completadas
echo.
echo 🚀 Iniciando Backend y Frontend...
echo 💡 Presione Ctrl+C para detener ambos servicios
echo.
echo 📋 URLs disponibles:
echo    • Frontend: http://localhost:3002
echo    • Backend:  http://localhost:3001
echo.
echo ========================================

REM Iniciar backend y frontend usando concurrently
npm run start

pause 