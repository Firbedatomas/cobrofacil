import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { 
  validarIdentificadorMesa, 
  obtenerColorPorEstado, 
  estadosMesa 
} from '../utils/validarIdentificadorMesa.js';

const router = express.Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticación a todas las rutas
router.use(verificarToken);

// Obtener todas las mesas
router.get('/', async (req, res) => {
  try {
    const { sectorId } = req.query;
    
    const whereClause = sectorId ? { sectorId } : {};

    const mesas = await prisma.mesa.findMany({
      where: whereClause,
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        },
        ventas: {
          where: {
            estado: {
              in: ['PENDIENTE', 'COMPLETADA']
            }
          },
          orderBy: {
            fechaVenta: 'desc'
          },
          take: 1,
          include: {
            detalles: {
              include: {
                producto: true
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
        }
      },
      orderBy: {
        numero: 'asc'
      }
    });

    res.json(mesas);
  } catch (error) {
    console.error('Error al obtener mesas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una mesa específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await prisma.mesa.findUnique({
      where: { id },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        },
        ventas: {
          where: {
            estado: {
              in: ['PENDIENTE', 'COMPLETADA']
            }
          },
          orderBy: {
            fechaVenta: 'desc'
          },
          include: {
            detalles: {
              include: {
                producto: true
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
        }
      }
    });

    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    res.json(mesa);
  } catch (error) {
    console.error('Error al obtener mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear nueva mesa
router.post('/', [
  body('numero').notEmpty().trim().withMessage('El número de mesa es requerido'),
  body('sectorId').notEmpty().withMessage('El sector es requerido'),
  body('capacidad').isInt({ min: 1 }).withMessage('La capacidad debe ser un número entero mayor a 0'),
  body('forma').optional().isIn(['REDONDA', 'CUADRADA', 'RECTANGULAR', 'OVALADA']).withMessage('Forma inválida'),
  body('posicionX').optional().isFloat().withMessage('La posición X debe ser un número'),
  body('posicionY').optional().isFloat().withMessage('La posición Y debe ser un número'),
  body('size').optional().isInt({ min: 20, max: 200 }).withMessage('El tamaño debe ser un número entero entre 20 y 200'),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('observaciones').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { numero, sectorId, capacidad, forma, posicionX, posicionY, size, color, observaciones } = req.body;
    const usuarioId = req.usuario.id;

    // ✅ VALIDAR IDENTIFICADOR DE MESA
    const validacionIdentificador = validarIdentificadorMesa(numero);
    if (!validacionIdentificador.valido) {
      return res.status(400).json({ 
        error: validacionIdentificador.error,
        criterios: {
          maxCaracteres: 4,
          formato: 'Hasta 2 letras + hasta 2 números',
          ejemplos: ['A01', 'B12', 'AA12', 'M5']
        }
      });
    }

    // Usar el identificador normalizado (mayúsculas)
    const numeroNormalizado = validacionIdentificador.identificadorNormalizado;

    // Verificar si el sector existe
    const sectorExistente = await prisma.sector.findUnique({
      where: { id: sectorId }
    });

    if (!sectorExistente) {
      return res.status(400).json({ error: 'El sector especificado no existe' });
    }

    // Verificar si ya existe una mesa con ese número en el sector
    const mesaExistente = await prisma.mesa.findFirst({
      where: {
        numero: numeroNormalizado,
        sectorId
      }
    });

    if (mesaExistente) {
      return res.status(400).json({ error: 'Ya existe una mesa con ese número en el sector' });
    }

    // Determinar color según estado (verde para LIBRE)
    const colorFinal = color || obtenerColorPorEstado('LIBRE');

    const nuevaMesa = await prisma.mesa.create({
      data: {
        numero: numeroNormalizado,
        sectorId,
        capacidad,
        forma: forma || 'REDONDA',
        posicionX: posicionX || 0,
        posicionY: posicionY || 0,
        size: size || 50,
        color: colorFinal,
        observaciones,
        estado: 'LIBRE', // ✅ Verde: Mesa vacía, sin ítems ni facturación
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

    res.status(201).json({
      ...nuevaMesa,
      estadoInfo: estadosMesa[nuevaMesa.estado]
    });
  } catch (error) {
    console.error('Error al crear mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar mesa
router.put('/:id', [
  body('numero').optional().notEmpty().trim().withMessage('El número de mesa no puede estar vacío'),
  body('sectorId').optional().notEmpty().withMessage('El sector no puede estar vacío'),
  body('capacidad').optional().isInt({ min: 1 }).withMessage('La capacidad debe ser un número entero mayor a 0'),
  body('forma').optional().isIn(['REDONDA', 'CUADRADA', 'RECTANGULAR', 'OVALADA']).withMessage('Forma inválida'),
  body('posicionX').optional().isFloat().withMessage('La posición X debe ser un número'),
  body('posicionY').optional().isFloat().withMessage('La posición Y debe ser un número'),
  body('size').optional().isInt({ min: 20, max: 200 }).withMessage('El tamaño debe ser un número entero entre 20 y 200'),
  body('color').optional().isHexColor().withMessage('El color debe ser un valor hexadecimal válido'),
  body('observaciones').optional().trim(),
  body('activa').optional().isBoolean().withMessage('El campo activa debe ser un booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { numero, sectorId, capacidad, forma, posicionX, posicionY, size, color, observaciones, activa } = req.body;

    // ✅ VALIDAR IDENTIFICADOR DE MESA SI SE ESTÁ CAMBIANDO
    let numeroNormalizado = numero;
    if (numero) {
      const validacionIdentificador = validarIdentificadorMesa(numero);
      if (!validacionIdentificador.valido) {
        return res.status(400).json({ 
          error: validacionIdentificador.error,
          criterios: {
            maxCaracteres: 4,
            formato: 'Hasta 2 letras + hasta 2 números',
            ejemplos: ['A01', 'B12', 'AA12', 'M5']
          }
        });
      }
      numeroNormalizado = validacionIdentificador.identificadorNormalizado;
    }

    // Verificar si la mesa existe
    const mesaExistente = await prisma.mesa.findUnique({
      where: { id }
    });

    if (!mesaExistente) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    // Si se está cambiando el sector, verificar que existe
    if (sectorId && sectorId !== mesaExistente.sectorId) {
      const sectorExistente = await prisma.sector.findUnique({
        where: { id: sectorId }
      });

      if (!sectorExistente) {
        return res.status(400).json({ error: 'El sector especificado no existe' });
      }
    }

    // Si se está cambiando el número, verificar que no exista otra mesa con ese número en el sector
    if (numeroNormalizado && (numeroNormalizado !== mesaExistente.numero || sectorId !== mesaExistente.sectorId)) {
      const mesaConMismoNumero = await prisma.mesa.findFirst({
        where: {
          numero: numeroNormalizado,
          sectorId: sectorId || mesaExistente.sectorId,
          id: { not: id }
        }
      });

      if (mesaConMismoNumero) {
        return res.status(400).json({ error: 'Ya existe una mesa con ese número en el sector' });
      }
    }

    const mesaActualizada = await prisma.mesa.update({
      where: { id },
      data: {
        ...(numeroNormalizado && { numero: numeroNormalizado }),
        ...(sectorId && { sectorId }),
        ...(capacidad !== undefined && { capacidad }),
        ...(forma && { forma }),
        ...(posicionX !== undefined && { posicionX }),
        ...(posicionY !== undefined && { posicionY }),
        ...(size !== undefined && { size }),
        ...(color !== undefined && { color }),
        ...(observaciones !== undefined && { observaciones }),
        ...(activa !== undefined && { activa })
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

    res.json(mesaActualizada);
  } catch (error) {
    console.error('Error al actualizar mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Cambiar estado de mesa
router.patch('/:id/estado', [
  body('estado').isIn(['LIBRE', 'OCUPADA', 'ESPERANDO_PEDIDO', 'CUENTA_PEDIDA', 'RESERVADA', 'FUERA_DE_SERVICIO']).withMessage('Estado inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { estado } = req.body;

    const mesa = await prisma.mesa.findUnique({
      where: { id }
    });

    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    // ✅ ACTUALIZAR COLOR SEGÚN ESTADO
    const colorPorEstado = obtenerColorPorEstado(estado);
    
    const mesaActualizada = await prisma.mesa.update({
      where: { id },
      data: { 
        estado,
        color: colorPorEstado // Actualizar color según estado
      },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true,
            color: true
          }
        }
      }
    });

    res.json({
      ...mesaActualizada,
      estadoInfo: estadosMesa[mesaActualizada.estado]
    });
  } catch (error) {
    console.error('Error al cambiar estado de mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar posición de mesa (para drag & drop)
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

    const mesa = await prisma.mesa.findUnique({
      where: { id }
    });

    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const mesaActualizada = await prisma.mesa.update({
      where: { id },
      data: { posicionX, posicionY }
    });

    res.json(mesaActualizada);
  } catch (error) {
    console.error('Error al actualizar posición de mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar mesa
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si la mesa existe
    const mesaExistente = await prisma.mesa.findUnique({
      where: { id },
      include: {
        ventas: {
          where: {
            estado: {
              in: ['PENDIENTE', 'COMPLETADA']
            }
          }
        }
      }
    });

    if (!mesaExistente) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    // Verificar si tiene ventas asociadas
    if (mesaExistente.ventas.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar la mesa porque tiene ventas asociadas' 
      });
    }

    // Eliminar la mesa
    await prisma.mesa.delete({
      where: { id }
    });

    res.json({ message: 'Mesa eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar mesa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener venta activa de una mesa
router.get('/:id/venta-activa', async (req, res) => {
  try {
    const { id } = req.params;

    const mesa = await prisma.mesa.findUnique({
      where: { id }
    });

    if (!mesa) {
      return res.status(404).json({ error: 'Mesa no encontrada' });
    }

    const ventaActiva = await prisma.venta.findFirst({
      where: {
        mesaId: id,
        estado: 'PENDIENTE'
      },
      include: {
        detalles: {
          include: {
            producto: true
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
        fechaVenta: 'desc'
      }
    });

    res.json(ventaActiva);
  } catch (error) {
    console.error('Error al obtener venta activa:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Transferir ítems entre mesas
router.post('/:id/transferir', [
  body('mesaDestinoId').notEmpty().withMessage('La mesa destino es requerida'),
  body('itemsIds').optional().isArray().withMessage('Los ítems deben ser un array'),
  body('transferirTodos').optional().isBoolean().withMessage('TransferirTodos debe ser un booleano')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: mesaOrigenId } = req.params;
    const { mesaDestinoId, itemsIds, transferirTodos = true } = req.body;
    const usuarioId = req.usuario.id;

    // Verificar que las mesas existen
    const [mesaOrigen, mesaDestino] = await Promise.all([
      prisma.mesa.findUnique({ where: { id: mesaOrigenId } }),
      prisma.mesa.findUnique({ where: { id: mesaDestinoId } })
    ]);

    if (!mesaOrigen) {
      return res.status(404).json({ error: 'Mesa origen no encontrada' });
    }

    if (!mesaDestino) {
      return res.status(404).json({ error: 'Mesa destino no encontrada' });
    }

    if (mesaOrigenId === mesaDestinoId) {
      return res.status(400).json({ error: 'No se puede transferir a la misma mesa' });
    }

    // Obtener venta activa de la mesa origen
    const ventaOrigen = await prisma.venta.findFirst({
      where: {
        mesaId: mesaOrigenId,
        estado: 'PENDIENTE'
      },
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    if (!ventaOrigen) {
      return res.status(404).json({ error: 'No hay venta activa en la mesa origen' });
    }

    // Obtener o crear venta en mesa destino
    let ventaDestino = await prisma.venta.findFirst({
      where: {
        mesaId: mesaDestinoId,
        estado: 'PENDIENTE'
      },
      include: {
        detalles: true
      }
    });

    if (!ventaDestino) {
      // Crear nueva venta en mesa destino
      const numeroVenta = `V-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      ventaDestino = await prisma.venta.create({
        data: {
          numeroVenta,
          mesaId: mesaDestinoId,
          usuarioId,
          total: 0,
          subtotal: 0,
          metodoPago: 'EFECTIVO',
          estado: 'PENDIENTE'
        },
        include: {
          detalles: true
        }
      });
    }

    // Determinar qué ítems transferir
    let itemsATransferir = ventaOrigen.detalles;
    
    if (!transferirTodos && itemsIds && itemsIds.length > 0) {
      itemsATransferir = ventaOrigen.detalles.filter(detalle => 
        itemsIds.includes(detalle.id)
      );
    }

    if (itemsATransferir.length === 0) {
      return res.status(400).json({ error: 'No hay ítems para transferir' });
    }

    // Usar transacción para garantizar consistencia
    const resultado = await prisma.$transaction(async (prisma) => {
      // Transferir ítems
      const itemsTransferidos = [];
      
      for (const item of itemsATransferir) {
        // Verificar si el producto ya existe en la venta destino
        const itemExistente = await prisma.detalleVenta.findFirst({
          where: {
            ventaId: ventaDestino.id,
            productoId: item.productoId
          }
        });

        if (itemExistente) {
          // Actualizar cantidad del item existente
          const itemActualizado = await prisma.detalleVenta.update({
            where: { id: itemExistente.id },
            data: {
              cantidad: itemExistente.cantidad + item.cantidad,
              subtotal: (itemExistente.cantidad + item.cantidad) * item.precioUnitario
            }
          });
          itemsTransferidos.push(itemActualizado);
        } else {
          // Crear nuevo item en venta destino
          const nuevoItem = await prisma.detalleVenta.create({
            data: {
              ventaId: ventaDestino.id,
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: item.precioUnitario,
              subtotal: item.subtotal
            }
          });
          itemsTransferidos.push(nuevoItem);
        }

        // Eliminar item de venta origen
        await prisma.detalleVenta.delete({
          where: { id: item.id }
        });
      }

      // Recalcular totales de venta origen
      const itemsRestantesOrigen = await prisma.detalleVenta.findMany({
        where: { ventaId: ventaOrigen.id }
      });

      const totalOrigen = itemsRestantesOrigen.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      
      if (itemsRestantesOrigen.length === 0) {
        // Si no quedan ítems, eliminar la venta y cambiar estado de mesa a LIBRE
        await prisma.venta.delete({
          where: { id: ventaOrigen.id }
        });
        await prisma.mesa.update({
          where: { id: mesaOrigenId },
          data: { estado: 'LIBRE' }
        });
      } else {
        // Actualizar totales de venta origen
        await prisma.venta.update({
          where: { id: ventaOrigen.id },
          data: {
            subtotal: totalOrigen,
            total: totalOrigen
          }
        });
      }

      // Recalcular totales de venta destino
      const itemsDestino = await prisma.detalleVenta.findMany({
        where: { ventaId: ventaDestino.id }
      });

      const totalDestino = itemsDestino.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
      
      await prisma.venta.update({
        where: { id: ventaDestino.id },
        data: {
          subtotal: totalDestino,
          total: totalDestino
        }
      });

      // Actualizar estado de mesa destino a OCUPADA
      await prisma.mesa.update({
        where: { id: mesaDestinoId },
        data: { estado: 'OCUPADA' }
      });

      return {
        itemsTransferidos: itemsTransferidos.length,
        totalTransferido: itemsATransferir.reduce((sum, item) => sum + parseFloat(item.subtotal), 0),
        mesaOrigenVacia: itemsRestantesOrigen.length === 0
      };
    });

    res.json({
      message: 'Transferencia completada exitosamente',
      ...resultado
    });

  } catch (error) {
    console.error('Error al transferir ítems:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 