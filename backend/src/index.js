import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Importar configuración de base de datos
import { conectarDB, configurarGracefulShutdown } from './config/database.js';

// Importar configuración de red
import { 
  generarCorsConfig, 
  configurarBindingServidor, 
  mostrarInfoRed 
} from './config/network.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import productosRoutes from './routes/productos.js';
import categoriasRoutes from './routes/categorias.js';
import ventasRoutes from './routes/ventas.js';
import reportesRoutes from './routes/reportes.js';
import afipRoutes from './routes/afip.js';
import cuitRoutes from './routes/cuit.js';
import turnosRoutes from './routes/turnos.js';

// Nuevas rutas implementadas
import presupuestosRoutes from './routes/presupuestos.js';
import clientesRoutes from './routes/clientes.js';
import facturasRecurrentesRoutes from './routes/facturas-recurrentes.js';
import listasPreciosRoutes from './routes/listas-precios.js';
import empleadosRoutes from './routes/empleados.js';
import chequesRoutes from './routes/cheques.js';

// Rutas del sistema de mesas
import sectoresRoutes from './routes/sectores.js';
import mesasRoutes from './routes/mesas.js';
import objetosDecorativosRoutes from './routes/objetos-decorativos.js';

// Rutas de red
import networkRoutes from './routes/network.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar rate limiting MEJORADO para autenticación
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'development' ? 50000 : 100), // MUY PERMISIVO en desarrollo
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // En desarrollo, ser EXTREMADAMENTE permisivo
    if (process.env.NODE_ENV === 'development') {
      return true; // Desactivar rate limiting completamente en desarrollo
    }
    
    // Rutas críticas que NO deben tener rate limiting
    const criticalRoutes = [
      '/health',
      '/api/auth/verify',
      '/api/auth/login',
      '/api/auth/logout',
      '/api/turnos/',
      '/api/mesas/',
      '/api/sectores/',
      '/api/ventas/',
      '/api/productos/'
    ];
    
    // Eximir rutas críticas completamente
    if (criticalRoutes.some(route => req.path.includes(route))) {
      return true;
    }
    
    return false;
  },
  // Configuración específica para evitar bloqueos innecesarios
  skipFailedRequests: true, // No contar requests fallidos
  skipSuccessfulRequests: false // Contar requests exitosos
});

// Middleware de seguridad
app.use(helmet());
app.use(limiter);

// Configurar CORS con detección automática de IP
const corsConfig = generarCorsConfig();
app.use(cors(corsConfig));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor CobroFacil funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/afip', afipRoutes);
app.use('/api/cuit', cuitRoutes);
app.use('/api/turnos', turnosRoutes);

// Nuevas funcionalidades implementadas
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/facturas-recurrentes', facturasRecurrentesRoutes);
app.use('/api/listas-precios', listasPreciosRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/cheques', chequesRoutes);

// Rutas del sistema de mesas
app.use('/api/sectores', sectoresRoutes);
app.use('/api/mesas', mesasRoutes);
app.use('/api/objetos-decorativos', objetosDecorativosRoutes);

// Rutas de red
app.use('/api/network', networkRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Función para iniciar el servidor
const iniciarServidor = async () => {
  try {
    // Conectar a la base de datos
    await conectarDB();
    
    // Configurar graceful shutdown
    configurarGracefulShutdown();
    
    // Configurar binding del servidor
    const bindingConfig = configurarBindingServidor();
    
    // Iniciar servidor
    app.listen(bindingConfig.port, bindingConfig.host, () => {
      console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║                                                              ║
      ║                     🚀 SERVIDOR COBRÓFÁCIL                  ║
      ║                                                              ║
      ╠══════════════════════════════════════════════════════════════╣
      ║  📡 Puerto: ${bindingConfig.port.toString().padEnd(48)} ║
      ║  🛡️  Host: ${bindingConfig.host.padEnd(49)} ║
      ║  📊 Base de datos: PostgreSQL conectada                     ║
      ║  ⚡ Estado: FUNCIONANDO                                      ║
      ╚══════════════════════════════════════════════════════════════╝
      
      🌐 API disponible en: http://localhost:${bindingConfig.port}
      📋 Health check: http://localhost:${bindingConfig.port}/health
      🌐 Red: http://localhost:${bindingConfig.port}/api/network/info
      
      🚀 Servidor CobroFacil iniciado correctamente
      
    `);
    
    // Mostrar información de red detallada
    mostrarInfoRed();
    });
    
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
iniciarServidor(); 