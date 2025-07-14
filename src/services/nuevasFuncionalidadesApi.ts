// ===============================================
// SERVICIOS API PARA NUEVAS FUNCIONALIDADES
// CobroFacil Plus - Funcionalidades Xubio
// ===============================================

import { api } from './api';
import type {
  Cliente,
  Presupuesto,
  FacturaRecurrente,
  ListaPrecio,
  Empleado,
  LiquidacionSueldo,
  Cheque,
  FiltrosClientes,
  FiltrosPresupuestos,
  FiltrosFacturasRecurrentes,
  FiltrosListasPrecios,
  FiltrosEmpleados,
  FiltrosLiquidaciones,
  FiltrosCheques,
  FormularioCliente,
  FormularioPresupuesto,
  FormularioFacturaRecurrente,
  FormularioListaPrecio,
  FormularioEmpleado,
  FormularioLiquidacion,
  FormularioCheque,
  ApiResponse,
  PaginatedResponse,
  EstadisticasGenerales
} from '../types/nuevasFuncionalidades';

// ===============================================
// SERVICIOS DE CLIENTES
// ===============================================

export const clientesApi = {
  // Listar clientes
  listar: async (filtros: FiltrosClientes = {}): Promise<PaginatedResponse<Cliente>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/clientes?${params.toString()}`);
    return response.data;
  },

  // Obtener cliente por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<Cliente>> => {
    const response = await api.get(`/clientes/${id}`);
    return response.data;
  },

  // Crear cliente
  crear: async (datos: FormularioCliente): Promise<ApiResponse<Cliente>> => {
    const response = await api.post('/clientes', datos);
    return response.data;
  },

  // Actualizar cliente
  actualizar: async (id: string, datos: Partial<FormularioCliente>): Promise<ApiResponse<Cliente>> => {
    const response = await api.put(`/clientes/${id}`, datos);
    return response.data;
  },

  // Activar/Desactivar cliente
  cambiarEstado: async (id: string, activo: boolean): Promise<ApiResponse<Cliente>> => {
    const response = await api.patch(`/clientes/${id}/estado`, { activo });
    return response.data;
  },

  // Eliminar cliente
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/clientes/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await api.get(`/clientes/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE PRESUPUESTOS
// ===============================================

export const presupuestosApi = {
  // Listar presupuestos
  listar: async (filtros: FiltrosPresupuestos = {}): Promise<PaginatedResponse<Presupuesto>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/presupuestos?${params.toString()}`);
    return response.data;
  },

  // Obtener presupuesto por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<Presupuesto>> => {
    const response = await api.get(`/presupuestos/${id}`);
    return response.data;
  },

  // Crear presupuesto
  crear: async (datos: FormularioPresupuesto): Promise<ApiResponse<Presupuesto>> => {
    const response = await api.post('/presupuestos', datos);
    return response.data;
  },

  // Actualizar presupuesto
  actualizar: async (id: string, datos: Partial<FormularioPresupuesto>): Promise<ApiResponse<Presupuesto>> => {
    const response = await api.put(`/presupuestos/${id}`, datos);
    return response.data;
  },

  // Cambiar estado del presupuesto
  cambiarEstado: async (id: string, estado: string): Promise<ApiResponse<Presupuesto>> => {
    const response = await api.patch(`/presupuestos/${id}/estado`, { estado });
    return response.data;
  },

  // Enviar presupuesto por email
  enviarPorEmail: async (id: string, email?: string): Promise<ApiResponse<void>> => {
    const response = await api.post(`/presupuestos/${id}/enviar-email`, { email });
    return response.data;
  },

  // Convertir presupuesto a venta
  convertirAVenta: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/presupuestos/${id}/convertir-venta`);
    return response.data;
  },

  // Obtener PDF del presupuesto
  obtenerPDF: async (id: string): Promise<Blob> => {
    const response = await api.get(`/presupuestos/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Eliminar presupuesto
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/presupuestos/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await api.get(`/presupuestos/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE FACTURAS RECURRENTES
// ===============================================

export const facturasRecurrentesApi = {
  // Listar facturas recurrentes
  listar: async (filtros: FiltrosFacturasRecurrentes = {}): Promise<PaginatedResponse<FacturaRecurrente>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/facturas-recurrentes?${params.toString()}`);
    return response.data;
  },

  // Obtener factura recurrente por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<FacturaRecurrente>> => {
    const response = await api.get(`/facturas-recurrentes/${id}`);
    return response.data;
  },

  // Crear factura recurrente
  crear: async (datos: FormularioFacturaRecurrente): Promise<ApiResponse<FacturaRecurrente>> => {
    const response = await api.post('/facturas-recurrentes', datos);
    return response.data;
  },

  // Actualizar factura recurrente
  actualizar: async (id: string, datos: Partial<FormularioFacturaRecurrente>): Promise<ApiResponse<FacturaRecurrente>> => {
    const response = await api.put(`/facturas-recurrentes/${id}`, datos);
    return response.data;
  },

  // Activar/Desactivar factura recurrente
  cambiarEstado: async (id: string, activa: boolean): Promise<ApiResponse<FacturaRecurrente>> => {
    const response = await api.patch(`/facturas-recurrentes/${id}/estado`, { activa });
    return response.data;
  },

  // Generar venta desde factura recurrente
  generarVenta: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.post(`/facturas-recurrentes/${id}/generar-venta`);
    return response.data;
  },

  // Obtener facturas pendientes de generar
  obtenerPendientes: async (): Promise<ApiResponse<FacturaRecurrente[]>> => {
    const response = await api.get('/facturas-recurrentes/pendientes/generar');
    return response.data;
  },

  // Generar todas las facturas pendientes
  generarTodasPendientes: async (): Promise<ApiResponse<any>> => {
    const response = await api.post('/facturas-recurrentes/generar-todas-pendientes');
    return response.data;
  },

  // Eliminar factura recurrente
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/facturas-recurrentes/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await api.get(`/facturas-recurrentes/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE LISTAS DE PRECIOS
// ===============================================

export const listasPreciosApi = {
  // Listar listas de precios
  listar: async (filtros: FiltrosListasPrecios = {}): Promise<PaginatedResponse<ListaPrecio>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/listas-precios?${params.toString()}`);
    return response.data;
  },

  // Obtener lista de precios por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<ListaPrecio>> => {
    const response = await api.get(`/listas-precios/${id}`);
    return response.data;
  },

  // Crear lista de precios
  crear: async (datos: FormularioListaPrecio): Promise<ApiResponse<ListaPrecio>> => {
    const response = await api.post('/listas-precios', datos);
    return response.data;
  },

  // Actualizar lista de precios
  actualizar: async (id: string, datos: Partial<FormularioListaPrecio>): Promise<ApiResponse<ListaPrecio>> => {
    const response = await api.put(`/listas-precios/${id}`, datos);
    return response.data;
  },

  // Activar/Desactivar lista de precios
  cambiarEstado: async (id: string, activa: boolean): Promise<ApiResponse<ListaPrecio>> => {
    const response = await api.patch(`/listas-precios/${id}/estado`, { activa });
    return response.data;
  },

  // Asignar lista de precios a cliente
  asignarACliente: async (clienteId: string, listaPrecioId: string): Promise<ApiResponse<any>> => {
    const response = await api.post('/listas-precios/asignar-cliente', { clienteId, listaPrecioId });
    return response.data;
  },

  // Obtener precio de producto para cliente
  obtenerPrecioProducto: async (clienteId: string, productoId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/listas-precios/precio/${clienteId}/${productoId}`);
    return response.data;
  },

  // Obtener precios masivos para cliente
  obtenerPreciosMasivos: async (clienteId: string, productosIds: string[]): Promise<ApiResponse<any>> => {
    const response = await api.post('/listas-precios/precios-masivos', { clienteId, productosIds });
    return response.data;
  },

  // Copiar lista de precios
  copiar: async (id: string, nuevoNombre: string, descripcion?: string): Promise<ApiResponse<ListaPrecio>> => {
    const response = await api.post(`/listas-precios/${id}/copiar`, { nuevoNombre, descripcion });
    return response.data;
  },

  // Eliminar lista de precios
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/listas-precios/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await api.get(`/listas-precios/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE EMPLEADOS
// ===============================================

export const empleadosApi = {
  // Listar empleados
  listar: async (filtros: FiltrosEmpleados = {}): Promise<PaginatedResponse<Empleado>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/empleados?${params.toString()}`);
    return response.data;
  },

  // Obtener empleado por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<Empleado>> => {
    const response = await api.get(`/empleados/${id}`);
    return response.data;
  },

  // Crear empleado
  crear: async (datos: FormularioEmpleado): Promise<ApiResponse<Empleado>> => {
    const response = await api.post('/empleados', datos);
    return response.data;
  },

  // Actualizar empleado
  actualizar: async (id: string, datos: Partial<FormularioEmpleado>): Promise<ApiResponse<Empleado>> => {
    const response = await api.put(`/empleados/${id}`, datos);
    return response.data;
  },

  // Activar/Desactivar empleado
  cambiarEstado: async (id: string, activo: boolean, fechaEgreso?: string): Promise<ApiResponse<Empleado>> => {
    const response = await api.patch(`/empleados/${id}/estado`, { activo, fechaEgreso });
    return response.data;
  },

  // Calcular liquidación automática
  calcularLiquidacion: async (
    id: string, 
    periodo: string, 
    horasExtra?: number, 
    premios?: number, 
    descuentos?: number
  ): Promise<ApiResponse<any>> => {
    const response = await api.post(`/empleados/${id}/calcular-liquidacion`, {
      periodo,
      horasExtra,
      premios,
      descuentos
    });
    return response.data;
  },

  // Eliminar empleado
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/empleados/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    
    const response = await api.get(`/empleados/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE LIQUIDACIONES
// ===============================================

export const liquidacionesApi = {
  // Listar liquidaciones
  listar: async (filtros: FiltrosLiquidaciones = {}): Promise<PaginatedResponse<LiquidacionSueldo>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/empleados/liquidaciones?${params.toString()}`);
    return response.data;
  },

  // Obtener liquidación por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<LiquidacionSueldo>> => {
    const response = await api.get(`/empleados/liquidaciones/${id}`);
    return response.data;
  },

  // Crear liquidación
  crear: async (datos: FormularioLiquidacion): Promise<ApiResponse<LiquidacionSueldo>> => {
    const response = await api.post('/empleados/liquidaciones', datos);
    return response.data;
  },

  // Marcar liquidación como pagada
  marcarComoPagada: async (id: string, fechaPago?: string): Promise<ApiResponse<LiquidacionSueldo>> => {
    const response = await api.patch(`/empleados/liquidaciones/${id}/pagar`, { fechaPago });
    return response.data;
  }
};

