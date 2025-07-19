import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function limpiarMesasHuerfanas() {
  console.log('🧹 LIMPIANDO MESAS HUÉRFANAS...');
  console.log('='.repeat(40));
  
  try {
    // 1. Obtener mesas ocupadas
    const mesasOcupadas = await prisma.mesa.findMany({
      where: { estado: 'OCUPADA' },
      include: { sector: true }
    });
    
    // 2. Obtener ventas pendientes
    const ventas = await prisma.venta.findMany({
      where: { estado: 'PENDIENTE' }
    });
    
    console.log(`Mesas ocupadas: ${mesasOcupadas.length}`);
    console.log(`Ventas pendientes: ${ventas.length}`);
    console.log('');
    
    // 3. Identificar y limpiar mesas sin venta
    const mesasSinVenta = [];
    
    for (const mesa of mesasOcupadas) {
      const tieneVenta = ventas.some(v => v.mesaId === mesa.id);
      if (!tieneVenta) {
        mesasSinVenta.push(mesa);
      }
    }
    
    console.log(`Mesas huérfanas encontradas: ${mesasSinVenta.length}`);
    
    if (mesasSinVenta.length > 0) {
      console.log('🔄 Liberando mesas huérfanas:');
      
      for (const mesa of mesasSinVenta) {
        // Liberar la mesa
        await prisma.mesa.update({
          where: { id: mesa.id },
          data: { estado: 'LIBRE' }
        });
        
        console.log(`   ✅ Mesa ${mesa.numero} (${mesa.sector?.nombre}) liberada`);
      }
      
      console.log('');
      console.log(`🎉 ${mesasSinVenta.length} mesas huérfanas limpiadas`);
    } else {
      console.log('✅ No hay mesas huérfanas que limpiar');
    }
    
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar directamente
limpiarMesasHuerfanas(); 