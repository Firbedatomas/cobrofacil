import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function actualizarIdentificadoresMesas() {
  console.log('🔄 Actualizando identificadores de mesas...');
  
  try {
    // 1. Obtener todas las mesas existentes
    const mesas = await prisma.mesa.findMany({
      orderBy: { fechaCreacion: 'asc' }
    });
    
    console.log(`📋 Encontradas ${mesas.length} mesas para actualizar`);
    
    // 2. Definir identificadores válidos: máximo 4 caracteres (2 letras + 2 números)
    const identificadoresValidos = [
      'A01', 'A02', 'A03', 'A04',
      'B01', 'B02', 'B03', 'B04', 
      'C01', 'C02', 'C03', 'C04',
      'M01', 'M02', 'M03', 'M04',
      'T01', 'T02', 'T03', 'T04'
    ];
    
    // 3. Actualizar cada mesa con un identificador válido
    for (let i = 0; i < mesas.length && i < identificadoresValidos.length; i++) {
      const mesa = mesas[i];
      const nuevoIdentificador = identificadoresValidos[i];
      
      console.log(`🔄 Actualizando mesa ${mesa.numero} → ${nuevoIdentificador}`);
      
      await prisma.mesa.update({
        where: { id: mesa.id },
        data: {
          numero: nuevoIdentificador,
          estado: 'LIBRE', // Asegurar que esté en estado inicial
          color: '#4CAF50' // Color verde para estado libre
        }
      });
    }
    
    console.log('✅ Identificadores actualizados exitosamente');
    
    // 4. Mostrar resumen de identificadores actualizados
    const mesasActualizadas = await prisma.mesa.findMany({
      select: { numero: true, estado: true },
      orderBy: { numero: 'asc' }
    });
    
    console.log('\n📊 Resumen de identificadores actualizados:');
    mesasActualizadas.forEach(mesa => {
      const estadoIcon = mesa.estado === 'LIBRE' ? '🟢' : mesa.estado === 'OCUPADA' ? '🔴' : '🔵';
      console.log(`   ${estadoIcon} ${mesa.numero} - ${mesa.estado}`);
    });
    
    console.log('\n🔵 Criterios de identificación implementados:');
    console.log('✅ Máximo 4 caracteres por identificador');
    console.log('✅ Combinación: hasta 2 letras + hasta 2 números');
    console.log('✅ Ejemplos válidos: A01, B12, M5, AA12');
    
    console.log('\n🔵 Estados visuales definidos:');
    console.log('🟢 Verde (LIBRE): Mesa vacía, sin ítems ni facturación');
    console.log('🔴 Rojo (OCUPADA): Mesa con ítems cargados o comanda impresa, sin facturación');
    console.log('🔵 Azul (ESPERANDO_PEDIDO): Mesa facturada (ticket fiscal o no fiscal emitido)');
    
  } catch (error) {
    console.error('❌ Error actualizando identificadores:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
actualizarIdentificadoresMesas()
  .then(() => {
    console.log('✅ Script de actualización de identificadores ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script de actualización:', error);
    process.exit(1);
  }); 