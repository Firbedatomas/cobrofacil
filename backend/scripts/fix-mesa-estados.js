import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corregirEstadosMesas() {
  try {
    console.log('🔍 Verificando estados de mesas...');
    
    // Obtener todas las mesas
    const mesas = await prisma.mesa.findMany({
      select: {
        id: true,
        numero: true,
        estado: true,
        sector: {
          select: {
            nombre: true
          }
        }
      }
    });

    console.log(`📊 Total de mesas encontradas: ${mesas.length}`);
    
    // Verificar cuántas mesas no tienen estado o tienen estado incorrecto
    const mesasSinEstado = mesas.filter(mesa => !mesa.estado);
    const mesasConEstadoIncorrecto = mesas.filter(mesa => mesa.estado && mesa.estado !== 'LIBRE');
    
    console.log(`🔴 Mesas sin estado: ${mesasSinEstado.length}`);
    console.log(`🟡 Mesas con estado diferente a LIBRE: ${mesasConEstadoIncorrecto.length}`);
    
    if (mesasSinEstado.length > 0) {
      console.log('\n📝 Mesas sin estado:');
      mesasSinEstado.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} (Sector: ${mesa.sector.nombre}) - Estado: ${mesa.estado || 'NULL'}`);
      });
    }
    
    if (mesasConEstadoIncorrecto.length > 0) {
      console.log('\n📝 Mesas con estado diferente a LIBRE:');
      mesasConEstadoIncorrecto.forEach(mesa => {
        console.log(`  - Mesa ${mesa.numero} (Sector: ${mesa.sector.nombre}) - Estado: ${mesa.estado}`);
      });
    }
    
    // Preguntar si se quiere corregir
    console.log('\n❓ ¿Desea establecer todas las mesas como LIBRE? (y/n)');
    
    // Para este script, vamos a corregir automáticamente
    const mesasACorregir = [...mesasSinEstado, ...mesasConEstadoIncorrecto];
    
    if (mesasACorregir.length > 0) {
      console.log(`\n🔧 Corrigiendo ${mesasACorregir.length} mesas...`);
      
      // Actualizar todas las mesas a estado LIBRE
      const resultado = await prisma.mesa.updateMany({
        where: {
          id: {
            in: mesasACorregir.map(mesa => mesa.id)
          }
        },
        data: {
          estado: 'LIBRE'
        }
      });
      
      console.log(`✅ ${resultado.count} mesas actualizadas a estado LIBRE`);
    } else {
      console.log('✅ Todas las mesas ya tienen el estado correcto (LIBRE)');
    }
    
    // Verificar resultado final
    const mesasActualizadas = await prisma.mesa.findMany({
      select: {
        id: true,
        numero: true,
        estado: true,
        sector: {
          select: {
            nombre: true
          }
        }
      }
    });
    
    const estadisticas = {
      LIBRE: 0,
      OCUPADA: 0,
      ESPERANDO_PEDIDO: 0,
      CUENTA_PEDIDA: 0,
      RESERVADA: 0,
      FUERA_DE_SERVICIO: 0
    };
    
    mesasActualizadas.forEach(mesa => {
      estadisticas[mesa.estado] = (estadisticas[mesa.estado] || 0) + 1;
    });
    
    console.log('\n📊 Estado final de las mesas:');
    Object.entries(estadisticas).forEach(([estado, cantidad]) => {
      if (cantidad > 0) {
        console.log(`  ${estado}: ${cantidad} mesas`);
      }
    });
    
    console.log('\n🎉 Corrección completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error al corregir estados de mesas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
corregirEstadosMesas(); 