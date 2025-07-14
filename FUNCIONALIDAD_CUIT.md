# ✅ Validación CUIT - CordobaShot POS

## Descripción

Funcionalidad que permite **validar el formato y dígito verificador** de un CUIT. **Sistema simplificado para carga manual** de datos empresariales.

## ✨ Características

### 🎯 Validación Inteligente
- **Formateo automático**: El CUIT se formatea con guiones automáticamente
- **Validación en tiempo real**: Verifica el dígito verificador
- **Validación instantánea**: Un clic para validar el formato
- **Feedback visual**: Indicadores de carga y estado
- **🔧 Carga Manual**: Complete manualmente todos los datos de la empresa

### 📝 Flujo de Trabajo
1. **Ingrese el CUIT**: Puede ser con o sin guiones
2. **Valide formato**: Clic en ✓ para verificar que sea válido
3. **Complete manualmente**: Razón Social, dirección, etc.
4. **Guarde configuración**: Todo listo para usar

## 🚀 Uso en la Aplicación

### Desde Configuración AFIP
1. Ve a **Configuración AFIP** (`/configuracion-afip`)
2. En el paso "Datos de la Empresa"
3. Ingresa el CUIT en el campo correspondiente
4. Haz clic en el botón **✓** (Validar)
5. Complete manualmente el resto de los datos

### Ejemplo Visual
```
┌─────────────────────────────────────────┬───┐
│ CUIT de la Empresa                      │ ✓ │
│ 30-12345678-1                          │   │
└─────────────────────────────────────────┴───┘
```

## 🧪 CUITs para Probar

Puedes probar la validación con estos CUITs:

| CUIT | Estado |
|------|--------|
| `30-12345678-1` | ✅ Válido |
| `20-12345678-6` | ✅ Válido |
| `30-45678912-5` | ✅ Válido |
| `30-12345678-9` | ❌ Inválido (dígito verificador incorrecto) |
| `12345678901` | ❌ Inválido (sin formato) |

## 🔧 API Endpoints

### POST /api/cuit/consultar
Valida el formato de un CUIT.

**Request:**
```json
{
  "cuit": "30-12345678-1"
}
```

**Response (Válido):**
```json
{
  "success": true,
  "cuit": "30-12345678-1",
  "valido": true,
  "message": "CUIT válido - Complete manualmente los datos de la empresa",
  "fuente": "VALIDACION"
}
```

**Response (Inválido):**
```json
{
  "success": false,
  "message": "Dígito verificador inválido"
}
```

### POST /api/cuit/validar
Alias del endpoint anterior para validación de formato.

## 🛡️ Validación

### Algoritmo de Validación CUIT
- **Longitud**: Debe tener exactamente 11 dígitos
- **Formato**: Se acepta con o sin guiones (se formatea automáticamente)
- **Dígito verificador**: Algoritmo oficial de AFIP

### Algoritmo Matemático
```javascript
// Multiplicadores para validación CUIT
const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

// Cálculo del dígito verificador
let suma = 0;
for (let i = 0; i < 10; i++) {
  suma += digitos[i] * multiplicadores[i];
}

const resto = suma % 11;
const digitoVerificador = resto < 2 ? resto : 11 - resto;
```

## 🔄 Estados de la Validación

### Durante la Validación
- **Loading**: Spinner en el botón ✓
- **Tooltip**: "Validar formato del CUIT"

### Resultados
- **✅ Válido**: "CUIT válido: [CUIT formateado] - Complete manualmente los datos"
- **❌ Formato inválido**: "El CUIT debe tener 11 dígitos"
- **❌ Dígito verificador**: "Dígito verificador inválido"

## 🎯 Ventajas del Sistema Manual

- ✅ **Simple y directo**: Sin dependencias externas
- ✅ **Siempre disponible**: No depende de servicios externos
- ✅ **Control total**: El usuario ingresa exactamente lo que necesita
- ✅ **Rápido**: Validación instantánea
- ✅ **Confiable**: Algoritmo oficial de AFIP para validación

---

**💡 Recuerda:** Este sistema valida el formato del CUIT pero **no consulta datos externos**. Todos los datos de la empresa deben completarse manualmente.

---

# 🔐 Proceso de Certificados Digitales ARCA

## 📋 ¿Cómo funciona el proceso real?

### 1. **Generación Local (Usuario)**
```bash
# El usuario genera su par de claves público/privada
openssl genrsa -out privada.key 2048

# Crea una solicitud de certificado (CSR)
openssl req -new -key privada.key \
  -subj "/C=AR/O=MI_EMPRESA/CN=MI_NOMBRE/serialNumber=CUIT 30123456789" \
  -out solicitud.csr
```

### 2. **Proceso en ARCA**
1. **Ingresar a ARCA** con Clave Fiscal
2. **Ir a "Administración de Certificados Digitales"**
3. **Crear nuevo certificado** con un alias (ej: "facturacion-1")
4. **Subir el archivo CSR** generado localmente
5. **ARCA valida** y emite el certificado firmado
6. **Descargar certificado (.crt)** emitido por ARCA

### 3. **Para Facturar Electrónicamente**
**Necesita AMBOS archivos:**
- ✅ **Su clave privada (.key)** - Guardada localmente
- ✅ **Certificado ARCA (.crt)** - Descargado desde ARCA

### 4. **¿Por qué necesita ambos?**
- **Clave privada**: Para firmar digitalmente las transacciones
- **Certificado**: Para que ARCA valide que la firma es auténtica
- **Sin uno de los dos**: No puede establecer conexión segura con ARCA

## 🎯 **Respuesta a tu Pregunta**

**¿Solo con el certificado de ARCA se puede vincular?**

**❌ NO** - Necesita **AMBOS** archivos:

1. **Su clave privada (.key)** que usted generó y guardó
2. **El certificado (.crt)** que descargó de ARCA

**El certificado sin la clave privada es inútil** - sería como tener un candado sin la llave.

## 🔧 **En CordobaShot POS**

El sistema necesita que suba:
1. **Su clave privada** (la que usó para generar el CSR)
2. **El certificado de ARCA** (el que descargó)

Solo así puede establecer la conexión segura para facturación electrónica. 