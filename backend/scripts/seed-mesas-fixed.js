import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMesas() {
  try {
    console.log('🍽️ Iniciando semilla de mesas y sectores...');

    // Verificar que hay al menos un usuario administrador
    const adminUser = await prisma.usuario.findFirst({
      where: { activo: true }
    });

    if (!adminUser) {
      console.error('❌ No se encontró un usuario administrador activo');
      return;
    }

    console.log(`👤 Usuario administrador encontrado: ${adminUser.email}`);

    // 1. Crear sectores (o encontrar existentes)
    console.log('📍 Verificando sectores...');

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
      // Verificar si el sector ya existe
      let sector = await prisma.sector.findFirst({
        where: { nombre: sectorData.nombre }
      });

      if (sector) {
        console.log(`   ⚠️ Sector ya existe: ${sector.nombre}`);
        sectoresCreados.push(sector);
      } else {
        // Crear el sector
        sector = await prisma.sector.create({
          data: {
            ...sectorData,
            usuarioId: adminUser.id
          }
        });
        sectoresCreados.push(sector);
        console.log(`   ✅ Sector creado: ${sector.nombre}`);
      }
    }

    // 2. Crear mesas para cada sector (solo si no existen)
    console.log('🪑 Verificando mesas...');

    const mesasDefiniciones = [
      // Mesas para Terraza
      { sectorIndex: 0, sectorName: 'Terraza', mesas: [
        { numero: 'T1', capacidad: 4, posicionX: 50, posicionY: 50, forma: 'REDONDA' },
        { numero: 'T2', capacidad: 2, posicionX: 150, posicionY: 50, forma: 'CUADRADA' },
        { numero: 'T3', capacidad: 6, posicionX: 250, posicionY: 50, forma: 'RECTANGULAR' },
        { numero: 'T4', capacidad: 4, posicionX: 50, posicionY: 150, forma: 'REDONDA' },
        { numero: 'T5', capacidad: 8, posicionX: 150, posicionY: 150, forma: 'RECTANGULAR' },
        { numero: 'T6', capacidad: 2, posicionX: 250, posicionY: 150, forma: 'CUADRADA' }
      ]},
      // Mesas para Interior
      { sectorIndex: 1, sectorName: 'Interior', mesas: [
        { numero: '1', capacidad: 4, posicionX: 80, posicionY: 80, forma: 'REDONDA' },
        { numero: '2', capacidad: 2, posicionX: 200, posicionY: 80, forma: 'CUADRADA' },
        { numero: '3', capacidad: 6, posicionX: 320, posicionY: 80, forma: 'RECTANGULAR' },
        { numero: '4', capacidad: 4, posicionX: 80, posicionY: 200, forma: 'REDONDA' },
        { numero: '5', capacidad: 4, posicionX: 200, posicionY: 200, forma: 'REDONDA' },
        { numero: '6', capacidad: 2, posicionX: 320, posicionY: 200, forma: 'CUADRADA' },
        { numero: '7', capacidad: 8, posicionX: 80, posicionY: 320, forma: 'RECTANGULAR' },
        { numero: '8', capacidad: 4, posicionX: 200, posicionY: 320, forma: 'REDONDA' },
        { numero: '9', capacidad: 6, posicionX: 320, posicionY: 320, forma: 'RECTANGULAR' }
      ]},
      // Mesas para VIP
      { sectorIndex: 2, sectorName: 'VIP', mesas: [
        { numero: 'VIP1', capacidad: 6, posicionX: 100, posicionY: 100, forma: 'RECTANGULAR' },
        { numero: 'VIP2', capacidad: 8, posicionX: 300, posicionY: 100, forma: 'RECTANGULAR' },
        { numero: 'VIP3', capacidad: 4, posicionX: 200, posicionY: 250, forma: 'REDONDA' }
      ]},
      // Mesas para Barra
      { sectorIndex: 3, sectorName: 'Barra', mesas: [
        { numero: 'B1', capacidad: 2, posicionX: 50, posicionY: 50, forma: 'CUADRADA' },
        { numero: 'B2', capacidad: 2, posicionX: 150, posicionY: 50, forma: 'CUADRADA' },
        { numero: 'B3', capacidad: 2, posicionX: 250, posicionY: 50, forma: 'CUADRADA' },
        { numero: 'B4', capacidad: 2, posicionX: 350, posicionY: 50, forma: 'CUADRADA' }
      ]}
    ];

    let totalMesasCreadas = 0;

    for (const definicion of mesasDefiniciones) {
      const sector = sectoresCreados[definicion.sectorIndex];
      if (!sector) continue;

      for (const mesaData of definicion.mesas) {
        // Verificar si la mesa ya existe
        const mesaExistente = await prisma.mesa.findFirst({
          where: {
            numero: mesaData.numero,
            sectorId: sector.id
          }
        });

        if (mesaExistente) {
          console.log(`   ⚠️ Mesa ya existe: ${mesaData.numero} (${definicion.sectorName})`);
        } else {
          await prisma.mesa.create({
            data: {
              ...mesaData,
              size: 50, // Tamaño por defecto
              sectorId: sector.id,
              usuarioId: adminUser.id
            }
          });
          totalMesasCreadas++;
          console.log(`   ✅ Mesa creada: ${mesaData.numero} (${definicion.sectorName})`);
        }
      }
    }

    // 3. Crear algunos objetos decorativos (solo si no existen)
    console.log('🏛️ Verificando objetos decorativos...');

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

    let totalObjetosCreados = 0;

    for (const objetoData of objetosDecorativos) {
      // Verificar si el objeto ya existe
      const objetoExistente = await prisma.objetoDecorativo.findFirst({
        where: {
          nombre: objetoData.nombre,
          sectorId: objetoData.sectorId
        }
      });

      if (objetoExistente) {
        console.log(`   ⚠️ Objeto decorativo ya existe: ${objetoData.nombre}`);
      } else {
        await prisma.objetoDecorativo.create({
          data: {
            ...objetoData,
            usuarioId: adminUser.id
          }
        });
        totalObjetosCreados++;
        console.log(`   ✅ Objeto decorativo creado: ${objetoData.nombre}`);
      }
    }

    console.log('\n🎉 ¡Semilla de mesas y sectores completada exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   - ${sectoresCreados.length} sectores disponibles`);
    console.log(`   - ${totalMesasCreadas} mesas nuevas creadas`);
    console.log(`   - ${totalObjetosCreados} objetos decorativos nuevos creados`);

  } catch (error) {
    console.error('❌ Error durante la semilla de mesas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la semilla
seedMesas().catch(console.error); 