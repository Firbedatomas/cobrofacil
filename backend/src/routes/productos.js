import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarSupervisor } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionProducto = [
  body('codigo')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El código debe tener al menos 1 carácter'),
  body('nombre')
    .notEmpty()
    .trim()
    .isLength({ min: 1 })
    .withMessage('El nombre es requerido'),
  body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo o cero'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  body('stockMinimo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock mínimo debe ser un número entero positivo'),
  body('categoriaId')
    .notEmpty()
    .withMessage('La categoría es requerida'),
  body('descripcion')
    .optional()
    .trim()
];

// GET /api/productos - Listar productos con filtros y paginación
router.get('/', verificarToken, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('buscar')
    .optional()
    .trim(),
  query('categoria')
    .optional()
    .trim(),
  query('activo')
    .optional()
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso')
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
    const buscar = req.query.buscar;
    const categoria = req.query.categoria;
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;

    // Construir filtros
    const where = {};
    
    if (activo !== undefined) {
      where.activo = activo;
    }

    if (categoria) {
      where.categoriaId = categoria;
    }

    if (buscar) {
      where.OR = [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { codigo: { contains: buscar, mode: 'insensitive' } },
        { descripcion: { contains: buscar, mode: 'insensitive' } }
      ];
    }

    // Contar total de productos
    const total = await prisma.producto.count({ where });

    // Obtener productos paginados
    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      productos,
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
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Función para normalizar términos de búsqueda (eliminar acentos)
function normalizarTermino(termino) {
  return termino
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

// GET /api/productos/buscar-rapido - Búsqueda rápida de productos para POS
router.get('/buscar-rapido', verificarToken, [
  query('q')
    .isLength({ min: 2 })
    .withMessage('El término de búsqueda debe tener al menos 2 caracteres')
    .trim(),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe estar entre 1 y 50'),
  query('conStock')
    .optional()
    .isBoolean()
    .withMessage('El parámetro conStock debe ser verdadero o falso')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        detalles: errores.array()
      });
    }

    const termino = req.query.q;
    const limite = parseInt(req.query.limite) || 10;
    const conStock = req.query.conStock === 'true';

    // Normalizar término de búsqueda (eliminar acentos)
    const terminoNormalizado = termino
      .replace(/[áàäâ]/gi, 'a')
      .replace(/[éèëê]/gi, 'e')
      .replace(/[íìïî]/gi, 'i')
      .replace(/[óòöô]/gi, 'o')
      .replace(/[úùüû]/gi, 'u')
      .replace(/[ñ]/gi, 'n');

    // Construir filtros
    const where = {
      activo: true,
      OR: [
        // Búsqueda por código (original y normalizado)
        { codigo: { contains: termino, mode: 'insensitive' } },
        { codigo: { contains: terminoNormalizado, mode: 'insensitive' } },
        // Búsqueda por nombre (original y normalizado)
        { nombre: { contains: termino, mode: 'insensitive' } },
        { nombre: { contains: terminoNormalizado, mode: 'insensitive' } }
      ]
    };

    // Filtrar por stock > 0 si se especifica
    if (conStock) {
      where.stock = { gt: 0 };
    }

    // Buscar tanto con el término original como con el normalizado
    const productos = await prisma.producto.findMany({
      where,
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: [
        { codigo: 'asc' },
        { nombre: 'asc' }
      ],
      take: limite
    });

    // Formatear para respuesta de búsqueda rápida
    const productosFormateados = productos.map(producto => ({
      id: producto.id,
      codigo: producto.codigo,
      nombre: producto.nombre,
      precio: parseFloat(producto.precio),
      stock: producto.stock,
      categoria: producto.categoria.nombre,
      activo: producto.activo
    }));

    res.status(200).json({
      productos: productosFormateados,
      total: productosFormateados.length,
      termino: termino
    });

  } catch (error) {
    console.error('Error en búsqueda rápida de productos:', error);
    
    // Fallback a búsqueda simple si falla la búsqueda avanzada
    try {
      const productos = await prisma.producto.findMany({
        where: {
          activo: true,
          OR: [
            { codigo: { contains: termino, mode: 'insensitive' } },
            { nombre: { contains: termino, mode: 'insensitive' } }
          ]
        },
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true
            }
          }
        },
        orderBy: [
          { codigo: 'asc' },
          { nombre: 'asc' }
        ],
        take: limite
      });

      const productosFormateados = productos.map(producto => ({
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio: parseFloat(producto.precio),
        stock: producto.stock,
        categoria: producto.categoria.nombre,
        activo: producto.activo
      }));

      res.status(200).json({
        productos: productosFormateados,
        total: productosFormateados.length,
        termino: termino
      });
    } catch (fallbackError) {
      console.error('Error en búsqueda fallback:', fallbackError);
      res.status(500).json({
        error: 'Error interno del servidor'
      });
    }
  }
});

