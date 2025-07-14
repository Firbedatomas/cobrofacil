# 🚀 CobroFacil - Sistema POS Intuitivo

**CobroFacil** es un sistema de punto de venta (POS) moderno y profesional diseñado para simplificar la gestión comercial de tu negocio.

## 🌐 URL Oficial
**[cobrofacil.io](https://cobrofacil.io)**

## ✨ Características Principales

### 💰 **Gestión de Caja Profesional**
- Apertura y cierre de caja con controles avanzados
- Totales discriminados por método de pago (efectivo, tarjeta, transferencia)
- Análisis por tipo de comprobante (Facturas A/B, Tickets Fiscales/No Fiscales)
- Resumen fiscal con integración AFIP
- Dashboard con métricas en tiempo real

### 📊 **Historial y Reportes Avanzados**
- Análisis completo de ventas sin repetición de información
- Discriminación entre ventas fiscales y no fiscales
- Totales generales y por categorías
- Información completa de CAE y comprobantes
- Exportación de datos y reportes

### 🏛️ **Integración AFIP**
- Emisión de comprobantes fiscales
- Validación de CUIT
- Gestión de CAE (Código de Autorización Electrónica)
- Configuración flexible de ambientes (testing/producción)

### 👥 **Gestión de Usuarios**
- Sistema de roles (Administrador, Supervisor, Cajero)
- Autenticación segura con JWT
- Sesiones controladas

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React 18** con TypeScript
- **Material-UI (MUI)** para interfaz profesional
- **Vite** para desarrollo rápido
- **React Router** para navegación

### Backend  
- **Node.js** con Express
- **PostgreSQL** como base de datos
- **Prisma ORM** para gestión de datos
- **bcrypt** para seguridad de contraseñas
- **JWT** para autenticación

## 🚀 Instalación y Desarrollo

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### Configuración Rápida

1. **Clonar el repositorio**
```bash
git clone https://github.com/tu-usuario/cobrofacil.git
cd cobrofacil
```

2. **Instalar dependencias**
```bash
npm install
cd backend && npm install
```

3. **Configurar base de datos**
```bash
# En PostgreSQL
CREATE DATABASE cobrofacil_db;
CREATE USER cobrofacil_user WITH PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE cobrofacil_db TO cobrofacil_user;
```

4. **Configurar variables de entorno**
```bash
# backend/.env
DATABASE_URL="postgresql://cobrofacil_user:tu_password_segura@localhost:5432/cobrofacil_db"
JWT_SECRET=cobrofacil_jwt_secret_2024
NODE_ENV=development
PORT=3001
```

5. **Inicializar base de datos**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

6. **Ejecutar en desarrollo**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev

# O ejecutar todo junto
npm run dev:full
```

## 🌐 Configuración de Red Local

### Acceso desde Otros Dispositivos

El sistema está configurado para funcionar en red local:

1. **Servidor Backend**: Escucha en todas las interfaces (0.0.0.0)
2. **Frontend**: Accesible desde la red local
3. **Detección Automática**: IP local detectada automáticamente

### URLs de Acceso

- **Local**: http://localhost:3002
- **Red Local**: http://[IP_LOCAL]:3002
- **Backend**: http://[IP_LOCAL]:3000

### Configuración de Red

Para consultar la información de red del servidor:

```bash
# Información de red
curl http://localhost:3000/api/network/info

# Test de conectividad
curl http://localhost:3000/api/network/ping

# Ver URLs de acceso para otros dispositivos
npm run urls
```

## 📧 Credenciales de Prueba

| Rol | Email | Password |
|-----|-------|----------|
| Administrador | admin@cobrofacil.io | admin123 |
| Supervisor | supervisor@cobrofacil.io | supervisor123 |
| Cajero 1 | cajero1@cobrofacil.io | cajero123 |
| Cajero 2 | cajero2@cobrofacil.io | cajero123 |

## 📱 URLs de Desarrollo

- **Frontend**: http://localhost:3003
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🎯 Próximas Funcionalidades

- [ ] Gestión de inventario avanzada
- [ ] Reportes de rentabilidad
- [ ] Integración con medios de pago
- [ ] Aplicación móvil
- [ ] Dashboard analytics avanzado

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`) 
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

- **Email**: info@cobrofacil.io
- **Website**: [cobrofacil.io](https://cobrofacil.io)
- **Issues**: [GitHub Issues](https://github.com/tu-usuario/cobrofacil/issues)

---

**Desarrollado con ❤️ para facilitar tu gestión comercial**
