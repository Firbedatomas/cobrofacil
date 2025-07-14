import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionFacturaRecurrente = [
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('descripcion').optional().isString().trim(),
  body('clienteId').isString().withMessage('El cliente es requerido'),
  body('frecuencia').isIn(['MENSUAL', 'BIMENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL']),
  body('diaVencimiento').isInt({ min: 1, max: 28 }).toInt().withMessage('El día debe estar entre 1 y 28'),
  body('proximaFactura').isISO8601().toDate(),
  body('tipoComprobante').optional().isIn(['TICKET_NO_FISCAL', 'TICKET_FISCAL', 'FACTURA_A', 'FACTURA_B']),
  body('metodoPago').optional().isIn(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR_MERCADOPAGO']),
  body('detalles').isArray({ min: 1 }),
  body('detalles.*.productoId').optional().isString(),
  body('detalles.*.descripcion').isString().trim(),
  body('detalles.*.cantidad').isInt({ min: 1 }).toInt(),
  body('detalles.*.precioUnitario').isDecimal({ decimal_digits: '0,2' }).toFloat()
];

// Función para calcular próxima fecha de facturación
const calcularProximaFecha = (fechaBase, frecuencia) => {
  const fecha = new Date(fechaBase);
  
  switch (frecuencia) {
    case 'MENSUAL':
      fecha.setMonth(fecha.getMonth() + 1);
      break;
    case 'BIMENSUAL':
      fecha.setMonth(fecha.getMonth() + 2);
      break;
    case 'TRIMESTRAL':
      fecha.setMonth(fecha.getMonth() + 3);
      break;
    case 'SEMESTRAL':
      fecha.setMonth(fecha.getMonth() + 6);
      break;
    case 'ANUAL':
      fecha.setFullYear(fecha.getFullYear() + 1);
      break;
  }
  
  return fecha;
};

// 📋 LISTAR FACTURAS RECURRENTES
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      activa, 
      frecuencia, 
      clienteId,
      busqueda,
      ordenPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (activa !== undefined) where.activa = activa === 'true';
    if (frecuencia) where.frecuencia = frecuencia;
    if (clienteId) where.clienteId = clienteId;
    
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
        { cliente: { nombre: { contains: busqueda, mode: 'insensitive' } } },
        { cliente: { razonSocial: { contains: busqueda, mode: 'insensitive' } } }
      ];
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [facturasRecurrentes, total] = await Promise.all([
      prisma.facturaRecurrente.findMany({
        where,
        skip,
        take,
        include: {
          cliente: true,
          usuario: {
            select: { nombre: true, apellido: true }
          },
          detalles: {
            include: {
              producto: true
            }
          },
          _count: {
            select: { ventasGeneradas: true }
          }
        },
        orderBy
      }),
      prisma.facturaRecurrente.count({ where })
    ]);

    res.json({
      success: true,
      data: facturasRecurrentes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando facturas recurrentes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER FACTURA RECURRENTE POR ID
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

    const facturaRecurrente = await prisma.facturaRecurrente.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        usuario: {
          select: { nombre: true, apellido: true }
        },
        detalles: {
          include: {
            producto: true
          }
        },
        ventasGeneradas: {
          include: {
            venta: true
          },
          orderBy: {
            fechaGeneracion: 'desc'
          }
        }
      }
    });

    if (!facturaRecurrente) {
      return res.status(404).json({
        success: false,
        message: 'Factura recurrente no encontrada'
      });
    }

    res.json({
      success: true,
      data: facturaRecurrente
    });
  } catch (error) {
    console.error('Error obteniendo factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR FACTURA RECURRENTE
router.post('/', validacionFacturaRecurrente, async (req, res) => {
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
      descripcion,
      clienteId,
      frecuencia,
      diaVencimiento,
      proximaFactura,
      tipoComprobante = 'FACTURA_B',
      metodoPago = 'TRANSFERENCIA',
      detalles
    } = req.body;

    // Validar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId }
    });
    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    // Validar productos si se especifican
    const productosIds = detalles
      .filter(d => d.productoId)
      .map(d => d.productoId);
    
    if (productosIds.length > 0) {
      const productos = await prisma.producto.findMany({
        where: { id: { in: productosIds } }
      });
      
      if (productos.length !== productosIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Uno o más productos no existen'
        });
      }
    }

    // Calcular totales
    let subtotal = 0;
    const detallesCalculados = detalles.map(detalle => {
      const subtotalDetalle = detalle.cantidad * detalle.precioUnitario;
      subtotal += subtotalDetalle;
      return {
        ...detalle,
        subtotal: subtotalDetalle
      };
    });

    const impuestos = subtotal * 0.21; // IVA 21%
    const total = subtotal + impuestos;

    // Crear factura recurrente
    const facturaRecurrente = await prisma.facturaRecurrente.create({
      data: {
        nombre,
        descripcion,
        frecuencia,
        diaVencimiento,
        proximaFactura,
        total,
        subtotal,
        impuestos,
        tipoComprobante,
        metodoPago,
        clienteId,
        usuarioId: req.usuario.id,
        detalles: {
          create: detallesCalculados.map(detalle => ({
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
            descripcion: detalle.descripcion,
            productoId: detalle.productoId
          }))
        }
      },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Factura recurrente creada exitosamente',
      data: facturaRecurrente
    });
  } catch (error) {
    console.error('Error creando factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✏️ ACTUALIZAR FACTURA RECURRENTE
router.put('/:id', [
  param('id').isString(),
  ...validacionFacturaRecurrente
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

    const facturaExistente = await prisma.facturaRecurrente.findUnique({
      where: { id: req.params.id }
    });

    if (!facturaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Factura recurrente no encontrada'
      });
    }

    const {
      nombre,
      descripcion,
      clienteId,
      frecuencia,
      diaVencimiento,
      proximaFactura,
      tipoComprobante,
      metodoPago,
      detalles
    } = req.body;

    // Calcular totales
    let subtotal = 0;
    const detallesCalculados = detalles.map(detalle => {
      const subtotalDetalle = detalle.cantidad * detalle.precioUnitario;
      subtotal += subtotalDetalle;
      return {
        ...detalle,
        subtotal: subtotalDetalle
      };
    });

    const impuestos = subtotal * 0.21;
    const total = subtotal + impuestos;

    // Actualizar factura recurrente
    const facturaRecurrente = await prisma.facturaRecurrente.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion,
        frecuencia,
        diaVencimiento,
        proximaFactura,
        total,
        subtotal,
        impuestos,
        tipoComprobante,
        metodoPago,
        clienteId,
        detalles: {
          deleteMany: {},
          create: detallesCalculados.map(detalle => ({
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
            descripcion: detalle.descripcion,
            productoId: detalle.productoId
          }))
        }
      },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Factura recurrente actualizada exitosamente',
      data: facturaRecurrente
    });
  } catch (error) {
    console.error('Error actualizando factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 ACTIVAR/DESACTIVAR FACTURA RECURRENTE
router.patch('/:id/estado', [
  param('id').isString(),
  body('activa').isBoolean()
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

    const facturaRecurrente = await prisma.facturaRecurrente.findUnique({
      where: { id: req.params.id }
    });

    if (!facturaRecurrente) {
      return res.status(404).json({
        success: false,
        message: 'Factura recurrente no encontrada'
      });
    }

    const facturaActualizada = await prisma.facturaRecurrente.update({
      where: { id: req.params.id },
      data: { activa: req.body.activa }
    });

    res.json({
      success: true,
      message: `Factura recurrente ${req.body.activa ? 'activada' : 'desactivada'} exitosamente`,
      data: facturaActualizada
    });
  } catch (error) {
    console.error('Error cambiando estado de factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ⚡ GENERAR VENTA DESDE FACTURA RECURRENTE
router.post('/:id/generar-venta', [
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

    const facturaRecurrente = await prisma.facturaRecurrente.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!facturaRecurrente) {
      return res.status(404).json({
        success: false,
        message: 'Factura recurrente no encontrada'
      });
    }

    if (!facturaRecurrente.activa) {
      return res.status(400).json({
        success: false,
        message: 'No se puede generar venta de una factura recurrente inactiva'
      });
    }

    // Generar número de venta
    const año = new Date().getFullYear();
    const ultimaVenta = await prisma.venta.findFirst({
      where: {
        numeroVenta: {
          startsWith: `VTA-${año}-`
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      }
    });

    let proximoNumero = 1;
    if (ultimaVenta) {
      const numeroActual = parseInt(ultimaVenta.numeroVenta.split('-')[2]);
      proximoNumero = numeroActual + 1;
    }

    const numeroVenta = `VTA-${año}-${proximoNumero.toString().padStart(6, '0')}`;

    // Crear venta en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const venta = await tx.venta.create({
        data: {
          numeroVenta,
          total: facturaRecurrente.total,
          subtotal: facturaRecurrente.subtotal,
          impuesto: facturaRecurrente.impuestos,
          metodoPago: facturaRecurrente.metodoPago,
          tipoComprobante: facturaRecurrente.tipoComprobante,
          usuarioId: req.usuario.id,
          clienteId: facturaRecurrente.clienteId,
          detalles: {
            create: facturaRecurrente.detalles.map(detalle => ({
              cantidad: detalle.cantidad,
              precioUnitario: detalle.precioUnitario,
              subtotal: detalle.subtotal,
              productoId: detalle.productoId
            }))
          }
        },
        include: {
          detalles: true,
          cliente: true
        }
      });

      // Actualizar stock de productos
      for (const detalle of facturaRecurrente.detalles) {
        if (detalle.productoId) {
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: {
              stock: {
                decrement: detalle.cantidad
              }
            }
          });

          // Registrar movimiento de stock
          await tx.movimientoStock.create({
            data: {
              tipo: 'VENTA',
              cantidad: -detalle.cantidad,
              motivo: `Venta ${numeroVenta} - Factura recurrente ${facturaRecurrente.nombre}`,
              productoId: detalle.productoId
            }
          });
        }
      }

      // Registrar la venta recurrente
      await tx.ventaRecurrente.create({
        data: {
          facturaRecurrenteId: facturaRecurrente.id,
          ventaId: venta.id,
          notificacionEnviada: false
        }
      });

      // Actualizar la próxima fecha de facturación
      const proximaFecha = calcularProximaFecha(facturaRecurrente.proximaFactura, facturaRecurrente.frecuencia);
      await tx.facturaRecurrente.update({
        where: { id: facturaRecurrente.id },
        data: {
          proximaFactura: proximaFecha
        }
      });

      return venta;
    });

    res.json({
      success: true,
      message: 'Venta generada exitosamente desde factura recurrente',
      data: {
        venta: resultado,
        proximaFactura: calcularProximaFecha(facturaRecurrente.proximaFactura, facturaRecurrente.frecuencia)
      }
    });
  } catch (error) {
    console.error('Error generando venta desde factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📅 OBTENER FACTURAS PENDIENTES DE GENERAR
router.get('/pendientes/generar', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const facturasPendientes = await prisma.facturaRecurrente.findMany({
      where: {
        activa: true,
        proximaFactura: {
          lte: hoy
        }
      },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        },
        _count: {
          select: { ventasGeneradas: true }
        }
      },
      orderBy: {
        proximaFactura: 'asc'
      }
    });

    res.json({
      success: true,
      data: facturasPendientes,
      total: facturasPendientes.length
    });
  } catch (error) {
    console.error('Error obteniendo facturas pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🤖 GENERAR TODAS LAS FACTURAS PENDIENTES (PROCESO AUTOMÁTICO)
router.post('/generar-todas-pendientes', [
  verificarRol(['ADMIN', 'SUPERVISOR'])
], async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const facturasPendientes = await prisma.facturaRecurrente.findMany({
      where: {
        activa: true,
        proximaFactura: {
          lte: hoy
        }
      },
      include: {
        cliente: true,
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    const resultados = [];
    const errores = [];

    for (const facturaRecurrente of facturasPendientes) {
      try {
        // Generar número de venta
        const año = new Date().getFullYear();
        const ultimaVenta = await prisma.venta.findFirst({
          where: {
            numeroVenta: {
              startsWith: `VTA-${año}-`
            }
          },
          orderBy: {
            fechaVenta: 'desc'
          }
        });

        let proximoNumero = 1;
        if (ultimaVenta) {
          const numeroActual = parseInt(ultimaVenta.numeroVenta.split('-')[2]);
          proximoNumero = numeroActual + 1;
        }

        const numeroVenta = `VTA-${año}-${proximoNumero.toString().padStart(6, '0')}`;

        // Crear venta en transacción
        const venta = await prisma.$transaction(async (tx) => {
          const nuevaVenta = await tx.venta.create({
            data: {
              numeroVenta,
              total: facturaRecurrente.total,
              subtotal: facturaRecurrente.subtotal,
              impuesto: facturaRecurrente.impuestos,
              metodoPago: facturaRecurrente.metodoPago,
              tipoComprobante: facturaRecurrente.tipoComprobante,
              usuarioId: req.usuario.id,
              clienteId: facturaRecurrente.clienteId,
              detalles: {
                create: facturaRecurrente.detalles.map(detalle => ({
                  cantidad: detalle.cantidad,
                  precioUnitario: detalle.precioUnitario,
                  subtotal: detalle.subtotal,
                  productoId: detalle.productoId
                }))
              }
            }
          });

          // Actualizar stock
          for (const detalle of facturaRecurrente.detalles) {
            if (detalle.productoId) {
              await tx.producto.update({
                where: { id: detalle.productoId },
                data: {
                  stock: {
                    decrement: detalle.cantidad
                  }
                }
              });

              await tx.movimientoStock.create({
                data: {
                  tipo: 'VENTA',
                  cantidad: -detalle.cantidad,
                  motivo: `Venta automática ${numeroVenta} - ${facturaRecurrente.nombre}`,
                  productoId: detalle.productoId
                }
              });
            }
          }

          // Registrar venta recurrente
          await tx.ventaRecurrente.create({
            data: {
              facturaRecurrenteId: facturaRecurrente.id,
              ventaId: nuevaVenta.id,
              notificacionEnviada: false
            }
          });

          // Actualizar próxima fecha
          const proximaFecha = calcularProximaFecha(facturaRecurrente.proximaFactura, facturaRecurrente.frecuencia);
          await tx.facturaRecurrente.update({
            where: { id: facturaRecurrente.id },
            data: {
              proximaFactura: proximaFecha
            }
          });

          return nuevaVenta;
        });

        resultados.push({
          facturaRecurrente: facturaRecurrente.nombre,
          cliente: facturaRecurrente.cliente.nombre,
          numeroVenta: venta.numeroVenta,
          total: venta.total,
          estado: 'EXITOSA'
        });

      } catch (error) {
        console.error(`Error generando venta para ${facturaRecurrente.nombre}:`, error);
        errores.push({
          facturaRecurrente: facturaRecurrente.nombre,
          cliente: facturaRecurrente.cliente.nombre,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Proceso completado. ${resultados.length} facturas generadas, ${errores.length} errores`,
      data: {
        exitosas: resultados,
        errores,
        totalProcesadas: facturasPendientes.length
      }
    });
  } catch (error) {
    console.error('Error en proceso automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error en proceso automático de facturas'
    });
  }
});

// 🗑️ ELIMINAR FACTURA RECURRENTE
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

    const facturaRecurrente = await prisma.facturaRecurrente.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { ventasGeneradas: true }
        }
      }
    });

    if (!facturaRecurrente) {
      return res.status(404).json({
        success: false,
        message: 'Factura recurrente no encontrada'
      });
    }

    // Verificar si hay ventas generadas
    if (facturaRecurrente._count.ventasGeneradas > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la factura recurrente porque ya ha generado ventas. Desactívela en su lugar.'
      });
    }

    await prisma.facturaRecurrente.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Factura recurrente eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando factura recurrente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE FACTURAS RECURRENTES
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
      activas,
      porFrecuencia,
      ventasGeneradas,
      ingresosTotales
    ] = await Promise.all([
      prisma.facturaRecurrente.count({ where }),
      prisma.facturaRecurrente.count({ where: { ...where, activa: true } }),
      prisma.facturaRecurrente.groupBy({
        by: ['frecuencia'],
        where,
        _count: true
      }),
      prisma.ventaRecurrente.count({
        where: {
          facturaRecurrente: where
        }
      }),
      prisma.venta.aggregate({
        where: {
          ventaRecurrente: {
            isNot: null
          }
        },
        _sum: {
          total: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activas,
        inactivas: total - activas,
        porFrecuencia: porFrecuencia.reduce((acc, item) => {
          acc[item.frecuencia] = item._count;
          return acc;
        }, {}),
        ventasGeneradas,
        ingresosTotales: ingresosTotales._sum.total || 0
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