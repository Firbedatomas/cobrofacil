import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { verificarToken, verificarSupervisor } from '../middleware/auth.js';
import { afipService } from '../services/afipService.js';

const router = express.Router();

// Configuración de multer para certificados AFIP
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'certificados');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const { tipoCertificado } = req.body;
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    
    if (tipoCertificado === 'certificado') {
      cb(null, `afip_certificado_${timestamp}${extension}`);
    } else if (tipoCertificado === 'clavePrivada') {
      cb(null, `afip_clave_privada_${timestamp}${extension}`);
    } else {
      cb(new Error('Tipo de certificado no válido'));
    }
  }
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  
  // Permitir todas las extensiones válidas de AFIP
  const extensionesValidas = ['.crt', '.cer', '.key', '.pem'];
  
  if (extensionesValidas.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no válido. Use ${extensionesValidas.join(', ')} para certificados AFIP.`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// GET /api/afip/estado - Obtener estado y configuración AFIP
router.get('/estado', verificarToken, async (req, res) => {
  try {
    const estado = await afipService.verificarConfiguracion();
    res.status(200).json(estado);
  } catch (error) {
    console.error('Error obteniendo estado AFIP:', error);
    res.status(500).json({
      configurado: false,
      advertencias: ['Error al obtener estado AFIP'],
      estado: 'ERROR'
    });
  }
});

// GET /api/afip/tipos-comprobante - Obtener tipos de comprobante disponibles
router.get('/tipos-comprobante', verificarToken, async (req, res) => {
  try {
    const tipos = afipService.getTiposComprobante();
    res.status(200).json(tipos);
  } catch (error) {
    console.error('Error obteniendo tipos de comprobante:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/afip/configuracion - Actualizar configuración AFIP
router.post('/configuracion', verificarToken, verificarSupervisor, async (req, res) => {
  try {
    const resultado = await afipService.actualizarConfiguracion(req.body);
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error actualizando configuración AFIP:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/afip/subir-certificado - Subir certificado AFIP
router.post('/subir-certificado', verificarToken, verificarSupervisor, upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    const { tipoCertificado } = req.body;
    const archivo = req.file;
    const extension = path.extname(archivo.originalname).toLowerCase();

    // Validar que el tipo de certificado coincida con la extensión
    if (tipoCertificado === 'certificado' && !['.crt', '.cer'].includes(extension)) {
      // Eliminar archivo subido
      try {
        await fs.unlink(archivo.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Para certificados debe usar archivos .crt o .cer'
      });
    }

    if (tipoCertificado === 'clavePrivada' && !['.key', '.pem'].includes(extension)) {
      // Eliminar archivo subido
      try {
        await fs.unlink(archivo.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Para claves privadas debe usar archivos .key o .pem'
      });
    }

    // Actualizar la configuración con la ruta del archivo
    const resultado = await afipService.actualizarCertificado(tipoCertificado, archivo.path);

    res.status(200).json({
      success: true,
      message: `${tipoCertificado === 'certificado' ? 'Certificado' : 'Clave privada'} subido correctamente`,
      archivo: {
        nombre: archivo.originalname,
        tamano: archivo.size,
        ruta: archivo.filename
      }
    });

  } catch (error) {
    console.error('Error subiendo certificado:', error);
    
    // Eliminar archivo si hubo error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error eliminando archivo:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/afip/eliminar-certificado - Eliminar certificado AFIP
router.delete('/eliminar-certificado/:tipo', verificarToken, verificarSupervisor, async (req, res) => {
  try {
    const { tipo } = req.params;
    
    if (!['certificado', 'clavePrivada'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de certificado no válido'
      });
    }

    const resultado = await afipService.eliminarCertificado(tipo);

    res.status(200).json({
      success: true,
      message: `${tipo === 'certificado' ? 'Certificado' : 'Clave privada'} eliminado correctamente`
    });

  } catch (error) {
    console.error('Error eliminando certificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/afip/solicitar-cae - Solicitar CAE para una venta
router.post('/solicitar-cae', verificarToken, async (req, res) => {
  try {
    const { ventaId } = req.body;
    
    // Aquí iría la lógica para solicitar CAE real
    const resultado = await afipService.solicitarCAE({ id: ventaId });
    
    res.status(200).json(resultado);
  } catch (error) {
    console.error('Error solicitando CAE:', error);
    res.status(500).json({
      success: false,
      message: 'Error al solicitar CAE'
    });
  }
});

export default router; 