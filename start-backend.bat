@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo 🚀 Iniciando CobroFacil Backend
echo ========================================

:: Función para verificar directorio
if not exist "backend\src\index.js" (
    echo ❌ Error: No se encontro backend\src\index.js
    echo 💡 Asegurese de ejecutar este script desde la raiz del proyecto CobroFacil
    echo    Directorio actual: %CD%
    echo    Directorio esperado: C:\...\cordobashot
    pause
    exit /b 1
)
echo ✅ Directorio correcto detectado

:: Función para verificar dependencias
echo.
echo 🔍 Verificando dependencias...

:: Verificar Node.js
node --version >nul 2>&1
if !errorlevel! neq 0 (
    echo ❌ Node.js no esta instalado
    echo 💡 Descargue Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

:: Verificar que exista package.json en backend
if not exist "backend\package.json" (
    echo ❌ No se encontro backend\package.json
    pause
    exit /b 1
)

:: Verificar node_modules
if not exist "backend\node_modules" (
    echo ⚠️  Dependencias no instaladas. Instalando...
    cd backend
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Error instalando dependencias
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Dependencias verificadas

:: Función para matar procesos en puerto 3000
echo.
echo 🔍 Buscando procesos en puerto 3000...

:: Buscar procesos usando el puerto 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    set "PID=%%a"
    if defined PID (
        echo ⚠️  Encontrado proceso usando puerto 3000: !PID!
        echo 🔄 Terminando proceso...
        taskkill /PID !PID! /F >nul 2>&1
        if !errorlevel! equ 0 (
            echo ✅ Proceso terminado correctamente
        ) else (
            echo ❌ No se pudo terminar el proceso
            echo 💡 Intente cerrar manualmente el proceso !PID!
        )
        timeout /t 2 /nobreak >nul
    )
)

:: Verificar puerto nuevamente
netstat -aon | findstr :3000 >nul 2>&1
if !errorlevel! equ 0 (
    echo ⚠️  Puerto 3000 aún en uso
    echo 💡 Cierre manualmente aplicaciones usando el puerto 3000
    pause
    exit /b 1
) else (
    echo ✅ Puerto 3000 disponible
)

:: Iniciar el backend
echo.
echo 🚀 Todo listo. Iniciando servidor...
echo ========================================
echo 💡 Para detener el servidor: Ctrl+C
echo 💡 Puerto: 3000
echo 💡 Ambiente: development
echo ========================================

:: Configurar variable de entorno
set NODE_ENV=development

:: Ejecutar el backend
echo 🎯 Iniciando backend...
node backend\src\index.js

:: Si llegamos aquí, el servidor se cerró
echo.
echo 🔄 Servidor detenido
pause 