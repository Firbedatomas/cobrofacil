import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Cliente } from '../types';
import { db } from '../services/database';

interface ClientesState {
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  cargando: boolean;
  error: string | null;
}

const initialState: ClientesState = {
  clientes: [], // Iniciar vacío - se cargan desde la DB
  clienteSeleccionado: null,
  cargando: false,
  error: null
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Calcular nivel de fidelidad basado en historial de compras
 */
const calcularNivelFidelidad = (totalCompras: number, cantidadCompras: number): Cliente['nivelFidelidad'] => {
  if (totalCompras >= 100000 || cantidadCompras >= 30) return 'Platino';
  if (totalCompras >= 50000 || cantidadCompras >= 15) return 'Oro';
  if (totalCompras >= 15000 || cantidadCompras >= 5) return 'Plata';
  return 'Bronce';
};

/**
 * Calcular descuento preferencial según nivel
 */
const calcularDescuentoPreferencial = (nivel: Cliente['nivelFidelidad']): number => {
  const descuentos = {
    'Platino': 15,
    'Oro': 10,
    'Plata': 5,
    'Bronce': 3
  };
  return descuentos[nivel] || 0;
};

/**
 * Calcular puntos ganados por compra (1 punto cada $100)
 */
const calcularPuntosGanados = (totalVenta: number): number => {
  return Math.floor(totalVenta / 100);
};

/**
 * Generar ID único para nuevo cliente
 */
const generarIdCliente = (): string => {
  return `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validar datos de cliente
 */
const validarCliente = (cliente: Partial<Cliente>): string | null => {
  if (!cliente.nombre?.trim()) return 'El nombre es requerido';
  if (!cliente.dni?.trim()) return 'El DNI es requerido';
  if (cliente.dni.length < 7 || cliente.dni.length > 9) return 'DNI debe tener entre 7 y 9 dígitos';
  if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) return 'Email inválido';
  if (cliente.telefono && !/^\+?[\d\s\-()]+$/.test(cliente.telefono)) return 'Teléfono inválido';
  return null;
};

// ===== SLICE =====

export const clientesSlice = createSlice({
  name: 'clientes',
  initialState,
  reducers: {
    /**
     * Cargar clientes desde la base de datos local
     */
    cargarClientes: (state) => {
      try {
        state.cargando = true;
        state.error = null;
        state.clientes = db.getClientes();
        state.cargando = false;
      } catch (error) {
        state.cargando = false;
        state.error = 'Error al cargar clientes desde la base de datos';
        console.error('Error cargando clientes:', error);
      }
    },

    /**
     * Agregar nuevo cliente
     */
    agregarCliente: (state, action: PayloadAction<Omit<Cliente, 'id' | 'fechaRegistro' | 'puntosFidelidad' | 'totalCompras' | 'cantidadCompras' | 'nivelFidelidad' | 'descuentoPreferencial'>>) => {
      try {
        // Validar datos
        const error = validarCliente(action.payload);
        if (error) {
          state.error = error;
          return;
        }

        // Verificar DNI único
        const dniExistente = state.clientes.find(c => c.dni === action.payload.dni);
        if (dniExistente) {
          state.error = 'Ya existe un cliente con ese DNI';
          return;
        }

        // Crear nuevo cliente
        const nuevoCliente: Cliente = {
          ...action.payload,
          id: generarIdCliente(),
          fechaRegistro: new Date().toISOString().split('T')[0],
          puntosFidelidad: 0,
          totalCompras: 0,
          cantidadCompras: 0,
          nivelFidelidad: 'Bronce',
          descuentoPreferencial: 3,
          ultimaCompra: undefined
        };

        // Agregar a la base de datos
        db.agregarCliente(nuevoCliente);
        
        // Actualizar estado
        state.clientes.push(nuevoCliente);
        state.error = null;
      } catch (error) {
        state.error = 'Error al crear el cliente';
        console.error('Error agregando cliente:', error);
      }
    },
    
    /**
     * Actualizar cliente existente
     */
    actualizarCliente: (state, action: PayloadAction<Cliente>) => {
      try {
        const error = validarCliente(action.payload);
        if (error) {
          state.error = error;
          return;
        }

        // Actualizar en la base de datos
        const actualizado = db.actualizarCliente(action.payload);
        if (!actualizado) {
          state.error = 'Cliente no encontrado';
          return;
        }

        // Actualizar estado
        const index = state.clientes.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clientes[index] = action.payload;
        }

        // Actualizar cliente seleccionado si es el mismo
        if (state.clienteSeleccionado?.id === action.payload.id) {
          state.clienteSeleccionado = action.payload;
        }

        state.error = null;
      } catch (error) {
        state.error = 'Error al actualizar el cliente';
        console.error('Error actualizando cliente:', error);
      }
    },
    
    /**
     * Registrar una nueva compra para el cliente
     */
    registrarCompra: (state, action: PayloadAction<{ 
      clienteId: string; 
      totalVenta: number; 
      puntosUtilizados?: number;
      fechaCompra?: string;
    }>) => {
      try {
        const { clienteId, totalVenta, puntosUtilizados = 0, fechaCompra } = action.payload;
        
        if (totalVenta <= 0) {
          state.error = 'El total de la venta debe ser mayor a 0';
          return;
        }

        const cliente = state.clientes.find(c => c.id === clienteId);
        if (!cliente) {
          state.error = 'Cliente no encontrado';
          return;
        }

        // Calcular nuevos valores
        const puntosGanados = calcularPuntosGanados(totalVenta);
        const nuevosTotalCompras = cliente.totalCompras + totalVenta;
        const nuevaCantidadCompras = cliente.cantidadCompras + 1;
        const nuevosPuntos = Math.max(0, cliente.puntosFidelidad + puntosGanados - puntosUtilizados);
        const nuevoNivel = calcularNivelFidelidad(nuevosTotalCompras, nuevaCantidadCompras);

        // Actualizar cliente
        const clienteActualizado: Cliente = {
          ...cliente,
          totalCompras: nuevosTotalCompras,
          cantidadCompras: nuevaCantidadCompras,
          puntosFidelidad: nuevosPuntos,
          ultimaCompra: fechaCompra || new Date().toISOString().split('T')[0],
          nivelFidelidad: nuevoNivel,
          descuentoPreferencial: calcularDescuentoPreferencial(nuevoNivel)
        };

        // Guardar en base de datos
        db.actualizarCliente(clienteActualizado);

        // Actualizar estado
        const index = state.clientes.findIndex(c => c.id === clienteId);
        if (index !== -1) {
          state.clientes[index] = clienteActualizado;
        }

        // Actualizar cliente seleccionado si es el mismo
        if (state.clienteSeleccionado?.id === clienteId) {
          state.clienteSeleccionado = clienteActualizado;
        }

        state.error = null;
      } catch (error) {
        state.error = 'Error al registrar la compra';
        console.error('Error registrando compra:', error);
      }
    },
    
    /**
     * Seleccionar cliente activo
     */
    seleccionarCliente: (state, action: PayloadAction<Cliente | null>) => {
      state.clienteSeleccionado = action.payload;
      state.error = null;
    },
    
    /**
     * Buscar cliente por DNI
     */
    buscarClientePorDni: (state, action: PayloadAction<string>) => {
      try {
        const cliente = db.buscarClientePorDni(action.payload.trim());
        state.clienteSeleccionado = cliente;
        
        if (!cliente) {
          state.error = `No se encontró cliente con DNI: ${action.payload}`;
        } else {
          state.error = null;
        }
      } catch (error) {
        state.error = 'Error al buscar cliente';
        console.error('Error buscando cliente:', error);
      }
    },
    
    /**
     * Eliminar cliente
     */
    eliminarCliente: (state, action: PayloadAction<string>) => {
      try {
        const eliminado = db.eliminarCliente(action.payload);
        if (!eliminado) {
          state.error = 'Cliente no encontrado';
          return;
        }

        // Actualizar estado
        state.clientes = state.clientes.filter(c => c.id !== action.payload);
        
        // Limpiar selección si era el cliente eliminado
        if (state.clienteSeleccionado?.id === action.payload) {
          state.clienteSeleccionado = null;
        }

        state.error = null;
      } catch (error) {
        state.error = 'Error al eliminar el cliente';
        console.error('Error eliminando cliente:', error);
      }
    },

    /**
     * Limpiar errores
     */
    limpiarError: (state) => {
      state.error = null;
    },

    /**
     * Reiniciar estado (para testing o reset)
     */
    reiniciarEstado: (state) => {
      state.clientes = [];
      state.clienteSeleccionado = null;
      state.cargando = false;
      state.error = null;
    }
  },
});

// ===== ACTIONS =====
export const {
  cargarClientes,
  agregarCliente,
  actualizarCliente,
  registrarCompra,
  seleccionarCliente,
  buscarClientePorDni,
  eliminarCliente,
  limpiarError,
  reiniciarEstado
} = clientesSlice.actions;

// ===== SELECTOR HELPERS =====

/**
 * Calcular puntos necesarios para descuento
 */
export const calcularPuntosParaDescuento = calcularPuntosGanados;

/**
 * Obtener configuración de niveles y descuentos
 */
export const obtenerConfigNiveles = () => ({
  niveles: {
    'Bronce': { minCompras: 0, minTotal: 0, descuento: 3 },
    'Plata': { minCompras: 5, minTotal: 15000, descuento: 5 },
    'Oro': { minCompras: 15, minTotal: 50000, descuento: 10 },
    'Platino': { minCompras: 30, minTotal: 100000, descuento: 15 }
  },
  puntosConversion: 100 // $100 = 1 punto
});

/**
 * Calcular estadísticas de clientes
 */
export const calcularEstadisticasClientes = (clientes: Cliente[]) => {
  if (clientes.length === 0) {
    return {
      total: 0,
      porNivel: { Bronce: 0, Plata: 0, Oro: 0, Platino: 0 },
      ventaPromedio: 0,
      clienteActivo: 0
    };
  }

  const porNivel = clientes.reduce((acc, cliente) => {
    acc[cliente.nivelFidelidad]++;
    return acc;
  }, { Bronce: 0, Plata: 0, Oro: 0, Platino: 0 });

  const totalVentas = clientes.reduce((sum, c) => sum + c.totalCompras, 0);
  const totalCompras = clientes.reduce((sum, c) => sum + c.cantidadCompras, 0);
  
  const fechaLimite = new Date();
  fechaLimite.setMonth(fechaLimite.getMonth() - 3); // 3 meses atrás
  const clientesActivos = clientes.filter(c => 
    c.ultimaCompra && new Date(c.ultimaCompra) > fechaLimite
  ).length;

  return {
    total: clientes.length,
    porNivel,
    ventaPromedio: totalCompras > 0 ? totalVentas / totalCompras : 0,
    clienteActivo: clientesActivos
  };
};

export default clientesSlice.reducer; 