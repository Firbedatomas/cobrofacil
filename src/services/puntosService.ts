import api from './api';

interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  email?: string;
  telefono?: string;
  puntos: number;
  nivelFidelidad: 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINUM';
  fechaRegistro: Date;
  ultimaCompra?: Date;
}

interface TransaccionPuntos {
  id: string;
  clienteId: string;
  tipo: 'GANADOS' | 'CANJEADOS' | 'VENCIDOS' | 'AJUSTE';
  cantidad: number;
  descripcion: string;
  ventaId?: string;
  fecha: Date;
  vencimiento?: Date;
}

interface ReglaPuntos {
  id: string;
  nombre: string;
  descripcion: string;
  puntosMoneda: number; // Puntos por peso gastado
  multiplicador: number;
  activa: boolean;
  fechaInicio: Date;
  fechaFin?: Date;
}

interface CanjeoPuntos {
  puntosRequeridos: number;
  valorEfectivo: number;
  descripcion: string;
  tipo: 'DESCUENTO_PORCENTAJE' | 'DESCUENTO_FIJO' | 'PRODUCTO_GRATIS';
  valor: number;
}

class PuntosService {
  // Obtener puntos de cliente
  async getPuntosCliente(clienteId: string): Promise<Cliente | null> {
    try {
      const response = await api.get(`/puntos/cliente/${clienteId}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo puntos del cliente:', error);
      return null;
    }
  }

  // Buscar cliente por DNI/teléfono
  async buscarCliente(termino: string): Promise<Cliente[]> {
    try {
      const response = await api.get(`/puntos/buscar-cliente?q=${encodeURIComponent(termino)}`);
      return response.data;
    } catch (error) {
      console.error('Error buscando cliente:', error);
      return [];
    }
  }

  // Calcular puntos a ganar por compra
  async calcularPuntosGanados(montoCompra: number, clienteId?: string): Promise<number> {
    try {
      const response = await api.post('/puntos/calcular-ganados', {
        monto: montoCompra,
        clienteId
      });
      return response.data.puntosGanados;
    } catch (error) {
      console.error('Error calculando puntos ganados:', error);
      return 0;
    }
  }

  // Obtener opciones de canje disponibles
  async getOpcionesCanje(puntosDisponibles: number): Promise<CanjeoPuntos[]> {
    try {
      const response = await api.get(`/puntos/opciones-canje?puntos=${puntosDisponibles}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo opciones de canje:', error);
      return [];
    }
  }

  // Aplicar descuento por puntos
  async aplicarDescuentoPuntos(clienteId: string, puntosACanjear: number, tipoDescuento: string): Promise<{
    success: boolean;
    descuento: number;
    puntosUsados: number;
    saldoRestante: number;
    transaccionId?: string;
  }> {
    try {
      const response = await api.post('/puntos/aplicar-descuento', {
        clienteId,
        puntosACanjear,
        tipoDescuento
      });
      return response.data;
    } catch (error: any) {
      console.error('Error aplicando descuento por puntos:', error);
      return {
        success: false,
        descuento: 0,
        puntosUsados: 0,
        saldoRestante: 0
      };
    }
  }

  // Registrar puntos ganados por venta
  async registrarPuntosVenta(ventaId: string, clienteId: string, montoVenta: number): Promise<void> {
    try {
      await api.post('/puntos/registrar-venta', {
        ventaId,
        clienteId,
        montoVenta
      });
    } catch (error) {
      console.error('Error registrando puntos de venta:', error);
    }
  }

  // Obtener historial de puntos
  async getHistorialPuntos(clienteId: string, limite: number = 50): Promise<TransaccionPuntos[]> {
    try {
      const response = await api.get(`/puntos/historial/${clienteId}?limite=${limite}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial de puntos:', error);
      return [];
    }
  }

  // Obtener reglas de puntos activas
  async getReglasActivas(): Promise<ReglaPuntos[]> {
    try {
      const response = await api.get('/puntos/reglas-activas');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo reglas de puntos:', error);
      return [];
    }
  }

  // Validar si cliente puede canjear puntos
  async validarCanje(clienteId: string, puntosRequeridos: number): Promise<{
    valido: boolean;
    mensaje: string;
    puntosDisponibles: number;
  }> {
    try {
      const response = await api.post('/puntos/validar-canje', {
        clienteId,
        puntosRequeridos
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validando canje:', error);
      return {
        valido: false,
        mensaje: error.response?.data?.message || 'Error al validar canje',
        puntosDisponibles: 0
      };
    }
  }

  // Crear cliente nuevo para puntos
  async crearClientePuntos(datos: {
    nombre: string;
    dni: string;
    email?: string;
    telefono?: string;
  }): Promise<Cliente | null> {
    try {
      const response = await api.post('/puntos/crear-cliente', datos);
      return response.data;
    } catch (error) {
      console.error('Error creando cliente para puntos:', error);
      return null;
    }
  }

  // Simulación para desarrollo
  async simulateClientePuntos(dni: string): Promise<Cliente> {
    return {
      id: `cliente-${dni}`,
      nombre: `Cliente ${dni}`,
      dni,
      puntos: Math.floor(Math.random() * 5000),
      nivelFidelidad: 'PLATA',
      fechaRegistro: new Date(),
      ultimaCompra: new Date()
    };
  }

  // Formatear puntos para display
  formatPuntos(puntos: number): string {
    return new Intl.NumberFormat('es-AR').format(puntos);
  }

  // Obtener nivel de fidelidad por puntos
  getNivelFidelidad(puntos: number): 'BRONCE' | 'PLATA' | 'ORO' | 'PLATINUM' {
    if (puntos >= 50000) return 'PLATINUM';
    if (puntos >= 20000) return 'ORO';
    if (puntos >= 5000) return 'PLATA';
    return 'BRONCE';
  }

  // Obtener color del nivel
  getColorNivel(nivel: string): string {
    switch (nivel) {
      case 'PLATINUM': return '#E5E7EB';
      case 'ORO': return '#FCD34D';
      case 'PLATA': return '#9CA3AF';
      case 'BRONCE': return '#CD7C2F';
      default: return '#6B7280';
    }
  }
}

export const puntosService = new PuntosService();
export type { Cliente, TransaccionPuntos, ReglaPuntos, CanjeoPuntos }; 