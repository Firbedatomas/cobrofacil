import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionPresupuesto = [
  body('clienteId').optional().isString(),
  body('nombreCliente').optional().isString().trim(),
  body('emailCliente').optional().isEmail().normalizeEmail(),
  body('telefonoCliente').optional().isString().trim(),
  body('direccionCliente').optional().isString().trim(),
  body('fechaVencimiento').isISO8601().toDate(),
  body('validezDias').isInt({ min: 1 }).toInt(),
  body('observaciones').optional().isString().trim(),
  body('condicionesComerciales').optional().isString().trim(),
  body('detalles').isArray({ min: 1 }),
  body('detalles.*.productoId').optional().isString(),
  body('detalles.*.descripcion').optional().isString().trim(),
  body('detalles.*.cantidad').isInt({ min: 1 }).toInt(),
  body('detalles.*.precioUnitario').isDecimal({ decimal_digits: '0,2' }).toFloat()
];

// Generar número de presupuesto
const generarNumeroPresupuesto = async () => {
  const año = new Date().getFullYear();
  const ultimoPresupuesto = await prisma.presupuesto.findFirst({
    where: {
      numero: {
        startsWith: `PRES-${año}-`
      }
    },
    orderBy: {
      fechaCreacion: 'desc'
    }
  });

  let proximoNumero = 1;
  if (ultimoPresupuesto) {
    const numeroActual = parseInt(ultimoPresupuesto.numero.split('-')[2]);
    proximoNumero = numeroActual + 1;
  }

  return `PRES-${año}-${proximoNumero.toString().padStart(6, '0')}`;
};

