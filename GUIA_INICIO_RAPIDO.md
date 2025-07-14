# 🚀 Guía de Inicio Rápido - CobroFácil

## 📋 Comandos Principales

### 🖥️ **Linux/Mac**
```bash
# Iniciar Backend (automático)
./start-backend.sh

# Iniciar Frontend (en otra terminal)
npm run dev

# Abrir Prisma Studio (en otra terminal)
cd backend && npm run db:studio
```

### 🪟 **Windows**
```cmd
# Iniciar Backend (automático)
start-backend.bat

# Iniciar Frontend (en otra terminal)
npm run dev

# Abrir Prisma Studio (en otra terminal)
cd backend && npm run db:studio
```

## 🔧 **¿Qué Hace el Script Mejorado?**

### ✅ **Verificaciones Automáticas**
- ✅ Verifica que estés en el directorio correcto
- ✅ Detecta procesos usando puerto 3000 y los termina automáticamente
- ✅ Verifica que Node.js esté instalado
- ✅ Instala dependencias si no existen
- ✅ Configura variables de entorno correctamente

### 🎯 **Soluciona Errores Comunes**
- ❌ `EADDRINUSE: address already in use 0.0.0.0:3000` → **Solucionado automáticamente**
- ❌ `Cannot find module '/home/tomas/cordobashot/src/index.js'` → **Comando corregido**
- ❌ Directorio incorrecto → **Detectado y mostrado**
- ❌ Dependencias faltantes → **Instaladas automáticamente**

## 🎨 **Salida del Script**

```
🚀 Iniciando CobroFácil Backend
======================================
✅ Directorio correcto detectado
✅ Dependencias verificadas  
✅ Puerto 3000 disponible
🚀 Todo listo. Iniciando servidor...
======================================
💡 Para detener el servidor: Ctrl+C
💡 Puerto: 3000
💡 Ambiente: development
======================================
```

## 🚀 **¡NUEVO! Acceso Rápido para Testing**

### 🎯 **Botones de Acceso Rápido**
En modo desarrollo (localhost), verás botones para hacer login automático:

#### 🔴 **Administrador**
- **Usuario:** admin@cobrofacil.io
- **Contraseña:** admin123
- **Acceso:** Completo al sistema
- **Redirección:** /caja

#### 🟠 **Supervisor**
- **Usuario:** supervisor@cobrofacil.io
- **Contraseña:** supervisor123
- **Acceso:** Gestión de personal y reportes
- **Redirección:** /gestion-mesas

#### 🟢 **Cajero**
- **Usuario:** cajero1@cobrofacil.io
- **Contraseña:** cajero123
- **Acceso:** Operaciones de venta
- **Redirección:** /nueva-venta

### 📱 **Cómo Usar los Botones de Acceso Rápido**

1. **Inicia el sistema:**
   ```bash
   # Terminal 1: Backend
   ./start-backend.sh
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Ve al navegador:**
   - URL: `http://localhost:3002`
   - Verás los botones de acceso rápido con iconos de colores

3. **Haz clic en el rol que quieres probar:**
   - **Rojo:** Administrador (acceso completo)
   - **Naranja:** Supervisor (mesas + reportes)
   - **Verde:** Cajero (ventas básicas)

4. **Login automático:**
   - El sistema te logea automáticamente
   - Te redirige a la página apropiada según el rol

### 🔒 **Seguridad**
- Los botones **solo aparecen en desarrollo** (localhost)
- En producción se muestran las cards informativas normales
- Usa el chip **"DEV"** para identificar que estás en modo desarrollo

## 🆘 **Solución de Problemas**

### **Error: "Puerto 3000 aún en uso"**
```bash
# Ver qué proceso está usando el puerto
lsof -i:3000

# Matar proceso específico
kill -9 [PID]

# O usar el comando integrado
sudo lsof -ti:3000 | xargs kill -9
```

### **Error: "Node.js no está instalado"**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nodejs npm

# CentOS/RHEL
sudo yum install nodejs npm

