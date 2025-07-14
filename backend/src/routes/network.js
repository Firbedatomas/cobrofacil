import express from 'express';
import { 
  obtenerInfoRed, 
  validarConectividad, 
  detectarIPLocal,
  configurarRedCobroFacil 
} from '../config/network.js';

const router = express.Router();

/**
 * GET /api/network/info
 * Obtener información de red del servidor
 */
router.get('/info', async (req, res) => {
  try {
    const infoRed = obtenerInfoRed();
    
    res.status(200).json({
      success: true,
      data: infoRed,
      message: 'Información de red obtenida correctamente'
    });
  } catch (error) {
    console.error('Error obteniendo información de red:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la información de red'
    });
  }
});

/**
 * GET /api/network/connectivity
 * Validar conectividad de red
 */
router.get('/connectivity', async (req, res) => {
  try {
    const conectividad = await validarConectividad();
    
    res.status(200).json({
      success: true,
      data: conectividad,
      message: 'Conectividad validada correctamente'
    });
  } catch (error) {
    console.error('Error validando conectividad:', error);
    res.status(500).json({
      success: false,
      error: 'Error validando conectividad',
      message: error.message
    });
  }
});

/**
 * GET /api/network/ip
 * Obtener IP local del servidor
 */
router.get('/ip', (req, res) => {
  try {
    const ipLocal = detectarIPLocal();
    
    res.status(200).json({
      success: true,
      data: {
        ip: ipLocal,
        timestamp: new Date().toISOString()
      },
      message: 'IP local obtenida correctamente'
    });
  } catch (error) {
    console.error('Error obteniendo IP local:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo IP local',
      message: error.message
    });
  }
});

/**
 * GET /api/network/config
 * Obtener configuración completa de red
 */
router.get('/config', (req, res) => {
  try {
    const configRed = configurarRedCobroFacil();
    
    res.status(200).json({
      success: true,
      data: configRed,
      message: 'Configuración de red obtenida correctamente'
    });
  } catch (error) {
    console.error('Error obteniendo configuración de red:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo configuración',
      message: error.message
    });
  }
});

/**
 * POST /api/network/test
 * Probar conectividad desde un cliente
 */
router.post('/test', async (req, res) => {
  try {
    const { clientIP, clientPort } = req.body;
    const serverInfo = obtenerInfoRed();
    
    // Registrar el test de conectividad
    console.log(`🔍 Test de conectividad desde ${clientIP}:${clientPort}`);
    
    const testResult = {
      timestamp: new Date().toISOString(),
      clientIP,
      clientPort,
      serverIP: serverInfo.ipLocal,
      serverPort: serverInfo.puerto,
      success: true,
      latency: Math.floor(Math.random() * 50) + 10 // Simulación de latencia
    };
    
    res.status(200).json({
      success: true,
      data: testResult,
      message: 'Test de conectividad exitoso'
    });
  } catch (error) {
    console.error('Error en test de conectividad:', error);
    res.status(500).json({
      success: false,
      error: 'Error en test de conectividad',
      message: error.message
    });
  }
});

/**
 * GET /api/network/ping
 * Endpoint simple para verificar que el servidor responde
 */
router.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress;
  
  res.status(200).json({
    success: true,
    data: {
      pong: true,
      timestamp,
      clientIP,
      serverIP: detectarIPLocal()
    },
    message: 'Servidor respondiendo correctamente'
  });
});

export default router; 