// 📋 LISTAR PRESUPUESTOS
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      estado, 
      clienteId, 
      fechaDesde, 
      fechaHasta,
      busqueda 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (estado) where.estado = estado;
    if (clienteId) where.clienteId = clienteId;
    if (fechaDesde && fechaHasta) {
      where.fechaCreacion = {
        gte: new Date(fechaDesde),
        lte: new Date(fechaHasta)
      };
    }
    
    if (busqueda) {
      where.OR = [
        { numero: { contains: busqueda, mode: 'insensitive' } },
        { nombreCliente: { contains: busqueda, mode: 'insensitive' } },
        { cliente: { nombre: { contains: busqueda, mode: 'insensitive' } } }
      ];
    }

    const [presupuestos, total] = await Promise.all([
      prisma.presupuesto.findMany({
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
            select: { detalles: true }
          }
        },
        orderBy: {
          fechaCreacion: 'desc'
        }
      }),
      prisma.presupuesto.count({ where })
    ]);

    res.json({
      success: true,
      data: presupuestos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando presupuestos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER PRESUPUESTO POR ID
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

    const presupuesto = await prisma.presupuesto.findUnique({
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
        ventaGenerada: true
      }
    });

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    res.json({
      success: true,
      data: presupuesto
    });
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR PRESUPUESTO
router.post('/', validacionPresupuesto, async (req, res) => {
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
      clienteId,
      nombreCliente,
      emailCliente,
      telefonoCliente,
      direccionCliente,
      fechaVencimiento,
      validezDias,
      observaciones,
      condicionesComerciales,
      detalles
    } = req.body;

    // Validar que si se proporciona clienteId, el cliente existe
    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId }
      });
      if (!cliente) {
        return res.status(400).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }
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

    // Generar número de presupuesto
    const numero = await generarNumeroPresupuesto();

    // Crear presupuesto
    const presupuesto = await prisma.presupuesto.create({
      data: {
        numero,
        fechaVencimiento,
        total,
        subtotal,
        impuestos,
        validezDias,
        observaciones,
        condicionesComerciales,
        clienteId,
        nombreCliente,
        emailCliente,
        telefonoCliente,
        direccionCliente,
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
      message: 'Presupuesto creado exitosamente',
      data: presupuesto
    });
  } catch (error) {
    console.error('Error creando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✏️ ACTUALIZAR PRESUPUESTO
router.put('/:id', [
  param('id').isString(),
  ...validacionPresupuesto
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

    const presupuestoExistente = await prisma.presupuesto.findUnique({
      where: { id: req.params.id }
    });

    if (!presupuestoExistente) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    // No permitir editar presupuestos ya convertidos
    if (presupuestoExistente.estado === 'CONVERTIDO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un presupuesto ya convertido a venta'
      });
    }

    const {
      clienteId,
      nombreCliente,
      emailCliente,
      telefonoCliente,
      direccionCliente,
      fechaVencimiento,
      validezDias,
      observaciones,
      condicionesComerciales,
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

    // Actualizar presupuesto
    const presupuesto = await prisma.presupuesto.update({
      where: { id: req.params.id },
      data: {
        fechaVencimiento,
        total,
        subtotal,
        impuestos,
        validezDias,
        observaciones,
        condicionesComerciales,
        clienteId,
        nombreCliente,
        emailCliente,
        telefonoCliente,
        direccionCliente,
        estado: 'PENDIENTE', // Resetear estado al editar
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
      message: 'Presupuesto actualizado exitosamente',
      data: presupuesto
    });
  } catch (error) {
    console.error('Error actualizando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📧 ENVIAR PRESUPUESTO POR EMAIL
router.post('/:id/enviar-email', [
  param('id').isString(),
  body('email').optional().isEmail().normalizeEmail(),
  body('mensaje').optional().isString().trim()
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

    const presupuesto = await prisma.presupuesto.findUnique({
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

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    const { email, mensaje } = req.body;
    const emailDestino = email || presupuesto.emailCliente || presupuesto.cliente?.email;

    if (!emailDestino) {
      return res.status(400).json({
        success: false,
        message: 'No se encontró una dirección de email válida'
      });
    }

    // TODO: Implementar envío real de email
    // Por ahora simularemos el envío
    console.log('📧 Enviando presupuesto por email:');
    console.log('Destino:', emailDestino);
    console.log('Presupuesto:', presupuesto.numero);
    console.log('Mensaje:', mensaje);

    // Actualizar presupuesto como enviado
    await prisma.presupuesto.update({
      where: { id: req.params.id },
      data: {
        enviadoPorEmail: true,
        fechaEnvio: new Date(),
        estado: 'ENVIADO'
      }
    });

    res.json({
      success: true,
      message: `Presupuesto enviado exitosamente a ${emailDestino}`
    });
  } catch (error) {
    console.error('Error enviando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 💰 CONVERTIR PRESUPUESTO A VENTA
router.post('/:id/convertir-venta', [
  param('id').isString(),
  body('metodoPago').isIn(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR_MERCADOPAGO']),
  body('tipoComprobante').optional().isIn(['TICKET_NO_FISCAL', 'TICKET_FISCAL', 'FACTURA_A', 'FACTURA_B'])
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

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: req.params.id },
      include: {
        detalles: {
          include: {
            producto: true
          }
        },
        cliente: true
      }
    });

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    if (presupuesto.estado === 'CONVERTIDO') {
      return res.status(400).json({
        success: false,
        message: 'Este presupuesto ya ha sido convertido a venta'
      });
    }

    const { metodoPago, tipoComprobante = 'TICKET_NO_FISCAL' } = req.body;

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
          total: presupuesto.total,
          subtotal: presupuesto.subtotal,
          impuesto: presupuesto.impuestos,
          metodoPago,
          tipoComprobante,
          usuarioId: req.usuario.id,
          clienteId: presupuesto.clienteId,
          detalles: {
            create: presupuesto.detalles.map(detalle => ({
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
      for (const detalle of presupuesto.detalles) {
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
              motivo: `Venta ${numeroVenta} - Conversión de presupuesto ${presupuesto.numero}`,
              productoId: detalle.productoId
            }
          });
        }
      }

      // Actualizar presupuesto como convertido
      await tx.presupuesto.update({
        where: { id: req.params.id },
        data: {
          estado: 'CONVERTIDO',
          ventaId: venta.id
        }
      });

      return venta;
    });

    res.json({
      success: true,
      message: 'Presupuesto convertido a venta exitosamente',
      data: {
        venta: resultado,
        presupuesto: {
          id: presupuesto.id,
          numero: presupuesto.numero,
          estado: 'CONVERTIDO'
        }
      }
    });
  } catch (error) {
    console.error('Error convirtiendo presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🗑️ ELIMINAR PRESUPUESTO
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

    const presupuesto = await prisma.presupuesto.findUnique({
      where: { id: req.params.id }
    });

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    if (presupuesto.estado === 'CONVERTIDO') {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un presupuesto ya convertido a venta'
      });
    }

    await prisma.presupuesto.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Presupuesto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando presupuesto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE PRESUPUESTOS
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
      porEstado,
      totalMonto,
      conversionRate
    ] = await Promise.all([
      prisma.presupuesto.count({ where }),
      prisma.presupuesto.groupBy({
        by: ['estado'],
        where,
        _count: true
      }),
      prisma.presupuesto.aggregate({
        where,
        _sum: {
          total: true
        }
      }),
      prisma.presupuesto.count({
        where: {
          ...where,
          estado: 'CONVERTIDO'
        }
      })
    ]);

    const tasaConversion = total > 0 ? (conversionRate / total * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        porEstado: porEstado.reduce((acc, item) => {
          acc[item.estado] = item._count;
          return acc;
        }, {}),
        montoTotal: totalMonto._sum.total || 0,
        tasaConversion: parseFloat(tasaConversion)
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