import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionVenta = [
  body('productos')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('productos.*.productoId')
    .isLength({ min: 1 })
    .withMessage('ID de producto requerido'),
  body('productos.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero positivo'),
  body('productos.*.precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('metodoPago')
    .isIn(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR_MERCADOPAGO'])
    .withMessage('Método de pago inválido'),
  body('descuento')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El descuento debe ser un número positivo')
];

// Función para generar número de venta único
const generarNumeroVenta = async () => {
  const fecha = new Date();
  const year = fecha.getFullYear().toString().slice(-2);
  const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const day = fecha.getDate().toString().padStart(2, '0');
  
  // Buscar el último número de venta del día
  const ultimaVenta = await prisma.venta.findFirst({
    where: {
      numeroVenta: {
        startsWith: `${year}${month}${day}`
      }
    },
    orderBy: {
      numeroVenta: 'desc'
    }
  });

  let secuencial = 1;
  if (ultimaVenta) {
    const ultimoSecuencial = parseInt(ultimaVenta.numeroVenta.slice(-4));
    secuencial = ultimoSecuencial + 1;
  }

  return `${year}${month}${day}${secuencial.toString().padStart(4, '0')}`;
};

// GET /api/ventas - Listar ventas con filtros y paginación
router.get('/', verificarToken, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta inválida'),
  query('metodoPago')
    .optional()
    .isIn(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR_MERCADOPAGO'])
    .withMessage('Método de pago inválido'),
  query('estado')
    .optional()
    .isIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA', 'DEVUELTA'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        detalles: errores.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const fechaDesde = req.query.fechaDesde;
    const fechaHasta = req.query.fechaHasta;
    const metodoPago = req.query.metodoPago;
    const estado = req.query.estado;

    // Construir filtros
    const where = {};

    if (fechaDesde || fechaHasta) {
      where.fechaVenta = {};
      if (fechaDesde) where.fechaVenta.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaVenta.lte = new Date(fechaHasta);
    }

    if (metodoPago) where.metodoPago = metodoPago;
    if (estado) where.estado = estado;

    // Contar total de ventas
    const total = await prisma.venta.count({ where });

    // Obtener ventas paginadas
    const ventas = await prisma.venta.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      ventas,
      paginacion: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo ventas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/ventas/:id - Obtener venta por ID
router.get('/:id', verificarToken, [
  param('id').isLength({ min: 1 }).withMessage('ID de venta inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de venta inválido',
        detalles: errores.array()
      });
    }

    const venta = await prisma.venta.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                descripcion: true,
                categoria: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    res.status(200).json({ venta });

  } catch (error) {
    console.error('Error obteniendo venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/ventas - Crear nueva venta
router.post('/', verificarToken, validacionVenta, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { productos, metodoPago, descuento = 0 } = req.body;

    // Procesar venta en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar stock y obtener productos
      const productosValidados = [];
      let subtotal = 0;

      for (const item of productos) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId, activo: true }
        });

        if (!producto) {
          throw new Error(`Producto ${item.productoId} no encontrado o inactivo`);
        }

        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
        }

        const subtotalItem = item.cantidad * item.precio;
        subtotal += subtotalItem;

        productosValidados.push({
          producto,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: subtotalItem
        });
      }

      // Calcular totales
      const impuesto = 0; // Se puede configurar según necesidades
      const total = subtotal + impuesto - descuento;

      // Generar número de venta
      const numeroVenta = await generarNumeroVenta();

      // Crear venta
      const nuevaVenta = await tx.venta.create({
        data: {
          numeroVenta,
          total,
          subtotal,
          impuesto,
          descuento,
          metodoPago,
          usuarioId: req.usuarioId
        }
      });

      // Crear detalles de venta y actualizar stock
      for (const item of productosValidados) {
        // Crear detalle de venta
        await tx.detalleVenta.create({
          data: {
            ventaId: nuevaVenta.id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.subtotal
          }
        });

        // Actualizar stock del producto
        await tx.producto.update({
          where: { id: item.producto.id },
          data: {
            stock: {
              decrement: item.cantidad
            }
          }
        });

        // Registrar movimiento de stock
        await tx.movimientoStock.create({
          data: {
            productoId: item.producto.id,
            tipo: 'VENTA',
            cantidad: item.cantidad,
            motivo: `Venta #${numeroVenta}`
          }
        });
      }

      return nuevaVenta;
    });

    // Obtener venta completa para la respuesta
    const ventaCompleta = await prisma.venta.findUnique({
      where: { id: resultado.id },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        detalles: {
          include: {
            producto: {
              select: {
                codigo: true,
                nombre: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Venta registrada exitosamente',
      venta: ventaCompleta
    });

  } catch (error) {
    console.error('Error creando venta:', error);
    
    if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
      return res.status(400).json({
        error: error.message
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/ventas/mesa - Crear nueva venta para mesa (sin método de pago)
router.post('/mesa', verificarToken, [
  body('mesaId').isString().notEmpty().withMessage('ID de mesa requerido'),
  body('productos').optional().isArray().withMessage('Productos debe ser un array'),
  body('productos.*.productoId').isString().withMessage('ID de producto requerido'),
  body('productos.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('productos.*.precio').isFloat({ min: 0 }).withMessage('Precio debe ser mayor o igual a 0'),
  body('descuento').optional().isFloat({ min: 0 }).withMessage('Descuento debe ser mayor o igual a 0'),
  body('clienteId').optional().isString().withMessage('ID de cliente debe ser string'),
  body('observaciones').optional().isString().withMessage('Observaciones debe ser string')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { mesaId, productos = [], descuento = 0, clienteId, observaciones } = req.body;

    // Verificar que la mesa existe
    const mesa = await prisma.mesa.findUnique({
      where: { id: mesaId }
    });

    if (!mesa) {
      return res.status(404).json({
        success: false,
        error: 'Mesa no encontrada'
      });
    }

    // Verificar si ya existe una venta activa para esta mesa
    const ventaExistente = await prisma.venta.findFirst({
      where: {
        mesaId,
        estado: 'PENDIENTE'
      }
    });

    if (ventaExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una venta activa para esta mesa',
        data: {
          ventaId: ventaExistente.id,
          numeroVenta: ventaExistente.numeroVenta
        }
      });
    }

    // Procesar venta en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Verificar stock y obtener productos si se proporcionaron
      const productosValidados = [];
      let subtotal = 0;

      for (const item of productos) {
        const producto = await tx.producto.findUnique({
          where: { id: item.productoId, activo: true }
        });

        if (!producto) {
          throw new Error(`Producto ${item.productoId} no encontrado o inactivo`);
        }

        if (producto.stock < item.cantidad) {
          throw new Error(`Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`);
        }

        const subtotalItem = item.cantidad * item.precio;
        subtotal += subtotalItem;

        productosValidados.push({
          producto,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: subtotalItem
        });
      }

      // Calcular totales
      const impuesto = 0; // Se puede configurar según necesidades
      const total = subtotal + impuesto - descuento;

      // Generar número de venta
      const numeroVenta = await generarNumeroVenta();

      // Crear venta SIN método de pago (para mesa)
      const nuevaVenta = await tx.venta.create({
        data: {
          numeroVenta,
          total,
          subtotal,
          impuesto,
          descuento,
          mesaId,
          clienteId,
          observaciones,
          usuarioId: req.usuarioId,
          estado: 'PENDIENTE'
        }
      });

      // Crear detalles de la venta
      const detallesVenta = [];
      for (const item of productosValidados) {
        const detalle = await tx.detalleVenta.create({
          data: {
            ventaId: nuevaVenta.id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
            subtotal: item.subtotal
          }
        });
        
        detallesVenta.push(detalle);

        // Actualizar stock del producto
        await tx.producto.update({
          where: { id: item.producto.id },
          data: {
            stock: {
              decrement: item.cantidad
            }
          }
        });
      }

      return {
        venta: nuevaVenta,
        detalles: detallesVenta
      };
    });

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Venta de mesa creada exitosamente',
      data: {
        ventaId: resultado.venta.id,
        numeroVenta: resultado.venta.numeroVenta,
        mesaId: resultado.venta.mesaId,
        total: resultado.venta.total,
        subtotal: resultado.venta.subtotal,
        estado: resultado.venta.estado,
        detalles: resultado.detalles,
        fechaCreacion: resultado.venta.fechaVenta
      }
    });

  } catch (error) {
    console.error('❌ Error creando venta de mesa:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al crear venta de mesa',
      message: error.message
    });
  }
});

