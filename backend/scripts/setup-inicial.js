import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupInicial() {
  console.log('🚀 Configurando datos iniciales del sistema...');
  
  try {
    // 1. Obtener el primer usuario para usar como creador
    const primerUsuario = await prisma.usuario.findFirst({
      where: { activo: true }
    });
    
    if (!primerUsuario) {
      console.error('❌ No hay usuarios activos en el sistema');
      return;
    }
    
    console.log(`👤 Usando usuario: ${primerUsuario.nombre} ${primerUsuario.apellido}`);
    
    // 2. Crear sector principal (verificar si ya existe)
    console.log('🏢 Verificando sector principal...');
    let sector = await prisma.sector.findFirst({
      where: { nombre: 'Salón Principal' }
    });
    
    if (!sector) {
      sector = await prisma.sector.create({
        data: {
          nombre: 'Salón Principal',
          descripcion: 'Área principal del restaurante',
          color: '#2196F3',
          icono: '🍽️',
          orden: 0,
          usuarioId: primerUsuario.id
        }
      });
      console.log(`✅ Sector creado: ${sector.nombre}`);
    } else {
      console.log(`✅ Sector ya existe: ${sector.nombre}`);
    }
    
    // 3. Crear mesas básicas con identificadores válidos (verificar si ya existen)
    console.log('🪑 Verificando mesas básicas...');
    const mesasExistentes = await prisma.mesa.count({
      where: { sectorId: sector.id }
    });
    
    if (mesasExistentes === 0) {
      // Definir identificadores válidos: máximo 4 caracteres (2 letras + 2 números)
      const identificadoresMesas = [
        'A01', 'A02', 'A03', 'A04',
        'B01', 'B02', 'B03', 'B04', 
        'C01', 'C02', 'C03', 'C04',
        'M01', 'M02', 'M03', 'M04'
      ];
      
      const mesas = [];
      for (let i = 0; i < identificadoresMesas.length; i++) {
        const mesa = await prisma.mesa.create({
          data: {
            numero: identificadoresMesas[i],
            capacidad: i < 4 ? 2 : i < 8 ? 4 : i < 12 ? 6 : 8,
            posicionX: ((i % 4) * 150) + 100,
            posicionY: (Math.floor(i / 4) * 150) + 100,
            size: 60,
            estado: 'LIBRE', // Verde: Mesa vacía, sin ítems ni facturación
            forma: i % 2 === 0 ? 'REDONDA' : 'CUADRADA',
            color: '#4CAF50', // Color verde para estado libre
            sectorId: sector.id,
            usuarioId: primerUsuario.id
          }
        });
        mesas.push(mesa);
      }
      console.log(`✅ Creadas ${mesas.length} mesas con identificadores válidos`);
      console.log(`📋 Identificadores: ${identificadoresMesas.join(', ')}`);
    } else {
      console.log(`✅ Ya existen ${mesasExistentes} mesas en el sector`);
    }
    
    // 4. Crear algunos objetos decorativos (verificar si ya existen)
    console.log('🎨 Verificando objetos decorativos...');
    const objetosExistentes = await prisma.objetoDecorativo.count({
      where: { sectorId: sector.id }
    });
    
    if (objetosExistentes === 0) {
      const objetosBarra = await prisma.objetoDecorativo.create({
        data: {
          nombre: 'Barra Principal',
          tipo: 'BARRA',
          posicionX: 50,
          posicionY: 50,
          ancho: 200,
          alto: 50,
          color: '#8B4513',
          forma: 'rectangle',
          descripcion: 'Barra principal del local',
          sectorId: sector.id,
          usuarioId: primerUsuario.id
        }
      });
      
      const objetoCocina = await prisma.objetoDecorativo.create({
        data: {
          nombre: 'Cocina',
          tipo: 'COCINA',
          posicionX: 500,
          posicionY: 50,
          ancho: 150,
          alto: 100,
          color: '#FF5722',
          forma: 'rectangle',
          descripcion: 'Área de cocina',
          sectorId: sector.id,
          usuarioId: primerUsuario.id
        }
      });
      
      console.log('✅ Objetos decorativos creados');
    } else {
      console.log(`✅ Ya existen ${objetosExistentes} objetos decorativos en el sector`);
    }
    
    // 5. Abrir turno inicial (verificar si ya hay uno abierto)
    console.log('🕐 Verificando turno inicial...');
    const turnoActivo = await prisma.turno.findFirst({
      where: { 
        estado: 'ABIERTO',
        caja: 'PRINCIPAL'
      }
    });
    
    if (!turnoActivo) {
      const turno = await prisma.turno.create({
        data: {
          nombre: 'Turno Inicial',
          caja: 'PRINCIPAL',
          horaInicio: '08:00',
          horaFin: '20:00',
          fondoInicial: 0,
          usuarioAperturaId: primerUsuario.id,
          estado: 'ABIERTO',
          observacionesApertura: 'Turno inicial creado automáticamente'
        }
      });
      console.log(`✅ Turno "${turno.nombre}" abierto`);
    } else {
      console.log(`✅ Ya hay un turno abierto: ${turnoActivo.nombre}`);
    }
    
    // 6. Mostrar resumen final
    console.log('\n📊 Resumen de configuración inicial:');
    
    const totalSectores = await prisma.sector.count();
    const totalMesas = await prisma.mesa.count();
    const totalObjetos = await prisma.objetoDecorativo.count();
    const turnosAbiertos = await prisma.turno.count({ where: { estado: 'ABIERTO' } });
    
    console.log(`🏢 Sectores: ${totalSectores}`);
    console.log(`🪑 Mesas: ${totalMesas}`);
    console.log(`🎨 Objetos decorativos: ${totalObjetos}`);
    console.log(`🕐 Turnos abiertos: ${turnosAbiertos}`);
    
    console.log('\n🔵 Estados de mesa definidos:');
    console.log('🟢 Verde (LIBRE): Mesa vacía, sin ítems ni facturación');
    console.log('🔴 Rojo (OCUPADA): Mesa con ítems cargados o comanda impresa, sin facturación');
    console.log('🔵 Azul (ESPERANDO_PEDIDO): Mesa facturada (ticket fiscal o no fiscal emitido)');
    
    console.log('\n🎉 ¡Configuración inicial completada!');
    console.log('✅ El sistema está listo para funcionar con identificadores válidos');
    
  } catch (error) {
    console.error('❌ Error durante la configuración inicial:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
setupInicial()
  .then(() => {
    console.log('✅ Script de configuración inicial ejecutado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el script de configuración inicial:', error);
    process.exit(1);
  }); 