// ===============================================
// SERVICIOS DE CHEQUES
// ===============================================

export const chequesApi = {
  // Listar cheques
  listar: async (filtros: FiltrosCheques = {}): Promise<PaginatedResponse<Cheque>> => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/cheques?${params.toString()}`);
    return response.data;
  },

  // Obtener cheque por ID
  obtenerPorId: async (id: string): Promise<ApiResponse<Cheque>> => {
    const response = await api.get(`/cheques/${id}`);
    return response.data;
  },

  // Crear cheque
  crear: async (datos: FormularioCheque): Promise<ApiResponse<Cheque>> => {
    const response = await api.post('/cheques', datos);
    return response.data;
  },

  // Actualizar cheque
  actualizar: async (id: string, datos: Partial<FormularioCheque>): Promise<ApiResponse<Cheque>> => {
    const response = await api.put(`/cheques/${id}`, datos);
    return response.data;
  },

  // Cambiar estado del cheque
  cambiarEstado: async (
    id: string, 
    estado: string, 
    fechaCobro?: string, 
    observacionesEstado?: string
  ): Promise<ApiResponse<Cheque>> => {
    const response = await api.patch(`/cheques/${id}/estado`, {
      estado,
      fechaCobro,
      observacionesEstado
    });
    return response.data;
  },

  // Obtener cheques próximos a vencer
  obtenerProximosVencer: async (dias: number = 30): Promise<ApiResponse<Cheque[]>> => {
    const response = await api.get(`/cheques/vencimientos/proximos?dias=${dias}`);
    return response.data;
  },

  // Obtener cheques vencidos
  obtenerVencidos: async (): Promise<ApiResponse<Cheque[]>> => {
    const response = await api.get('/cheques/vencimientos/vencidos');
    return response.data;
  },

  // Eliminar cheque
  eliminar: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/cheques/${id}`);
    return response.data;
  },

  // Obtener estadísticas
  obtenerEstadisticas: async (fechaDesde?: string, fechaHasta?: string, tipo?: string): Promise<ApiResponse<EstadisticasGenerales>> => {
    const params = new URLSearchParams();
    if (fechaDesde) params.append('fechaDesde', fechaDesde);
    if (fechaHasta) params.append('fechaHasta', fechaHasta);
    if (tipo) params.append('tipo', tipo);
    
    const response = await api.get(`/cheques/stats/general?${params.toString()}`);
    return response.data;
  }
};

// ===============================================
// EXPORTACIONES
// ===============================================

export default {
  clientes: clientesApi,
  presupuestos: presupuestosApi,
  facturasRecurrentes: facturasRecurrentesApi,
  listasPrecios: listasPreciosApi,
  empleados: empleadosApi,
  liquidaciones: liquidacionesApi,
  cheques: chequesApi
}; 