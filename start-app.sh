#!/bin/bash

# 🚀 Script de inicio rápido para CobroFácil
# ========================================

echo "🎯 CobroFácil - Iniciando Aplicación Completa"
echo "============================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecute este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar dependencias
echo "🔍 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "⚠️  No se encontraron node_modules. Instalando dependencias..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  No se encontraron node_modules del backend. Instalando dependencias..."
    cd backend && npm install && cd ..
fi

# Verificar puerto backend
if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  El puerto 3000 está ocupado. Cerrando proceso anterior..."
    pkill -f "node.*index.js" || true
    sleep 2
fi

# Verificar puerto frontend  
if lsof -i :3002 > /dev/null 2>&1; then
    echo "⚠️  El puerto 3002 está ocupado. Cerrando proceso anterior..."
    pkill -f "vite.*3002" || true
    sleep 2
fi

echo "✅ Verificaciones completadas"
echo ""
echo "🚀 Iniciando Backend + Frontend..."
echo "💡 Presione Ctrl+C para detener ambos servicios"
echo ""
echo "📋 URLs disponibles:"
echo "   • Frontend: http://localhost:3002"
echo "   • Backend:  http://localhost:3000"
echo ""
echo "============================================="

# Iniciar backend y frontend en paralelo
npm run dev:app 