// POST /api/ventas/:ventaId/facturar - Procesar facturación de una venta (TICKET sin fiscal)
router.post('/:ventaId/facturar', verificarToken, [
  param('ventaId').isString().withMessage('ID de venta requerido'),
  body('tipoComprobante').isIn(['TICKET', 'FACTURA_A', 'FACTURA_B']).withMessage('Tipo de comprobante inválido'),
  body('formasPago').isArray({ min: 1 }).withMessage('Debe especificar al menos una forma de pago'),
  body('formasPago.*.metodo').isIn(['efectivo', 'tarjeta', 'qr', 'transferencia']).withMessage('Método de pago inválido'),
  body('formasPago.*.monto').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { ventaId } = req.params;
    const { tipoComprobante, formasPago, datosCliente } = req.body;

    console.log('🎫 Procesando facturación:', { ventaId, tipoComprobante, formasPago });

    // Buscar la venta
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        detalles: {
          include: {
            producto: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    // Validar que la venta no haya sido ya facturada
    if (venta.cae || venta.numeroComprobante) {
      return res.status(400).json({
        error: 'Esta venta ya fue facturada'
      });
    }

    // Validar que el total de las formas de pago coincida con el total de la venta
    const totalPagos = formasPago.reduce((sum, pago) => sum + pago.monto, 0);
    if (Math.abs(totalPagos - venta.total) > 0.01) {
      return res.status(400).json({
        error: `El total de los pagos ($${totalPagos}) debe coincidir con el total de la venta ($${venta.total})`
      });
    }

    // Procesar la facturación en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Para TICKET (sin fiscal), generar número interno
      let numeroComprobante = null;
      let cae = null;
      
      if (tipoComprobante === 'TICKET') {
        // Generar número de ticket interno
        const fecha = new Date();
        const year = fecha.getFullYear().toString().slice(-2);
        const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
        const day = fecha.getDate().toString().padStart(2, '0');
        
        // Buscar el último ticket del día
        const ultimoTicket = await tx.venta.findFirst({
          where: {
            tipoComprobante: 'TICKET_NO_FISCAL',
            numeroComprobante: {
              startsWith: `TK${year}${month}${day}`
            }
          },
          orderBy: {
            numeroComprobante: 'desc'
          }
        });

        let secuencial = 1;
        if (ultimoTicket && ultimoTicket.numeroComprobante) {
          const ultimoSecuencial = parseInt(ultimoTicket.numeroComprobante.slice(-4));
          secuencial = ultimoSecuencial + 1;
        }

        numeroComprobante = `TK${year}${month}${day}${secuencial.toString().padStart(4, '0')}`;
        cae = `INT-${Date.now()}`; // CAE interno para tickets
      }

      // Actualizar la venta con datos de facturación
      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          tipoComprobante: tipoComprobante === 'TICKET' ? 'TICKET_NO_FISCAL' : tipoComprobante,
          numeroComprobante,
          cae,
          estado: 'COMPLETADA'
        }
      });

      // 🏦 ACTUALIZAR CAJA - Registrar movimientos por cada forma de pago
      const turnoActivo = await tx.turno.findFirst({
        where: {
          estado: 'ABIERTO',
          caja: 'PRINCIPAL'
        }
      });

      if (!turnoActivo) {
        throw new Error('No hay un turno de caja abierto. Debe abrir la caja antes de procesar ventas.');
      }

      // Registrar movimiento de caja para cada forma de pago
      for (const pago of formasPago) {
        await tx.movimientoCaja.create({
          data: {
            turnoId: turnoActivo.id,
            tipo: 'VENTA',
            concepto: `Venta ${venta.numeroVenta} - ${pago.metodo.toUpperCase()}`,
            monto: pago.monto,
            metodoPago: pago.metodo.toUpperCase(),
            usuarioId: req.usuarioId,
            tipoComprobante: tipoComprobante === 'TICKET' ? 'TICKET_NO_FISCAL' : tipoComprobante,
            numeroComprobante,
            cae,
            ventaId: venta.id
          }
        });
      }

      console.log('✅ Facturación procesada exitosamente:', {
        numeroComprobante,
        tipoComprobante,
        total: venta.total,
        formasPago: formasPago.length
      });

      return {
        venta: ventaActualizada,
        numeroComprobante,
        cae,
        formasPago,
        totalMovimientosCaja: formasPago.length
      };
    });

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: `${tipoComprobante} emitido exitosamente`,
      data: {
        ventaId: venta.id,
        numeroVenta: venta.numeroVenta,
        numeroComprobante: resultado.numeroComprobante,
        cae: resultado.cae,
        tipoComprobante,
        total: venta.total,
        formasPago: resultado.formasPago,
        fechaEmision: new Date(),
        cajasActualizadas: resultado.totalMovimientosCaja
      }
    });

  } catch (error) {
    console.error('❌ Error procesando facturación:', error);
    
    if (error.message.includes('turno de caja')) {
      return res.status(400).json({
        error: error.message
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor al procesar la facturación'
    });
  }
});

