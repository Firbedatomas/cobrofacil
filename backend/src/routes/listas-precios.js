import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarRol } from '../middleware/auth.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Validaciones
const validacionListaPrecio = [
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('descripcion').optional().isString().trim(),
  body('descuentoGeneral').optional().isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('moneda').optional().isIn(['ARS', 'USD', 'EUR']),
  body('precios').optional().isArray(),
  body('precios.*.productoId').isString(),
  body('precios.*.precio').isDecimal({ decimal_digits: '0,2' }).toFloat(),
  body('precios.*.descuento').optional().isDecimal({ decimal_digits: '0,2' }).toFloat()
];

const validacionAsignacionCliente = [
  body('clienteId').isString().withMessage('El cliente es requerido'),
  body('listaPrecioId').isString().withMessage('La lista de precios es requerida')
];

// 📋 LISTAR LISTAS DE PRECIOS
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      activa, 
      moneda, 
      busqueda,
      ordenPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};
    
    if (activa !== undefined) where.activa = activa === 'true';
    if (moneda) where.moneda = moneda;
    
    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } }
      ];
    }

    // Construir ordenamiento
    const orderBy = {};
    orderBy[ordenPor] = orden;

    const [listasPrecios, total] = await Promise.all([
      prisma.listaPrecio.findMany({
        where,
        skip,
        take,
        include: {
          usuario: {
            select: { nombre: true, apellido: true }
          },
          _count: {
            select: { 
              precios: true,
              clientesAsignados: true
            }
          }
        },
        orderBy
      }),
      prisma.listaPrecio.count({ where })
    ]);

    res.json({
      success: true,
      data: listasPrecios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listando listas de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📄 OBTENER LISTA DE PRECIOS POR ID
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

    const listaPrecio = await prisma.listaPrecio.findUnique({
      where: { id: req.params.id },
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        },
        precios: {
          include: {
            producto: {
              include: {
                categoria: true
              }
            }
          }
        },
        clientesAsignados: {
          include: {
            cliente: true
          },
          where: { activa: true }
        }
      }
    });

    if (!listaPrecio) {
      return res.status(404).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    res.json({
      success: true,
      data: listaPrecio
    });
  } catch (error) {
    console.error('Error obteniendo lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ CREAR LISTA DE PRECIOS
router.post('/', validacionListaPrecio, async (req, res) => {
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
      descuentoGeneral = 0,
      moneda = 'ARS',
      precios = []
    } = req.body;

    // Verificar que no exista una lista con el mismo nombre
    const listaExistente = await prisma.listaPrecio.findUnique({
      where: { nombre }
    });
    if (listaExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una lista de precios con este nombre'
      });
    }

    // Validar productos si se especifican precios
    if (precios.length > 0) {
      const productosIds = precios.map(p => p.productoId);
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

    // Crear lista de precios
    const listaPrecio = await prisma.listaPrecio.create({
      data: {
        nombre,
        descripcion,
        descuentoGeneral,
        moneda,
        usuarioId: req.usuario.id,
        precios: {
          create: precios.map(precio => ({
            productoId: precio.productoId,
            precio: precio.precio,
            descuento: precio.descuento || 0
          }))
        }
      },
      include: {
        precios: {
          include: {
            producto: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lista de precios creada exitosamente',
      data: listaPrecio
    });
  } catch (error) {
    console.error('Error creando lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✏️ ACTUALIZAR LISTA DE PRECIOS
router.put('/:id', [
  param('id').isString(),
  ...validacionListaPrecio
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

    const listaExistente = await prisma.listaPrecio.findUnique({
      where: { id: req.params.id }
    });

    if (!listaExistente) {
      return res.status(404).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    const {
      nombre,
      descripcion,
      descuentoGeneral,
      moneda,
      precios = []
    } = req.body;

    // Verificar nombre único
    if (nombre !== listaExistente.nombre) {
      const nombreExistente = await prisma.listaPrecio.findFirst({
        where: { 
          nombre,
          id: { not: req.params.id }
        }
      });
      if (nombreExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra lista de precios con este nombre'
        });
      }
    }

    // Validar productos
    if (precios.length > 0) {
      const productosIds = precios.map(p => p.productoId);
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

    // Actualizar lista de precios
    const listaPrecio = await prisma.listaPrecio.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion,
        descuentoGeneral,
        moneda,
        precios: {
          deleteMany: {},
          create: precios.map(precio => ({
            productoId: precio.productoId,
            precio: precio.precio,
            descuento: precio.descuento || 0
          }))
        }
      },
      include: {
        precios: {
          include: {
            producto: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Lista de precios actualizada exitosamente',
      data: listaPrecio
    });
  } catch (error) {
    console.error('Error actualizando lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 ACTIVAR/DESACTIVAR LISTA DE PRECIOS
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

    const listaPrecio = await prisma.listaPrecio.findUnique({
      where: { id: req.params.id }
    });

    if (!listaPrecio) {
      return res.status(404).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    const listaActualizada = await prisma.listaPrecio.update({
      where: { id: req.params.id },
      data: { activa: req.body.activa }
    });

    res.json({
      success: true,
      message: `Lista de precios ${req.body.activa ? 'activada' : 'desactivada'} exitosamente`,
      data: listaActualizada
    });
  } catch (error) {
    console.error('Error cambiando estado de lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 👥 ASIGNAR LISTA DE PRECIOS A CLIENTE
router.post('/asignar-cliente', validacionAsignacionCliente, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { clienteId, listaPrecioId } = req.body;

    // Verificar que existan el cliente y la lista
    const [cliente, listaPrecio] = await Promise.all([
      prisma.cliente.findUnique({ where: { id: clienteId } }),
      prisma.listaPrecio.findUnique({ where: { id: listaPrecioId } })
    ]);

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    if (!listaPrecio) {
      return res.status(400).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    // Verificar si ya está asignada
    const asignacionExistente = await prisma.listaPrecioCliente.findFirst({
      where: {
        clienteId,
        listaPrecioId,
        activa: true
      }
    });

    if (asignacionExistente) {
      return res.status(400).json({
        success: false,
        message: 'El cliente ya tiene asignada esta lista de precios'
      });
    }

    // Desactivar otras asignaciones del cliente si existe alguna activa
    await prisma.listaPrecioCliente.updateMany({
      where: {
        clienteId,
        activa: true
      },
      data: {
        activa: false
      }
    });

    // Crear nueva asignación
    const asignacion = await prisma.listaPrecioCliente.create({
      data: {
        clienteId,
        listaPrecioId
      },
      include: {
        cliente: true,
        listaPrecio: true
      }
    });

    res.json({
      success: true,
      message: 'Lista de precios asignada exitosamente al cliente',
      data: asignacion
    });
  } catch (error) {
    console.error('Error asignando lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🔄 CAMBIAR ASIGNACIÓN DE CLIENTE
router.patch('/asignacion/:id/estado', [
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

    const asignacion = await prisma.listaPrecioCliente.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        listaPrecio: true
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    const asignacionActualizada = await prisma.listaPrecioCliente.update({
      where: { id: req.params.id },
      data: { activa: req.body.activa },
      include: {
        cliente: true,
        listaPrecio: true
      }
    });

    res.json({
      success: true,
      message: `Asignación ${req.body.activa ? 'activada' : 'desactivada'} exitosamente`,
      data: asignacionActualizada
    });
  } catch (error) {
    console.error('Error cambiando estado de asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 💰 OBTENER PRECIO DE PRODUCTO PARA CLIENTE
router.get('/precio/:clienteId/:productoId', [
  param('clienteId').isString(),
  param('productoId').isString()
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

    const { clienteId, productoId } = req.params;

    // Obtener el producto base
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
      include: {
        categoria: true
      }
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Obtener asignación activa del cliente
    const asignacion = await prisma.listaPrecioCliente.findFirst({
      where: {
        clienteId,
        activa: true
      },
      include: {
        listaPrecio: {
          include: {
            precios: {
              where: {
                productoId
              }
            }
          }
        }
      }
    });

    let precioFinal = producto.precio;
    let descuentoAplicado = 0;
    let listaPrecioUsada = null;
    let origen = 'PRECIO_BASE';

    if (asignacion && asignacion.listaPrecio.activa) {
      listaPrecioUsada = asignacion.listaPrecio;
      
      // Verificar si hay precio específico para el producto
      const precioEspecifico = asignacion.listaPrecio.precios[0];
      
      if (precioEspecifico) {
        // Usar precio específico
        precioFinal = precioEspecifico.precio;
        descuentoAplicado = precioEspecifico.descuento;
        origen = 'PRECIO_ESPECIFICO';
      } else {
        // Aplicar descuento general de la lista
        descuentoAplicado = asignacion.listaPrecio.descuentoGeneral;
        precioFinal = producto.precio * (1 - descuentoAplicado / 100);
        origen = 'DESCUENTO_GENERAL';
      }
    }

    res.json({
      success: true,
      data: {
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          precioBase: producto.precio,
          categoria: producto.categoria
        },
        precioFinal: parseFloat(precioFinal.toFixed(2)),
        descuentoAplicado,
        origen,
        listaPrecio: listaPrecioUsada ? {
          id: listaPrecioUsada.id,
          nombre: listaPrecioUsada.nombre,
          moneda: listaPrecioUsada.moneda
        } : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo precio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 OBTENER PRECIOS MASIVOS PARA CLIENTE
router.post('/precios-masivos', [
  body('clienteId').isString(),
  body('productosIds').isArray({ min: 1 }),
  body('productosIds.*').isString()
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

    const { clienteId, productosIds } = req.body;

    // Obtener productos
    const productos = await prisma.producto.findMany({
      where: { id: { in: productosIds } },
      include: {
        categoria: true
      }
    });

    // Obtener asignación del cliente
    const asignacion = await prisma.listaPrecioCliente.findFirst({
      where: {
        clienteId,
        activa: true
      },
      include: {
        listaPrecio: {
          include: {
            precios: {
              where: {
                productoId: { in: productosIds }
              }
            }
          }
        }
      }
    });

    const precios = productos.map(producto => {
      let precioFinal = producto.precio;
      let descuentoAplicado = 0;
      let origen = 'PRECIO_BASE';

      if (asignacion && asignacion.listaPrecio.activa) {
        // Buscar precio específico
        const precioEspecifico = asignacion.listaPrecio.precios.find(
          p => p.productoId === producto.id
        );

        if (precioEspecifico) {
          precioFinal = precioEspecifico.precio;
          descuentoAplicado = precioEspecifico.descuento;
          origen = 'PRECIO_ESPECIFICO';
        } else {
          // Aplicar descuento general
          descuentoAplicado = asignacion.listaPrecio.descuentoGeneral;
          precioFinal = producto.precio * (1 - descuentoAplicado / 100);
          origen = 'DESCUENTO_GENERAL';
        }
      }

      return {
        producto: {
          id: producto.id,
          nombre: producto.nombre,
          precioBase: producto.precio,
          categoria: producto.categoria
        },
        precioFinal: parseFloat(precioFinal.toFixed(2)),
        descuentoAplicado,
        origen
      };
    });

    res.json({
      success: true,
      data: {
        precios,
        listaPrecio: asignacion ? {
          id: asignacion.listaPrecio.id,
          nombre: asignacion.listaPrecio.nombre,
          moneda: asignacion.listaPrecio.moneda
        } : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo precios masivos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📦 COPIAR LISTA DE PRECIOS
router.post('/:id/copiar', [
  param('id').isString(),
  body('nuevoNombre').isLength({ min: 2 }).trim(),
  body('descripcion').optional().isString().trim()
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

    const listaOriginal = await prisma.listaPrecio.findUnique({
      where: { id: req.params.id },
      include: {
        precios: true
      }
    });

    if (!listaOriginal) {
      return res.status(404).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    const { nuevoNombre, descripcion } = req.body;

    // Verificar nombre único
    const nombreExistente = await prisma.listaPrecio.findUnique({
      where: { nombre: nuevoNombre }
    });
    if (nombreExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una lista de precios con este nombre'
      });
    }

    // Copiar lista
    const nuevaLista = await prisma.listaPrecio.create({
      data: {
        nombre: nuevoNombre,
        descripcion: descripcion || `Copia de ${listaOriginal.nombre}`,
        descuentoGeneral: listaOriginal.descuentoGeneral,
        moneda: listaOriginal.moneda,
        usuarioId: req.usuario.id,
        precios: {
          create: listaOriginal.precios.map(precio => ({
            productoId: precio.productoId,
            precio: precio.precio,
            descuento: precio.descuento
          }))
        }
      },
      include: {
        precios: {
          include: {
            producto: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Lista de precios copiada exitosamente',
      data: nuevaLista
    });
  } catch (error) {
    console.error('Error copiando lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 🗑️ ELIMINAR LISTA DE PRECIOS
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

    const listaPrecio = await prisma.listaPrecio.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { clientesAsignados: true }
        }
      }
    });

    if (!listaPrecio) {
      return res.status(404).json({
        success: false,
        message: 'Lista de precios no encontrada'
      });
    }

    // Verificar si tiene clientes asignados
    if (listaPrecio._count.clientesAsignados > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la lista porque tiene clientes asignados. Desactívela en su lugar.'
      });
    }

    await prisma.listaPrecio.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Lista de precios eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando lista de precios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📊 ESTADÍSTICAS DE LISTAS DE PRECIOS
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
      porMoneda,
      clientesConListas,
      productosMasUsados
    ] = await Promise.all([
      prisma.listaPrecio.count({ where }),
      prisma.listaPrecio.count({ where: { ...where, activa: true } }),
      prisma.listaPrecio.groupBy({
        by: ['moneda'],
        where,
        _count: true
      }),
      prisma.listaPrecioCliente.count({
        where: { activa: true }
      }),
      prisma.precioProducto.groupBy({
        by: ['productoId'],
        _count: true,
        orderBy: {
          _count: {
            productoId: 'desc'
          }
        },
        take: 10
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        activas,
        inactivas: total - activas,
        porMoneda: porMoneda.reduce((acc, item) => {
          acc[item.moneda] = item._count;
          return acc;
        }, {}),
        clientesConListas,
        productosMasUsados
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