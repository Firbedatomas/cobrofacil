import api from './api';

export interface Turno {
  id: string;
  nombre: string;
  caja: string;
  fechaApertura: string;
  fechaCierre?: string;
  horaInicio: string;
  horaFin: string;
  fondoInicial: number;
  fondoFinal?: number;
  estado: 'ABIERTO' | 'CERRADO' | 'FORZADO_CIERRE';
  usuarioAperturaId: string;
  usuarioCierreId?: string;
  usuarioApertura: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  usuarioCierre?: {
    nombre: string;
    apellido: string;
  };
  observacionesApertura?: string;
  observacionesCierre?: string;
  efectivoContado?: number;
  efectivoSistema?: number;
  diferencia?: number;
  observacionesArqueo?: string;
  turnoAnteriorId?: string;
  movimientos?: MovimientoCaja[];
  totales?: TotalesTurno;
  esTercerTurno?: boolean;
  reporteGenerado?: {
    archivo: string;
    emailsEnviados: string[];
  } | null;
}

export interface MovimientoCaja {
  id: string;
  turnoId: string;
  tipo: 'VENTA' | 'APORTE' | 'RETIRO' | 'GASTO' | 'PAGO_PROVEEDOR' | 'AJUSTE' | 'TRANSFERENCIA' | 'ARQUEO';
  concepto: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'QR_MERCADOPAGO';
  fecha: string;
  usuarioId: string;
  usuario: {
    nombre: string;
    apellido: string;
  };
  tipoComprobante?: string;
  numeroComprobante?: string;
  cae?: string;
  requiereAutorizacion: boolean;
  autorizado: boolean;
  autorizadoPor?: string;
  cajaOrigen?: string;
  cajaDestino?: string;
  observaciones?: string;
}

export interface TotalesTurno {
  ventas: number;
  aportes: number;
  retiros: number;
  gastos: number;
  pagosProveedor: number;
  ajustes: number;
  transferencias: number;
  efectivo: number;
  tarjeta: number;
  transferencia: number;
}

export interface AbrirTurnoDto {
  nombre: string;
  caja?: string;
  horaInicio: string;
  horaFin: string;
  fondoInicial: number;
  observacionesApertura?: string;
}

export interface CerrarTurnoDto {
  efectivoContado: number;
  observacionesCierre?: string;
  observacionesArqueo?: string;
}

export interface ForzarCierreDto {
  motivo: string;
  efectivoContado: number;
}

export interface RegistrarMovimientoDto {
  tipo: MovimientoCaja['tipo'];
  concepto: string;
  monto: number;
  metodoPago: MovimientoCaja['metodoPago'];
  caja?: string;
  observaciones?: string;
}

export interface HistorialParams {
  caja?: string;
  page?: number;
  limit?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: 'ABIERTO' | 'CERRADO' | 'FORZADO_CIERRE';
}

class TurnosService {
  