// PATCH /api/ventas/:id/cancelar - Cancelar venta
router.patch('/:id/cancelar', verificarToken, [
  param('id').isLength({ min: 1 }).withMessage('ID de venta inválido'),
  body('motivo')
    .isLength({ min: 3 })
    .withMessage('El motivo debe tener al menos 3 caracteres')
    .trim()
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { motivo } = req.body;

    // Verificar que la venta existe y está completada
    const venta = await prisma.venta.findUnique({
      where: { id: req.params.id },
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    if (venta.estado !== 'COMPLETADA') {
      return res.status(400).json({
        error: 'Solo se pueden cancelar ventas completadas'
      });
    }

    // Cancelar venta y restaurar stock en una transacción
    await prisma.$transaction(async (tx) => {
      // Actualizar estado de la venta
      await tx.venta.update({
        where: { id: req.params.id },
        data: { estado: 'CANCELADA' }
      });

      // Restaurar stock de todos los productos
      for (const detalle of venta.detalles) {
        await tx.producto.update({
          where: { id: detalle.productoId },
          data: {
            stock: {
              increment: detalle.cantidad
            }
          }
        });

        // Registrar movimiento de stock
        await tx.movimientoStock.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'DEVOLUCION',
            cantidad: detalle.cantidad,
            motivo: `Cancelación venta #${venta.numeroVenta}: ${motivo}`
          }
        });
      }
    });

    res.status(200).json({
      message: 'Venta cancelada exitosamente'
    });

  } catch (error) {
    console.error('Error cancelando venta:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/ventas/resumen/diario - Resumen de ventas del día
router.get('/resumen/diario', verificarToken, async (req, res) => {
  try {
    const fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);
    
    const fechaFin = new Date();
    fechaFin.setHours(23, 59, 59, 999);

    // Obtener resumen de ventas del día
    const resumen = await prisma.venta.aggregate({
      where: {
        fechaVenta: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: 'COMPLETADA'
      },
      _sum: {
        total: true,
        subtotal: true,
        descuento: true
      },
      _count: {
        id: true
      }
    });

    // Obtener ventas por método de pago
    const ventasPorMetodo = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where: {
        fechaVenta: {
          gte: fechaInicio,
          lte: fechaFin
        },
        estado: 'COMPLETADA'
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      fecha: new Date().toISOString().split('T')[0],
      totalVentas: resumen._count.id || 0,
      totalIngresos: resumen._sum.total || 0,
      totalSubtotal: resumen._sum.subtotal || 0,
      totalDescuentos: resumen._sum.descuento || 0,
      ventasPorMetodo
    });

  } catch (error) {
    console.error('Error obteniendo resumen diario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/ventas/:ventaId/productos - Agregar producto a venta existente
router.post('/:ventaId/productos', verificarToken, [
  param('ventaId').isString().notEmpty().withMessage('ID de venta requerido'),
  body('productoId').isString().notEmpty().withMessage('ID de producto requerido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('precio').isFloat({ min: 0 }).withMessage('Precio debe ser mayor o igual a 0'),
  body('observaciones').optional().isString().withMessage('Observaciones debe ser string')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { ventaId } = req.params;
    const { productoId, cantidad, precio, observaciones } = req.body;

    // Verificar que la venta existe y está pendiente
    const venta = await prisma.venta.findUnique({
      where: { id: ventaId },
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'Venta no encontrada'
      });
    }

    if (venta.estado !== 'PENDIENTE') {
      return res.status(400).json({
        success: false,
        error: 'No se pueden agregar productos a una venta que no está pendiente'
      });
    }

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: productoId, activo: true }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        error: 'Producto no encontrado o inactivo'
      });
    }

    // Verificar stock
    if (producto.stock < cantidad) {
      return res.status(400).json({
        success: false,
        error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`
      });
    }

    // Procesar en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Buscar si ya existe el producto en la venta
      const detalleExistente = await tx.detalleVenta.findFirst({
        where: {
          ventaId,
          productoId,
          observaciones: observaciones || null
        }
      });

      let detalleActualizado;
      if (detalleExistente) {
        // Actualizar cantidad del producto existente
        detalleActualizado = await tx.detalleVenta.update({
          where: { id: detalleExistente.id },
          data: {
            cantidad: detalleExistente.cantidad + cantidad,
            subtotal: (detalleExistente.cantidad + cantidad) * precio
          }
        });
      } else {
        // Crear nuevo detalle
        detalleActualizado = await tx.detalleVenta.create({
          data: {
            ventaId,
            productoId,
            cantidad,
            precioUnitario: precio,
            subtotal: cantidad * precio,
            observaciones
          }
        });
      }

      // Actualizar stock del producto
      await tx.producto.update({
        where: { id: productoId },
        data: {
          stock: {
            decrement: cantidad
          }
        }
      });

      // Recalcular totales de la venta
      const totalDetalles = await tx.detalleVenta.aggregate({
        where: { ventaId },
        _sum: {
          subtotal: true
        }
      });

      const nuevoSubtotal = totalDetalles._sum.subtotal || 0;
      const nuevoTotal = nuevoSubtotal + (venta.impuesto || 0) - (venta.descuento || 0);

      // Actualizar totales de la venta
      const ventaActualizada = await tx.venta.update({
        where: { id: ventaId },
        data: {
          subtotal: nuevoSubtotal,
          total: nuevoTotal
        }
      });

      return {
        venta: ventaActualizada,
        detalle: detalleActualizado
      };
    });

    res.status(200).json({
      success: true,
      message: 'Producto agregado exitosamente',
      data: {
        ventaId: resultado.venta.id,
        total: resultado.venta.total,
        subtotal: resultado.venta.subtotal,
        detalleAgregado: resultado.detalle
      }
    });

  } catch (error) {
    console.error('❌ Error agregando producto a venta:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al agregar producto',
      message: error.message
    });
  }
});

// GET /api/ventas/mesa/:mesaId - Obtener venta activa de una mesa
router.get('/mesa/:mesaId', verificarToken, [
  param('mesaId').isString().notEmpty().withMessage('ID de mesa requerido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { mesaId } = req.params;

    // Buscar venta activa de la mesa
    const venta = await prisma.venta.findFirst({
      where: {
        mesaId,
        estado: 'PENDIENTE'
      },
      include: {
        detalles: {
          include: {
            producto: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                precio: true
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true
          }
        }
      }
    });

    if (!venta) {
      return res.status(404).json({
        success: false,
        error: 'No hay venta activa para esta mesa'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ventaId: venta.id,
        numeroVenta: venta.numeroVenta,
        mesaId: venta.mesaId,
        mesa: venta.mesa,
        total: venta.total,
        subtotal: venta.subtotal,
        impuesto: venta.impuesto,
        descuento: venta.descuento,
        estado: venta.estado,
        fechaCreacion: venta.fechaVenta,
        usuario: venta.usuario,
        cliente: venta.cliente,
        observaciones: venta.observaciones,
        detalles: venta.detalles.map(detalle => ({
          id: detalle.id,
          productoId: detalle.productoId,
          producto: detalle.producto,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          subtotal: detalle.subtotal,
          observaciones: detalle.observaciones
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo venta de mesa:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor al obtener venta de mesa',
      message: error.message
    });
  }
});

export default router; 