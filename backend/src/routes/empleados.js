import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionEmpleado = [
  body('legajo')
    .isLength({ min: 1 })
    .withMessage('El legajo es requerido')
    .trim(),
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('apellido')
    .isLength({ min: 2 })
    .withMessage('El apellido debe tener al menos 2 caracteres')
    .trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('telefono').optional().isString().trim(),
  body('direccion').optional().isString().trim(),
  body('cuit').optional().isLength({ min: 11, max: 11 }).withMessage('El CUIT debe tener 11 dígitos'),
  body('fechaIngreso').isISO8601().toDate(),
  body('fechaEgreso').optional().isISO8601().toDate(),
  body('categoria').isString().trim(),
  body('cargo').isString().trim(),
  body('sector').optional().isString().trim(),
  body('sueldoBasico').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('modalidadPago').optional().isIn(['MENSUAL', 'QUINCENAL', 'SEMANAL']),
  body('banco').optional().isString().trim(),
  body('cbu').optional().isString().trim(),
  body('aliasCbu').optional().isString().trim()
];

const validacionLiquidacion = [
  body('empleadoId').isString().withMessage('El empleado es requerido'),
  body('periodo').matches(/^\d{4}-\d{2}$/).withMessage('El período debe tener formato YYYY-MM'),
  body('sueldoBasico').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('horasExtra').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('premios').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('descuentos').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('aportesJubilatorios').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('aportesSociales').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('obraSocial').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('observaciones').optional().isString().trim()
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

// Función para calcular aportes automáticamente
const calcularAportes = (sueldoBasico, horasExtra = 0, premios = 0) => {
  const totalHaberes = sueldoBasico + horasExtra + premios;
  
  return {
    aportesJubilatorios: totalHaberes * 0.11, // 11%
    aportesSociales: totalHaberes * 0.03, // 3%
    obraSocial: totalHaberes * 0.03 // 3%
  };
};

// 📋 LISTAR EMPLEADOS
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      activo, 
      categoria, 
      sector,
      busqueda,
      ordenPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (activo !== undefined) where.activo = activo === 'true';
    if (categoria) where.categoria = categoria;
    if (sector) where.sector = sector;
    
    if (busqueda) {
      where.OR = [
        { legajo: { contains: busqueda, mode: 'insensitive' } },
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { apellido: { contains: busqueda, mode: 'insensitive' } },
        { email: { contains: busqueda, mode: 'insensitive' } },
        { cuit: { contains: busqueda } },
        { cargo: { contains: busqueda, mode: 'insensitive' } }
      ];
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [empleados, total] = await Promise.all([
      prisma.empleado.findMany({
        where,
        skip,
        take,
        include: {
          usuario: {
            select: { nombre: true, apellido: true }
          },
          _count: {
            select: { liquidaciones: true }
          }
        },
        orderBy
      }),
      prisma.empleado.count({ where })
    ]);

    res.json({
      success: true,
      data: empleados,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando empleados:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER EMPLEADO POR ID
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

    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        },
        liquidaciones: {
          orderBy: { fechaLiquidacion: 'desc' },
          take: 12 // Últimas 12 liquidaciones
        }
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    res.json({
      success: true,
      data: empleado
    });
  } catch (error) {
    console.error('Error obteniendo empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR EMPLEADO
router.post('/', validacionEmpleado, async (req, res) => {
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
      legajo,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      cuit,
      fechaIngreso,
      fechaEgreso,
      categoria,
      cargo,
      sector,
      sueldoBasico,
      modalidadPago = 'MENSUAL',
      banco,
      cbu,
      aliasCbu
    } = req.body;

    // Validar CUIT si se proporciona
    if (cuit && !validarCUIT(cuit)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT proporcionado no es válido'
      });
    }

    // Verificar legajo único
    const legajoExistente = await prisma.empleado.findUnique({
      where: { legajo }
    });
    if (legajoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un empleado con este legajo'
      });
    }

    // Verificar CUIT único si se proporciona
    if (cuit) {
      const cuitExistente = await prisma.empleado.findUnique({
        where: { cuit }
      });
      if (cuitExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un empleado con este CUIT'
        });
      }
    }

    // Verificar email único si se proporciona
    if (email) {
      const emailExistente = await prisma.empleado.findFirst({
        where: { email }
      });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un empleado con este email'
        });
      }
    }

    const empleado = await prisma.empleado.create({
      data: {
        legajo,
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        cuit,
        fechaIngreso,
        fechaEgreso,
        categoria,
        cargo,
        sector,
        sueldoBasico,
        modalidadPago,
        banco,
        cbu,
        aliasCbu,
        usuarioId: req.usuario.id
      }
    });

    res.status(201).json({
      success: true,
      message: 'Empleado creado exitosamente',
      data: empleado
    });
  } catch (error) {
    console.error('Error creando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✏️ ACTUALIZAR EMPLEADO
router.put('/:id', [
  param('id').isString(),
  ...validacionEmpleado
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

    const empleadoExistente = await prisma.empleado.findUnique({
      where: { id: req.params.id }
    });

    if (!empleadoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const {
      legajo,
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      cuit,
      fechaIngreso,
      fechaEgreso,
      categoria,
      cargo,
      sector,
      sueldoBasico,
      modalidadPago,
      banco,
      cbu,
      aliasCbu
    } = req.body;

    // Validar CUIT
    if (cuit && !validarCUIT(cuit)) {
      return res.status(400).json({
        success: false,
        message: 'El CUIT proporcionado no es válido'
      });
    }

    // Verificar legajo único
    if (legajo !== empleadoExistente.legajo) {
      const legajoExistente = await prisma.empleado.findFirst({
        where: { 
          legajo,
          id: { not: req.params.id }
        }
      });
      if (legajoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro empleado con este legajo'
        });
      }
    }

    // Verificar CUIT único
    if (cuit && cuit !== empleadoExistente.cuit) {
      const cuitExistente = await prisma.empleado.findFirst({
        where: { 
          cuit,
          id: { not: req.params.id }
        }
      });
      if (cuitExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro empleado con este CUIT'
        });
      }
    }

    // Verificar email único
    if (email && email !== empleadoExistente.email) {
      const emailExistente = await prisma.empleado.findFirst({
        where: { 
          email,
          id: { not: req.params.id }
        }
      });
      if (emailExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro empleado con este email'
        });
      }
    }

    const empleado = await prisma.empleado.update({
      where: { id: req.params.id },
      data: {
        legajo,
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        cuit,
        fechaIngreso,
        fechaEgreso,
        categoria,
        cargo,
        sector,
        sueldoBasico,
        modalidadPago,
        banco,
        cbu,
        aliasCbu
      }
    });

    res.json({
      success: true,
      message: 'Empleado actualizado exitosamente',
      data: empleado
    });
  } catch (error) {
    console.error('Error actualizando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 ACTIVAR/DESACTIVAR EMPLEADO
router.patch('/:id/estado', [
  param('id').isString(),
  body('activo').isBoolean(),
  body('fechaEgreso').optional().isISO8601().toDate()
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

    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const { activo, fechaEgreso } = req.body;

    const datosActualizacion = { 
      activo,
      fechaEgreso: !activo ? (fechaEgreso || new Date()) : null
    };

    const empleadoActualizado = await prisma.empleado.update({
      where: { id: req.params.id },
      data: datosActualizacion
    });

    res.json({
      success: true,
      message: `Empleado ${activo ? 'activado' : 'desactivado'} exitosamente`,
      data: empleadoActualizado
    });
  } catch (error) {
    console.error('Error cambiando estado del empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 💰 CREAR LIQUIDACIÓN DE SUELDO
router.post('/liquidaciones', validacionLiquidacion, async (req, res) => {
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
      empleadoId,
      periodo,
      sueldoBasico,
      horasExtra = 0,
      premios = 0,
      descuentos = 0,
      aportesJubilatorios,
      aportesSociales,
      obraSocial,
      observaciones
    } = req.body;

    // Verificar que el empleado existe
    const empleado = await prisma.empleado.findUnique({
      where: { id: empleadoId }
    });
    if (!empleado) {
      return res.status(400).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar que no exista liquidación para ese período
    const liquidacionExistente = await prisma.liquidacionSueldo.findUnique({
      where: {
        empleadoId_periodo: {
          empleadoId,
          periodo
        }
      }
    });
    if (liquidacionExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una liquidación para este empleado en el período especificado'
      });
    }

    // Calcular aportes automáticamente si no se proporcionan
    const aportesCalculados = calcularAportes(sueldoBasico, horasExtra, premios);
    
    const aportesFinales = {
      aportesJubilatorios: aportesJubilatorios || aportesCalculados.aportesJubilatorios,
      aportesSociales: aportesSociales || aportesCalculados.aportesSociales,
      obraSocial: obraSocial || aportesCalculados.obraSocial
    };

    // Calcular totales
    const totalHaberes = sueldoBasico + horasExtra + premios;
    const totalDescuentos = descuentos + 
                           aportesFinales.aportesJubilatorios + 
                           aportesFinales.aportesSociales + 
                           aportesFinales.obraSocial;
    const netoAPagar = totalHaberes - totalDescuentos;

    const liquidacion = await prisma.liquidacionSueldo.create({
      data: {
        empleadoId,
        periodo,
        sueldoBasico,
        horasExtra,
        premios,
        descuentos,
        aportesJubilatorios: aportesFinales.aportesJubilatorios,
        aportesSociales: aportesFinales.aportesSociales,
        obraSocial: aportesFinales.obraSocial,
        totalHaberes,
        totalDescuentos,
        netoAPagar,
        observaciones,
        usuarioId: req.usuario.id
      },
      include: {
        empleado: true,
        usuario: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Liquidación creada exitosamente',
      data: liquidacion
    });
  } catch (error) {
    console.error('Error creando liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📋 LISTAR LIQUIDACIONES
router.get('/liquidaciones', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      empleadoId, 
      periodo,
      estado,
      fechaDesde,
      fechaHasta,
      ordenPor = 'fechaLiquidacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (empleadoId) where.empleadoId = empleadoId;
    if (periodo) where.periodo = periodo;
    if (estado) where.estado = estado;
    
    if (fechaDesde && fechaHasta) {
      where.fechaLiquidacion = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [liquidaciones, total] = await Promise.all([
      prisma.liquidacionSueldo.findMany({
        where,
        skip,
        take,
        include: {
          empleado: true,
          usuario: {
            select: { nombre: true, apellido: true }
          }
        },
        orderBy
      }),
      prisma.liquidacionSueldo.count({ where })
    ]);

    res.json({
      success: true,
      data: liquidaciones,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando liquidaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER LIQUIDACIÓN POR ID
router.get('/liquidaciones/:id', [
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

    const liquidacion = await prisma.liquidacionSueldo.findUnique({
      where: { id: req.params.id },
      include: {
        empleado: true,
        usuario: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    if (!liquidacion) {
      return res.status(404).json({
        success: false,
        message: 'Liquidación no encontrada'
      });
    }

    res.json({
      success: true,
      data: liquidacion
    });
  } catch (error) {
    console.error('Error obteniendo liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 💳 MARCAR LIQUIDACIÓN COMO PAGADA
router.patch('/liquidaciones/:id/pagar', [
  param('id').isString(),
  body('fechaPago').optional().isISO8601().toDate()
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

    const liquidacion = await prisma.liquidacionSueldo.findUnique({
      where: { id: req.params.id },
      include: { empleado: true }
    });

    if (!liquidacion) {
      return res.status(404).json({
        success: false,
        message: 'Liquidación no encontrada'
      });
    }

    if (liquidacion.estado === 'PAGADA') {
      return res.status(400).json({
        success: false,
        message: 'La liquidación ya está marcada como pagada'
      });
    }

    const { fechaPago } = req.body;

    const liquidacionActualizada = await prisma.liquidacionSueldo.update({
      where: { id: req.params.id },
      data: {
        estado: 'PAGADA',
        fechaPago: fechaPago || new Date()
      },
      include: {
        empleado: true,
        usuario: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Liquidación marcada como pagada exitosamente',
      data: liquidacionActualizada
    });
  } catch (error) {
    console.error('Error marcando liquidación como pagada:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🗑️ ELIMINAR EMPLEADO
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

    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { liquidaciones: true }
        }
      }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    // Verificar si tiene liquidaciones
    if (empleado._count.liquidaciones > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el empleado porque tiene liquidaciones asociadas. Desactívelo en su lugar.'
      });
    }

    await prisma.empleado.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Empleado eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando empleado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE EMPLEADOS
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
      porCategoria,
      porSector,
      sueldoPromedio,
      liquidacionesPendientes
    ] = await Promise.all([
      prisma.empleado.count({ where }),
      prisma.empleado.count({ where: { ...where, activo: true } }),
      prisma.empleado.groupBy({
        by: ['categoria'],
        where,
        _count: true
      }),
      prisma.empleado.groupBy({
        by: ['sector'],
        where,
        _count: true
      }),
      prisma.empleado.aggregate({
        where: { ...where, activo: true },
        _avg: {
          sueldoBasico: true
        }
      }),
      prisma.liquidacionSueldo.count({
        where: { estado: 'PENDIENTE' }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activos,
        inactivos: total - activos,
        porCategoria: porCategoria.reduce((acc, item) => {
          acc[item.categoria] = item._count;
          return acc;
        }, {}),
        porSector: porSector.reduce((acc, item) => {
          acc[item.sector || 'Sin sector'] = item._count;
          return acc;
        }, {}),
        sueldoPromedio: sueldoPromedio._avg.sueldoBasico || 0,
        liquidacionesPendientes
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

// 💼 CALCULAR LIQUIDACIÓN AUTOMÁTICA
router.post('/:id/calcular-liquidacion', [
  param('id').isString(),
  body('periodo').matches(/^\d{4}-\d{2}$/).withMessage('El período debe tener formato YYYY-MM'),
  body('horasExtra').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('premios').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('descuentos').optional().isDecimal({ decimal_digits: '0,2' }).toFloat()
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

    const empleado = await prisma.empleado.findUnique({
      where: { id: req.params.id }
    });

    if (!empleado) {
      return res.status(404).json({
        success: false,
        message: 'Empleado no encontrado'
      });
    }

    const {
      periodo,
      horasExtra = 0,
      premios = 0,
      descuentos = 0
    } = req.body;

    // Calcular con datos actuales del empleado
    const sueldoBasico = empleado.sueldoBasico;
    const aportesCalculados = calcularAportes(sueldoBasico, horasExtra, premios);

    const totalHaberes = sueldoBasico + horasExtra + premios;
    const totalDescuentos = descuentos + 
                           aportesCalculados.aportesJubilatorios + 
                           aportesCalculados.aportesSociales + 
                           aportesCalculados.obraSocial;
    const netoAPagar = totalHaberes - totalDescuentos;

    res.json({
      success: true,
      data: {
        empleado: {
          id: empleado.id,
          legajo: empleado.legajo,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          categoria: empleado.categoria,
          cargo: empleado.cargo
        },
        periodo,
        conceptos: {
          sueldoBasico,
          horasExtra,
          premios,
          descuentos,
          aportesJubilatorios: aportesCalculados.aportesJubilatorios,
          aportesSociales: aportesCalculados.aportesSociales,
          obraSocial: aportesCalculados.obraSocial
        },
        totales: {
          totalHaberes,
          totalDescuentos,
          netoAPagar
        }
      }
    });
  } catch (error) {
    console.error('Error calculando liquidación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 