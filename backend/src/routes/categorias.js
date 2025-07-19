import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarSupervisor } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionCategoria = [
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('descripcion')
    .optional()
    .trim()
];

// GET /api/categorias - Listar todas las categorías
router.get('/', verificarToken, async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activa: true },
      include: {
        _count: {
          select: {
            productos: {
              where: { activo: true }
            }
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.status(200).json({ categorias });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/categorias/:id - Obtener categoría por ID
router.get('/:id', verificarToken, [
  param('id').isLength({ min: 1 }).withMessage('ID de categoría inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de categoría inválido',
        detalles: errores.array()
      });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: req.params.id },
      include: {
        productos: {
          where: { activo: true },
          select: {
            id: true,
            codigo: true,
            nombre: true,
            precio: true,
            stock: true
          }
        }
      }
    });

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    res.status(200).json({ categoria });

  } catch (error) {
    console.error('Error obteniendo categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/categorias - Crear nueva categoría (requiere supervisor)
router.post('/', verificarToken, verificarSupervisor, validacionCategoria, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { nombre, descripcion } = req.body;

    // Verificar que el nombre no exista
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { 
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });

    if (categoriaExistente) {
      return res.status(409).json({
        error: 'Ya existe una categoría con este nombre'
      });
    }

    // Crear categoría
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        nombre,
        descripcion
      }
    });

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoria: nuevaCategoria
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/categorias/rapida - Crear categoría rápida (para uso en productos)
router.post('/rapida', verificarToken, validacionCategoria, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { nombre, descripcion } = req.body;

    // Verificar que el nombre no exista
    const categoriaExistente = await prisma.categoria.findFirst({
      where: { 
        nombre: {
          equals: nombre,
          mode: 'insensitive'
        }
      }
    });

    if (categoriaExistente) {
      return res.status(409).json({
        error: 'Ya existe una categoría con este nombre'
      });
    }

    // Crear categoría
    const nuevaCategoria = await prisma.categoria.create({
      data: {
        nombre,
        descripcion
      }
    });

    res.status(201).json({
      message: 'Categoría creada exitosamente',
      categoria: nuevaCategoria
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/categorias/:id - Actualizar categoría
router.put('/:id', verificarToken, verificarSupervisor, [
  param('id').isLength({ min: 1 }).withMessage('ID de categoría inválido'),
  ...validacionCategoria
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { nombre, descripcion } = req.body;

    // Verificar que la categoría existe
    const categoriaExistente = await prisma.categoria.findUnique({
      where: { id: req.params.id }
    });

    if (!categoriaExistente) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    // Verificar que el nombre no esté en uso por otra categoría
    if (nombre !== categoriaExistente.nombre) {
      const nombreEnUso = await prisma.categoria.findFirst({
        where: { 
          nombre: {
            equals: nombre,
            mode: 'insensitive'
          },
          id: {
            not: req.params.id
          }
        }
      });

      if (nombreEnUso) {
        return res.status(409).json({
          error: 'Ya existe una categoría con este nombre'
        });
      }
    }

    // Actualizar categoría
    const categoriaActualizada = await prisma.categoria.update({
      where: { id: req.params.id },
      data: {
        nombre,
        descripcion
      }
    });

    res.status(200).json({
      message: 'Categoría actualizada exitosamente',
      categoria: categoriaActualizada
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// DELETE /api/categorias/:id - Desactivar categoría
router.delete('/:id', verificarToken, verificarSupervisor, [
  param('id').isLength({ min: 1 }).withMessage('ID de categoría inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de categoría inválido',
        detalles: errores.array()
      });
    }

    const categoria = await prisma.categoria.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: {
            productos: {
              where: { activo: true }
            }
          }
        }
      }
    });

    if (!categoria) {
      return res.status(404).json({
        error: 'Categoría no encontrada'
      });
    }

    // Verificar que no tenga productos activos
    if (categoria._count.productos > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar una categoría que tiene productos activos'
      });
    }

    // Desactivar categoría
    await prisma.categoria.update({
      where: { id: req.params.id },
      data: { activa: false }
    });

    res.status(200).json({
      message: 'Categoría desactivada exitosamente'
    });

  } catch (error) {
    console.error('Error desactivando categoría:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

export default router; 