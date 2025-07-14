import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { EstadoCaja, Venta } from '../types';
import { db } from '../services/database';

interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  concepto: string;
  monto: number;
  metodoPago: 'efectivo' | 'tarjeta' | 'transferencia';
  fecha: string;
  usuario: string;
  observaciones?: string;
}

interface CierreCaja {
  id: string;
  fecha: string;
  horaApertura: string;
  horaCierre: string;
  efectivoInicial: number;
  efectivoFinal: number;
  totalVentas: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  totalIngresos: number;
  totalEgresos: number;
  diferencia: number;
  usuario: string;
  observaciones?: string;
}

interface CajaState {
  estadoActual: EstadoCaja;
  movimientos: MovimientoCaja[];
  cierres: CierreCaja[];
  cajaAbierta: boolean;
  efectivoInicial: number;
  horaApertura: string;
  usuario: string;
  loading: boolean;
  error: string | null;
}

const initialState: CajaState = {
  estadoActual: db.getCaja(),
  movimientos: [],
  cierres: [],
  cajaAbierta: false,
  efectivoInicial: 0,
  horaApertura: '',
  usuario: 'Admin',
  loading: false,
  error: null,
};

export const cajaSlice = createSlice({
  name: 'caja',
  initialState,
  reducers: {
    abrirCaja: (state, action: PayloadAction<{ efectivoInicial: number; usuario: string }>) => {
      state.cajaAbierta = true;
      state.efectivoInicial = action.payload.efectivoInicial;
      state.horaApertura = new Date().toISOString();
      state.usuario = action.payload.usuario;
      state.estadoActual.efectivo = action.payload.efectivoInicial;
      
      // Registrar movimiento de apertura
      const movimiento: MovimientoCaja = {
        id: Date.now().toString(),
        tipo: 'ingreso',
        concepto: 'Apertura de caja',
        monto: action.payload.efectivoInicial,
        metodoPago: 'efectivo',
        fecha: new Date().toISOString(),
        usuario: action.payload.usuario,
        observaciones: 'Efectivo inicial para operaciones'
      };
      state.movimientos.push(movimiento);
      
      db.saveCaja(state.estadoActual);
    },

    registrarVenta: (state, action: PayloadAction<Venta>) => {
      const venta = action.payload;
      
      // Actualizar totales por método de pago
      switch (venta.formaPago) {
        case 'efectivo':
          state.estadoActual.efectivo += venta.total;
          break;
        case 'tarjeta':
          state.estadoActual.tarjeta += venta.total;
          break;
        case 'transferencia':
          state.estadoActual.transferencia += venta.total;
          break;
      }
      
      state.estadoActual.totalVentas += venta.total;
      
      // Registrar movimiento de venta
      const movimiento: MovimientoCaja = {
        id: Date.now().toString(),
        tipo: 'venta',
        concepto: `Venta ${venta.id}${venta.cliente ? ` - ${venta.cliente.nombre}` : ''}`,
        monto: venta.total,
        metodoPago: venta.formaPago,
        fecha: venta.fecha,
        usuario: state.usuario,
        observaciones: venta.observaciones
      };
      state.movimientos.push(movimiento);
      
      db.saveCaja(state.estadoActual);
    },

    registrarMovimiento: (state, action: PayloadAction<Omit<MovimientoCaja, 'id' | 'fecha' | 'usuario'>>) => {
      const movimiento: MovimientoCaja = {
        ...action.payload,
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        usuario: state.usuario
      };
      
      // Actualizar estado según el tipo y método de pago
      const factor = movimiento.tipo === 'ingreso' ? 1 : -1;
      const monto = movimiento.monto * factor;
      
      switch (movimiento.metodoPago) {
        case 'efectivo':
          state.estadoActual.efectivo += monto;
          break;
        case 'tarjeta':
          state.estadoActual.tarjeta += monto;
          break;
        case 'transferencia':
          state.estadoActual.transferencia += monto;
          break;
      }
      
      state.movimientos.push(movimiento);
      db.saveCaja(state.estadoActual);
    },

    cerrarCaja: (state, action: PayloadAction<{ observaciones?: string }>) => {
      if (!state.cajaAbierta) return;
      
      const ahora = new Date().toISOString();
      const totalIngresos = state.movimientos
        .filter(m => m.tipo === 'ingreso' && m.metodoPago === 'efectivo')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const totalEgresos = state.movimientos
        .filter(m => m.tipo === 'egreso' && m.metodoPago === 'efectivo')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const ventasEfectivo = state.movimientos
        .filter(m => m.tipo === 'venta' && m.metodoPago === 'efectivo')
        .reduce((sum, m) => sum + m.monto, 0);
      
      const efectivoEsperado = state.efectivoInicial + totalIngresos - totalEgresos + ventasEfectivo;
      const diferencia = state.estadoActual.efectivo - efectivoEsperado;
      
      const cierre: CierreCaja = {
        id: Date.now().toString(),
        fecha: ahora.split('T')[0],
        horaApertura: state.horaApertura,
        horaCierre: ahora,
        efectivoInicial: state.efectivoInicial,
        efectivoFinal: state.estadoActual.efectivo,
        totalVentas: state.estadoActual.totalVentas,
        totalEfectivo: ventasEfectivo,
        totalTarjeta: state.estadoActual.tarjeta,
        totalTransferencia: state.estadoActual.transferencia,
        totalIngresos,
        totalEgresos,
        diferencia,
        usuario: state.usuario,
        observaciones: action.payload.observaciones
      };
      
      state.cierres.push(cierre);
      
      // Resetear caja para el próximo día
      state.cajaAbierta = false;
      state.efectivoInicial = 0;
      state.horaApertura = '';
      state.movimientos = [];
      state.estadoActual = {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        totalVentas: 0
      };
      
      db.saveCaja(state.estadoActual);
    },

    ajustarEfectivo: (state, action: PayloadAction<{ monto: number; concepto: string }>) => {
      const diferencia = action.payload.monto - state.estadoActual.efectivo;
      state.estadoActual.efectivo = action.payload.monto;
      
      const movimiento: MovimientoCaja = {
        id: Date.now().toString(),
        tipo: diferencia > 0 ? 'ingreso' : 'egreso',
        concepto: `Ajuste: ${action.payload.concepto}`,
        monto: Math.abs(diferencia),
        metodoPago: 'efectivo',
        fecha: new Date().toISOString(),
        usuario: state.usuario,
        observaciones: `Ajuste de efectivo en caja`
      };
      
      state.movimientos.push(movimiento);
      db.saveCaja(state.estadoActual);
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    recargarCaja: (state) => {
      state.estadoActual = db.getCaja();
    }
  },
});

export const {
  abrirCaja,
  registrarVenta,
  registrarMovimiento,
  cerrarCaja,
  ajustarEfectivo,
  setLoading,
  setError,
  recargarCaja
} = cajaSlice.actions;

export default cajaSlice.reducer;

// Tipos exportados
export type { MovimientoCaja, CierreCaja }; 