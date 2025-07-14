import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando proceso de semillas...');

  try {
    // Limpiar datos existentes (opcional - descomenta si quieres limpiar)
    // await prisma.detalleVenta.deleteMany();
    // await prisma.venta.deleteMany();
    // await prisma.movimientoStock.deleteMany();
    // await prisma.producto.deleteMany();
    // await prisma.categoria.deleteMany();
    // await prisma.sesionUsuario.deleteMany();
    // await prisma.usuario.deleteMany();
    // await prisma.configuracionSistema.deleteMany();

    // 1. Crear usuario administrador
    console.log('👤 Creando usuario administrador...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    
    const admin = await prisma.usuario.upsert({
      where: { email: 'admin@cobrofacil.io' },
      update: {},
      create: {
        email: 'admin@cobrofacil.io',
        nombre: 'Administrador',
        apellido: 'Sistema',
        password: adminPassword,
        rol: 'ADMIN'
      }
    });
    console.log(`✅ Usuario administrador creado: ${admin.email}`);

    // 2. Crear usuarios adicionales
    console.log('👥 Creando usuarios adicionales...');
    const supervisorPassword = await bcrypt.hash('supervisor123', 12);
    const cajeroPassword = await bcrypt.hash('cajero123', 12);

    const supervisor = await prisma.usuario.upsert({
      where: { email: 'supervisor@cobrofacil.io' },
      update: {},
      create: {
        email: 'supervisor@cobrofacil.io',
        nombre: 'Juan Carlos',
        apellido: 'Supervisor',
        password: supervisorPassword,
        rol: 'SUPERVISOR'
      }
    });

    const cajero1 = await prisma.usuario.upsert({
      where: { email: 'cajero1@cobrofacil.io' },
      update: {},
      create: {
        email: 'cajero1@cobrofacil.io',
        nombre: 'María Elena',
        apellido: 'Cajera',
        password: cajeroPassword,
        rol: 'CAJERO'
      }
    });

    const cajero2 = await prisma.usuario.upsert({
      where: { email: 'cajero2@cobrofacil.io' },
      update: {},
      create: {
        email: 'cajero2@cobrofacil.io',
        nombre: 'Carlos',
        apellido: 'Mendoza',
        password: cajeroPassword,
        rol: 'CAJERO'
      }
    });

    console.log(`✅ Usuarios creados: ${supervisor.email}, ${cajero1.email}, ${cajero2.email}`);

// 3. Crear categorías
console.log('📂 Creando categorías...');
const categorias = [
  { nombre: 'Cafetería', descripcion: 'Diferentes tipos de café y bebidas calientes' },
  { nombre: 'Breaks', descripcion: 'Packs para compartir, ideales para breaks y reuniones' },
  { nombre: 'Panadería', descripcion: 'Productos de panadería tradicionales y frescos' },
  { nombre: 'Bebidas', descripcion: 'Jugos, refrescos y bebidas frías' },
  { nombre: 'Pastelería', descripcion: 'Pasteles, galletas, budines y dulces' },
  { nombre: 'Salados', descripcion: 'Snacks salados, sandwichitos y minitartas' },
  { nombre: 'Sin TACC', descripcion: 'Productos aptos para celíacos' },
  { nombre: 'Almuerzos', descripcion: 'Comidas principales listas para servir' },
  { nombre: 'Almuerzos CHEFF', descripcion: 'Platos elaborados por chefs profesionales' },
  { nombre: 'Promociones', descripcion: 'Ofertas especiales y combos destacados' },
  { nombre: 'Take Away', descripcion: 'Opciones para llevar, listas para consumir' },
  { nombre: 'Grupo Libertad', descripcion: 'Productos exclusivos para Grupo Libertad' },
  { nombre: 'Acompañamientos', descripcion: 'Guarniciones, salsas y extras para tus comidas' },
  { nombre: 'Productos Bonafide', descripcion: 'Productos originales de la marca Bonafide' },
  { nombre: 'Molido', descripcion: 'Café molido en diferentes variedades' },
  { nombre: 'Cápsulas', descripcion: 'Cápsulas de café compatibles con máquinas' },
  { nombre: 'Cafeteras', descripcion: 'Cafeteras y accesorios para preparar café' },
  { nombre: 'Impresiones', descripcion: 'Servicios de impresión personalizados o institucionales' }
];


    const categoriasCreadas = [];
    for (const cat of categorias) {
      const categoria = await prisma.categoria.upsert({
        where: { nombre: cat.nombre },
        update: {},
        create: cat
      });
      categoriasCreadas.push(categoria);
    }
    console.log(`✅ ${categoriasCreadas.length} categorías creadas`);

    // 4. Crear productos
    console.log('📦 Creando productos...');
    const productos = [
      { codigo: '1', nombre: 'Cafe doble', precio: 3900, categoriaId: categoriasCreadas[0].id },
      { codigo: '2', nombre: 'Cafe en jarro', precio: 3400, categoriaId: categoriasCreadas[0].id },
      { codigo: '3', nombre: 'Cafe chico', precio: 2900, categoriaId: categoriasCreadas[0].id },
      { codigo: '4', nombre: 'Cafe tazon', precio: 4600, categoriaId: categoriasCreadas[0].id },
      { codigo: '5', nombre: 'Adicional Tazon', precio: 700, categoriaId: categoriasCreadas[0].id },
      { codigo: '6', nombre: 'Cafe doble con crema', precio: 4300, categoriaId: categoriasCreadas[0].id },
      { codigo: '7', nombre: 'Cafe en jarro con crema', precio: 3800, categoriaId: categoriasCreadas[0].id },
      { codigo: '8', nombre: 'Cafe con crema', precio: 3300, categoriaId: categoriasCreadas[0].id },
      { codigo: '9', nombre: 'Adicional Crema', precio: 400, categoriaId: categoriasCreadas[0].id },
      { codigo: '10', nombre: 'Te/mate cocido con o sin leche', precio: 2900, categoriaId: categoriasCreadas[0].id },
      { codigo: '11', nombre: 'Jarro + 2 Medialunas', precio: 6300, categoriaId: categoriasCreadas[1].id },
      { codigo: '12', nombre: 'Medialuna/Criollo', precio: 1800, categoriaId: categoriasCreadas[2].id },
      { codigo: '13', nombre: 'Media docena de medialunas', precio: 1800, categoriaId: categoriasCreadas[2].id },
      { codigo: '14', nombre: 'Docena de medialunas', precio: 10800, categoriaId: categoriasCreadas[2].id },
      { codigo: '15', nombre: 'Gaseosa/agua c/ gas/sin gas/saborizada', precio: 1900, categoriaId: categoriasCreadas[3].id },
      { codigo: '16', nombre: 'Cerveza Stella Artois 330ml', precio: 2900, categoriaId: categoriasCreadas[3].id },
      { codigo: '17', nombre: 'Cerveza Stella Artois 330ml', precio: 2900, categoriaId: categoriasCreadas[3].id },
      { codigo: '18', nombre: 'Cerveza Corona 330cc', precio: 2900, categoriaId: categoriasCreadas[3].id },
      { codigo: '19', nombre: 'Cerveza Corona 0.0% Alcohol 330cc', precio: 2900, categoriaId: categoriasCreadas[3].id },
      { codigo: '20', nombre: 'Cerveza Andes Origen roja 473cc', precio: 3900, categoriaId: categoriasCreadas[3].id },
      { codigo: '21', nombre: 'Cerveza Patagonia Amber Weisse 730cc', precio: 5900, categoriaId: categoriasCreadas[3].id },
      { codigo: '22', nombre: 'Copa de vino', precio: 4900, categoriaId: categoriasCreadas[3].id },
      { codigo: '23', nombre: 'Porcion de torta', precio: 6400, categoriaId: categoriasCreadas[4].id },
      { codigo: '24', nombre: 'Postre individual', precio: 5500, categoriaId: categoriasCreadas[4].id },
      { codigo: '25', nombre: 'Tostado', precio: 8700, categoriaId: categoriasCreadas[5].id },
      { codigo: '26', nombre: 'Tostado Napolitano', precio: 9400, categoriaId: categoriasCreadas[5].id },
      { codigo: '27', nombre: 'Tostado arabe', precio: 9400, categoriaId: categoriasCreadas[5].id },
      { codigo: '28', nombre: 'Bagel con Jamón Crudo Queso Crema BONAFIDE c/ papas', precio: 7500, categoriaId: categoriasCreadas[5].id },
      { codigo: '29', nombre: 'Ciabatta de pollo', precio: 8900, categoriaId: categoriasCreadas[5].id },
      { codigo: '30', nombre: 'Ciabatta Veggie', precio: 8900, categoriaId: categoriasCreadas[5].id },
      { codigo: '31', nombre: 'Croissant jamon y queso BONAFIDE', precio: 4900, categoriaId: categoriasCreadas[5].id },
      { codigo: '32', nombre: 'Avocado toast c/ semillas', precio: 5500, categoriaId: categoriasCreadas[5].id },
      { codigo: '33', nombre: 'Tostado sin TACC', precio: 8700, categoriaId: categoriasCreadas[6].id },
      { codigo: '34', nombre: 'Baguette cocido/crudo', precio: 7700, categoriaId: categoriasCreadas[5].id },
      { codigo: '35', nombre: 'Muffin', precio: 3900, categoriaId: categoriasCreadas[4].id },
      { codigo: '36', nombre: 'Waffle', precio: 4900, categoriaId: categoriasCreadas[4].id },
      { codigo: '37', nombre: 'Roll de manzana y canela', precio: 3900, categoriaId: categoriasCreadas[4].id },
      { codigo: '38', nombre: 'Tostadas x 3 con queso crema y mermelada', precio: 2800, categoriaId: categoriasCreadas[4].id },
      { codigo: '39', nombre: 'Yogur artesanal, granola, frutas, miel/sésamo', precio: 6900, categoriaId: categoriasCreadas[4].id },
      { codigo: '40', nombre: 'Budin', precio: 2900, categoriaId: categoriasCreadas[4].id },
      { codigo: '41', nombre: 'Patisserie SIN TACC', precio: 5900, categoriaId: categoriasCreadas[6].id },
      { codigo: '42', nombre: 'Ejecutivo Milanesa de ojo de bife', precio: 13990, categoriaId: categoriasCreadas[7].id },
      { codigo: '43', nombre: 'Ejecutivo Pechuga de pollo grille', precio: 12900, categoriaId: categoriasCreadas[7].id },
      { codigo: '44', nombre: 'Ejecutivo Tallarines caseros al huevo', precio: 10900, categoriaId: categoriasCreadas[7].id },
      { codigo: '45', nombre: 'Ejecutivo Ojo de bife (200gr)', precio: 12900, categoriaId: categoriasCreadas[7].id },
      { codigo: '46', nombre: 'Ejecutivo salteado de Arroz con hongos y vegetales', precio: 10900, categoriaId: categoriasCreadas[7].id },
      { codigo: '47', nombre: 'Ejecutivo Cazuela de lentejas chorizo, carne y verdura', precio: 13900, categoriaId: categoriasCreadas[7].id },
      { codigo: '48', nombre: 'Ejecutivo Ensalada Cesar', precio: 12900, categoriaId: categoriasCreadas[7].id },
      { codigo: '49', nombre: 'Ejecutivo Ensalada Bonafide', precio: 12900, categoriaId: categoriasCreadas[7].id },
      { codigo: '50', nombre: 'Ejecutivo Tarta', precio: 13990, categoriaId: categoriasCreadas[7].id },
      { codigo: '51', nombre: 'Ejecutivo Pizza', precio: 11900, categoriaId: categoriasCreadas[7].id },
      { codigo: '52', nombre: 'Chef menú proteína', precio: 15000, categoriaId: categoriasCreadas[8].id },
      { codigo: '53', nombre: 'Chef menú vegetariano', precio: 16000, categoriaId: categoriasCreadas[8].id },
      { codigo: '54', nombre: 'Chef menú pastas', precio: 17000, categoriaId: categoriasCreadas[8].id },
      { codigo: '55', nombre: 'Ejecutivo adicional Cerveza 330ml', precio: 1000, categoriaId: categoriasCreadas[7].id },
      { codigo: '56', nombre: 'Breaks con medialunas', precio: 6800, categoriaId: categoriasCreadas[9].id },
      { codigo: '57', nombre: 'Breaks con Budin', precio: 5900, categoriaId: categoriasCreadas[9].id },
      { codigo: '58', nombre: 'Breaks completo', precio: 8200, categoriaId: categoriasCreadas[9].id },
      { codigo: '59', nombre: 'Breaks croissant', precio: 7900, categoriaId: categoriasCreadas[9].id },
      { codigo: '60', nombre: 'Breaks cuadrado', precio: 8900, categoriaId: categoriasCreadas[9].id },
      { codigo: '61', nombre: 'Breaks tostado', precio: 11600, categoriaId: categoriasCreadas[9].id },
      { codigo: '62', nombre: 'Breaks Postre individual', precio: 7900, categoriaId: categoriasCreadas[9].id },
      { codigo: '63', nombre: 'Breaks Brunch', precio: 9400, categoriaId: categoriasCreadas[9].id },
      { codigo: '64', nombre: 'Breaks Saludable', precio: 6400, categoriaId: categoriasCreadas[9].id },
      { codigo: '65', nombre: 'Breaks vegano', precio: 7800, categoriaId: categoriasCreadas[9].id },
      { codigo: '66', nombre: 'Breaks Campo', precio: 8900, categoriaId: categoriasCreadas[9].id },
      { codigo: '67', nombre: 'Breaks Americano', precio: 8900, categoriaId: categoriasCreadas[9].id },
      { codigo: '68', nombre: 'Breaks Tazon en Familia', precio: 24900, categoriaId: categoriasCreadas[9].id },
      { codigo: '69', nombre: 'Breaks Avocado toast', precio: 8500, categoriaId: categoriasCreadas[9].id },
      { codigo: '70', nombre: 'Breaks Waffle', precio: 8400, categoriaId: categoriasCreadas[9].id },
      { codigo: '71', nombre: 'Combo c/l + tostado', precio: 14900, categoriaId: categoriasCreadas[1].id },
      { codigo: '72', nombre: 'Combo c/l + porcion de torta', precio: 12900, categoriaId: categoriasCreadas[1].id },
      { codigo: '73', nombre: 'Combo c/l + 2 waffle', precio: 16700, categoriaId: categoriasCreadas[1].id },
      { codigo: '74', nombre: 'Combo c/l + 2 avocado toast', precio: 15900, categoriaId: categoriasCreadas[1].id },
      { codigo: '75', nombre: 'Mega combo 1', precio: 18500, categoriaId: categoriasCreadas[1].id },
      { codigo: '76', nombre: 'Mega combo 2', precio: 20400, categoriaId: categoriasCreadas[1].id },
      { codigo: '77', nombre: 'Cafetera de vidrio con émbolo tipo prensa francesa 600ml', precio: 30490, categoriaId: categoriasCreadas[16].id },
      { codigo: '78', nombre: 'Impresion', precio: 100, categoriaId: categoriasCreadas[17].id },
    ];

    const productosCreados = [];
    for (const prod of productos) {
      const producto = await prisma.producto.upsert({
        where: { codigo: prod.codigo },
        update: {},
        create: {
          codigo: prod.codigo,
          nombre: prod.nombre,
          precio: prod.precio,
          categoriaId: prod.categoriaId,
          activo: true,
          descripcion: `Producto ${prod.nombre}`,
        }
      });
      productosCreados.push(producto);
    }
    console.log(`✅ ${productosCreados.length} productos creados`);

    // 5. Crear configuraciones del sistema
    console.log('⚙️ Creando configuraciones del sistema...');
    const configuraciones = [
      { clave: 'EMPRESA_NOMBRE', valor: 'CobroFacil POS', descripcion: 'Nombre de la empresa' },
      { clave: 'EMPRESA_DIRECCION', valor: 'Av. Córdoba 1234', descripcion: 'Dirección de la empresa' },
      { clave: 'EMPRESA_TELEFONO', valor: '+54 351 123-4567', descripcion: 'Teléfono de la empresa' },
      { clave: 'EMPRESA_EMAIL', valor: 'info@cobrofacil.io', descripcion: 'Email de la empresa' },
      { clave: 'EMPRESA_CUIT', valor: '30-12345678-9', descripcion: 'CUIT de la empresa' },
      { clave: 'MONEDA_DEFECTO', valor: 'ARS', descripcion: 'Moneda por defecto' },
      { clave: 'DECIMALES_PRECIO', valor: '2', descripcion: 'Cantidad de decimales para precios' },
      { clave: 'BACKUP_AUTOMATICO', valor: 'true', descripcion: 'Activar backup automático' },
      { clave: 'BACKUP_FRECUENCIA', valor: '24', descripcion: 'Frecuencia de backup en horas' },
      { clave: 'IMPRESION_AUTOMATICA', valor: 'true', descripcion: 'Impresión automática de tickets' },
      { clave: 'STOCK_MINIMO_ALERTA', valor: '5', descripcion: 'Stock mínimo para alertas' },
      { clave: 'SESION_DURACION', valor: '480', descripcion: 'Duración de sesión en minutos (8 horas)' },
    ];

    for (const config of configuraciones) {
      await prisma.configuracionSistema.upsert({
        where: { clave: config.clave },
        update: { valor: config.valor },
        create: config
      });
    }
    console.log(`✅ ${configuraciones.length} configuraciones creadas`);

    // 6. Crear algunas ventas de ejemplo (opcional)
    console.log('🧾 Creando ventas de ejemplo...');
    
    const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
    
    // Verificar si ya existen ventas, si existen, omitir creación
    const ventasExistentes = await prisma.venta.findMany();
    
    if (ventasExistentes.length === 0) {
      // Venta 1
      const venta1 = await prisma.venta.create({
        data: {
          numeroVenta: `24${timestamp}01`,
          total: 12800,
          subtotal: 12800,
          impuesto: 0,
          descuento: 0,
          metodoPago: 'EFECTIVO',
          usuarioId: cajero1.id,
          fechaVenta: new Date(),
          detalles: {
            create: [
              {
                productoId: productosCreados.find(p => p.codigo === '4').id, // Cafe tazon
                cantidad: 2,
                precioUnitario: 4600,
                subtotal: 9200
              },
              {
                productoId: productosCreados.find(p => p.codigo === '12').id, // Medialuna/Criollo
                cantidad: 2,
                precioUnitario: 1800,
                subtotal: 3600
              }
            ]
          }
        }
      });

      // Venta 2
      const venta2 = await prisma.venta.create({
        data: {
          numeroVenta: `24${timestamp}02`,
          total: 10100,
          subtotal: 10600,
          impuesto: 0,
          descuento: 500,
          metodoPago: 'TARJETA_DEBITO',
          usuarioId: cajero2.id,
          fechaVenta: new Date(),
          detalles: {
            create: [
              {
                productoId: productosCreados.find(p => p.codigo === '25').id, // Tostado
                cantidad: 1,
                precioUnitario: 8700,
                subtotal: 8700
              },
              {
                productoId: productosCreados.find(p => p.codigo === '15').id, // Gaseosa
                cantidad: 1,
                precioUnitario: 1900,
                subtotal: 1900
              }
            ]
          }
        }
      });

      console.log(`✅ 2 ventas de ejemplo creadas`);
    } else {
      console.log(`⏭️ Ventas de ejemplo omitidas (ya existen ${ventasExistentes.length} ventas)`);
    }

    console.log('\n🎉 ¡Proceso de semillas completado exitosamente!');
    console.log('\n📋 Credenciales de acceso:');
    console.log('👤 Administrador:');
    console.log('   Email: admin@cobrofacil.io');
    console.log('   Password: admin123');
    console.log('\n👤 Supervisor:');
    console.log('   Email: supervisor@cobrofacil.io');
    console.log('   Password: supervisor123');
    console.log('\n👤 Cajeros:');
    console.log('   Email: cajero1@cobrofacil.io');
    console.log('   Password: cajero123');
    console.log('   Email: cajero2@cobrofacil.io');
    console.log('   Password: cajero123');

  } catch (error) {
    console.error('❌ Error durante el proceso de semillas:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 