import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Obtener todos los sectores
router.get('/', async (req, res) => {
  try {
    console.log('🏢 Obteniendo sectores para usuario:', req.usuario?.id);
    
    const sectores = await prisma.sector.findMany({
      include: {
        mesas: {
          select: {
            id: true,
            numero: true,
            estado: true,
            capacidad: true,
            posicionX: true,
            posicionY: true,
            color: true,
            forma: true,
            size: true
          }
        },
        objetosDecorativos: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            posicionX: true,
            posicionY: true,
            ancho: true,
            alto: true,
            color: true,
            icono: true
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
        orden: 'asc'
      }
    });

    console.log(`✅ Sectores obtenidos: ${sectores.length}`);
    res.json(sectores);
  } catch (error) {
    console.error('❌ Error al obtener sectores:', error);
    
    // Respuesta de error más específica
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Conflicto de datos único',
        details: 'Ya existe un registro con esos datos' 
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Registro no encontrado',
        details: 'No se encontró el registro solicitado' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error procesando la solicitud'
    });
  }
});

// Obtener un sector específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        mesas: {
          include: {
            ventas: {
              where: {
                estado: 'COMPLETADA'
              },
              take: 1,
              orderBy: {
                fechaVenta: 'desc'
              }
            }
          }
        },
        objetosDecorativos: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    if (!sector) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    res.json(sector);
  } catch (error) {
    console.error('Error al obtener sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nuevo sector
router.post('/', [
  body('nombre').notEmpty().trim().withMessage('El nombre del sector es requerido'),
  body('descripcion').optional().trim(),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('icono').optional().trim(),
  body('orden').optional().isInt({ min: 0 }).withMessage('El orden debe ser un número entero positivo')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, descripcion, color, icono, orden } = req.body;
    const usuarioId = req.usuario.id;

    // Verificar si ya existe un sector con ese nombre
    const sectorExistente = await prisma.sector.findUnique({
      where: { nombre }
    });

    if (sectorExistente) {
      return res.status(400).json({ error: 'Ya existe un sector con ese nombre' });
    }

    // Si no se especifica orden, usar el siguiente disponible
    let ordenFinal = orden;
    if (ordenFinal === undefined) {
      const ultimoSector = await prisma.sector.findFirst({
        orderBy: { orden: 'desc' }
      });
      ordenFinal = ultimoSector ? ultimoSector.orden + 1 : 0;
    }

    const nuevoSector = await prisma.sector.create({
      data: {
        nombre,
        descripcion,
        color,
        icono,
        orden: ordenFinal,
        usuarioId
      },
      include: {
        mesas: true,
        objetosDecorativos: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.status(201).json(nuevoSector);
  } catch (error) {
    console.error('Error al crear sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar sector
router.put('/:id', [
  body('nombre').optional().notEmpty().trim().withMessage('El nombre del sector no puede estar vacío'),
  body('descripcion').optional().trim(),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('icono').optional().trim(),
  body('orden').optional().isInt({ min: 0 }).withMessage('El orden debe ser un número entero positivo'),
  body('activo').optional().isBoolean().withMessage('El campo activo debe ser un booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nombre, descripcion, color, icono, orden, activo } = req.body;

    // Verificar si el sector existe
    const sectorExistente = await prisma.sector.findUnique({
      where: { id }
    });

    if (!sectorExistente) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Si se está cambiando el nombre, verificar que no exista otro sector con ese nombre
    if (nombre && nombre !== sectorExistente.nombre) {
      const sectorConMismoNombre = await prisma.sector.findUnique({
        where: { nombre }
      });

      if (sectorConMismoNombre) {
        return res.status(400).json({ error: 'Ya existe un sector con ese nombre' });
      }
    }

    const sectorActualizado = await prisma.sector.update({
      where: { id },
      data: {
        ...(nombre && { nombre }),
        ...(descripcion !== undefined && { descripcion }),
        ...(color && { color }),
        ...(icono !== undefined && { icono }),
        ...(orden !== undefined && { orden }),
        ...(activo !== undefined && { activo })
      },
      include: {
        mesas: true,
        objetosDecorativos: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    });

    res.json(sectorActualizado);
  } catch (error) {
    console.error('Error al actualizar sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar sector
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el sector existe
    const sectorExistente = await prisma.sector.findUnique({
      where: { id },
      include: {
        mesas: true,
        objetosDecorativos: true
      }
    });

    if (!sectorExistente) {
      return res.status(404).json({ error: 'Sector no encontrado' });
    }

    // Verificar si tiene mesas asociadas
    if (sectorExistente.mesas.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el sector porque tiene mesas asociadas' 
      });
    }

    // Eliminar objetos decorativos primero
    await prisma.objetoDecorativo.deleteMany({
      where: { sectorId: id }
    });

    // Eliminar el sector
    await prisma.sector.delete({
      where: { id }
    });

    res.json({ message: 'Sector eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar sector:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Reordenar sectores
router.patch('/reordenar', [
  body('sectores').isArray().withMessage('Se requiere un array de sectores'),
  body('sectores.*.id').notEmpty().withMessage('Cada sector debe tener un ID'),
  body('sectores.*.orden').isInt({ min: 0 }).withMessage('Cada sector debe tener un orden válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sectores } = req.body;

    // Actualizar el orden de cada sector
    const actualizaciones = sectores.map(sector => 
      prisma.sector.update({
        where: { id: sector.id },
        data: { orden: sector.orden }
      })
    );

    await Promise.all(actualizaciones);

    res.json({ message: 'Sectores reordenados exitosamente' });
  } catch (error) {
    console.error('Error al reordenar sectores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 