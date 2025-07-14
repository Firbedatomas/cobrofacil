import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Venta, ItemVenta, Producto, Cliente } from '../types';

interface VentasState {
  historial: Venta[];
  ventaActual: Venta | null;
}

const initialState: VentasState = {
  historial: [],
  ventaActual: null,
};

export const ventasSlice = createSlice({
  name: 'ventas',
  initialState,
  reducers: {
    iniciarVenta: (state) => {
      if (!state.ventaActual) {
        state.ventaActual = {
          id: Date.now().toString(),
          items: [],
          total: 0,
          formaPago: 'efectivo',
          fecha: new Date().toISOString(),
          descuentoAplicado: 0,
          puntosGanados: 0,
          puntosUtilizados: 0,
        };
      }
    },
    agregarItem: (state, action: PayloadAction<{ producto: Producto; cantidad: number }>) => {
      console.log('Reducer agregarItem ejecutado con:', action.payload);
      
      if (!state.ventaActual) {
        state.ventaActual = {
          id: Date.now().toString(),
          items: [],
          total: 0,
          formaPago: 'efectivo',
          fecha: new Date().toISOString(),
          descuentoAplicado: 0,
          puntosGanados: 0,
          puntosUtilizados: 0,
        };
      }

      const { producto, cantidad } = action.payload;
      const productoExistente = state.ventaActual.items.find(
        item => item.producto.id === producto.id
      );

      if (productoExistente) {
        productoExistente.cantidad += cantidad;
        console.log('Producto existente, nueva cantidad:', productoExistente.cantidad);
      } else {
        const nuevoItem: ItemVenta = {
          producto,
          cantidad,
        };
        state.ventaActual.items.push(nuevoItem);
        console.log('Producto nuevo agregado:', nuevoItem);
      }

      // Recalcular el total
      state.ventaActual.total = state.ventaActual.items.reduce(
        (sum, item) => sum + (item.producto.precio * item.cantidad),
        0
      );
      
      console.log('Nuevo total:', state.ventaActual.total);
      console.log('Items en venta:', state.ventaActual.items.length);
    },
    eliminarItem: (state, action: PayloadAction<string>) => {
      if (!state.ventaActual) return;
      
      state.ventaActual.items = state.ventaActual.items.filter(
        item => item.producto.id !== action.payload
      );

      // Recalcular el total
      state.ventaActual.total = state.ventaActual.items.reduce(
        (sum, item) => sum + (item.producto.precio * item.cantidad),
        0
      );
    },
    asignarCliente: (state, action: PayloadAction<Cliente>) => {
      if (state.ventaActual) {
        state.ventaActual.cliente = action.payload;
      }
    },
    aplicarDescuentoFidelidad: (state, action: PayloadAction<number>) => {
      if (state.ventaActual) {
        state.ventaActual.descuentoAplicado = action.payload;
      }
    },
    utilizarPuntos: (state, action: PayloadAction<number>) => {
      if (state.ventaActual) {
        state.ventaActual.puntosUtilizados = action.payload;
        // 100 puntos = $100 de descuento
        const descuentoPorPuntos = action.payload;
        state.ventaActual.descuentoAplicado = (state.ventaActual.descuentoAplicado || 0) + descuentoPorPuntos;
      }
    },
    finalizarVenta: (state, action: PayloadAction<{ 
      formaPago: Venta['formaPago']; 
      observaciones?: string;
    }>) => {
      if (!state.ventaActual) return;
      
      const subtotal = state.ventaActual.total;
      const totalConDescuento = subtotal - (state.ventaActual.descuentoAplicado || 0);
      
      // Calcular puntos ganados (1 punto por cada $100)
      const puntosGanados = Math.floor(totalConDescuento / 100);
      
      state.ventaActual.formaPago = action.payload.formaPago;
      state.ventaActual.total = totalConDescuento;
      state.ventaActual.puntosGanados = puntosGanados;
      state.ventaActual.observaciones = action.payload.observaciones;
      
      state.historial.push({...state.ventaActual});
      state.ventaActual = null;
    },
    cancelarVenta: (state) => {
      state.ventaActual = null;
    },
    agregarObservaciones: (state, action: PayloadAction<string>) => {
      if (state.ventaActual) {
        state.ventaActual.observaciones = action.payload;
      }
    },
  },
});

export const { 
  iniciarVenta, 
  agregarItem,
  eliminarItem,
  asignarCliente,
  aplicarDescuentoFidelidad,
  utilizarPuntos,
  finalizarVenta, 
  cancelarVenta,
  agregarObservaciones,
} = ventasSlice.actions;

export default ventasSlice.reducer; 