import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetParcialDB() {
  console.log('🧹 Iniciando reset parcial de la base de datos...');
  console.log('📋 Manteniendo: usuarios, productos, categorías y configuración AFIP');
  
  try {
    // Orden de borrado respetando relaciones de clave foránea
    
    // 1. Borrar tablas dependientes primero
    console.log('🗑️  Borrando sesiones de usuario...');
    await prisma.sesionUsuario.deleteMany({});
    
    console.log('🗑️  Borrando detalles de ventas...');
    await prisma.detalleVenta.deleteMany({});
    
    console.log('🗑️  Borrando ventas...');
    await prisma.venta.deleteMany({});
    
    console.log('🗑️  Borrando movimientos de caja...');
    await prisma.movimientoCaja.deleteMany({});
    
    console.log('🗑️  Borrando turnos...');
    await prisma.turno.deleteMany({});
    
    console.log('🗑️  Borrando mesas...');
    await prisma.mesa.deleteMany({});
    
    console.log('🗑️  Borrando objetos decorativos...');
    await prisma.objetoDecorativo.deleteMany({});
    
    console.log('🗑️  Borrando sectores...');
    await prisma.sector.deleteMany({});
    
    console.log('🗑️  Borrando clientes...');
    await prisma.cliente.deleteMany({});
    
    console.log('🗑️  Borrando detalles de presupuestos...');
    await prisma.detallePresupuesto.deleteMany({});
    
    console.log('🗑️  Borrando presupuestos...');
    await prisma.presupuesto.deleteMany({});
    
    console.log('🗑️  Borrando detalles de facturas recurrentes...');
    await prisma.detalleFacturaRecurrente.deleteMany({});
    
    console.log('🗑️  Borrando facturas recurrentes...');
    await prisma.facturaRecurrente.deleteMany({});
    
    console.log('🗑️  Borrando ventas recurrentes...');
    await prisma.ventaRecurrente.deleteMany({});
    
    console.log('🗑️  Borrando precios de productos...');
    await prisma.precioProducto.deleteMany({});
    
    console.log('🗑️  Borrando listas de precios por cliente...');
    await prisma.listaPrecioCliente.deleteMany({});
    
    console.log('🗑️  Borrando listas de precios...');
    await prisma.listaPrecio.deleteMany({});
    
    console.log('🗑️  Borrando liquidaciones de sueldos...');
    await prisma.liquidacionSueldo.deleteMany({});
    
    console.log('🗑️  Borrando empleados...');
    await prisma.empleado.deleteMany({});
    
    console.log('🗑️  Borrando cheques...');
    await prisma.cheque.deleteMany({});
    
    // 2. Verificar qué se mantuvo
    console.log('\n✅ Reset parcial completado. Estado actual:');
    
    const usuarios = await prisma.usuario.count();
    console.log(`👤 Usuarios: ${usuarios}`);
    
    const categorias = await prisma.categoria.count();
    console.log(`📂 Categorías: ${categorias}`);
    
    const productos = await prisma.producto.count();
    console.log(`📦 Productos: ${productos}`);
    
    const configAfip = await prisma.configuracionAfip.count();
    console.log(`🏛️  Configuración AFIP: ${configAfip}`);
    
    const configSistema = await prisma.configuracionSistema.count();
    console.log(`⚙️  Configuración Sistema: ${configSistema}`);
    
    // 3. Verificar que todo lo demás se borró
    const ventas = await prisma.venta.count();
    const mesas = await prisma.mesa.count();
    const turnos = await prisma.turno.count();
    const sectores = await prisma.sector.count();
    
    console.log(`\n🧹 Datos borrados (debería ser 0):`);
    console.log(`💰 Ventas: ${ventas}`);
    console.log(`🪑 Mesas: ${mesas}`);
    console.log(`🕐 Turnos: ${turnos}`);
    console.log(`🏢 Sectores: ${sectores}`);
    
    console.log('\n🎉 ¡Reset parcial completado exitosamente!');
    console.log('📝 Datos mantenidos: usuarios, productos, categorías, configuración AFIP y sistema');
    
  } catch (error) {
    console.error('❌ Error durante el reset parcial:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
resetParcialDB()
  .then(() => {
    console.log('✅ Script ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  }); 