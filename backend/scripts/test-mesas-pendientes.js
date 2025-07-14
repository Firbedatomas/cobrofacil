import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMesasPendientes() {
  try {
    console.log('🔍 Creando mesas de prueba con estado ESPERANDO_PEDIDO...');

    // Obtener el primer sector disponible
    const sector = await prisma.sector.findFirst({
      where: { activo: true }
    });

    if (!sector) {
      console.log('❌ No se encontró un sector activo');
      return;
    }

    // Obtener el primer usuario disponible
    const usuario = await prisma.usuario.findFirst({
      where: { activo: true }
    });

    if (!usuario) {
      console.log('❌ No se encontró un usuario activo');
      return;
    }

    // Crear 2 mesas de prueba en estado ESPERANDO_PEDIDO
    const mesasTest = await Promise.all([
      prisma.mesa.create({
        data: {
          numero: 'TEST01',
          capacidad: 4,
          estado: 'ESPERANDO_PEDIDO',
          forma: 'REDONDA',
          posicionX: 100,
          posicionY: 100,
          size: 60,
          sectorId: sector.id,
          usuarioId: usuario.id,
          activa: true
        }
      }),
      prisma.mesa.create({
        data: {
          numero: 'TEST02',
          capacidad: 6,
          estado: 'ESPERANDO_PEDIDO',
          forma: 'CUADRADA',
          posicionX: 200,
          posicionY: 200,
          size: 60,
          sectorId: sector.id,
          usuarioId: usuario.id,
          activa: true
        }
      })
    ]);

    console.log('✅ Mesas de prueba creadas:');
    mesasTest.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero} (${mesa.estado})`);
    });

    // Verificar que las mesas están en estado ESPERANDO_PEDIDO
    const mesasPendientes = await prisma.mesa.findMany({
      where: {
        estado: 'ESPERANDO_PEDIDO',
        activa: true
      },
      include: {
        sector: {
          select: {
            nombre: true
          }
        }
      }
    });

    console.log(`\n🔍 Mesas pendientes encontradas: ${mesasPendientes.length}`);
    mesasPendientes.forEach(mesa => {
      console.log(`  - Mesa ${mesa.numero} (${mesa.sector.nombre})`);
    });

    console.log('\n📋 Ahora puedes probar:');
    console.log('1. Abrir un turno en la aplicación');
    console.log('2. Intentar cerrar el turno');
    console.log('3. Debería aparecer el error de mesas pendientes');
    console.log('4. Usar el siguiente comando para limpiar las mesas de prueba:');
    console.log('   npm run clean-test-mesas');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function cleanTestMesas() {
  try {
    console.log('🧹 Limpiando mesas de prueba...');
    
    const deletedMesas = await prisma.mesa.deleteMany({
      where: {
        numero: {
          in: ['TEST01', 'TEST02']
        }
      }
    });

    console.log(`✅ ${deletedMesas.count} mesas de prueba eliminadas`);
  } catch (error) {
    console.error('❌ Error limpiando mesas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar según el argumento
const command = process.argv[2];
if (command === 'clean') {
  cleanTestMesas();
} else {
  testMesasPendientes();
} 