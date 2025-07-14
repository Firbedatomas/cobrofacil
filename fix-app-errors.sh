#!/bin/bash

echo "🔧 SOLUCIONANDO ERRORES DE LA APLICACIÓN COBROFÁCIL"
echo "=============================================="

# 1. Limpiar tokens de autenticación inválidos
echo "🗑️ Limpiando tokens de autenticación inválidos..."
echo "
// Limpiar localStorage
localStorage.removeItem('authToken');
localStorage.removeItem('usuario');
console.log('✅ Tokens limpiados');
" > /tmp/clear-auth.js

# 2. Verificar y crear variables de entorno faltantes
echo "⚙️ Verificando variables de entorno..."
if [ ! -f backend/.env ]; then
    echo "DATABASE_URL=postgresql://usuario:password@localhost:5432/cobrofacil" > backend/.env
    echo "JWT_SECRET=mi_jwt_secret_super_seguro_2024" >> backend/.env
    echo "NODE_ENV=development" >> backend/.env
    echo "PORT=3000" >> backend/.env
    echo "✅ Variables de entorno creadas"
else
    echo "✅ Variables de entorno existen"
fi

# 3. Verificar JWT_SECRET en backend
if ! grep -q "JWT_SECRET" backend/.env; then
    echo "JWT_SECRET=mi_jwt_secret_super_seguro_2024" >> backend/.env
    echo "✅ JWT_SECRET agregado"
fi

# 4. Limpiar caché de node_modules y reinstalar dependencias
echo "📦 Limpiando caché y dependencias..."
cd backend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
cd ..

# 5. Limpiar caché de Vite y reinstalar dependencias del frontend
echo "🚀 Limpiando caché de Vite..."
rm -rf node_modules package-lock.json .vite
npm cache clean --force
npm install

# 6. Verificar iconos PWA
echo "🎨 Verificando iconos PWA..."
if [ ! -f public/icons/icon-144x144.png ]; then
    echo "⚠️ Creando iconos PWA faltantes..."
    mkdir -p public/icons
    # Crear un icono simple de placeholder
    echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" | base64 -d > public/icons/icon-144x144.png
    cp public/icons/icon-144x144.png public/icons/icon-128x128.png
    cp public/icons/icon-144x144.png public/icons/icon-152x152.png
    cp public/icons/icon-144x144.png public/icons/icon-192x192.png
    cp public/icons/icon-144x144.png public/icons/icon-384x384.png
    cp public/icons/icon-144x144.png public/icons/icon-512x512.png
    echo "✅ Iconos PWA creados"
fi

# 7. Generar cliente Prisma
echo "🗄️ Generando cliente Prisma..."
cd backend
npx prisma generate
npx prisma db push
cd ..

# 8. Compilar TypeScript para verificar errores
echo "🔍 Verificando errores de TypeScript..."
npx tsc --noEmit --project tsconfig.json

echo ""
echo "✅ SOLUCIÓN COMPLETA - PRÓXIMOS PASOS:"
echo "========================================="
echo "1. Ejecuta en una terminal: cd backend && npm start"
echo "2. Ejecuta en otra terminal: npm run dev"
echo "3. Abre el navegador en http://localhost:3002"
echo "4. Abre las DevTools (F12) y pega este código para limpiar autenticación:"
echo "   localStorage.clear(); location.reload();"
echo ""
echo "🚀 La aplicación debería funcionar correctamente ahora!" 