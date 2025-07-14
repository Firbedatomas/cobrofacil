import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Obtener todos los objetos decorativos
router.get('/', async (req, res) => {
  try {
    const { sectorId } = req.query;
    
    const whereClause = sectorId ? { sectorId } : {};

    const objetos = await prisma.objetoDecorativo.findMany({
      where: whereClause,
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    res.json(objetos);
  } catch (error) {
    console.error('Error al obtener objetos decorativos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo objeto decorativo
router.post('/', [
  body('nombre').notEmpty().trim().withMessage('El nombre del objeto es requerido'),
  body('sectorId').notEmpty().withMessage('El sector es requerido'),
  body('tipo').optional().isIn(['DECORATIVO', 'BARRA', 'ESCENARIO', 'BANO', 'COCINA', 'ENTRADA', 'SALIDA', 'OTROS']).withMessage('Tipo inválido'),
  body('posicionX').optional().isFloat().withMessage('La posición X debe ser un número'),
  body('posicionY').optional().isFloat().withMessage('La posición Y debe ser un número'),
  body('ancho').optional().isFloat({ min: 1 }).withMessage('El ancho debe ser un número positivo'),
  body('alto').optional().isFloat({ min: 1 }).withMessage('El alto debe ser un número positivo'),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('icono').optional().trim(),
  body('forma').optional().trim(),
  body('descripcion').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, sectorId, tipo, posicionX, posicionY, ancho, alto, color, icono, forma, descripcion } = req.body;
    const usuarioId = req.usuario.id;

    // Verificar si el sector existe
    const sectorExistente = await prisma.sector.findUnique({
      where: { id: sectorId }
    });

    if (!sectorExistente) {
      return res.status(400).json({ error: 'El sector especificado no existe' });
    }

    const nuevoObjeto = await prisma.objetoDecorativo.create({
      data: {
        nombre,
        sectorId,
        tipo: tipo || 'DECORATIVO',
        posicionX: posicionX || 0,
        posicionY: posicionY || 0,
        ancho: ancho || 50,
        alto: alto || 50,
        color,
        icono,
        forma,
        descripcion,
        usuarioId
      },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.status(201).json(nuevoObjeto);
  } catch (error) {
    console.error('Error al crear objeto decorativo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar objeto decorativo
router.put('/:id', [
  body('nombre').optional().notEmpty().trim().withMessage('El nombre del objeto no puede estar vacío'),
  body('sectorId').optional().notEmpty().withMessage('El sector no puede estar vacío'),
  body('tipo').optional().isIn(['DECORATIVO', 'BARRA', 'ESCENARIO', 'BANO', 'COCINA', 'ENTRADA', 'SALIDA', 'OTROS']).withMessage('Tipo inválido'),
  body('posicionX').optional().isFloat().withMessage('La posición X debe ser un número'),
  body('posicionY').optional().isFloat().withMessage('La posición Y debe ser un número'),
  body('ancho').optional().isFloat({ min: 1 }).withMessage('El ancho debe ser un número positivo'),
  body('alto').optional().isFloat({ min: 1 }).withMessage('El alto debe ser un número positivo'),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('icono').optional().trim(),
  body('forma').optional().trim(),
  body('descripcion').optional().trim(),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser un booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, sectorId, tipo, posicionX, posicionY, ancho, alto, color, icono, forma, descripcion, activo } = req.body;

    // Verificar si el objeto existe
    const objetoExistente = await prisma.objetoDecorativo.findUnique({
      where: { id }
    });

    if (!objetoExistente) {
      return res.status(404).json({ error: 'Objeto decorativo no encontrado' });
    }

    // Si se está cambiando el sector, verificar que existe
    if (sectorId && sectorId !== objetoExistente.sectorId) {
      const sectorExistente = await prisma.sector.findUnique({
        where: { id: sectorId }
      });

      if (!sectorExistente) {
        return res.status(400).json({ error: 'El sector especificado no existe' });
      }
    }

    const objetoActualizado = await prisma.objetoDecorativo.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(sectorId && { sectorId }),
        ...(tipo && { tipo }),
        ...(posicionX !== undefined && { posicionX }),
        ...(posicionY !== undefined && { posicionY }),
        ...(ancho !== undefined && { ancho }),
        ...(alto !== undefined && { alto }),
        ...(color !== undefined && { color }),
        ...(icono !== undefined && { icono }),
        ...(forma !== undefined && { forma }),
        ...(descripcion !== undefined && { descripcion }),
        ...(activo !== undefined && { activo })
      },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.json(objetoActualizado);
  } catch (error) {
    console.error('Error al actualizar objeto decorativo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar posición de objeto decorativo (para drag & drop)
router.patch('/:id/posicion', [
  body('posicionX').isFloat().withMessage('La posición X debe ser un número'),
  body('posicionY').isFloat().withMessage('La posición Y debe ser un número')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { posicionX, posicionY } = req.body;

    const objeto = await prisma.objetoDecorativo.findUnique({
      where: { id }
    });

    if (!objeto) {
      return res.status(404).json({ error: 'Objeto decorativo no encontrado' });
    }

    const objetoActualizado = await prisma.objetoDecorativo.update({
      where: { id },
      data: { posicionX, posicionY }
    });

    res.json(objetoActualizado);
  } catch (error) {
    console.error('Error al actualizar posición del objeto decorativo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar objeto decorativo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el objeto existe
    const objetoExistente = await prisma.objetoDecorativo.findUnique({
      where: { id }
    });

    if (!objetoExistente) {
      return res.status(404).json({ error: 'Objeto decorativo no encontrado' });
    }

    // Eliminar el objeto
    await prisma.objetoDecorativo.delete({
      where: { id }
    });

    res.json({ message: 'Objeto decorativo eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar objeto decorativo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 