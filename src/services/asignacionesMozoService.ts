// ===============================================
// SERVICIO DE ASIGNACIONES MOZO-MESA
// Manejo de persistencia de la relación mozo-mesa
// ===============================================

import api from './api';
import { toastService } from './toastService';

export interface AsignacionMozo {
  id: string;
  mesaId: string;
  mozoId: string;
  fechaAsignacion: Date;
  fechaLiberacion?: Date;
  activa: boolean;
  observaciones?: string;
  mesa: {
    id: string;
    numero: string;
    estado: string;
  };
  mozo: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  asignadoPor: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface MozoAsignado {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  fechaAsignacion: Date;
  observaciones?: string;
}

class AsignacionesMozoService {
  private static instance: AsignacionesMozoService;
  private cache: Map<string, AsignacionMozo> = new Map();

  private constructor() {
    console.log('🚀 AsignacionesMozoService iniciado');
  }

  static getInstance(): AsignacionesMozoService {
    if (!AsignacionesMozoService.instance) {
      AsignacionesMozoService.instance = new AsignacionesMozoService();
    }
    return AsignacionesMozoService.instance;
  }

  // ===============================================
  // MÉTODOS PRINCIPALES
  // ===============================================

  /**
   * Asignar mozo a mesa - Persistencia inmediata
   */
  async asignarMozo(mesaId: string, mozoId: string, observaciones?: string): Promise<AsignacionMozo> {
    try {
      // Validación estricta de parámetros
      if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
        throw new Error('ID de mesa inválido');
      }

      if (!mozoId || typeof mozoId !== 'string' || mozoId.trim() === '') {
        throw new Error('ID de mozo inválido');
      }

      console.log('🎯 Asignando mozo a mesa:', { mesaId, mozoId, observaciones });

      const response = await api.post('/asignaciones-mozo', {
        mesaId,
        mozoId,
        observaciones
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error al asignar mozo');
      }

      const asignacion: AsignacionMozo = {
        ...response.data.data,
        fechaAsignacion: new Date(response.data.data.fechaAsignacion)
      };

      // Actualizar cache
      this.cache.set(mesaId, asignacion);

      console.log('✅ Mozo asignado exitosamente:', {
        mesa: asignacion.mesa.numero,
        mozo: `${asignacion.mozo.nombre} ${asignacion.mozo.apellido}`
      });

      return asignacion;

    } catch (error: any) {
      console.error('❌ Error asignando mozo:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toastService.error(`Error al asignar mozo: ${errorMessage}`);
      
      throw error;
    }
  }

  /**
   * Obtener mozo asignado a una mesa
   */
  async obtenerMozoAsignado(mesaId: string): Promise<MozoAsignado | null> {
    try {
      // Validación estricta del parámetro
      if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
        console.warn('⚠️ obtenerMozoAsignado: mesaId inválido:', mesaId);
        return null;
      }

      // Verificar cache primero
      const cacheKey = mesaId;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (cached && cached.activa) {
          return {
            id: cached.mozo.id,
            nombre: cached.mozo.nombre,
            apellido: cached.mozo.apellido,
            email: cached.mozo.email,
            fechaAsignacion: cached.fechaAsignacion,
            observaciones: cached.observaciones
          };
        }
      }

      const response = await api.get(`/asignaciones-mozo/mesa/${mesaId}`);

      if (!response.data.success) {
        // No hay asignación activa
        this.cache.delete(cacheKey);
        return null;
      }

      const asignacion: AsignacionMozo = {
        ...response.data.data,
        fechaAsignacion: new Date(response.data.data.fechaAsignacion)
      };

      // Actualizar cache
      this.cache.set(cacheKey, asignacion);

      return {
        id: asignacion.mozo.id,
        nombre: asignacion.mozo.nombre,
        apellido: asignacion.mozo.apellido,
        email: asignacion.mozo.email,
        fechaAsignacion: asignacion.fechaAsignacion,
        observaciones: asignacion.observaciones
      };

    } catch (error: any) {
      if (error.response?.status === 404) {
        // No hay asignación activa
        this.cache.delete(mesaId);
        return null;
      }

      console.error('❌ Error obteniendo mozo asignado:', error);
      return null;
    }
  }

  /**
   * Verificar si una mesa tiene mozo asignado
   */
  async tieneMozoAsignado(mesaId: string): Promise<boolean> {
    try {
      const mozo = await this.obtenerMozoAsignado(mesaId);
      return mozo !== null;
    } catch (error) {
      console.error('❌ Error verificando mozo asignado:', error);
      return false;
    }
  }

