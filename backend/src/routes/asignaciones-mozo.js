import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, param, validationResult } from 'express-validator';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ==========================================
// 🎯 RUTAS DE ASIGNACIONES MOZO-MESA
// ==========================================
// Criterios obligatorios:
// 1. Persistencia inmediata del mozo vinculado a la mesa
// 2. Validación estricta de datos
// 3. Trazabilidad completa de asignaciones
// 4. Solo una asignación activa por mesa
// ==========================================

// POST /api/asignaciones-mozo - Asignar mozo a mesa
router.post('/', verificarToken, [
  body('mesaId').isString().notEmpty().withMessage('ID de mesa requerido'),
  body('mozoId').isString().notEmpty().withMessage('ID de mozo requerido'),
  body('observaciones').optional().isString().withMessage('Observaciones deben ser texto')
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

    const { mesaId, mozoId, observaciones } = req.body;
    const asignadoPorId = req.usuarioId;

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

    // Verificar que el mozo existe y tiene rol MOZO
    const mozo = await prisma.usuario.findUnique({
      where: { id: mozoId }
    });

    if (!mozo || mozo.rol !== 'MOZO') {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado o no tiene rol de mozo'
      });
    }

    // Verificar que no hay asignación activa para esta mesa
    const asignacionExistente = await prisma.asignacionMozo.findFirst({
      where: {
        mesaId,
        activa: true
      }
    });

    if (asignacionExistente) {
      return res.status(400).json({
        success: false,
        error: 'Ya existe una asignación activa para esta mesa',
        asignacionExistente: {
          id: asignacionExistente.id,
          mozoId: asignacionExistente.mozoId
        }
      });
    }

    // Crear nueva asignación
    const nuevaAsignacion = await prisma.asignacionMozo.create({
      data: {
        mesaId,
        mozoId,
        asignadoPorId,
        observaciones,
        activa: true
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true
          }
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        asignadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    console.log('✅ Asignación mozo-mesa creada:', {
      mesa: mesa.numero,
      mozo: `${mozo.nombre} ${mozo.apellido}`,
      asignadoPor: asignadoPorId
    });

    res.status(201).json({
      success: true,
      message: 'Mozo asignado exitosamente',
      data: nuevaAsignacion
    });

  } catch (error) {
    console.error('❌ Error asignando mozo a mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/asignaciones-mozo/mesa/:mesaId - Obtener asignación activa de una mesa
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

    const asignacion = await prisma.asignacionMozo.findFirst({
      where: {
        mesaId,
        activa: true
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true
          }
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        asignadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: 'No hay asignación activa para esta mesa'
      });
    }

    res.json({
      success: true,
      data: asignacion
    });

  } catch (error) {
    console.error('❌ Error obteniendo asignación de mesa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/asignaciones-mozo/:id/liberar - Liberar asignación de mozo
router.put('/:id/liberar', verificarToken, [
  param('id').isString().notEmpty().withMessage('ID de asignación requerido'),
  body('observaciones').optional().isString().withMessage('Observaciones deben ser texto')
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

    const { id } = req.params;
    const { observaciones } = req.body;

    const asignacion = await prisma.asignacionMozo.findUnique({
      where: { id },
      include: {
        mesa: true,
        mozo: true
      }
    });

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: 'Asignación no encontrada'
      });
    }

    if (!asignacion.activa) {
      return res.status(400).json({
        success: false,
        error: 'Asignación ya está liberada'
      });
    }

    // Liberar asignación
    const asignacionLiberada = await prisma.asignacionMozo.update({
      where: { id },
      data: {
        activa: false,
        fechaLiberacion: new Date(),
        observaciones: observaciones || asignacion.observaciones
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true
          }
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    console.log('✅ Asignación liberada:', {
      mesa: asignacion.mesa.numero,
      mozo: `${asignacion.mozo.nombre} ${asignacion.mozo.apellido}`
    });

    res.json({
      success: true,
      message: 'Asignación liberada exitosamente',
      data: asignacionLiberada
    });

  } catch (error) {
    console.error('❌ Error liberando asignación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/asignaciones-mozo/mesa/:mesaId/cambiar - Cambiar mozo de una mesa
router.put('/mesa/:mesaId/cambiar', verificarToken, [
  param('mesaId').isString().notEmpty().withMessage('ID de mesa requerido'),
  body('nuevoMozoId').isString().notEmpty().withMessage('ID del nuevo mozo requerido'),
  body('observaciones').optional().isString().withMessage('Observaciones deben ser texto')
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
    const { nuevoMozoId, observaciones } = req.body;
    const asignadoPorId = req.usuarioId;

    // Verificar que el nuevo mozo existe y tiene rol MOZO
    const nuevoMozo = await prisma.usuario.findUnique({
      where: { id: nuevoMozoId }
    });

    if (!nuevoMozo || nuevoMozo.rol !== 'MOZO') {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado o no tiene rol de mozo'
      });
    }

    // Usar transacción para liberar asignación anterior y crear nueva
    const resultado = await prisma.$transaction(async (tx) => {
      // Liberar asignación anterior
      const asignacionAnterior = await tx.asignacionMozo.findFirst({
        where: {
          mesaId,
          activa: true
        }
      });

      if (asignacionAnterior) {
        await tx.asignacionMozo.update({
          where: { id: asignacionAnterior.id },
          data: {
            activa: false,
            fechaLiberacion: new Date(),
            observaciones: `Cambio de mozo: ${observaciones || 'Sin observaciones'}`
          }
        });
      }

      // Crear nueva asignación
      const nuevaAsignacion = await tx.asignacionMozo.create({
        data: {
          mesaId,
          mozoId: nuevoMozoId,
          asignadoPorId,
          observaciones: observaciones || 'Cambio de mozo',
          activa: true
        },
        include: {
          mesa: {
            select: {
              id: true,
              numero: true,
              estado: true
            }
          },
          mozo: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true
            }
          },
          asignadoPor: {
            select: {
              id: true,
              nombre: true,
              apellido: true
            }
          }
        }
      });

      return nuevaAsignacion;
    });

    console.log('✅ Mozo cambiado exitosamente:', {
      mesa: resultado.mesa.numero,
      nuevoMozo: `${resultado.mozo.nombre} ${resultado.mozo.apellido}`
    });

    res.json({
      success: true,
      message: 'Mozo cambiado exitosamente',
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error cambiando mozo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/asignaciones-mozo/mozo/:mozoId - Obtener asignaciones activas de un mozo
router.get('/mozo/:mozoId', verificarToken, [
  param('mozoId').isString().notEmpty().withMessage('ID de mozo requerido')
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

    const { mozoId } = req.params;

    const asignaciones = await prisma.asignacionMozo.findMany({
      where: {
        mozoId,
        activa: true
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true,
            capacidad: true
          }
        }
      },
      orderBy: {
        fechaAsignacion: 'desc'
      }
    });

    res.json({
      success: true,
      data: asignaciones
    });

  } catch (error) {
    console.error('❌ Error obteniendo asignaciones de mozo:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/asignaciones-mozo - Obtener todas las asignaciones activas
router.get('/', verificarToken, async (req, res) => {
  try {
    const asignaciones = await prisma.asignacionMozo.findMany({
      where: {
        activa: true
      },
      include: {
        mesa: {
          select: {
            id: true,
            numero: true,
            estado: true,
            capacidad: true
          }
        },
        mozo: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        asignadoPor: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaAsignacion: 'desc'
      }
    });

    res.json({
      success: true,
      data: asignaciones
    });

  } catch (error) {
    console.error('❌ Error obteniendo asignaciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router; 