export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: string;
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  dni: string;
  telefono?: string;
  email?: string;
  fechaRegistro: string;
  puntosFidelidad: number;
  totalCompras: number;
  cantidadCompras: number;
  ultimaCompra?: string;
  descuentoPreferencial: number; // Porcentaje de descuento por fidelidad
  nivelFidelidad: 'Bronce' | 'Plata' | 'Oro' | 'Platino';
}

export interface ItemVenta {
  producto: Producto;
  cantidad: number;
}

export interface Venta {
  id: string;
  items: ItemVenta[];
  total: number;
  formaPago: 'efectivo' | 'tarjeta' | 'transferencia';
  fecha: string;
  cliente?: Cliente;
  descuentoAplicado: number;
  puntosGanados: number;
  puntosUtilizados: number;
  observaciones?: string;
}

export interface EstadoCaja {
  efectivo: number;
  tarjeta: number;
  transferencia: number;
  totalVentas: number;
}

export interface EstadisticasCliente {
  ventasPorMes: { mes: string; total: number; cantidad: number }[];
  productosFavoritos: { producto: string; cantidad: number }[];
  metodoPagoPreferido: string;
} 