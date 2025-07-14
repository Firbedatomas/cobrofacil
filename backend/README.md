# CordobaShot Backend - PostgreSQL

Backend completo para el sistema de punto de venta CordobaShot con PostgreSQL como base de datos principal.

## 🚀 Características

- **Base de datos real**: PostgreSQL con Prisma ORM
- **Autenticación segura**: JWT con bcrypt para contraseñas
- **Roles y permisos**: Sistema de roles (Admin, Supervisor, Cajero)
- **API RESTful**: Endpoints organizados y documentados
- **Transacciones ACID**: Operaciones seguras para ventas
- **Validación robusta**: Express-validator para todas las entradas
- **Seguridad**: Rate limiting, CORS, Helmet
- **Logging**: Morgan para desarrollo y producción

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 12+
- npm o yarn

## 🛠️ Instalación

### 1. Instalar PostgreSQL

#### En Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### En macOS (con Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

#### En Windows:
Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)

### 2. Configurar Base de Datos

```bash
# Conectar como usuario postgres
sudo -u postgres psql

# Crear base de datos y usuario
CREATE DATABASE cordobashot_db;
CREATE USER cordobashot_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE cordobashot_db TO cordobashot_user;
\q
```

### 3. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

### 4. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env

# Editar .env con tus configuraciones
nano .env
```

Ejemplo de configuración `.env`:
```env
# Base de Datos PostgreSQL
DATABASE_URL="postgresql://cordobashot_user:tu_password_segura@localhost:5432/cordobashot_db"

# Configuración del Servidor
PORT=3001
NODE_ENV=development

# JWT Secret (generar uno seguro para producción)
JWT_SECRET=tu_jwt_secret_super_seguro_aqui_cambiar_en_produccion

# Configuración de CORS
FRONTEND_URL=http://localhost:5173

# Configuración de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de Logs
LOG_LEVEL=info
```

### 5. Configurar Base de Datos con Prisma

```bash
# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma db push

# (Opcional) Poblar con datos iniciales
npm run db:seed
```

## 🚀 Uso

### Desarrollo

```bash
# Iniciar servidor en modo desarrollo
npm run dev

# El servidor estará disponible en http://localhost:3001
```

### Producción

```bash
# Ejecutar migraciones
npm run db:migrate

# Iniciar servidor
npm start
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev                 # Servidor con nodemon
npm run start              # Servidor en producción

# Base de datos
npm run db:push            # Sincronizar esquema con BD
npm run db:migrate         # Ejecutar migraciones
npm run db:reset           # Resetear base de datos
npm run db:seed            # Poblar con datos iniciales
npm run db:studio          # Abrir Prisma Studio
```

## 📚 API Endpoints

### Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/login` | Iniciar sesión | No |
| POST | `/register` | Registrar usuario | Admin |
| POST | `/logout` | Cerrar sesión | Sí |
| GET | `/perfil` | Obtener perfil | Sí |
| POST | `/cambiar-password` | Cambiar contraseña | Sí |

### Usuarios (`/api/usuarios`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar usuarios | Admin |
| GET | `/:id` | Obtener usuario | Admin |
| PUT | `/:id` | Actualizar usuario | Admin |
| PATCH | `/:id/estado` | Activar/Desactivar | Admin |
| PATCH | `/:id/password` | Cambiar contraseña | Admin |
| GET | `/estadisticas/general` | Estadísticas | Admin |

### Productos (`/api/productos`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar productos | Sí |
| GET | `/:id` | Obtener producto | Sí |
| POST | `/` | Crear producto | Supervisor |
| PUT | `/:id` | Actualizar producto | Supervisor |
| PATCH | `/:id/stock` | Ajustar stock | Supervisor |
| DELETE | `/:id` | Desactivar producto | Supervisor |
| GET | `/stock/bajo` | Stock bajo | Sí |

### Categorías (`/api/categorias`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar categorías | Sí |
| GET | `/:id` | Obtener categoría | Sí |
| POST | `/` | Crear categoría | Supervisor |
| PUT | `/:id` | Actualizar categoría | Supervisor |
| DELETE | `/:id` | Desactivar categoría | Supervisor |

### Ventas (`/api/ventas`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/` | Listar ventas | Sí |
| GET | `/:id` | Obtener venta | Sí |
| POST | `/` | Crear venta | Sí |
| PATCH | `/:id/cancelar` | Cancelar venta | Sí |
| GET | `/resumen/diario` | Resumen diario | Sí |

