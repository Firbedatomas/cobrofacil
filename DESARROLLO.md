# 🚀 Guía de Desarrollo - CordobaShot POS

## Inicio Rápido

### Opción 1: Script NPM (Recomendado)
```bash
npm run dev:full
```

### Opción 2: Script Bash
```bash
./dev-start.sh
```

### Mostrar URLs
```bash
npm run urls
```

## 📋 Scripts Disponibles

| Script | Descripción | Puerto |
|--------|-------------|---------|
| `npm run dev:full` | Inicia todo el entorno (Frontend + Backend + DB) | - |
| `npm run dev:frontend` | Solo frontend React + Vite | 3002 |
| `npm run dev:backend` | Solo backend Express | 3000 |
| `npm run dev:db` | Solo Prisma Studio | 5555 |
| `npm run urls` | Muestra URLs del entorno | - |
| `npm run dev` | Solo frontend (script original) | 5173 |

## 🌐 URLs del Entorno

- **Frontend**: http://localhost:3002
- **Backend**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **Health Check**: http://localhost:3000/health

## 🏛️ Configuración AFIP

### Acceso a Configuración
- Desde la aplicación: `/configuracion-afip`
- Link directo a AFIP: https://auth.afip.gob.ar/contribuyente_/login.xhtml

### Funcionalidades Implementadas

✅ **Configuración básica**: CUIT, Razón Social, Punto de Venta, Ambiente  
✅ **Autocompletado CUIT**: Búsqueda automática de datos empresariales  
✅ **Validación CUIT**: Verificación de formato y dígito verificador  
✅ **Subida de certificados**: Certificado (.crt) y Clave Privada (.key)  
✅ **Validación de archivos**: Formato y extensiones correctas  
✅ **Gestión segura**: Almacenamiento en directorio protegido  
✅ **Estado visual**: Indicadores de configuración completa  

### Autocompletado de CUIT

**🔍 Funcionalidad de Búsqueda:**
- Formateo automático del CUIT (con guiones)
- Validación de dígito verificador
- Búsqueda automática de datos empresariales
- Autocompletado de Razón Social

**🎯 CUITs de Prueba:**
- `30-12345678-9` → EJEMPLO SA (Responsable Inscripto)
- `20-12345678-1` → LOPEZ JUAN CARLOS (Monotributo)
- `30-45678912-3` → TECNOLOGIA Y DESARROLLO SRL (Responsable Inscripto)

**💡 Uso:**
1. Ingrese el CUIT en el campo correspondiente
2. Haga clic en el botón ✨ (AutoAwesome)
3. Los datos se completarán automáticamente

### Endpoints AFIP
- `GET /api/afip/estado` - Estado y configuración
- `POST /api/afip/configuracion` - Actualizar configuración
- `POST /api/afip/subir-certificado` - Subir certificados
- `DELETE /api/afip/eliminar-certificado/:tipo` - Eliminar certificados

### Endpoints CUIT (Nuevo)
- `POST /api/cuit/consultar` - Consultar datos por CUIT
- `POST /api/cuit/validar` - Validar formato de CUIT
- `POST /api/cuit/buscar-razon-social` - Buscar por razón social

### APIs Integradas

**🔗 Fuentes de Datos:**
- Argentina.gob.ar (Registro Nacional de Sociedades)
- AFIP Constancia de Inscripción
- Base de datos simulada para desarrollo

**🛡️ Características:**
- Múltiples APIs con fallback automático
- Validación de formato CUIT
- Cache de resultados (planificado)
- Rate limiting integrado

### Seguridad
- Los certificados se almacenan en `backend/uploads/certificados/`
- El directorio está excluido del control de versiones (.gitignore)
- Validación de tipos de archivo (.crt/.key)
- Autenticación requerida para todas las operaciones
- Validación del dígito verificador del CUIT
- Rate limiting en consultas CUIT

## 🔧 Configuración Automática

El script `dev-start.sh` realiza automáticamente:

✅ Verificación de Node.js y npm  
✅ Instalación de dependencias si no existen  
✅ Inicio de PostgreSQL  
✅ Creación del archivo `.env` si no existe  
✅ Sincronización de la base de datos  
✅ Inicio de todos los servicios en paralelo  

## 🛠️ Requisitos Previos

- Node.js v18+ 
- PostgreSQL instalado y configurado
- Git

## ⚡ Comandos Individuales

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
npm install
npm run dev
```

### Base de Datos
```bash
cd backend
npx prisma studio
```

## 🔄 Reiniciar Servicios

Para reiniciar todos los servicios:
```bash
# Detener (Ctrl+C)
# Luego ejecutar nuevamente:
npm run dev:full
```

## 🐛 Troubleshooting

### Error de conexión con PostgreSQL
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Error 404 en consulta CUIT
Si ves el error `Request failed with status code 404` al consultar CUIT:

1. **Verificar que el backend esté corriendo:**
```bash
curl http://localhost:3000/health
```

2. **Verificar que las rutas CUIT funcionen:**
```bash
curl -X POST http://localhost:3000/api/cuit/consultar \
  -H "Content-Type: application/json" \
  -d '{"cuit":"30-12345678-1"}'
```

3. **Verificar configuración de CORS:**
   - El backend debe estar configurado para `http://localhost:3002`
   - Si ves `access-control-allow-origin: http://localhost:3003`, hay un conflicto de puertos

4. **Reiniciar servicios completamente:**
```bash
pkill -f "npm.*start"
npm run dev:full
```

### Error con certificados AFIP
```bash
# Verificar permisos del directorio
ls -la backend/uploads/certificados/

# Limpiar certificados si hay problemas
rm -rf backend/uploads/certificados/*
```

### Limpiar caché de npm
```bash
npm cache clean --force
```

### Reinstalar dependencias
```bash
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install && cd ..
```

## 📊 Monitoreo

Durante el desarrollo, verás logs con colores:
- 🖥️ **Backend** (Cyan): Logs del servidor Express
- ⚛️ **Frontend** (Magenta): Logs de Vite
- 🗄️ **Database** (Yellow): Logs de Prisma Studio

## 🔐 Variables de Entorno

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cordobashot"
PORT=3000
FRONTEND_URL=http://localhost:3002
JWT_SECRET=tu_jwt_secret_aqui
```

### Frontend (vite.config.ts)
- Puerto configurado: 3002
- Proxy: `/api` → `http://localhost:3000`

## 🎯 Desarrollo Productivo

1. **Inicio rápido**: `npm run dev:full`
2. **Hot reload** automático en frontend y backend
3. **Base de datos** visual con Prisma Studio
4. **Logs centralizados** con colores
5. **Cleanup automático** al salir (Ctrl+C)
6. **Configuración AFIP** completa e integrada

---

¡Todo listo para desarrollar! 🚀 