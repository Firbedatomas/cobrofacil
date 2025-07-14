import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';

// Middleware para verificar token JWT
export const verificarToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que la sesión esté activa en la base de datos
    const sesion = await prisma.sesionUsuario.findFirst({
      where: {
        token,
        activa: true,
        usuario: {
          id: decoded.usuarioId,
          activo: true
        }
      },
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            rol: true,
            activo: true
          }
        }
      }
    });

    if (!sesion) {
      return res.status(401).json({
        error: 'Token inválido o sesión expirada'
      });
    }

    // Agregar información del usuario a la request
    req.usuarioId = decoded.usuarioId;
    req.usuario = sesion.usuario;
    req.token = token;

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido'
      });
    }

    if (error.name === 'TokenExpiredError') {
      // Marcar la sesión como inactiva si el token expiró
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
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
      } catch (dbError) {
        console.error('Error actualizando sesión expirada:', dbError);
      }

      return res.status(401).json({
        error: 'Token expirado'
      });
    }

    console.error('Error en verificación de token:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar roles específicos
export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

// Middleware específico para administradores
export const verificarAdmin = verificarRol(['ADMIN']);

// Middleware específico para supervisores y administradores
export const verificarSupervisor = verificarRol(['ADMIN', 'SUPERVISOR']);

// Middleware para limpiar sesiones expiradas (se puede usar en una tarea programada)
export const limpiarSesionesExpiradas = async () => {
  try {
    const fechaExpiracion = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas atrás

    await prisma.sesionUsuario.updateMany({
      where: {
        fechaInicio: {
          lt: fechaExpiracion
        },
        activa: true
      },
      data: {
        activa: false,
        fechaFin: new Date()
      }
    });

    console.log('✅ Sesiones expiradas limpiadas correctamente');
  } catch (error) {
    console.error('❌ Error limpiando sesiones expiradas:', error);
  }
}; 