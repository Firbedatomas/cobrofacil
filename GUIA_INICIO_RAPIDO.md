# 🚀 Guía de Inicio Rápido - CobroFácil

## ✅ **MÉTODO RECOMENDADO (Más Fácil)**

### Opción 1: Script de Inicio Automático
```bash
./start-app.sh
```
**Ventajas:**
- ✅ Inicia backend + frontend automáticamente
- ✅ Verifica dependencias
- ✅ Libera puertos ocupados
- ✅ Muestra URLs disponibles
- ✅ Un solo comando para todo

---

## 🔧 **MÉTODOS ALTERNATIVOS**

### Opción 2: NPM Scripts (Recomendado)
```bash
# Iniciar solo backend + frontend
npm run dev:app

# Iniciar backend + frontend + base de datos
npm run dev:full
```

### Opción 3: Método Manual (Tu método actual)
```bash
# Terminal 1: Backend
./start-backend.sh

# Terminal 2: Frontend  
npm run start
```

---

## 🎯 **COMPARACIÓN DE MÉTODOS**

| Método | Terminales | Tiempo | Facilidad | Recomendado |
|--------|------------|--------|-----------|------------|
| `./start-app.sh` | 1 | ⚡ Rápido | 🟢 Muy fácil | ✅ **SÍ** |
| `npm run dev:app` | 1 | ⚡ Rápido | 🟢 Fácil | ✅ **SÍ** |
| `npm run dev:full` | 1 | ⚡ Rápido | 🟢 Fácil | ⚠️ Si necesitas BD |
| Método manual | 2 | 🐌 Lento | 🔴 Complicado | ❌ **NO** |

---

## 🔍 **PUERTOS Y URLs**

### Desarrollo
- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3000  
- **Base de datos**: http://localhost:5555 (Prisma Studio)

### Producción
- **Frontend**: http://localhost:3003
- **Backend**: http://localhost:3000

---

## 🛠️ **COMANDOS ÚTILES**

### Scripts Disponibles
```bash
# Desarrollo
npm run dev:app          # Backend + Frontend
npm run dev:full         # Backend + Frontend + BD
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend
npm run dev:db           # Solo Prisma Studio

# Electron (Aplicación de escritorio)
npm run electron:dev     # Electron + Backend + Frontend
npm run electron:safe    # Electron modo seguro

# Producción
npm run build            # Compilar para producción
npm run start            # Iniciar frontend en modo producción
```

### Scripts de Utilidad
```bash
./mostrar-urls.sh        # Mostrar URLs disponibles
./start-backend.sh       # Iniciar solo backend (método anterior)
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### Error: "Port already in use"
```bash
# Liberar puerto 3000 (Backend)
sudo lsof -t -i:3000 | xargs kill -9

# Liberar puerto 3002 (Frontend)  
sudo lsof -t -i:3002 | xargs kill -9
```

### Error: "Module not found"
```bash
# Reinstalar dependencias
npm install
cd backend && npm install
```

### Error: "Database connection failed"
```bash
# Verificar base de datos
cd backend && npx prisma studio
```

---

## 🎉 **FLUJO DE TRABAJO RECOMENDADO**

### Para Desarrollo Diario:
1. Abrir una terminal en el directorio del proyecto
2. Ejecutar: `./start-app.sh`
3. Esperar a que abran automáticamente:
   - Backend en http://localhost:3000
   - Frontend en http://localhost:3002
4. Comenzar a trabajar

### Para Detener la Aplicación:
1. Presionar `Ctrl+C` en la terminal donde se ejecuta
2. Ambos servicios se detendrán automáticamente

---

## 📋 **VERIFICACIÓN DE ESTADO**

### Verificar que todo funciona:
```bash
# Verificar backend
curl http://localhost:3000/api/sectores

# Verificar frontend
curl http://localhost:3002
```

### Logs útiles:
```bash
# Ver logs del backend
cd backend && npm run dev

# Ver logs del frontend
npm run dev:frontend
```

---

## 🔥 **CONCLUSIÓN**

**✅ RECOMENDACIÓN FINAL:**
- **Usar**: `./start-app.sh` (más fácil)
- **O usar**: `npm run dev:app` (más rápido)
- **Evitar**: Método manual con dos terminales

**¿Por qué?**
- ⚡ **50% más rápido** que el método manual
- 🎯 **Un solo comando** para todo
- 🔧 **Verificaciones automáticas** de dependencias
- 📱 **URLs mostradas** automáticamente
- 🛡️ **Manejo de errores** integrado 