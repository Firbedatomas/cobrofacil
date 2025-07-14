import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Producto } from '../types';
import { productosService } from '../services/productosService';

interface ProductosState {
  items: Producto[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductosState = {
  items: [], // Sin datos iniciales - se cargan desde API
  loading: false,
  error: null,
};

// Thunk para cargar productos desde la API
export const cargarProductos = createAsyncThunk(
  'productos/cargar',
  async () => {
    const productosCompletos = await productosService.obtenerTodos();
    // Convertir ProductoCompleto a Producto (formato esperado por el estado)
    const productos: Producto[] = productosCompletos.map(p => ({
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      stockMinimo: 5, // Valor por defecto si no viene del backend
      categoria: p.categoria,
      activo: p.activo,
      fechaCreacion: p.fechaCreacion,
      fechaActualizacion: p.fechaActualizacion
    }));
    return productos;
  }
);

// Thunk para crear producto
export const crearProductoAsync = createAsyncThunk(
  'productos/crear',
  async (datosProducto: Omit<Producto, 'id'>) => {
    const productoCompleto = await productosService.crearProducto({
      codigo: datosProducto.codigo,
      nombre: datosProducto.nombre,
      descripcion: datosProducto.descripcion,
      precio: datosProducto.precio,
      stock: datosProducto.stock,
      stockMinimo: datosProducto.stockMinimo,
      categoriaId: datosProducto.categoria // Asumiendo que categoría es el ID
    });
    
    // Convertir ProductoCompleto a Producto
    const producto: Producto = {
      id: productoCompleto.id,
      codigo: productoCompleto.codigo,
      nombre: productoCompleto.nombre,
      descripcion: productoCompleto.descripcion,
      precio: productoCompleto.precio,
      stock: productoCompleto.stock,
      stockMinimo: 5,
      categoria: productoCompleto.categoria,
      activo: productoCompleto.activo,
      fechaCreacion: productoCompleto.fechaCreacion,
      fechaActualizacion: productoCompleto.fechaActualizacion
    };
    return producto;
  }
);

export const productosSlice = createSlice({
  name: 'productos',
  initialState,
  reducers: {
    // Mantener solo las acciones síncronas que no requieren API
    actualizarStock: (state, action: PayloadAction<{ id: string; cantidad: number }>) => {
      const producto = state.items.find(p => p.id === action.payload.id);
      if (producto) {
        producto.stock = Math.max(0, producto.stock - action.payload.cantidad);
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Cargar productos
      .addCase(cargarProductos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cargarProductos.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(cargarProductos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar productos';
      })
      // Crear producto
      .addCase(crearProductoAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(crearProductoAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(crearProductoAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear producto';
      });
  },
});

export const { 
  actualizarStock,
  setLoading,
  setError 
} = productosSlice.actions;

export default productosSlice.reducer; 