### Reportes (`/api/reportes`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| GET | `/ventas` | Reporte de ventas | Supervisor |
| GET | `/productos` | Productos más vendidos | Supervisor |
| GET | `/inventario` | Reporte de inventario | Supervisor |
| GET | `/dashboard` | Datos dashboard | Sí |

## 🔐 Sistema de Autenticación

### Roles y Permisos

- **ADMIN**: Acceso completo al sistema
- **SUPERVISOR**: Gestión de productos, categorías y reportes
- **CAJERO**: Realizar ventas y consultar productos

### Credenciales por Defecto (después del seed)

```
👤 Administrador:
Email: admin@cordobashot.com
Password: admin123

👤 Supervisor:
Email: supervisor@cordobashot.com
Password: supervisor123

👤 Cajeros:
Email: cajero1@cordobashot.com
Password: cajero123
Email: cajero2@cordobashot.com
Password: cajero123
```

## 🗄️ Estructura de Base de Datos

### Tablas Principales

- **usuarios**: Empleados del sistema
- **sesiones_usuario**: Control de sesiones activas
- **categorias**: Categorías de productos
- **productos**: Inventario de productos
- **ventas**: Transacciones de venta
- **detalles_venta**: Items de cada venta
- **movimientos_stock**: Historial de movimientos
- **configuracion_sistema**: Configuraciones del sistema

### Relaciones

- Usuario → Ventas (1:N)
- Categoría → Productos (1:N)
- Producto → Movimientos Stock (1:N)
- Venta → Detalles Venta (1:N)
- Producto → Detalles Venta (1:N)

## 🛠️ Herramientas de Desarrollo

### Prisma Studio

```bash
npm run db:studio
```
Interfaz web para visualizar y editar datos en http://localhost:5555

### Health Check

```
GET http://localhost:3001/health
```

Endpoint para verificar el estado del servidor.

## 🔧 Configuración Avanzada

### Variables de Entorno Adicionales

```env
# Rate Limiting personalizado
RATE_LIMIT_WINDOW_MS=900000      # Ventana de tiempo (15 min)
RATE_LIMIT_MAX_REQUESTS=100      # Máximo requests por ventana

# Configuración JWT
JWT_EXPIRES_IN=8h                # Tiempo de expiración token

# Base de datos
DB_CONNECTION_TIMEOUT=10000      # Timeout de conexión
DB_POOL_SIZE=10                  # Tamaño del pool de conexiones
```

### Logging Avanzado

El sistema incluye logging detallado:
- Desarrollo: Logs coloridos con morgan 'dev'
- Producción: Logs estructurados con morgan 'combined'
- Errores: Stack traces en desarrollo, mensajes genéricos en producción

## 🚨 Seguridad

### Medidas Implementadas

- **Rate Limiting**: Previene ataques de fuerza bruta
- **Helmet**: Headers de seguridad HTTP
- **CORS**: Control de acceso desde dominios
- **JWT**: Tokens seguros para autenticación
- **bcrypt**: Hashing seguro de contraseñas
- **Validación**: Express-validator en todos los endpoints
- **Sanitización**: Normalización de datos de entrada

### Recomendaciones para Producción

1. Cambiar todas las contraseñas por defecto
2. Generar JWT_SECRET seguro (32+ caracteres aleatorios)
3. Configurar HTTPS
4. Implementar backup automático de BD
5. Configurar monitoreo y alertas
6. Usar variables de entorno para secretos
7. Implementar rotación de logs

## 📊 Monitoreo

### Métricas Disponibles

- Ventas por día/mes
- Productos más vendidos
- Stock bajo/agotado
- Usuarios más activos
- Métodos de pago utilizados

### Logs del Sistema

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Buscar errores específicos
grep "ERROR" logs/app.log
```

## 🐛 Troubleshooting

### Problemas Comunes

1. **Error de conexión a PostgreSQL**
   ```bash
   # Verificar que PostgreSQL esté corriendo
   sudo systemctl status postgresql
   
   # Verificar conexión
   psql -h localhost -U cordobashot_user -d cordobashot_db
   ```

2. **Error de migración Prisma**
   ```bash
   # Resetear y volver a migrar
   npx prisma migrate reset
   npx prisma db push
   ```

3. **Error de autenticación JWT**
   ```bash
   # Verificar JWT_SECRET en .env
   # Limpiar sesiones expiradas
   # Revisar logs del servidor
   ```

## 🤝 Contribución

1. Fork el proyecto
2. Crear branch para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📧 Soporte

Para soporte técnico, contactar a:
- Email: tech@cordobashot.com
- Issues: [GitHub Issues](https://github.com/tu-usuario/cordobashot/issues) 