// GET /api/productos/stock/bajo - Productos con stock bajo
router.get('/stock/bajo', verificarToken, async (req, res) => {
  try {
    const productosStockBajo = await prisma.producto.findMany({
      where: {
        activo: true,
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    res.status(200).json({
      productos: productosStockBajo,
      total: productosStockBajo.length
    });

  } catch (error) {
    console.error('Error obteniendo productos con stock bajo:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/productos/:id - Obtener producto por ID
router.get('/:id', verificarToken, [
  param('id').isLength({ min: 1 }).withMessage('ID de producto inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de producto inválido',
        detalles: errores.array()
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true,
            descripcion: true
          }
        },
        movimientosStock: {
          orderBy: {
            fechaMovimiento: 'desc'
          },
          take: 10
        }
      }
    });

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    res.status(200).json({ producto });

  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/productos - Crear nuevo producto
router.post('/', verificarToken, validacionProducto, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { codigo, nombre, descripcion, precio = 0, stock = 0, stockMinimo = 5, categoriaId } = req.body;

    // Verificar que la categoría existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId, activa: true }
    });

    if (!categoria) {
      return res.status(400).json({
        error: 'Categoría no válida'
      });
    }

    // Generar código automáticamente si no se proporciona
    let codigoFinal = codigo;
    if (!codigoFinal) {
      // Obtener el último código para generar uno nuevo
      const ultimoProducto = await prisma.producto.findFirst({
        orderBy: { fechaCreacion: 'desc' },
        select: { codigo: true }
      });
      
      const numeroSiguiente = ultimoProducto ? 
        parseInt(ultimoProducto.codigo.replace(/\D/g, '')) + 1 : 1;
      
      codigoFinal = `P${String(numeroSiguiente).padStart(4, '0')}`;
    }

    // Verificar que el código no exista
    const productoExistente = await prisma.producto.findUnique({
      where: { codigo: codigoFinal }
    });

    if (productoExistente) {
      return res.status(409).json({
        error: 'Ya existe un producto con este código'
      });
    }

    // Crear producto en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear producto
      const nuevoProducto = await tx.producto.create({
        data: {
          codigo: codigoFinal,
          nombre,
          descripcion,
          precio,
          stock,
          stockMinimo,
          categoriaId
        },
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true
            }
          }
        }
      });

      // Crear movimiento de stock inicial si hay stock
      if (stock > 0) {
        await tx.movimientoStock.create({
          data: {
            productoId: nuevoProducto.id,
            tipo: 'ENTRADA',
            cantidad: stock,
            motivo: 'Stock inicial'
          }
        });
      }

      return nuevoProducto;
    });

    res.status(201).json({
      message: 'Producto creado exitosamente',
      producto: resultado
    });

  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/productos/:id - Actualizar producto
router.put('/:id', verificarToken, verificarSupervisor, [
  param('id').isLength({ min: 1 }).withMessage('ID de producto inválido'),
  ...validacionProducto
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { codigo, nombre, descripcion, precio, stockMinimo, categoriaId } = req.body;

    // Verificar que el producto existe
    const productoExistente = await prisma.producto.findUnique({
      where: { id: req.params.id }
    });

    if (!productoExistente) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Verificar que la categoría existe
    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId, activa: true }
    });

    if (!categoria) {
      return res.status(400).json({
        error: 'Categoría no válida'
      });
    }

    // Verificar que el código no esté en uso por otro producto
    if (codigo !== productoExistente.codigo) {
      const codigoEnUso = await prisma.producto.findUnique({
        where: { codigo }
      });

      if (codigoEnUso) {
        return res.status(409).json({
          error: 'Ya existe un producto con este código'
        });
      }
    }

    // Actualizar producto
    const productoActualizado = await prisma.producto.update({
      where: { id: req.params.id },
      data: {
        codigo,
        nombre,
        descripcion,
        precio,
        stockMinimo,
        categoriaId
      },
      include: {
        categoria: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    res.status(200).json({
      message: 'Producto actualizado exitosamente',
      producto: productoActualizado
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PATCH /api/productos/:id/stock - Ajustar stock de producto
router.patch('/:id/stock', verificarToken, verificarSupervisor, [
  param('id').isLength({ min: 1 }).withMessage('ID de producto inválido'),
  body('cantidad')
    .isInt()
    .withMessage('La cantidad debe ser un número entero'),
  body('tipo')
    .isIn(['ENTRADA', 'SALIDA', 'AJUSTE'])
    .withMessage('Tipo de movimiento inválido'),
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

    const { cantidad, tipo, motivo } = req.body;

    // Verificar que el producto existe
    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id }
    });

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Calcular nuevo stock
    let nuevoStock = producto.stock;
    if (tipo === 'ENTRADA' || tipo === 'AJUSTE') {
      nuevoStock += Math.abs(cantidad);
    } else if (tipo === 'SALIDA') {
      nuevoStock -= Math.abs(cantidad);
    }

    if (nuevoStock < 0) {
      return res.status(400).json({
        error: 'No hay suficiente stock disponible'
      });
    }

    // Actualizar stock en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar stock del producto
      const productoActualizado = await tx.producto.update({
        where: { id: req.params.id },
        data: { stock: nuevoStock }
      });

      // Crear movimiento de stock
      const movimiento = await tx.movimientoStock.create({
        data: {
          productoId: req.params.id,
          tipo,
          cantidad: Math.abs(cantidad),
          motivo
        }
      });

      return { producto: productoActualizado, movimiento };
    });

    res.status(200).json({
      message: 'Stock actualizado exitosamente',
      producto: resultado.producto,
      movimiento: resultado.movimiento
    });

  } catch (error) {
    console.error('Error actualizando stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/productos/:id - Desactivar producto (soft delete)
router.delete('/:id', verificarToken, verificarSupervisor, [
  param('id').isLength({ min: 1 }).withMessage('ID de producto inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de producto inválido',
        detalles: errores.array()
      });
    }

    const producto = await prisma.producto.findUnique({
      where: { id: req.params.id }
    });

    if (!producto) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    // Desactivar producto
    await prisma.producto.update({
      where: { id: req.params.id },
      data: { activo: false }
    });

    res.status(200).json({
      message: 'Producto desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error desactivando producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

export default router; 