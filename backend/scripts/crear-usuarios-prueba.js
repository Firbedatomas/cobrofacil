import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function crearUsuariosPrueba() {
  console.log('🚀 Creando usuarios de prueba...');

  try {
    // Usuarios de prueba con diferentes roles
    const usuarios = [
      {
        email: 'admin@cobrofacil.io',
        nombre: 'Admin',
        apellido: 'Sistema',
        password: '123456',
        rol: 'ADMIN'
      },
      {
        email: 'supervisor@cobrofacil.io',
        nombre: 'Supervisor',
        apellido: 'Principal',
        password: '123456',
        rol: 'SUPERVISOR'
      },
      {
        email: 'cajero1@cobrofacil.io',
        nombre: 'Cajero',
        apellido: 'Uno',
        password: '123456',
        rol: 'CAJERO'
      },
      {
        email: 'mozo1@cobrofacil.io',
        nombre: 'Juan',
        apellido: 'Pérez',
        password: '123456',
        rol: 'MOZO'
      },
      {
        email: 'mozo2@cobrofacil.io',
        nombre: 'María',
        apellido: 'González',
        password: '123456',
        rol: 'MOZO'
      },
      {
        email: 'mozo3@cobrofacil.io',
        nombre: 'Carlos',
        apellido: 'Rodríguez',
        password: '123456',
        rol: 'MOZO'
      }
    ];

    // Crear usuarios uno por uno
    for (const userData of usuarios) {
      // Verificar si el usuario ya existe
      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email: userData.email }
      });

      if (usuarioExistente) {
        console.log(`⚠️  Usuario ${userData.email} ya existe, saltando...`);
        continue;
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Crear usuario
      const nuevoUsuario = await prisma.usuario.create({
        data: {
          email: userData.email,
          nombre: userData.nombre,
          apellido: userData.apellido,
          password: hashedPassword,
          rol: userData.rol,
          activo: true
        }
      });

      console.log(`✅ Usuario creado: ${userData.email} (${userData.rol})`);
    }

    console.log('\n🎉 Usuarios de prueba creados exitosamente!');
    console.log('\n📋 Credenciales para testing:');
    console.log('================================');
    usuarios.forEach(user => {
      console.log(`${user.rol}: ${user.email} / 123456`);
    });
    console.log('================================\n');

  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
crearUsuariosPrueba(); 