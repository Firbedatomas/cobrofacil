import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarAdmin } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionConfiguracion = [
  body('clave')
    .isLength({ min: 1 })
    .withMessage('La clave es obligatoria')
    .trim(),
  body('valor')
    .isLength({ min: 1 })
    .withMessage('El valor es obligatorio')
    .trim(),
  body('descripcion')
    .optional()
    .isLength({ min: 1 })
    .withMessage('La descripción debe tener al menos 1 carácter')
    .trim()
];

// GET /api/configuracion-sistema - Obtener todas las configuraciones
router.get('/', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const configuraciones = await prisma.configuracionSistema.findMany({
      orderBy: {
        clave: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: configuraciones,
      message: 'Configuraciones obtenidas correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener configuraciones'
    });
  }
});

// GET /api/configuracion-sistema/:clave - Obtener configuración específica
router.get('/:clave', verificarToken, async (req, res) => {
  try {
    const { clave } = req.params;

    const configuracion = await prisma.configuracionSistema.findUnique({
      where: { clave }
    });

    if (!configuracion) {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada',
        message: `No se encontró configuración con clave: ${clave}`
      });
    }

    res.status(200).json({
      success: true,
      data: configuracion,
      message: 'Configuración obtenida correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener configuración'
    });
  }
});

// POST /api/configuracion-sistema - Crear o actualizar configuración
router.post('/', verificarToken, verificarAdmin, validacionConfiguracion, async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores.array()
      });
    }

    const { clave, valor, descripcion } = req.body;

    // Usar upsert para crear o actualizar
    const configuracion = await prisma.configuracionSistema.upsert({
      where: { clave },
      update: {
        valor,
        descripcion: descripcion || undefined
      },
      create: {
        clave,
        valor,
        descripcion: descripcion || undefined
      }
    });

    res.status(200).json({
      success: true,
      data: configuracion,
      message: 'Configuración guardada correctamente'
    });

  } catch (error) {
    console.error('Error guardando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al guardar configuración'
    });
  }
});

// PUT /api/configuracion-sistema/:clave - Actualizar configuración específica
router.put('/:clave', verificarToken, verificarAdmin, [
  body('valor')
    .isLength({ min: 1 })
    .withMessage('El valor es obligatorio')
    .trim(),
  body('descripcion')
    .optional()
    .isLength({ min: 1 })
    .withMessage('La descripción debe tener al menos 1 carácter')
    .trim()
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores.array()
      });
    }

    const { clave } = req.params;
    const { valor, descripcion } = req.body;

    const configuracion = await prisma.configuracionSistema.update({
      where: { clave },
      data: {
        valor,
        descripcion: descripcion || undefined
      }
    });

    res.status(200).json({
      success: true,
      data: configuracion,
      message: 'Configuración actualizada correctamente'
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada',
        message: `No se encontró configuración con clave: ${req.params.clave}`
      });
    }

    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al actualizar configuración'
    });
  }
});

// DELETE /api/configuracion-sistema/:clave - Eliminar configuración
router.delete('/:clave', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { clave } = req.params;

    await prisma.configuracionSistema.delete({
      where: { clave }
    });

    res.status(200).json({
      success: true,
      message: 'Configuración eliminada correctamente'
    });

  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Configuración no encontrada',
        message: `No se encontró configuración con clave: ${req.params.clave}`
      });
    }

    console.error('Error eliminando configuración:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al eliminar configuración'
    });
  }
});

// GET /api/configuracion-sistema/empresa/datos - Obtener datos de la empresa
router.get('/empresa/datos', verificarToken, async (req, res) => {
  try {
    const configuracionesEmpresa = await prisma.configuracionSistema.findMany({
      where: {
        clave: {
          in: ['EMPRESA_NOMBRE', 'EMPRESA_DIRECCION', 'EMPRESA_TELEFONO', 'EMPRESA_EMAIL', 'EMPRESA_CUIT']
        }
      }
    });

    const datosEmpresa = {
      nombre: configuracionesEmpresa.find(c => c.clave === 'EMPRESA_NOMBRE')?.valor || '',
      direccion: configuracionesEmpresa.find(c => c.clave === 'EMPRESA_DIRECCION')?.valor || '',
      telefono: configuracionesEmpresa.find(c => c.clave === 'EMPRESA_TELEFONO')?.valor || '',
      email: configuracionesEmpresa.find(c => c.clave === 'EMPRESA_EMAIL')?.valor || '',
      cuit: configuracionesEmpresa.find(c => c.clave === 'EMPRESA_CUIT')?.valor || ''
    };

    res.status(200).json({
      success: true,
      data: datosEmpresa,
      message: 'Datos de empresa obtenidos correctamente'
    });

  } catch (error) {
    console.error('Error obteniendo datos de empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener datos de empresa'
    });
  }
});

// POST /api/configuracion-sistema/empresa/datos - Guardar datos de la empresa
router.post('/empresa/datos', verificarToken, verificarAdmin, [
  body('nombre').optional().isLength({ min: 1 }).withMessage('El nombre debe tener al menos 1 carácter'),
  body('direccion').optional().isLength({ min: 1 }).withMessage('La dirección debe tener al menos 1 carácter'),
  body('telefono').optional().isLength({ min: 1 }).withMessage('El teléfono debe tener al menos 1 carácter'),
  body('email').optional().isEmail().withMessage('El email debe ser válido'),
  body('cuit').optional().isLength({ min: 1 }).withMessage('El CUIT debe tener al menos 1 carácter')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        detalles: errores.array()
      });
    }

    const { nombre, direccion, telefono, email, cuit } = req.body;

    const configuraciones = [
      { clave: 'EMPRESA_NOMBRE', valor: nombre || '', descripcion: 'Nombre de la empresa' },
      { clave: 'EMPRESA_DIRECCION', valor: direccion || '', descripcion: 'Dirección de la empresa' },
      { clave: 'EMPRESA_TELEFONO', valor: telefono || '', descripcion: 'Teléfono de la empresa' },
      { clave: 'EMPRESA_EMAIL', valor: email || '', descripcion: 'Email de la empresa' },
      { clave: 'EMPRESA_CUIT', valor: cuit || '', descripcion: 'CUIT de la empresa' }
    ];

    // Guardar todas las configuraciones
    const resultados = await Promise.all(
      configuraciones.map(config =>
        prisma.configuracionSistema.upsert({
          where: { clave: config.clave },
          update: { valor: config.valor },
          create: config
        })
      )
    );

    res.status(200).json({
      success: true,
      data: resultados,
      message: 'Datos de empresa guardados correctamente'
    });

  } catch (error) {
    console.error('Error guardando datos de empresa:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al guardar datos de empresa'
    });
  }
});

export default router; 