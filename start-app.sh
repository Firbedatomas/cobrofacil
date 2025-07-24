#!/bin/bash

echo "========================================"
echo "   🚀 Iniciando CobroFacil POS"
echo "========================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecute este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar dependencias del frontend
if [ ! -d "node_modules" ]; then
    echo "⚠️  No se encontraron node_modules. Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias del frontend"
        exit 1
    fi
fi

# Verificar dependencias del backend
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  No se encontraron node_modules del backend. Instalando dependencias..."
    cd backend && npm install && cd ..
    if [ $? -ne 0 ]; then
        echo "❌ Error instalando dependencias del backend"
        exit 1
    fi
fi

echo "✅ Verificaciones completadas"
echo ""
echo "🚀 Iniciando Backend y Frontend..."
echo "💡 Presione Ctrl+C para detener ambos servicios"
echo ""
echo "📋 URLs disponibles:"
echo "   • Frontend: http://localhost:3002"
echo "   • Backend:  http://localhost:3001"
echo ""
echo "========================================"

# Iniciar backend y frontend usando concurrently
npm run start 