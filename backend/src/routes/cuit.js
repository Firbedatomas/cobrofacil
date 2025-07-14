import express from 'express';
import { cuitService } from '../services/cuitService.js';

const router = express.Router();

// POST /api/cuit/consultar - Validar formato de CUIT (sin autenticación requerida)
router.post('/consultar', async (req, res) => {
  try {
    const { cuit } = req.body;

    if (!cuit) {
      return res.status(400).json({
        success: false,
        message: 'CUIT es requerido'
      });
    }

    const resultado = await cuitService.consultarCuit(cuit);
    
    if (resultado.success) {
      res.status(200).json({
        success: true,
        ...resultado.datos
      });
    } else {
      res.status(200).json({
        success: false,
        message: resultado.message
      });
    }

  } catch (error) {
    console.error('Error validando CUIT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/cuit/validar - Validar formato de CUIT (alias del anterior)
router.post('/validar', async (req, res) => {
  try {
    const { cuit } = req.body;

    if (!cuit) {
      return res.status(400).json({
        success: false,
        message: 'CUIT es requerido'
      });
    }

    const validacion = cuitService.validarCuit(cuit);
    
    res.status(200).json({
      success: true,
      valido: validacion.valido,
      message: validacion.error || 'CUIT válido',
      cuitFormateado: validacion.valido ? validacion.cuitFormateado : null
    });

  } catch (error) {
    console.error('Error validando CUIT:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router; 