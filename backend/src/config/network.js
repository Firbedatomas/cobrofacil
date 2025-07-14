import os from 'os';

/**
 * Detectar la IP local de la máquina
 */
export const detectarIPLocal = () => {
  const interfaces = os.networkInterfaces();
  
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    
    for (const address of addresses) {
      // Buscar IPv4 no loopback y no interno
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  
  return 'localhost'; // Fallback si no se encuentra IP
};

/**
 * Generar configuración de CORS para red local
 */
export const generarCorsConfig = () => {
  const ipLocal = detectarIPLocal();
  
  const origenes = [
    'http://localhost:3000',
    'http://localhost:3002', 
    'http://localhost:3003',
    'http://localhost:5173',
    `http://${ipLocal}:3000`,
    `http://${ipLocal}:3002`,
    `http://${ipLocal}:3003`,
    `http://${ipLocal}:5173`,
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  return {
    origin: origenes,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 horas
  };
};

/**
 * Obtener información de red del sistema
 */
export const obtenerInfoRed = () => {
  const ipLocal = detectarIPLocal();
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const networkInterfaces = os.networkInterfaces();
  
  // Filtrar solo interfaces relevantes
  const interfacesRelevantes = {};
  for (const [nombre, addresses] of Object.entries(networkInterfaces)) {
    const ipv4 = addresses.find(addr => addr.family === 'IPv4' && !addr.internal);
    if (ipv4) {
      interfacesRelevantes[nombre] = {
        ip: ipv4.address,
        netmask: ipv4.netmask,
        mac: ipv4.mac
      };
    }
  }
  
  return {
    ipLocal,
    hostname,
    platform,
    arch,
    interfaces: interfacesRelevantes,
    puerto: process.env.PORT || 3000,
    urlsAcceso: [
      `http://localhost:${process.env.PORT || 3000}`,
      `http://${ipLocal}:${process.env.PORT || 3000}`
    ]
  };
};

/**
 * Configurar binding del servidor para red local
 */
export const configurarBindingServidor = () => {
  return {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: process.env.PORT || 3000
  };
};

/**
 * Mostrar información de red al iniciar el servidor
 */
export const mostrarInfoRed = () => {
  const infoRed = obtenerInfoRed();
  
  console.log(`
  ╔══════════════════════════════════════════════════════════════╗
  ║                    🌐 INFORMACIÓN DE RED                     ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  📡 IP Principal: ${infoRed.ipLocal.padEnd(40)} ║
  ║  🖥️  Hostname: ${infoRed.hostname.padEnd(43)} ║
  ║  💻 Sistema: ${(infoRed.platform + ' ' + infoRed.arch).padEnd(46)} ║
  ║  🔌 Puerto: ${infoRed.puerto.toString().padEnd(48)} ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                    📱 ACCESO DESDE OTROS DISPOSITIVOS        ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  🌍 Local: http://localhost:${infoRed.puerto}                               ║
  ║  🌐 Red: http://${infoRed.ipLocal}:${infoRed.puerto}                        ║
  ║                                                              ║
  ║  📋 Para conectar desde otros dispositivos:                 ║
  ║     1. Usar IP: ${infoRed.ipLocal}                          ║
  ║     2. Puerto: ${infoRed.puerto}                                          ║
  ║     3. URL completa: http://${infoRed.ipLocal}:${infoRed.puerto}         ║
  ╚══════════════════════════════════════════════════════════════╝
  `);
  
  // Mostrar interfaces disponibles
  console.log('  📡 Interfaces de red disponibles:');
  for (const [nombre, info] of Object.entries(infoRed.interfaces)) {
    console.log(`     • ${nombre}: ${info.ip} (${info.netmask})`);
  }
  console.log('');
  
  return infoRed;
};

/**
 * Validar conectividad de red
 */
export const validarConectividad = async () => {
  const infoRed = obtenerInfoRed();
  
  try {
    // Ping a la IP local (simulado)
    const pingResult = await new Promise((resolve) => {
      // Simulación de ping - en producción usar librerías como 'ping'
      setTimeout(() => resolve(true), 100);
    });
    
    return {
      conectividad: pingResult,
      ipLocal: infoRed.ipLocal,
      puerto: infoRed.puerto,
      status: 'OK'
    };
  } catch (error) {
    return {
      conectividad: false,
      error: error.message,
      status: 'ERROR'
    };
  }
};

/**
 * Configuración completa de red para CobroFacil
 */
export const configurarRedCobroFacil = () => {
  const infoRed = obtenerInfoRed();
  const corsConfig = generarCorsConfig();
  const bindingConfig = configurarBindingServidor();
  
  return {
    info: infoRed,
    cors: corsConfig,
    binding: bindingConfig,
    mostrarInfo: mostrarInfoRed
  };
};

export default {
  detectarIPLocal,
  generarCorsConfig,
  obtenerInfoRed,
  configurarBindingServidor,
  mostrarInfoRed,
  validarConectividad,
  configurarRedCobroFacil
}; 