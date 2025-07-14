import express from 'express';
import { body, validationResult, param, query } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionUsuario = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('apellido')
    .isLength({ min: 2 })
    .withMessage('El apellido debe tener al menos 2 caracteres')
    .trim(),
  body('rol')
    .optional()
    .isIn(['ADMIN', 'SUPERVISOR', 'CAJERO', 'MOZO'])
    .withMessage('Rol inválido')
];

// GET /api/usuarios - Listar usuarios (solo admins)
router.get('/', verificarToken, verificarAdmin, [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100'),
  query('activo')
    .optional()
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso'),
  query('rol')
    .optional()
    .isIn(['ADMIN', 'SUPERVISOR', 'CAJERO', 'MOZO'])
    .withMessage('Rol inválido')
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
    const activo = req.query.activo !== undefined ? req.query.activo === 'true' : undefined;
    const rol = req.query.rol;

    // Construir filtros
    const where = {};
    if (activo !== undefined) where.activo = activo;
    if (rol) where.rol = rol;

    // Contar total de usuarios
    const total = await prisma.usuario.count({ where });

    // Obtener usuarios paginados
    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        fechaCreacion: true,
        fechaActualizacion: true,
        _count: {
          select: {
            ventasRealizadas: {
              where: {
                estado: 'COMPLETADA'
              }
            }
          }
        }
      },
      orderBy: {
        fechaCreacion: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      usuarios,
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
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/usuarios/:id - Obtener usuario por ID (solo admins)
router.get('/:id', verificarToken, verificarAdmin, [
  param('id').isLength({ min: 1 }).withMessage('ID de usuario inválido')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'ID de usuario inválido',
        detalles: errores.array()
      });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        fechaCreacion: true,
        fechaActualizacion: true,
        ventasRealizadas: {
          where: {
            estado: 'COMPLETADA'
          },
          select: {
            id: true,
            numeroVenta: true,
            total: true,
            fechaVenta: true
          },
          orderBy: {
            fechaVenta: 'desc'
          },
          take: 10
        }
      }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({ usuario });

  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/usuarios/:id - Actualizar usuario (solo admins)
router.put('/:id', verificarToken, verificarAdmin, [
  param('id').isLength({ min: 1 }).withMessage('ID de usuario inválido'),
  ...validacionUsuario
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { email, nombre, apellido, rol } = req.body;

    // Verificar que el usuario existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: req.params.id }
    });

    if (!usuarioExistente) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // No permitir que el usuario se quite el rol de admin a sí mismo
    if (req.usuarioId === req.params.id && req.usuario.rol === 'ADMIN' && rol !== 'ADMIN') {
      return res.status(400).json({
        error: 'No puedes quitarte el rol de administrador a ti mismo'
      });
    }

    // Verificar que el email no esté en uso por otro usuario
    if (email !== usuarioExistente.email) {
      const emailEnUso = await prisma.usuario.findUnique({
        where: { email }
      });

      if (emailEnUso) {
        return res.status(409).json({
          error: 'Ya existe un usuario con este email'
        });
      }
    }

    // Actualizar usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: {
        email,
        nombre,
        apellido,
        rol: rol || usuarioExistente.rol
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        fechaCreacion: true,
        fechaActualizacion: true
      }
    });

    res.status(200).json({
      message: 'Usuario actualizado exitosamente',
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PATCH /api/usuarios/:id/estado - Activar/Desactivar usuario (solo admins)
router.patch('/:id/estado', verificarToken, verificarAdmin, [
  param('id').isLength({ min: 1 }).withMessage('ID de usuario inválido'),
  body('activo')
    .isBoolean()
    .withMessage('El estado activo debe ser verdadero o falso')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { activo } = req.body;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // No permitir que el usuario se desactive a sí mismo
    if (req.usuarioId === req.params.id && !activo) {
      return res.status(400).json({
        error: 'No puedes desactivarte a ti mismo'
      });
    }

    // Actualizar estado del usuario
    const usuarioActualizado = await prisma.usuario.update({
      where: { id: req.params.id },
      data: { activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true
      }
    });

    // Si se desactiva el usuario, invalidar todas sus sesiones
    if (!activo) {
      await prisma.sesionUsuario.updateMany({
        where: {
          usuarioId: req.params.id,
          activa: true
        },
        data: {
          activa: false,
          fechaFin: new Date()
        }
      });
    }

    res.status(200).json({
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: usuarioActualizado
    });

  } catch (error) {
    console.error('Error actualizando estado del usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// PATCH /api/usuarios/:id/password - Cambiar contraseña de otro usuario (solo admins)
router.patch('/:id/password', verificarToken, verificarAdmin, [
  param('id').isLength({ min: 1 }).withMessage('ID de usuario inválido'),
  body('nuevaPassword')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { nuevaPassword } = req.body;

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.id }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: req.params.id },
      data: { password: passwordHash }
    });

    // Invalidar todas las sesiones del usuario
    await prisma.sesionUsuario.updateMany({
      where: {
        usuarioId: req.params.id,
        activa: true
      },
      data: {
        activa: false,
        fechaFin: new Date()
      }
    });

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/usuarios/estadisticas/general - Estadísticas generales de usuarios
router.get('/estadisticas/general', verificarToken, verificarAdmin, async (req, res) => {
  try {
    // Contar usuarios por rol
    const usuariosPorRol = await prisma.usuario.groupBy({
      by: ['rol'],
      where: { activo: true },
      _count: {
        id: true
      }
    });

    // Contar usuarios activos vs inactivos
    const estadoUsuarios = await prisma.usuario.groupBy({
      by: ['activo'],
      _count: {
        id: true
      }
    });

    // Obtener usuarios más activos (por número de ventas)
    const usuariosActivos = await prisma.usuario.findMany({
      where: { 
        activo: true,
        rol: {
          in: ['CAJERO', 'SUPERVISOR']
        }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        rol: true,
        _count: {
          select: {
            ventasRealizadas: {
              where: {
                estado: 'COMPLETADA',
                fechaVenta: {
                  gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Mes actual
                }
              }
            }
          }
        }
      },
      orderBy: {
        ventasRealizadas: {
          _count: 'desc'
        }
      },
      take: 5
    });

    res.status(200).json({
      usuariosPorRol,
      estadoUsuarios,
      usuariosActivos
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

export default router; 