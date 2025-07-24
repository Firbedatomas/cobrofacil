# 🚀 CobroFacil POS - Guía de Inicio Rápido

## 📋 Comandos para Iniciar la Aplicación

### 🖥️ **Windows**
```bash
# Opción 1: Usar el script batch (Recomendado)
start-app.bat

# Opción 2: Usar npm directamente
npm run start

# Opción 3: Verificar servicios
.\verificar-servicios.ps1

# Opción 4: Iniciar solo frontend
npm run dev
```

### 🐧 **Linux/Mac**
```bash
# Opción 1: Usar el script bash (Recomendado)
./start-app.sh

# Opción 2: Usar npm directamente
npm run start

# Opción 3: Iniciar solo frontend
npm run dev
```

## 🔧 **Scripts Disponibles**

| Comando | Descripción |
|---------|-------------|
| `npm run start` | ✅ Inicia backend + frontend juntos |
| `npm run dev` | Solo frontend (puerto 3002) |
| `npm run dev:backend` | Solo backend (puerto 3001) |
| `npm run dev:full` | Backend + frontend + base de datos |
| `npm run dev:app` | Backend + frontend (sin base de datos) |

## 🌐 **URLs de Acceso**

Una vez iniciada la aplicación:

- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3001
- **Base de Datos**: http://localhost:5555 (solo con `dev:full`)

## ⚠️ **Requisitos Previos**

1. **Node.js** instalado (versión 16 o superior)
2. **npm** instalado
3. **Base de datos PostgreSQL** configurada
4. **Variables de entorno** configuradas en `.env`

## 🔍 **Solución de Problemas**

### Error: "Puerto ya en uso"
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Error: "Dependencias no encontradas"
```bash
# Instalar dependencias del frontend
npm install

# Instalar dependencias del backend
cd backend && npm install && cd ..
```

### Error: "Base de datos no conecta"
```bash
# Verificar que PostgreSQL esté corriendo
# Verificar variables de entorno en .env
# Ejecutar migraciones si es necesario
cd backend && npx prisma db push
```

## 📝 **Notas Importantes**

- El script `start-app.bat` (Windows) y `start-app.sh` (Linux/Mac) verifican automáticamente las dependencias
- Para desarrollo, usa `npm run start` que inicia ambos servicios
- Para producción, usa `npm run dev:full` que incluye la base de datos
- Presiona `Ctrl+C` para detener todos los servicios

## 🎯 **Flujo de Desarrollo Típico**

1. **Iniciar aplicación**: `npm run start`
2. **Desarrollar**: Editar archivos en `src/`
3. **Ver cambios**: Se recargan automáticamente
4. **Detener**: `Ctrl+C` en la terminal

¡Listo! 🎉 Tu aplicación CobroFacil POS debería estar funcionando correctamente. 