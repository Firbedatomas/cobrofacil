import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken } from '../middleware/auth.js';

const router = express.Router();

// Validaciones
const validacionLogin = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const validacionRegistro = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un email válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre')
    .isLength({ min: 2 })
    .withMessage('El nombre debe tener al menos 2 caracteres')
    .trim(),
  body('apellido')
    .isLength({ min: 2 })
    .withMessage('El apellido debe tener al menos 2 caracteres')
    .trim(),
  body('rol')
    .optional()
    .isIn(['ADMIN', 'SUPERVISOR', 'CAJERO'])
    .withMessage('Rol inválido')
];

// Función para generar token JWT
const generarToken = (usuarioId) => {
  return jwt.sign(
    { usuarioId },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
};

// POST /api/auth/login
router.post('/login', validacionLogin, async (req, res) => {
  try {
    console.log('🔑 Intento de login para:', req.body.email);
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      console.log('❌ Errores de validación:', errores.array());
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { email, password } = req.body;

    // Verificar que JWT_SECRET esté configurado
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET no está configurado');
      return res.status(500).json({
        error: 'Error de configuración del servidor'
      });
    }

    // Buscar usuario en la base de datos
    console.log('🔍 Buscando usuario en base de datos...');
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        password: true
      }
    });

    if (!usuario) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    if (!usuario.activo) {
      console.log('❌ Usuario desactivado:', email);
      return res.status(401).json({
        error: 'Usuario desactivado. Contacte al administrador.'
      });
    }

    // Verificar contraseña
    console.log('🔒 Verificando contraseña...');
    const contraseñaValida = await bcrypt.compare(password, usuario.password);
    if (!contraseñaValida) {
      console.log('❌ Contraseña inválida para:', email);
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
    }

    // Generar token
    console.log('🎟️ Generando token JWT...');
    const token = generarToken(usuario.id);

    // Crear sesión en la base de datos
    console.log('💾 Creando sesión en base de datos...');
    await prisma.sesionUsuario.create({
      data: {
        usuarioId: usuario.id,
        token,
        activa: true
      }
    });

    // Remover password de la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    console.log('✅ Login exitoso para:', email);
    res.status(200).json({
      message: 'Login exitoso',
      token,
      usuario: usuarioSinPassword
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('Stack trace:', error.stack);
    
    // Identificar tipo específico de error
    if (error.name === 'PrismaClientKnownRequestError') {
      console.error('Error de Prisma:', error.code, error.message);
    } else if (error.name === 'JsonWebTokenError') {
      console.error('Error de JWT:', error.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Error de conexión a base de datos');
    }
    
    res.status(500).json({
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/auth/register (solo para administradores)
router.post('/register', verificarToken, validacionRegistro, async (req, res) => {
  try {
    // Verificar que el usuario actual es admin
    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: { rol: true }
    });

    if (usuarioActual.rol !== 'ADMIN') {
      return res.status(403).json({
        error: 'No tienes permisos para registrar usuarios'
      });
    }

    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { email, password, nombre, apellido, rol = 'CAJERO' } = req.body;

    // Verificar si el usuario ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(409).json({
        error: 'Ya existe un usuario con este email'
      });
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        password: passwordHash,
        nombre,
        apellido,
        rol
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        fechaCreacion: true
      }
    });

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      usuario: nuevoUsuario
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/logout
router.post('/logout', verificarToken, async (req, res) => {
  try {
    // Obtener el token del header
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
      // Marcar la sesión como inactiva
      await prisma.sesionUsuario.updateMany({
        where: {
          token,
          activa: true
        },
        data: {
          activa: false,
          fechaFin: new Date()
        }
      });
    }

    res.status(200).json({
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/verify - Verificar si el token es válido
router.get('/verify', verificarToken, async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (verificado por el middleware)
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true
      }
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        error: 'Usuario no encontrado o desactivado'
      });
    }

    res.status(200).json({
      valid: true,
      usuario
    });
  } catch (error) {
    console.error('Error verificando token:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/auth/perfil
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        rol: true,
        activo: true,
        fechaCreacion: true,
        fechaActualizacion: true
      }
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      usuario
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/auth/cambiar-password
router.post('/cambiar-password', verificarToken, [
  body('passwordActual')
    .isLength({ min: 6 })
    .withMessage('Debe proporcionar la contraseña actual'),
  body('passwordNueva')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: errores.array()
      });
    }

    const { passwordActual, passwordNueva } = req.body;

    // Obtener usuario con contraseña
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuarioId },
      select: { id: true, password: true }
    });

    // Verificar contraseña actual
    const contraseñaValida = await bcrypt.compare(passwordActual, usuario.password);
    if (!contraseñaValida) {
      return res.status(401).json({
        error: 'Contraseña actual incorrecta'
      });
    }

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(passwordNueva, 12);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: req.usuarioId },
      data: { password: passwordHash }
    });

    res.status(200).json({
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

export default router; 