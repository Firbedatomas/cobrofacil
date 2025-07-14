import { prisma } from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';

class AfipService {
  constructor() {
    this.configuracion = null;
    this.estadoConexion = 'DESCONECTADO';
  }

  // Verificar configuración AFIP
  async verificarConfiguracion() {
    try {
      this.configuracion = await prisma.configuracionAfip.findFirst();
      
      if (!this.configuracion) {
        // Crear configuración por defecto
        this.configuracion = await prisma.configuracionAfip.create({
          data: {
            habilitado: false,
            ambiente: 'TESTING',
            puntoVenta: 1
          }
        });
      }

      return {
        configurado: this.configuracion.habilitado,
        advertencias: this.getAdvertencias(),
        estado: this.estadoConexion,
        certificados: {
          certificado: !!this.configuracion.certificado,
          clavePrivada: !!this.configuracion.clavePrivada
        }
      };
    } catch (error) {
      console.error('Error verificando configuración AFIP:', error);
      return {
        configurado: false,
        advertencias: ['Error al verificar configuración AFIP'],
        estado: 'ERROR',
        certificados: {
          certificado: false,
          clavePrivada: false
        }
      };
    }
  }

  // Obtener advertencias AFIP
  getAdvertencias() {
    const advertencias = [];

    if (!this.configuracion?.habilitado) {
      advertencias.push('AFIP no configurado - Operando en modo offline');
    }

    if (!this.configuracion?.cuitEmpresa) {
      advertencias.push('CUIT de empresa no configurado');
    }

    if (!this.configuracion?.certificado) {
      advertencias.push('Certificado AFIP no configurado');
    }

    if (!this.configuracion?.clavePrivada) {
      advertencias.push('Clave privada AFIP no configurada');
    }

    if (this.configuracion?.ambiente === 'TESTING') {
      advertencias.push('Ambiente de testing AFIP activo');
    }

    return advertencias;
  }

  // Actualizar certificado
  async actualizarCertificado(tipoCertificado, rutaArchivo) {
    try {
      // Verificar que el archivo existe
      await fs.access(rutaArchivo);

      // Leer el contenido del archivo
      const contenido = await fs.readFile(rutaArchivo, 'utf8');

      // Validar formato básico
      if (tipoCertificado === 'certificado' && !contenido.includes('-----BEGIN CERTIFICATE-----')) {
        throw new Error('El archivo no parece ser un certificado válido (.crt)');
      }

      if (tipoCertificado === 'clavePrivada' && !contenido.includes('-----BEGIN')) {
        throw new Error('El archivo no parece ser una clave privada válida (.key)');
      }

      // Actualizar la base de datos
      const datosActualizacion = {};
      if (tipoCertificado === 'certificado') {
        datosActualizacion.certificado = rutaArchivo;
      } else if (tipoCertificado === 'clavePrivada') {
        datosActualizacion.clavePrivada = rutaArchivo;
      }

      this.configuracion = await prisma.configuracionAfip.upsert({
        where: { id: this.configuracion?.id || 'new' },
        update: datosActualizacion,
        create: {
          habilitado: false,
          ambiente: 'TESTING',
          puntoVenta: 1,
          ...datosActualizacion
        }
      });

      return {
        success: true,
        message: `${tipoCertificado === 'certificado' ? 'Certificado' : 'Clave privada'} actualizado correctamente`
      };

    } catch (error) {
      // Si hay error, intentar eliminar el archivo subido
      try {
        await fs.unlink(rutaArchivo);
      } catch (unlinkError) {
        console.error('Error eliminando archivo tras falla:', unlinkError);
      }

      throw new Error(`Error procesando certificado: ${error.message}`);
    }
  }

  // Eliminar certificado
  async eliminarCertificado(tipoCertificado) {
    try {
      let rutaArchivo = null;
      
      if (tipoCertificado === 'certificado') {
        rutaArchivo = this.configuracion?.certificado;
      } else if (tipoCertificado === 'clavePrivada') {
        rutaArchivo = this.configuracion?.clavePrivada;
      }

      // Eliminar archivo del sistema si existe
      if (rutaArchivo) {
        try {
          await fs.unlink(rutaArchivo);
        } catch (error) {
          console.warn('No se pudo eliminar el archivo físico:', rutaArchivo);
        }
      }

      // Actualizar la base de datos
      const datosActualizacion = {};
      if (tipoCertificado === 'certificado') {
        datosActualizacion.certificado = null;
      } else if (tipoCertificado === 'clavePrivada') {
        datosActualizacion.clavePrivada = null;
      }

      this.configuracion = await prisma.configuracionAfip.update({
        where: { id: this.configuracion.id },
        data: datosActualizacion
      });

      return {
        success: true,
        message: `${tipoCertificado === 'certificado' ? 'Certificado' : 'Clave privada'} eliminado correctamente`
      };

    } catch (error) {
      throw new Error(`Error eliminando certificado: ${error.message}`);
    }
  }

  // Generar número de comprobante
  async generarNumeroComprobante(tipoComprobante, puntoVenta = 1) {
    try {
      // Buscar último número usado
      const ultimaVenta = await prisma.venta.findFirst({
        where: {
          tipoComprobante,
          puntoVenta
        },
        orderBy: {
          numeroComprobante: 'desc'
        }
      });

      let numeroSiguiente = 1;
      if (ultimaVenta?.numeroComprobante) {
        numeroSiguiente = parseInt(ultimaVenta.numeroComprobante) + 1;
      }

      return numeroSiguiente.toString().padStart(8, '0');
    } catch (error) {
      console.error('Error generando número de comprobante:', error);
      return Date.now().toString(); // Fallback
    }
  }

  // Validar CAE (simulado)
  async solicitarCAE(venta) {
    if (!this.configuracion?.habilitado) {
      return {
        success: false,
        message: 'AFIP no habilitado - Venta procesada sin CAE',
        cae: null
      };
    }

    try {
      // Simulación de solicitud CAE
      const cae = this.generarCAESimulado();
      const vencimiento = new Date();
      vencimiento.setDate(vencimiento.getDate() + 10); // 10 días de validez

      return {
        success: true,
        cae,
        vencimiento,
        message: 'CAE obtenido correctamente'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error al solicitar CAE: ' + error.message,
        cae: null
      };
    }
  }

  // Generar CAE simulado para testing
  generarCAESimulado() {
    const timestamp = Date.now().toString();
    return `${timestamp.slice(-8)}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  // Obtener tipos de comprobante válidos
  getTiposComprobante() {
    return [
      { codigo: 'TICKET_NO_FISCAL', nombre: 'Ticket No Fiscal', requiereAfip: false },
      { codigo: 'TICKET_FISCAL', nombre: 'Ticket Fiscal', requiereAfip: true },
      { codigo: 'FACTURA_A', nombre: 'Factura A', requiereAfip: true },
      { codigo: 'FACTURA_B', nombre: 'Factura B', requiereAfip: true },
      { codigo: 'NOTA_DE_CREDITO', nombre: 'Nota de Crédito', requiereAfip: true },
      { codigo: 'NOTA_DE_DEBITO', nombre: 'Nota de Débito', requiereAfip: true }
    ];
  }

  // Actualizar configuración
  async actualizarConfiguracion(datos) {
    try {
      this.configuracion = await prisma.configuracionAfip.upsert({
        where: { id: this.configuracion?.id || 'new' },
        update: datos,
        create: datos
      });

      return {
        success: true,
        message: 'Configuración AFIP actualizada'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error actualizando configuración: ' + error.message
      };
    }
  }
}

export const afipService = new AfipService(); 