  /**
   * Cambiar mozo de una mesa
   */
  async cambiarMozo(mesaId: string, nuevoMozoId: string, observaciones?: string): Promise<AsignacionMozo> {
    try {
      // Validación estricta de parámetros
      if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
        throw new Error('ID de mesa inválido');
      }

      if (!nuevoMozoId || typeof nuevoMozoId !== 'string' || nuevoMozoId.trim() === '') {
        throw new Error('ID del nuevo mozo inválido');
      }

      console.log('🔄 Cambiando mozo de mesa:', { mesaId, nuevoMozoId, observaciones });

      const response = await api.put(`/asignaciones-mozo/mesa/${mesaId}/cambiar`, {
        nuevoMozoId,
        observaciones
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error al cambiar mozo');
      }

      const asignacion: AsignacionMozo = {
        ...response.data.data,
        fechaAsignacion: new Date(response.data.data.fechaAsignacion)
      };

      // Actualizar cache
      this.cache.set(mesaId, asignacion);

      console.log('✅ Mozo cambiado exitosamente:', {
        mesa: asignacion.mesa.numero,
        nuevoMozo: `${asignacion.mozo.nombre} ${asignacion.mozo.apellido}`
      });

      toastService.success(`Mozo cambiado a ${asignacion.mozo.nombre} ${asignacion.mozo.apellido}`);

      return asignacion;

    } catch (error: any) {
      console.error('❌ Error cambiando mozo:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toastService.error(`Error al cambiar mozo: ${errorMessage}`);
      
      throw error;
    }
  }

  /**
   * Liberar mozo de una mesa
   */
  async liberarMozo(mesaId: string, observaciones?: string): Promise<void> {
    try {
      // Validación estricta del parámetro
      if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
        throw new Error('ID de mesa inválido');
      }

      // Primero obtener la asignación activa
      const asignacion = await this.obtenerAsignacionActiva(mesaId);
      if (!asignacion) {
        console.warn('⚠️ No hay asignación activa para liberar en mesa:', mesaId);
        return;
      }

      console.log('🔓 Liberando mozo de mesa:', { mesaId, observaciones });

      const response = await api.put(`/asignaciones-mozo/${asignacion.id}/liberar`, {
        observaciones
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Error al liberar mozo');
      }

      // Limpiar cache
      this.cache.delete(mesaId);

      console.log('✅ Mozo liberado exitosamente de mesa:', mesaId);

    } catch (error: any) {
      console.error('❌ Error liberando mozo:', error);
      
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      toastService.error(`Error al liberar mozo: ${errorMessage}`);
      
      throw error;
    }
  }

  /**
   * Obtener asignación activa completa de una mesa
   */
  async obtenerAsignacionActiva(mesaId: string): Promise<AsignacionMozo | null> {
    try {
      const response = await api.get(`/asignaciones-mozo/mesa/${mesaId}`);

      if (!response.data.success) {
        return null;
      }

      const asignacion: AsignacionMozo = {
        ...response.data.data,
        fechaAsignacion: new Date(response.data.data.fechaAsignacion)
      };

      return asignacion;

    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }

      console.error('❌ Error obteniendo asignación activa:', error);
      return null;
    }
  }

  /**
   * Obtener todas las asignaciones activas de un mozo
   */
  async obtenerAsignacionesMozo(mozoId: string): Promise<AsignacionMozo[]> {
    try {
      const response = await api.get(`/asignaciones-mozo/mozo/${mozoId}`);

      if (!response.data.success) {
        return [];
      }

      return response.data.data.map((asignacion: any) => ({
        ...asignacion,
        fechaAsignacion: new Date(asignacion.fechaAsignacion)
      }));

    } catch (error: any) {
      console.error('❌ Error obteniendo asignaciones de mozo:', error);
      return [];
    }
  }

  /**
   * Obtener todas las asignaciones activas
   */
  async obtenerTodasAsignaciones(): Promise<AsignacionMozo[]> {
    try {
      const response = await api.get('/asignaciones-mozo');

      if (!response.data.success) {
        return [];
      }

      return response.data.data.map((asignacion: any) => ({
        ...asignacion,
        fechaAsignacion: new Date(asignacion.fechaAsignacion)
      }));

    } catch (error: any) {
      console.error('❌ Error obteniendo todas las asignaciones:', error);
      return [];
    }
  }

  // ===============================================
  // MÉTODOS DE UTILIDAD
  // ===============================================

  /**
   * Limpiar cache de asignaciones
   */
  limpiarCache(): void {
    this.cache.clear();
    console.log('🧹 Cache de asignaciones limpiado');
  }

  /**
   * Validar que un usuario puede ser asignado como mozo
   */
  async validarMozo(usuarioId: string): Promise<boolean> {
    try {
      const response = await api.get(`/usuarios/${usuarioId}`);
      
      if (!response.data.success) {
        return false;
      }

      const usuario = response.data.data;
      return usuario.rol === 'MOZO' && usuario.activo;

    } catch (error) {
      console.error('❌ Error validando mozo:', error);
      return false;
    }
  }

  /**
   * Obtener nombre completo del mozo para mostrar en UI
   */
  static formatearNombreMozo(mozo: MozoAsignado): string {
    return `${mozo.nombre} ${mozo.apellido}`.trim();
  }

  /**
   * Obtener información resumida del mozo para debugging
   */
  static obtenerInfoMozo(mozo: MozoAsignado): string {
    return `${mozo.nombre} ${mozo.apellido} (${mozo.email})`;
  }
}

// Instancia singleton
export const asignacionesMozoService = AsignacionesMozoService.getInstance();
export default asignacionesMozoService; 