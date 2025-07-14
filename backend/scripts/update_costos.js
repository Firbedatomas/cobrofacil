import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function updateCostos() {
  try {
    console.log('Actualizando costos de productos...');

    // Obtener todos los productos
    const productos = await prisma.producto.findMany();

    for (const producto of productos) {
      // Calcular un costo del 60% del precio de venta (margen del 40%)
      const costo = Number(producto.precio) * 0.6;
      
      await prisma.producto.update({
        where: { id: producto.id },
        data: { costo: costo }
      });

      console.log(`Actualizado ${producto.nombre}: Precio ${producto.precio} -> Costo ${costo.toFixed(2)}`);
    }

    console.log('✅ Costos actualizados correctamente');
  } catch (error) {
    console.error('Error actualizando costos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCostos(); 