  // 🔍 Obtener turno activo
  async obtenerTurnoActivo(caja: string = 'PRINCIPAL'): Promise<Turno | null> {
    try {
      const response = await api.get(`/turnos/activo/${caja}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No hay turno activo
      }
      throw error;
    }
  }

  // 🔓 Abrir nuevo turno
  async abrirTurno(datos: AbrirTurnoDto): Promise<Turno> {
    const response = await api.post('/turnos/abrir', datos);
    return response.data.data;
  }

  // 🔒 Cerrar turno
  async cerrarTurno(turnoId: string, datos: CerrarTurnoDto): Promise<{
    turno: Turno;
    esTercerTurno: boolean;
    reporteGenerado?: {
      archivo: string;
      emailsEnviados: string[];
    } | null;
  }> {
    try {
      const response = await api.post(`/turnos/cerrar/${turnoId}`, datos);
      
      if (response.data.success) {
        const resultado = response.data.data;
        
        return {
          turno: resultado,
          esTercerTurno: resultado.esTercerTurno || false,
          reporteGenerado: resultado.reporteGenerado || null
        };
      } else {
        throw new Error(response.data.message || 'Error al cerrar turno');
      }
    } catch (error: any) {
      console.error('Error cerrando turno:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Error de conexión al cerrar turno');
    }
  }

  // 🚫 Forzar cierre (solo supervisores/admin)
  async forzarCierre(turnoId: string, datos: ForzarCierreDto): Promise<Turno> {
    const response = await api.post(`/turnos/forzar-cierre/${turnoId}`, datos);
    return response.data.data;
  }

  // 📊 Obtener historial de turnos
  async obtenerHistorial(params: HistorialParams = {}) {
    const { caja = 'PRINCIPAL', ...queryParams } = params;
    const searchParams = new URLSearchParams();
    
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const url = `/turnos/historial/${caja}${query ? `?${query}` : ''}`;
    
    const response = await api.get(url);
    return response.data.data;
  }

  // 📋 Registrar movimiento en turno activo
  async registrarMovimiento(datos: RegistrarMovimientoDto): Promise<MovimientoCaja> {
    const response = await api.post('/turnos/movimiento', datos);
    return response.data.data;
  }

  // 🛡️ Validar si se puede abrir turno
  async validarAperturaTurno(caja: string = 'PRINCIPAL'): Promise<{
    puedeAbrir: boolean;
    mensaje?: string;
    turnoAbierto?: Partial<Turno>;
    turnosDia?: number;
  }> {
    try {
      // Verificar si hay turno abierto
      const turnoActivo = await this.obtenerTurnoActivo(caja);
      
      if (turnoActivo) {
        return {
          puedeAbrir: false,
          mensaje: `Ya existe un turno abierto: "${turnoActivo.nombre}" por ${turnoActivo.usuarioApertura.nombre} ${turnoActivo.usuarioApertura.apellido}`,
          turnoAbierto: turnoActivo
        };
      }

      // Criterio 5: Validar máximo 3 turnos por día
      const hoy = new Date();
      const fechaInicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaFinHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const response = await this.obtenerHistorial({
        caja,
        fechaDesde: fechaInicioHoy.toISOString(),
        fechaHasta: fechaFinHoy.toISOString(),
        limit: 10
      });

      const turnosHoy = response.turnos || [];
      const cantidadTurnosHoy = turnosHoy.length;

      if (cantidadTurnosHoy >= 3) {
        return {
          puedeAbrir: false,
          mensaje: `Se ha alcanzado el máximo de 3 turnos por día (${cantidadTurnosHoy}/3)`,
          turnosDia: cantidadTurnosHoy
        };
      }

      return {
        puedeAbrir: true,
        mensaje: `Puede abrir un nuevo turno (${cantidadTurnosHoy}/3 turnos hoy)`,
        turnosDia: cantidadTurnosHoy
      };
    } catch (error) {
      console.error('Error validando apertura:', error);
      throw error;
    }
  }

  // Función para verificar si se puede gestionar mesas (Criterio 1: @turnos)
  async verificarGestionMesasPermitida(caja: string = 'PRINCIPAL'): Promise<{
    permitida: boolean;
    mensaje?: string;
    turnoActivo?: Partial<Turno>;
    requiereAbrirTurno: boolean;
  }> {
    try {
      // Verificar si hay turno activo
      const turnoActivo = await this.obtenerTurnoActivo(caja);
      
      if (!turnoActivo) {
        return {
          permitida: false,
          mensaje: 'Debe abrir un turno para comenzar la gestión de mesas',
          requiereAbrirTurno: true
        };
      }

      if (turnoActivo.estado !== 'ABIERTO') {
        return {
          permitida: false,
          mensaje: `El turno ${turnoActivo.nombre} está ${turnoActivo.estado}. Debe abrir un nuevo turno.`,
          turnoActivo: {
            id: turnoActivo.id,
            nombre: turnoActivo.nombre,
            estado: turnoActivo.estado,
            fechaCierre: turnoActivo.fechaCierre
          },
          requiereAbrirTurno: true
        };
      }

      return {
        permitida: true,
        mensaje: `Gestión de mesas habilitada - Turno ${turnoActivo.nombre} activo`,
        turnoActivo: {
          id: turnoActivo.id,
          nombre: turnoActivo.nombre,
          estado: turnoActivo.estado,
          fechaApertura: turnoActivo.fechaApertura,
          usuarioApertura: turnoActivo.usuarioApertura
        },
        requiereAbrirTurno: false
      };
    } catch (error) {
      console.error('Error verificando gestión de mesas:', error);
      return {
        permitida: false,
        mensaje: 'Error al verificar el estado del turno. Verifique la conexión.',
        requiereAbrirTurno: true
      };
    }
  }

  // Función para obtener el próximo número de turno secuencial (Criterio 1)
  async obtenerProximoNumeroTurno(caja: string = 'PRINCIPAL'): Promise<number> {
    try {
      // Obtener historial de turnos del día actual
      const hoy = new Date();
      const fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const fechaHasta = new Date(fechaDesde);
      fechaHasta.setDate(fechaHasta.getDate() + 1);

      const response = await api.get(`/turnos/historial/${caja}`, {
        params: {
          fechaDesde: fechaDesde.toISOString(),
          fechaHasta: fechaHasta.toISOString(),
          limit: 10
        }
      });

      const turnos = response.data?.data?.turnos || [];
      
      // Encontrar el número más alto usado hoy
      let numeroMasAlto = 0;
      turnos.forEach((turno: any) => {
        const match = turno.nombre.match(/Turno (\d+)/);
        if (match) {
          const numero = parseInt(match[1]);
          if (numero > numeroMasAlto) {
            numeroMasAlto = numero;
          }
        }
      });

      // Validar máximo de 3 turnos
      if (numeroMasAlto >= 3) {
        throw new Error('Máximo de 3 turnos por día alcanzado');
      }

      return numeroMasAlto + 1;
    } catch (error) {
      console.error('Error obteniendo próximo número de turno:', error);
      return 1; // Default al primer turno
    }
  }

  // 📈 Calcular totales de turno
  calcularTotales(movimientos: MovimientoCaja[]): TotalesTurno {
    const totales: TotalesTurno = {
      ventas: 0,
      aportes: 0,
      retiros: 0,
      gastos: 0,
      pagosProveedor: 0,
      ajustes: 0,
      transferencias: 0,
      efectivo: 0,
      tarjeta: 0,
      transferencia: 0
    };

    movimientos.forEach(mov => {
      const monto = mov.monto;
      
      // Totales por tipo
      switch (mov.tipo) {
        case 'VENTA':
          totales.ventas += monto;
          break;
        case 'APORTE':
          totales.aportes += monto;
          break;
        case 'RETIRO':
          totales.retiros += monto;
          break;
        case 'GASTO':
          totales.gastos += monto;
          break;
        case 'PAGO_PROVEEDOR':
          totales.pagosProveedor += monto;
          break;
        case 'AJUSTE':
        case 'ARQUEO':
          totales.ajustes += monto;
          break;
        case 'TRANSFERENCIA':
          totales.transferencias += monto;
          break;
      }

      // Totales por método de pago
      switch (mov.metodoPago) {
        case 'EFECTIVO':
          // Para efectivo, ingresos suman y egresos restan
          if (['VENTA', 'APORTE'].includes(mov.tipo)) {
            totales.efectivo += monto;
          } else {
            totales.efectivo -= monto;
          }
          break;
        case 'TARJETA_DEBITO':
        case 'TARJETA_CREDITO':
          totales.tarjeta += monto;
          break;
        case 'TRANSFERENCIA':
        case 'QR_MERCADOPAGO':
          totales.transferencia += monto;
          break;
      }
    });

    return totales;
  }

  // 💰 Formatear moneda
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(monto);
  }

  // 🕒 Formatear fecha y hora
  formatearFechaHora(fecha: string): string {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ⏰ Calcular duración del turno
  calcularDuracionTurno(fechaApertura: string, fechaCierre?: string): string {
    const inicio = new Date(fechaApertura);
    const fin = fechaCierre ? new Date(fechaCierre) : new Date();
    
    const diferencia = fin.getTime() - inicio.getTime();
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${horas}h ${minutos}m`;
  }

  // 🔍 Obtener mesas pendientes de cobro
  async obtenerMesasPendientesCobro(): Promise<{
    cantidad: number;
    mesas: Array<{
      id: string;
      numero: string;
      sector: string;
      estado: string;
    }>;
  }> {
    try {
      const response = await api.get('/turnos/mesas-pendientes');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error al obtener mesas pendientes');
      }
    } catch (error: any) {
      console.error('Error obteniendo mesas pendientes:', error);
      
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Error de conexión al obtener mesas pendientes');
    }
  }
}

export default new TurnosService(); 