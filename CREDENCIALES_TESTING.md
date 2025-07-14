# 🔑 Credenciales para Testing - CobroFácil

## 📋 Usuarios de Prueba Disponibles

Todos los usuarios tienen la contraseña: **123456**

### 👑 **ADMINISTRADOR**
- **Email:** `admin@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** ADMIN
- **Permisos:** Acceso completo al sistema

### 👥 **SUPERVISOR**
- **Email:** `supervisor@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** SUPERVISOR
- **Permisos:** Supervisión y control de operaciones

### 💰 **CAJERO**
- **Email:** `cajero1@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** CAJERO
- **Permisos:** Gestión de ventas, caja y facturación

### 🍽️ **MOZOS** (Para testing del sistema de mozos)

#### Mozo 1 - Juan
- **Email:** `mozo1@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** MOZO
- **Nombre:** Juan Pérez

#### Mozo 2 - María
- **Email:** `mozo2@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** MOZO
- **Nombre:** María González

#### Mozo 3 - Carlos
- **Email:** `mozo3@cobrofacil.io`
- **Contraseña:** `123456`
- **Rol:** MOZO
- **Nombre:** Carlos Rodríguez

## 🧪 Cómo Testear el Sistema de Mozos

### **Paso 1: Acceso Inicial**
1. Acceder a: `http://localhost:3003/`
2. Hacer login con **cualquier usuario** (recomendado: cajero1@cobrofacil.io)
3. Ir a "Gestión de Mesas"

### **Paso 2: Testing del Sistema de Mozos**
1. **Hacer clic en una mesa verde** (libre)
2. ✅ **Verificar**: Se abre el modal de selección de mozos
3. **Opciones disponibles**:
   - Usuario actual (predeterminado)
   - Juan Pérez (mozo1)
   - María González (mozo2) 
   - Carlos Rodríguez (mozo3)
   - Crear Nuevo Mozo

### **Paso 3: Crear Nuevo Mozo** (Opcional)
1. En el modal, hacer clic en "Crear Nuevo Mozo"
2. Completar los datos del nuevo mozo
3. ✅ **Verificar**: Se crea y aparece en la lista

### **Paso 4: Flujo de Venta Completo**
1. Seleccionar un mozo
2. ✅ **Verificar**: Se abre el panel de venta
3. ✅ **Verificar**: Aparece notificación del mozo seleccionado
4. Agregar productos a la venta
5. ✅ **Verificar**: Los productos NO desaparecen automáticamente
6. Procesar la venta normalmente

## 🎯 Funcionalidades a Testear

### ✅ **Sistema de Mozos**
- [x] Modal de selección se abre al hacer clic en mesa
- [x] Lista de mozos disponibles
- [x] Usuario actual como opción predeterminada  
- [x] Creación de nuevos mozos
- [x] Búsqueda de mozos por nombre
- [x] Notificación de mozo seleccionado

### ✅ **Persistencia de Productos**
- [x] Los productos persisten al agregarlos
- [x] No desaparecen automáticamente
- [x] Se mantienen durante toda la venta

### ✅ **Correcciones de Bugs**
- [x] Sin warnings de DOM nesting
- [x] Sistema completamente funcional
- [x] Base de datos actualizada

## 🚀 URLs de Acceso

### **Frontend (React)**
- **Local:** http://localhost:3003/
- **Red:** http://192.168.0.122:3003/

### **Backend (Node.js)**
- **API:** http://localhost:3000/
- **Health Check:** http://localhost:3000/api/health

## 🔧 Troubleshooting

### **Si no puedes hacer login:**
1. Verificar que el backend esté corriendo en puerto 3000
2. Verificar que el frontend esté en puerto 3003
3. Usar las credenciales exactas de arriba
4. Verificar la consola del navegador para errores

### **Si no aparecen los mozos:**
1. Los mozos ya están creados en la base de datos
2. Se cargan automáticamente al abrir el modal
3. Si no aparecen, verificar la consola para errores de API

### **Si los productos desaparecen:**
1. Esto ya fue corregido
2. Si sigue pasando, verificar la consola para errores
3. Reportar el problema con detalles

---

**¡Todo listo para testing! 🎉**

El sistema de mozos está completamente implementado y funcional. Puedes empezar a testear usando cualquiera de las credenciales de arriba. 