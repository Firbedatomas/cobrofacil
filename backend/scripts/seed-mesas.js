import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMesas() {
  console.log('🍽️ Iniciando semilla de mesas y sectores...');

  try {
    // Obtener el primer usuario administrador
    const adminUser = await prisma.usuario.findFirst({
      where: { rol: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ No se encontró un usuario administrador');
      return;
    }

    // 1. Crear sectores
    console.log('📍 Creando sectores...');
    
    const sectores = [
      {
        nombre: 'Terraza',
        descripcion: 'Zona exterior con mesas al aire libre',
        color: '#4CAF50',
        icono: '🌿',
        orden: 0
      },
      {
        nombre: 'Interior',
        descripcion: 'Zona principal del local',
        color: '#2196F3',
        icono: '🏠',
        orden: 1
      },
      {
        nombre: 'VIP',
        descripcion: 'Zona reservada para clientes VIP',
        color: '#FF9800',
        icono: '⭐',
        orden: 2
      },
      {
        nombre: 'Barra',
        descripcion: 'Zona de barra para consumo rápido',
        color: '#9C27B0',
        icono: '🍻',
        orden: 3
      }
    ];

    const sectoresCreados = [];
    for (const sectorData of sectores) {
      const sector = await prisma.sector.create({
        data: {
          ...sectorData,
          usuarioId: adminUser.id
        }
      });
      sectoresCreados.push(sector);
      console.log(`   ✅ Sector creado: ${sector.nombre}`);
    }

    // 2. Crear mesas para cada sector
    console.log('🪑 Creando mesas...');

    // Mesas para Terraza
    const mesasTerraza = [
      { numero: 'T1', capacidad: 4, posicionX: 50, posicionY: 50, forma: 'REDONDA' },
      { numero: 'T2', capacidad: 2, posicionX: 150, posicionY: 50, forma: 'CUADRADA' },
      { numero: 'T3', capacidad: 6, posicionX: 250, posicionY: 50, forma: 'RECTANGULAR' },
      { numero: 'T4', capacidad: 4, posicionX: 50, posicionY: 150, forma: 'REDONDA' },
      { numero: 'T5', capacidad: 8, posicionX: 150, posicionY: 150, forma: 'RECTANGULAR' },
      { numero: 'T6', capacidad: 2, posicionX: 250, posicionY: 150, forma: 'CUADRADA' }
    ];

    for (const mesaData of mesasTerraza) {
      await prisma.mesa.create({
        data: {
          ...mesaData,
          sectorId: sectoresCreados[0].id, // Terraza
          usuarioId: adminUser.id
        }
      });
      console.log(`   ✅ Mesa creada: ${mesaData.numero} (Terraza)`);
    }

    // Mesas para Interior
    const mesasInterior = [
      { numero: '1', capacidad: 4, posicionX: 80, posicionY: 80, forma: 'REDONDA' },
      { numero: '2', capacidad: 2, posicionX: 200, posicionY: 80, forma: 'CUADRADA' },
      { numero: '3', capacidad: 6, posicionX: 320, posicionY: 80, forma: 'RECTANGULAR' },
      { numero: '4', capacidad: 4, posicionX: 80, posicionY: 200, forma: 'REDONDA' },
      { numero: '5', capacidad: 4, posicionX: 200, posicionY: 200, forma: 'REDONDA' },
      { numero: '6', capacidad: 2, posicionX: 320, posicionY: 200, forma: 'CUADRADA' },
      { numero: '7', capacidad: 8, posicionX: 80, posicionY: 320, forma: 'RECTANGULAR' },
      { numero: '8', capacidad: 4, posicionX: 200, posicionY: 320, forma: 'REDONDA' },
      { numero: '9', capacidad: 6, posicionX: 320, posicionY: 320, forma: 'RECTANGULAR' }
    ];

    for (const mesaData of mesasInterior) {
      await prisma.mesa.create({
        data: {
          ...mesaData,
          sectorId: sectoresCreados[1].id, // Interior
          usuarioId: adminUser.id
        }
      });
      console.log(`   ✅ Mesa creada: ${mesaData.numero} (Interior)`);
    }

    // Mesas para VIP
    const mesasVIP = [
      { numero: 'VIP1', capacidad: 6, posicionX: 100, posicionY: 100, forma: 'RECTANGULAR' },
      { numero: 'VIP2', capacidad: 8, posicionX: 300, posicionY: 100, forma: 'RECTANGULAR' },
      { numero: 'VIP3', capacidad: 4, posicionX: 200, posicionY: 250, forma: 'REDONDA' }
    ];

    for (const mesaData of mesasVIP) {
      await prisma.mesa.create({
        data: {
          ...mesaData,
          sectorId: sectoresCreados[2].id, // VIP
          usuarioId: adminUser.id
        }
      });
      console.log(`   ✅ Mesa creada: ${mesaData.numero} (VIP)`);
    }

    // Mesas para Barra
    const mesasBarra = [
      { numero: 'B1', capacidad: 2, posicionX: 50, posicionY: 50, forma: 'CUADRADA' },
      { numero: 'B2', capacidad: 2, posicionX: 150, posicionY: 50, forma: 'CUADRADA' },
      { numero: 'B3', capacidad: 2, posicionX: 250, posicionY: 50, forma: 'CUADRADA' },
      { numero: 'B4', capacidad: 2, posicionX: 350, posicionY: 50, forma: 'CUADRADA' }
    ];

    for (const mesaData of mesasBarra) {
      await prisma.mesa.create({
        data: {
          ...mesaData,
          sectorId: sectoresCreados[3].id, // Barra
          usuarioId: adminUser.id
        }
      });
      console.log(`   ✅ Mesa creada: ${mesaData.numero} (Barra)`);
    }

    // 3. Crear algunos objetos decorativos
    console.log('🏛️ Creando objetos decorativos...');

    const objetosDecorativos = [
      {
        nombre: 'Barra Principal',
        tipo: 'BARRA',
        sectorId: sectoresCreados[3].id, // Barra
        posicionX: 200,
        posicionY: 20,
        ancho: 200,
        alto: 40,
        color: '#8B4513',
        forma: 'rectangle'
      },
      {
        nombre: 'Baño',
        tipo: 'BANO',
        sectorId: sectoresCreados[1].id, // Interior
        posicionX: 400,
        posicionY: 100,
        ancho: 60,
        alto: 60,
        color: '#E0E0E0',
        forma: 'rectangle'
      },
      {
        nombre: 'Entrada Principal',
        tipo: 'ENTRADA',
        sectorId: sectoresCreados[1].id, // Interior
        posicionX: 20,
        posicionY: 20,
        ancho: 40,
        alto: 40,
        color: '#4CAF50',
        forma: 'rectangle'
      },
      {
        nombre: 'Escenario',
        tipo: 'ESCENARIO',
        sectorId: sectoresCreados[2].id, // VIP
        posicionX: 400,
        posicionY: 200,
        ancho: 100,
        alto: 80,
        color: '#FF6B6B',
        forma: 'rectangle'
      }
    ];

    for (const objetoData of objetosDecorativos) {
      await prisma.objetoDecorativo.create({
        data: {
          ...objetoData,
          usuarioId: adminUser.id
        }
      });
      console.log(`   ✅ Objeto decorativo creado: ${objetoData.nombre}`);
    }

    console.log('\n🎉 ¡Semilla de mesas y sectores completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${sectoresCreados.length} sectores creados`);
    console.log(`   - ${mesasTerraza.length + mesasInterior.length + mesasVIP.length + mesasBarra.length} mesas creadas`);
    console.log(`   - ${objetosDecorativos.length} objetos decorativos creados`);

  } catch (error) {
    console.error('❌ Error durante la semilla de mesas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la semilla
seedMesas().catch(console.error); 