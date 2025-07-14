import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCompleto() {
  try {
    console.log('🧹 INICIANDO RESET COMPLETO DE LA BASE DE DATOS...');
    console.log('⚠️  ESTO ELIMINARÁ TODOS LOS SECTORES, MESAS Y OBJETOS DECORATIVOS');
    console.log('⚠️  TAMBIÉN LIMPIARÁ TODAS LAS VENTAS ACTIVAS');
    console.log('');

    // 1. Eliminar todos los objetos decorativos
    console.log('🏛️ Eliminando objetos decorativos...');
    const objetosEliminados = await prisma.objetoDecorativo.deleteMany({});
    console.log(`   ✅ ${objetosEliminados.count} objetos decorativos eliminados`);

    // 2. Eliminar todas las mesas
    console.log('🪑 Eliminando mesas...');
    const mesasEliminadas = await prisma.mesa.deleteMany({});
    console.log(`   ✅ ${mesasEliminadas.count} mesas eliminadas`);

    // 3. Eliminar todos los sectores
    console.log('📍 Eliminando sectores...');
    const sectoresEliminados = await prisma.sector.deleteMany({});
    console.log(`   ✅ ${sectoresEliminados.count} sectores eliminados`);

    // 4. Eliminar todas las ventas
    console.log('🧾 Eliminando ventas...');
    const ventasEliminadas = await prisma.venta.deleteMany({});
    console.log(`   ✅ ${ventasEliminadas.count} ventas eliminadas`);

    // 5. Eliminar detalles de venta
    console.log('📋 Eliminando detalles de venta...');
    const detallesEliminados = await prisma.detalleVenta.deleteMany({});
    console.log(`   ✅ ${detallesEliminados.count} detalles de venta eliminados`);

    // 6. Verificar que no queden datos residuales
    console.log('🔍 Verificando limpieza...');
    const conteoSectores = await prisma.sector.count();
    const conteoMesas = await prisma.mesa.count();
    const conteoObjetos = await prisma.objetoDecorativo.count();
    const conteoVentas = await prisma.venta.count();
    const conteoDetalles = await prisma.detalleVenta.count();

    console.log(`📊 Verificación:`);
    console.log(`   - Sectores restantes: ${conteoSectores}`);
    console.log(`   - Mesas restantes: ${conteoMesas}`);
    console.log(`   - Objetos decorativos restantes: ${conteoObjetos}`);
    console.log(`   - Ventas restantes: ${conteoVentas}`);
    console.log(`   - Detalles de venta restantes: ${conteoDetalles}`);

    if (conteoSectores === 0 && conteoMesas === 0 && conteoObjetos === 0 && conteoVentas === 0 && conteoDetalles === 0) {
      console.log('');
      console.log('🎉 ¡RESET COMPLETO EXITOSO!');
      console.log('✅ La base de datos está completamente limpia');
      console.log('✅ Ahora puedes crear sectores y mesas desde cero');
      console.log('');
      console.log('📋 PRÓXIMOS PASOS:');
      console.log('1. Limpia también el localStorage del navegador');
      console.log('2. Reinicia la aplicación');
      console.log('3. Crea tus sectores y mesas desde la interfaz');
    } else {
      console.log('');
      console.log('⚠️  ADVERTENCIA: Algunos datos no se eliminaron correctamente');
      console.log('   Revisa los logs arriba para más detalles');
    }

  } catch (error) {
    console.error('❌ Error durante el reset completo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el reset
resetCompleto().catch(console.error); 