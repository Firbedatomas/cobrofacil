import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionCliente = [
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('apellido').optional().isString().trim(),
  body('razonSocial').optional().isString().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().isString().trim(),
  body('direccion').optional().isString().trim(),
  body('cuit').optional().isLength({ min: 11, max: 11 }).withMessage('El CUIT debe tener 11 dígitos'),
  body('numeroDocumento').optional().isInt({ min: 1000000 }).toInt(),
  body('tipoDocumento').optional().isIn(['DNI', 'CUIT', 'PASAPORTE', 'EXTRANJERO']),
  body('condicionIva').optional().isIn(['CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO', 'EXENTO', 'MONOTRIBUTISTA'])
];

// Función para validar CUIT
const validarCUIT = (cuit) => {
  if (!cuit || cuit.length !== 11) return false;
  
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;
  
  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuit[i]) * multiplicadores[i];
  }
  
  const resto = suma % 11;
  const digitoVerificador = resto < 2 ? resto : 11 - resto;
  
  return parseInt(cuit[10]) === digitoVerificador;
};

// 📋 LISTAR CLIENTES
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      activo, 
      condicionIva, 
      busqueda,
      ordenPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (activo !== undefined) where.activo = activo === 'true';
    if (condicionIva) where.condicionIva = condicionIva;
    
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { apellido: { contains: busqueda, mode: 'insensitive' } },
        { razonSocial: { contains: busqueda, mode: 'insensitive' } },
        { email: { contains: busqueda, mode: 'insensitive' } },
        { cuit: { contains: busqueda } },
        { telefono: { contains: busqueda } }
      ];
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { 
              presupuestos: true,
              ventasCliente: true,
              facturasRecurrentes: true
            }
          }
        },
        orderBy
      }),
      prisma.cliente.count({ where })
    ]);

    res.json({
      success: true,
      data: clientes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER CLIENTE POR ID
router.get('/:id', [
  param('id').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        presupuestos: {
          orderBy: { fechaCreacion: 'desc' },
          take: 5
        },
        ventasCliente: {
          orderBy: { fechaVenta: 'desc' },
          take: 5
        },
        facturasRecurrentes: {
          where: { activa: true }
        },
        listasPrecios: {
          include: {
            listaPrecio: true
          }
        },
        _count: {
          select: { 
            presupuestos: true,
            ventasCliente: true,
            facturasRecurrentes: true
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR CLIENTE
router.post('/', validacionCliente, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      nombre,
      apellido,
      razonSocial,
      email,
      telefono,
      direccion,
      cuit,
      numeroDocumento,
      tipoDocumento = 'DNI',
      condicionIva = 'CONSUMIDOR_FINAL'
    } = req.body;

    // Validar CUIT si se proporciona
    if (cuit && !validarCUIT(cuit)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT proporcionado no es válido'
      });
    }

    // Verificar si ya existe un cliente con el mismo CUIT
    if (cuit) {
      const clienteExistente = await prisma.cliente.findUnique({
        where: { cuit }
      });
      if (clienteExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con este CUIT'
        });
      }
    }

    // Verificar email único si se proporciona
    if (email) {
      const emailExistente = await prisma.cliente.findFirst({
        where: { email }
      });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un cliente con este email'
        });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre,
        apellido,
        razonSocial,
        email,
        telefono,
        direccion,
        cuit,
        numeroDocumento,
        tipoDocumento,
        condicionIva
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: cliente
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✏️ ACTUALIZAR CLIENTE
router.put('/:id', [
  param('id').isString(),
  ...validacionCliente
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: { id: req.params.id }
    });

    if (!clienteExistente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const {
      nombre,
      apellido,
      razonSocial,
      email,
      telefono,
      direccion,
      cuit,
      numeroDocumento,
      tipoDocumento,
      condicionIva
    } = req.body;

    // Validar CUIT si se proporciona
    if (cuit && !validarCUIT(cuit)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT proporcionado no es válido'
      });
    }

    // Verificar si ya existe otro cliente con el mismo CUIT
    if (cuit && cuit !== clienteExistente.cuit) {
      const cuitExistente = await prisma.cliente.findFirst({
        where: { 
          cuit,
          id: { not: req.params.id }
        }
      });
      if (cuitExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con este CUIT'
        });
      }
    }

    // Verificar email único
    if (email && email !== clienteExistente.email) {
      const emailExistente = await prisma.cliente.findFirst({
        where: { 
          email,
          id: { not: req.params.id }
        }
      });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro cliente con este email'
        });
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: {
        nombre,
        apellido,
        razonSocial,
        email,
        telefono,
        direccion,
        cuit,
        numeroDocumento,
        tipoDocumento,
        condicionIva
      }
    });

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: cliente
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 ACTIVAR/DESACTIVAR CLIENTE
router.patch('/:id/estado', [
  param('id').isString(),
  body('activo').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { id: req.params.id },
      data: { activo: req.body.activo }
    });

    res.json({
      success: true,
      message: `Cliente ${req.body.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: clienteActualizado
    });
  } catch (error) {
    console.error('Error cambiando estado del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🗑️ ELIMINAR CLIENTE
router.delete('/:id', [
  param('id').isString(),
  verificarRol(['ADMIN', 'SUPERVISOR'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { 
            presupuestos: true,
            ventasCliente: true,
            facturasRecurrentes: true
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Verificar si el cliente tiene transacciones asociadas
    const tieneTransacciones = cliente._count.presupuestos > 0 || 
                              cliente._count.ventasCliente > 0 || 
                              cliente._count.facturasRecurrentes > 0;

    if (tieneTransacciones) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el cliente porque tiene transacciones asociadas. Desactívelo en su lugar.'
      });
    }

    await prisma.cliente.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔍 BUSCAR CLIENTE POR CUIT
router.get('/buscar/cuit/:cuit', [
  param('cuit').isLength({ min: 11, max: 11 }).withMessage('El CUIT debe tener 11 dígitos')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'CUIT inválido',
        errors: errors.array()
      });
    }

    const { cuit } = req.params;

    if (!validarCUIT(cuit)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT proporcionado no es válido'
      });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { cuit },
      include: {
        _count: {
          select: { 
            presupuestos: true,
            ventasCliente: true,
            facturasRecurrentes: true
          }
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado con ese CUIT'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error) {
    console.error('Error buscando cliente por CUIT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE CLIENTES
router.get('/stats/general', async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;
    
    const where = {};
    if (fechaDesde && fechaHasta) {
      where.fechaCreacion = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }

    const [
      total,
      activos,
      porCondicionIva,
      conVentas,
      sinVentas
    ] = await Promise.all([
      prisma.cliente.count({ where }),
      prisma.cliente.count({ where: { ...where, activo: true } }),
      prisma.cliente.groupBy({
        by: ['condicionIva'],
        where,
        _count: true
      }),
      prisma.cliente.count({
        where: {
          ...where,
          ventasCliente: {
            some: {}
          }
        }
      }),
      prisma.cliente.count({
        where: {
          ...where,
          ventasCliente: {
            none: {}
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activos,
        inactivos: total - activos,
        porCondicionIva: porCondicionIva.reduce((acc, item) => {
          acc[item.condicionIva] = item._count;
          return acc;
        }, {}),
        conVentas,
        sinVentas
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 💼 HISTORIAL DE TRANSACCIONES DEL CLIENTE
router.get('/:id/historial', [
  param('id').isString(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id }
    });

    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    const [presupuestos, ventas, facturasRecurrentes] = await Promise.all([
      prisma.presupuesto.findMany({
        where: { clienteId: req.params.id },
        include: {
          detalles: {
            include: {
              producto: true
            }
          }
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: Math.floor(take / 3)
      }),
      prisma.venta.findMany({
        where: { clienteId: req.params.id },
        include: {
          detalles: {
            include: {
              producto: true
            }
          }
        },
        orderBy: { fechaVenta: 'desc' },
        skip,
        take: Math.floor(take / 3)
      }),
      prisma.facturaRecurrente.findMany({
        where: { clienteId: req.params.id },
        include: {
          detalles: {
            include: {
              producto: true
            }
          }
        },
        orderBy: { fechaCreacion: 'desc' },
        skip,
        take: Math.floor(take / 3)
      })
    ]);

    // Combinar y ordenar todas las transacciones
    const transacciones = [
      ...presupuestos.map(p => ({ ...p, tipo: 'PRESUPUESTO', fecha: p.fechaCreacion })),
      ...ventas.map(v => ({ ...v, tipo: 'VENTA', fecha: v.fechaVenta })),
      ...facturasRecurrentes.map(f => ({ ...f, tipo: 'FACTURA_RECURRENTE', fecha: f.fechaCreacion }))
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json({
      success: true,
      data: {
        cliente,
        transacciones: transacciones.slice(0, take),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          hasMore: transacciones.length > take
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo historial del cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 