import api from './api';
import type { 
  Sector, 
  Mesa, 
  ObjetoDecorativo, 
  CrearSectorForm, 
  ActualizarSectorForm,
  CrearMesaForm,
  ActualizarMesaForm,
  CrearObjetoDecorativoForm,
  ActualizarObjetoDecorativoForm,
  EstadoMesa,
  VentaMesa
} from '../types/mesas';

// ============= SECTORES =============

export const sectoresApi = {
  // Obtener todos los sectores
  obtenerTodos: async (): Promise<Sector[]> => {
    const response = await api.get('/sectores');
    return response.data;
  },

  // Obtener un sector por ID
  obtenerPorId: async (id: string): Promise<Sector> => {
    const response = await api.get(`/sectores/${id}`);
    return response.data;
  },

  // Crear nuevo sector
  crear: async (sector: CrearSectorForm): Promise<Sector> => {
    const response = await api.post('/sectores', sector);
    return response.data;
  },

  // Actualizar sector
  actualizar: async (id: string, sector: ActualizarSectorForm): Promise<Sector> => {
    const response = await api.put(`/sectores/${id}`, sector);
    return response.data;
  },

  // Eliminar sector
  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/sectores/${id}`);
  },

  // Reordenar sectores
  reordenar: async (sectores: { id: string; orden: number }[]): Promise<void> => {
    await api.patch('/sectores/reordenar', { sectores });
  }
};

// ============= MESAS =============

export const mesasApi = {
  // Obtener todas las mesas
  obtenerTodas: async (sectorId?: string): Promise<Mesa[]> => {
    const params = sectorId ? { sectorId } : {};
    const response = await api.get('/mesas', { params });
    return response.data;
  },

  // Obtener una mesa por ID
  obtenerPorId: async (id: string): Promise<Mesa> => {
    const response = await api.get(`/mesas/${id}`);
    return response.data;
  },

  // Crear nueva mesa
  crear: async (mesa: CrearMesaForm): Promise<Mesa> => {
    const response = await api.post('/mesas', mesa);
    return response.data;
  },

  // Actualizar mesa
  actualizar: async (id: string, mesa: ActualizarMesaForm): Promise<Mesa> => {
    const response = await api.put(`/mesas/${id}`, mesa);
    return response.data;
  },

  // Cambiar estado de mesa
  cambiarEstado: async (id: string, estado: EstadoMesa): Promise<Mesa> => {
    const response = await api.patch(`/mesas/${id}/estado`, { estado });
    return response.data;
  },

  // Actualizar posición de mesa (para drag & drop)
  actualizarPosicion: async (id: string, posicionX: number, posicionY: number): Promise<Mesa> => {
    const response = await api.patch(`/mesas/${id}/posicion`, { posicionX, posicionY });
    return response.data;
  },

  // Eliminar mesa
  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/mesas/${id}`);
  },

  // Obtener venta activa de una mesa
  obtenerVentaActiva: async (id: string): Promise<VentaMesa | null> => {
    const response = await api.get(`/mesas/${id}/venta-activa`);
    return response.data;
  },

  // Transferir ítems entre mesas
  transferirItems: async (
    mesaOrigenId: string, 
    mesaDestinoId: string, 
    itemsIds?: string[], 
    transferirTodos: boolean = true
  ): Promise<{ message: string; itemsTransferidos: number; totalTransferido: number; mesaOrigenVacia: boolean }> => {
    const response = await api.post(`/mesas/${mesaOrigenId}/transferir`, {
      mesaDestinoId,
      itemsIds,
      transferirTodos
    });
    return response.data;
  }
};

// ============= OBJETOS DECORATIVOS =============

export const objetosDecorativosApi = {
  // Obtener todos los objetos decorativos
  obtenerTodos: async (sectorId?: string): Promise<ObjetoDecorativo[]> => {
    const params = sectorId ? { sectorId } : {};
    const response = await api.get('/objetos-decorativos', { params });
    return response.data;
  },

  // Crear nuevo objeto decorativo
  crear: async (objeto: CrearObjetoDecorativoForm): Promise<ObjetoDecorativo> => {
    const response = await api.post('/objetos-decorativos', objeto);
    return response.data;
  },

  // Actualizar objeto decorativo
  actualizar: async (id: string, objeto: ActualizarObjetoDecorativoForm): Promise<ObjetoDecorativo> => {
    const response = await api.put(`/objetos-decorativos/${id}`, objeto);
    return response.data;
  },

  // Actualizar posición de objeto decorativo (para drag & drop)
  actualizarPosicion: async (id: string, posicionX: number, posicionY: number): Promise<ObjetoDecorativo> => {
    const response = await api.patch(`/objetos-decorativos/${id}/posicion`, { posicionX, posicionY });
    return response.data;
  },

  // Eliminar objeto decorativo
  eliminar: async (id: string): Promise<void> => {
    await api.delete(`/objetos-decorativos/${id}`);
  }
};

// ============= FUNCIONES AUXILIARES =============

export const mesasUtils = {
  // Obtener color de estado de mesa
  obtenerColorEstado: (estado: EstadoMesa): string => {
    const colores = {
      'LIBRE': '#4CAF50',
      'OCUPADA': '#F44336',
      'ESPERANDO_PEDIDO': '#2196F3',
      'CUENTA_PEDIDA': '#FF9800',
      'RESERVADA': '#9C27B0',
      'FUERA_DE_SERVICIO': '#9E9E9E'
    };
    return colores[estado] || '#9E9E9E';
  },

  // Obtener etiqueta de estado de mesa
  obtenerEtiquetaEstado: (estado: EstadoMesa): string => {
    const etiquetas = {
      'LIBRE': 'Libre',
      'OCUPADA': 'Ocupada',
      'ESPERANDO_PEDIDO': 'Esperando Pedido',
      'CUENTA_PEDIDA': 'Cuenta Pedida',
      'RESERVADA': 'Reservada',
      'FUERA_DE_SERVICIO': 'Fuera de Servicio'
    };
    return etiquetas[estado] || 'Desconocido';
  },

  // Verificar si una mesa está disponible
  estaDisponible: (mesa: Mesa): boolean => {
    return mesa.estado === 'LIBRE' && mesa.activa;
  },

  // Verificar si una mesa está ocupada
  estaOcupada: (mesa: Mesa): boolean => {
    return mesa.estado === 'OCUPADA' || mesa.estado === 'ESPERANDO_PEDIDO' || mesa.estado === 'CUENTA_PEDIDA';
  },

  // Calcular estadísticas de un sector
  calcularEstadisticasSector: (mesas: Mesa[]) => {
    const total = mesas.length;
    const libres = mesas.filter(m => m.estado === 'LIBRE').length;
    const ocupadas = mesas.filter(m => m.estado === 'OCUPADA').length;
    const esperandoPedido = mesas.filter(m => m.estado === 'ESPERANDO_PEDIDO').length;
    const cuentaPedida = mesas.filter(m => m.estado === 'CUENTA_PEDIDA').length;
    const reservadas = mesas.filter(m => m.estado === 'RESERVADA').length;
    const fueraServicio = mesas.filter(m => m.estado === 'FUERA_DE_SERVICIO').length;
    
    return {
      total,
      libres,
      ocupadas,
      esperandoPedido,
      cuentaPedida,
      reservadas,
      fueraServicio,
      porcentajeOcupacion: total > 0 ? Math.round((ocupadas / total) * 100) : 0
    };
  }
};

export default {
  sectores: sectoresApi,
  mesas: mesasApi,
  objetosDecorativos: objetosDecorativosApi,
  utils: mesasUtils
}; 