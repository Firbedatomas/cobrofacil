import { PrismaClient } from '@prisma/client';

// Configuración del cliente Prisma
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'pretty',
});

// Función para conectar a la base de datos
export const conectarDB = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Conexión exitosa a PostgreSQL');
    
    // Verificar la conexión
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Base de datos PostgreSQL funcionando correctamente');
    
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

// Función para desconectar de la base de datos
export const desconectarDB = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconexión exitosa de PostgreSQL');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
};

// Función para manejar el graceful shutdown
export const configurarGracefulShutdown = () => {
  process.on('SIGINT', async () => {
    console.log('\n🔄 Cerrando servidor...');
    await desconectarDB();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🔄 Cerrando servidor...');
    await desconectarDB();
    process.exit(0);
  });
};

export { prisma }; 