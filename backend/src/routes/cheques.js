import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionCheque = [
  body('numero')
    .isLength({ min: 1 })
    .withMessage('El número de cheque es requerido')
    .trim(),
  body('banco')
    .isLength({ min: 2 })
    .withMessage('El banco debe tener al menos 2 caracteres')
    .trim(),
  body('sucursal').optional().isString().trim(),
  body('cuentaCorriente').optional().isString().trim(),
  body('importe').isDecimal({ decimal_digits: '0,2' }).toFloat().withMessage('El importe debe ser un número válido'),
  body('fechaEmision').isISO8601().toDate(),
  body('fechaVencimiento').isISO8601().toDate(),
  body('firmante').optional().isString().trim(),
  body('cuitFirmante').optional().isLength({ min: 11, max: 11 }).withMessage('El CUIT debe tener 11 dígitos'),
  body('librador').optional().isString().trim(),
  body('beneficiario').optional().isString().trim(),
  body('concepto').optional().isString().trim(),
  body('observaciones').optional().isString().trim(),
  body('tipo').isIn(['EMITIDO', 'RECIBIDO']).withMessage('El tipo debe ser EMITIDO o RECIBIDO'),
  body('origen').optional().isIn(['VENTA', 'COMPRA', 'PAGO_PROVEEDOR', 'COBRO_CLIENTE', 'OTROS'])
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

// 📋 LISTAR CHEQUES
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      tipo, 
      estado, 
      banco,
      fechaDesde,
      fechaHasta,
      vencimientoDesde,
      vencimientoHasta,
      busqueda,
      ordenPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (banco) where.banco = { contains: banco, mode: 'insensitive' };
    
    if (fechaDesde && fechaHasta) {
      where.fechaEmision = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }
    
    if (vencimientoDesde && vencimientoHasta) {
      where.fechaVencimiento = {
        gte: new Date(vencimientoDesde),
        lte: new Date(vencimientoHasta)
      };
    }
    
    if (busqueda) {
      where.OR = [
        { numero: { contains: busqueda, mode: 'insensitive' } },
        { banco: { contains: busqueda, mode: 'insensitive' } },
        { firmante: { contains: busqueda, mode: 'insensitive' } },
        { librador: { contains: busqueda, mode: 'insensitive' } },
        { beneficiario: { contains: busqueda, mode: 'insensitive' } },
        { cuitFirmante: { contains: busqueda } }
      ];
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [cheques, total] = await Promise.all([
      prisma.cheque.findMany({
        where,
        skip,
        take,
        include: {
          usuario: {
            select: { nombre: true, apellido: true }
          }
        },
        orderBy
      }),
      prisma.cheque.count({ where })
    ]);

    res.json({
      success: true,
      data: cheques,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando cheques:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR CHEQUE
router.post('/', validacionCheque, async (req, res) => {
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
      numero,
      banco,
      sucursal,
      cuentaCorriente,
      importe,
      fechaEmision,
      fechaVencimiento,
      firmante,
      cuitFirmante,
      librador,
      beneficiario,
      concepto,
      observaciones,
      tipo,
      origen
    } = req.body;

    // Validar CUIT si se proporciona
    if (cuitFirmante && !validarCUIT(cuitFirmante)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT del firmante no es válido'
      });
    }

    // Verificar que no exista un cheque con el mismo número y banco
    const chequeExistente = await prisma.cheque.findFirst({
      where: {
        numero,
        banco: { equals: banco, mode: 'insensitive' }
      }
    });
    if (chequeExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un cheque con este número en el mismo banco'
      });
    }

    // Validar fechas
    if (new Date(fechaVencimiento) < new Date(fechaEmision)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de vencimiento no puede ser anterior a la fecha de emisión'
      });
    }

    const cheque = await prisma.cheque.create({
      data: {
        numero,
        banco,
        sucursal,
        cuentaCorriente,
        importe,
        fechaEmision,
        fechaVencimiento,
        firmante,
        cuitFirmante,
        librador,
        beneficiario,
        concepto,
        observaciones,
        tipo,
        origen,
        usuarioId: req.usuario.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cheque registrado exitosamente',
      data: cheque
    });
  } catch (error) {
    console.error('Error creando cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 CAMBIAR ESTADO DEL CHEQUE
router.patch('/:id/estado', [
  param('id').isString(),
  body('estado').isIn(['PENDIENTE', 'COBRADO', 'RECHAZADO', 'ANULADO']),
  body('fechaCobro').optional().isISO8601().toDate(),
  body('observacionesEstado').optional().isString().trim()
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

    const cheque = await prisma.cheque.findUnique({
      where: { id: req.params.id }
    });

    if (!cheque) {
      return res.status(404).json({
        success: false,
        message: 'Cheque no encontrado'
      });
    }

    const { estado, fechaCobro, observacionesEstado } = req.body;

    // Validaciones de cambio de estado
    if (cheque.estado === 'COBRADO' && estado !== 'COBRADO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar el estado de un cheque ya cobrado'
      });
    }

    if (cheque.estado === 'RECHAZADO' && estado === 'COBRADO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede marcar como cobrado un cheque rechazado'
      });
    }

    // Si se marca como cobrado, establecer fecha de cobro
    const datosActualizacion = {
      estado,
      observacionesEstado
    };

    if (estado === 'COBRADO') {
      datosActualizacion.fechaCobro = fechaCobro || new Date();
    } else if (estado === 'RECHAZADO') {
      datosActualizacion.fechaRechazo = new Date();
    }

    const chequeActualizado = await prisma.cheque.update({
      where: { id: req.params.id },
      data: datosActualizacion
    });

    res.json({
      success: true,
      message: `Cheque marcado como ${estado.toLowerCase()} exitosamente`,
      data: chequeActualizado
    });
  } catch (error) {
    console.error('Error cambiando estado del cheque:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📅 OBTENER CHEQUES PRÓXIMOS A VENCER
router.get('/vencimientos/proximos', [
  query('dias').optional().isInt({ min: 1, max: 365 }).toInt()
], async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + parseInt(dias));

    const chequesProximosVencer = await prisma.cheque.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaVencimiento: {
          gte: new Date(),
          lte: fechaLimite
        }
      },
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: {
        fechaVencimiento: 'asc'
      }
    });

    res.json({
      success: true,
      data: chequesProximosVencer,
      total: chequesProximosVencer.length,
      diasConsultados: parseInt(dias)
    });
  } catch (error) {
    console.error('Error obteniendo cheques próximos a vencer:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ⚠️ OBTENER CHEQUES VENCIDOS
router.get('/vencimientos/vencidos', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const chequesVencidos = await prisma.cheque.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaVencimiento: {
          lt: hoy
        }
      },
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: {
        fechaVencimiento: 'desc'
      }
    });

    res.json({
      success: true,
      data: chequesVencidos,
      total: chequesVencidos.length
    });
  } catch (error) {
    console.error('Error obteniendo cheques vencidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE CHEQUES
router.get('/stats/general', async (req, res) => {
  try {
    const { fechaDesde, fechaHasta, tipo } = req.query;
    
    const where = {};
    if (tipo) where.tipo = tipo;
    if (fechaDesde && fechaHasta) {
      where.fechaCreacion = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }

    const [
      total,
      porEstado,
      porTipo,
      importeTotal,
      proximosVencer,
      vencidos
    ] = await Promise.all([
      prisma.cheque.count({ where }),
      prisma.cheque.groupBy({
        by: ['estado'],
        where,
        _count: true
      }),
      prisma.cheque.groupBy({
        by: ['tipo'],
        where,
        _count: true
      }),
      prisma.cheque.aggregate({
        where,
        _sum: {
          importe: true
        }
      }),
      prisma.cheque.count({
        where: {
          ...where,
          estado: 'PENDIENTE',
          fechaVencimiento: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
          }
        }
      }),
      prisma.cheque.count({
        where: {
          ...where,
          estado: 'PENDIENTE',
          fechaVencimiento: {
            lt: new Date()
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        porEstado: porEstado.reduce((acc, item) => {
          acc[item.estado] = item._count;
          return acc;
        }, {}),
        porTipo: porTipo.reduce((acc, item) => {
          acc[item.tipo] = item._count;
          return acc;
        }, {}),
        importeTotal: importeTotal._sum.importe || 0,
        proximosVencer,
        vencidos
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

export default router; 