# macOS
brew install node
```

### **Error: "Dependencias no instaladas"**
```bash
# En directorio backend
cd backend
npm install
cd ..

# Luego ejecutar el script
./start-backend.sh
```

### **Error: "db:studio no encontrado"**
```bash
# Ya está solucionado en el package.json
cd backend
npm run db:studio
# Se abre en: http://localhost:5556
```

## 🌟 **Comandos Útiles para Diagnóstico**

```bash
# Ver todos los procesos de Node.js
ps aux | grep node

# Ver puertos en uso
netstat -tlnp | grep :3000

# Verificar conexión a PostgreSQL
psql -U postgres -h localhost -p 5432

# Logs del sistema
sudo journalctl -u postgresql

# Crear usuarios de prueba
cd backend && node src/db/seed.js

# Abrir Prisma Studio
cd backend && npm run db:studio
```

## 📂 **Estructura de Archivos**

```
cordobashot/
├── backend/
│   ├── src/
│   │   ├── index.js          ← Archivo principal del backend
│   │   └── db/
│   │       └── seed.js       ← Usuarios de prueba
│   ├── package.json          ← Scripts actualizados
│   └── node_modules/
├── src/                      ← Frontend React
│   └── pages/
│       └── Login.tsx         ← Botones de acceso rápido
├── start-backend.sh          ← Script Linux/Mac (MEJORADO)
├── start-backend.bat         ← Script Windows (MEJORADO)
└── package.json
```

## 🎯 **Flujo de Trabajo Recomendado**

### **Para Desarrollo Normal:**
1. **Terminal 1 (Backend):**
   ```bash
   cd ~/cordobashot
   ./start-backend.sh
   ```

2. **Terminal 2 (Frontend):**
   ```bash
   cd ~/cordobashot
   npm run dev
   ```

3. **Terminal 3 (Base de Datos - Opcional):**
   ```bash
   cd ~/cordobashot/backend
   npm run db:studio
   ```

### **Para Testing Rápido:**
1. **Inicia backend y frontend** (pasos 1-2 arriba)
2. **Ve a:** `http://localhost:3002`
3. **Haz clic en el botón** del rol que quieres probar
4. **¡Listo!** Ya estás logueado automáticamente

## 📊 **URLs del Sistema**

```
🖥️  Frontend:     http://localhost:3002
🔧  Backend API:   http://localhost:3000
🗄️  Prisma Studio: http://localhost:5556
```

## 🔄 **Comandos de Reinicio**

```bash
# Reiniciar backend (detener con Ctrl+C, luego)
./start-backend.sh

# Reiniciar frontend (detener con Ctrl+C, luego)
npm run dev

# Reiniciar base de datos PostgreSQL
sudo systemctl restart postgresql

# Recrear usuarios de prueba
cd backend && node src/db/seed.js
```

## 📊 **Verificación del Sistema**

```bash
# Verificar backend
curl http://localhost:3000/api/network/info

# Verificar frontend
curl http://localhost:3002

# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar usuarios en BD
cd backend && npm run db:studio
# Ir a tabla 'usuarios' en Prisma Studio
```

## 🚨 **En Caso de Emergencia**

```bash
# Matar todos los procesos de Node.js
pkill -f node

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Limpiar caché de npm
npm cache clean --force

# Reinstalar dependencias
rm -rf backend/node_modules
cd backend && npm install

# Recrear base de datos
cd backend && npx prisma db push --force-reset
cd backend && node src/db/seed.js
```

---

## 🎉 **¡Listo para usar!**

### **🎯 Para Desarrollo:**
- Usa los **botones de acceso rápido** para testing
- Cambia de rol fácilmente con un clic
- Prueba diferentes flujos de trabajo

### **🔧 Para Producción:**
- Los botones se ocultan automáticamente
- Usa credenciales reales
- Mantén la seguridad estándar

**¿Problemas?** Revisa la sección de solución de problemas arriba o contacta al equipo de desarrollo. 