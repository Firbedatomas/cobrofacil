// ===============================================
// INTERFACES PARA NUEVAS FUNCIONALIDADES
// CobroFacil Plus - Funcionalidades Xubio
// ===============================================

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  cuit?: string;
  condicionIva: 'RESPONSABLE_INSCRIPTO' | 'CONSUMIDOR_FINAL' | 'EXENTO' | 'MONOTRIBUTO';
  activo: boolean;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  usuarioId: string;
  
  // Relaciones
  listaPrecioAsignada?: ListaPrecioCliente;
  presupuestos?: Presupuesto[];
  ventas?: any[];
}

export interface Presupuesto {
  id: string;
  numero: string;
  clienteId?: string;
  nombreCliente?: string;
  emailCliente?: string;
  telefonoCliente?: string;
  direccionCliente?: string;
  fechaVencimiento: Date;
  validezDias: number;
  total: number;
  subtotal: number;
  impuestos: number;
  descuento: number;
  observaciones?: string;
  estado: 'BORRADOR' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'VENCIDO' | 'CONVERTIDO';
  fechaEnvio?: Date;
  fechaAceptacion?: Date;
  fechaConversion?: Date;
  templatePersonalizado?: string;
  usuarioId: string;
  
  // Relaciones
  cliente?: Cliente;
  detalles: DetallePresupuesto[];
  ventaGenerada?: any;
}

export interface DetallePresupuesto {
  id: string;
  presupuestoId: string;
  productoId?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  subtotal: number;
  
  // Relaciones
  producto?: any;
}

export interface FacturaRecurrente {
  id: string;
  nombre: string;
  descripcion?: string;
  clienteId: string;
  frecuencia: 'MENSUAL' | 'BIMENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';
  diaVencimiento: number;
  proximaFactura: Date;
  total: number;
  subtotal: number;
  impuestos: number;
  tipoComprobante: 'TICKET_NO_FISCAL' | 'TICKET_FISCAL' | 'FACTURA_A' | 'FACTURA_B';
  metodoPago: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'QR_MERCADOPAGO';
  activa: boolean;
  fechaCreacion: Date;
  usuarioId: string;
  
  // Relaciones
  cliente: Cliente;
  detalles: DetalleFacturaRecurrente[];
  ventasGeneradas?: VentaRecurrente[];
}

export interface DetalleFacturaRecurrente {
  id: string;
  facturaRecurrenteId: string;
  productoId?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  
  // Relaciones
  producto?: any;
}

export interface VentaRecurrente {
  id: string;
  facturaRecurrenteId: string;
  ventaId: string;
  fechaGeneracion: Date;
  notificacionEnviada: boolean;
  
  // Relaciones
  facturaRecurrente: FacturaRecurrente;
  venta: any;
}

export interface ListaPrecio {
  id: string;
  nombre: string;
  descripcion?: string;
  descuentoGeneral: number;
  moneda: 'ARS' | 'USD' | 'EUR';
  activa: boolean;
  fechaCreacion: Date;
  usuarioId: string;
  
  // Relaciones
  precios: PrecioProducto[];
  clientesAsignados?: ListaPrecioCliente[];
}

export interface PrecioProducto {
  id: string;
  listaPrecioId: string;
  productoId: string;
  precio: number;
  descuento: number;
  
  // Relaciones
  listaPrecio: ListaPrecio;
  producto: any;
}

export interface ListaPrecioCliente {
  id: string;
  clienteId: string;
  listaPrecioId: string;
  activa: boolean;
  fechaAsignacion: Date;
  
  // Relaciones
  cliente: Cliente;
  listaPrecio: ListaPrecio;
}

export interface Empleado {
  id: string;
  legajo: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  fechaIngreso: Date;
  fechaEgreso?: Date;
  categoria: string;
  cargo: string;
  sector?: string;
  sueldoBasico: number;
  modalidadPago: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
  activo: boolean;
  fechaCreacion: Date;
  usuarioId: string;
  
  // Relaciones
  liquidaciones?: LiquidacionSueldo[];
}

export interface LiquidacionSueldo {
  id: string;
  empleadoId: string;
  periodo: string; // YYYY-MM
  sueldoBasico: number;
  horasExtra: number;
  premios: number;
  descuentos: number;
  aportesJubilatorios: number;
  aportesSociales: number;
  obraSocial: number;
  totalHaberes: number;
  totalDescuentos: number;
  netoAPagar: number;
  observaciones?: string;
  estado: 'PENDIENTE' | 'PAGADA';
  fechaLiquidacion: Date;
  fechaPago?: Date;
  usuarioId: string;
  
  // Relaciones
  empleado: Empleado;
}

export interface Cheque {
  id: string;
  numero: string;
  banco: string;
  sucursal?: string;
  cuentaCorriente?: string;
  importe: number;
  fechaEmision: Date;
  fechaVencimiento: Date;
  fechaCobro?: Date;
  fechaRechazo?: Date;
  firmante?: string;
  cuitFirmante?: string;
  librador?: string;
  beneficiario?: string;
  concepto?: string;
  observaciones?: string;
  observacionesEstado?: string;
  tipo: 'EMITIDO' | 'RECIBIDO';
  estado: 'PENDIENTE' | 'COBRADO' | 'RECHAZADO' | 'ANULADO';
  origen?: 'VENTA' | 'COMPRA' | 'PAGO_PROVEEDOR' | 'COBRO_CLIENTE' | 'OTROS';
  fechaCreacion: Date;
  usuarioId: string;
}

// ===============================================
// INTERFACES PARA FILTROS Y BÚSQUEDAS
// ===============================================

export interface FiltrosClientes {
  page?: number;
  limit?: number;
  activo?: boolean;
  condicionIva?: string;
  provincia?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosPresupuestos {
  page?: number;
  limit?: number;
  estado?: string;
  clienteId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosFacturasRecurrentes {
  page?: number;
  limit?: number;
  activa?: boolean;
  frecuencia?: string;
  clienteId?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosListasPrecios {
  page?: number;
  limit?: number;
  activa?: boolean;
  moneda?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosEmpleados {
  page?: number;
  limit?: number;
  activo?: boolean;
  categoria?: string;
  sector?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosLiquidaciones {
  page?: number;
  limit?: number;
  empleadoId?: string;
  periodo?: string;
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

export interface FiltrosCheques {
  page?: number;
  limit?: number;
  tipo?: string;
  estado?: string;
  banco?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  vencimientoDesde?: string;
  vencimientoHasta?: string;
  busqueda?: string;
  ordenPor?: string;
  orden?: 'asc' | 'desc';
}

// ===============================================
// INTERFACES PARA RESPUESTAS DE API
// ===============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface EstadisticasGenerales {
  total: number;
  activos?: number;
  inactivos?: number;
  [key: string]: any;
}

// ===============================================
// INTERFACES PARA FORMULARIOS
// ===============================================

export interface FormularioCliente {
  nombre: string;
  apellido?: string;
  razonSocial?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  provincia?: string;
  codigoPostal?: string;
  cuit?: string;
  condicionIva: string;
}

export interface FormularioPresupuesto {
  clienteId?: string;
  nombreCliente?: string;
  emailCliente?: string;
  telefonoCliente?: string;
  direccionCliente?: string;
  fechaVencimiento: string;
  validezDias: number;
  observaciones?: string;
  detalles: {
    productoId?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
  }[];
}

export interface FormularioFacturaRecurrente {
  nombre: string;
  descripcion?: string;
  clienteId: string;
  frecuencia: string;
  diaVencimiento: number;
  proximaFactura: string;
  tipoComprobante: string;
  metodoPago: string;
  detalles: {
    productoId?: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
  }[];
}

export interface FormularioListaPrecio {
  nombre: string;
  descripcion?: string;
  descuentoGeneral: number;
  moneda: string;
  precios: {
    productoId: string;
    precio: number;
    descuento: number;
  }[];
}

export interface FormularioEmpleado {
  legajo: string;
  nombre: string;
  apellido: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  cuit?: string;
  fechaIngreso: string;
  categoria: string;
  cargo: string;
  sector?: string;
  sueldoBasico: number;
  modalidadPago: string;
  banco?: string;
  cbu?: string;
  aliasCbu?: string;
}

export interface FormularioLiquidacion {
  empleadoId: string;
  periodo: string;
  sueldoBasico: number;
  horasExtra?: number;
  premios?: number;
  descuentos?: number;
  aportesJubilatorios?: number;
  aportesSociales?: number;
  obraSocial?: number;
  observaciones?: string;
}

export interface FormularioCheque {
  numero: string;
  banco: string;
  sucursal?: string;
  cuentaCorriente?: string;
  importe: number;
  fechaEmision: string;
  fechaVencimiento: string;
  firmante?: string;
  cuitFirmante?: string;
  librador?: string;
  beneficiario?: string;
  concepto?: string;
  observaciones?: string;
  tipo: string;
  origen?: string;
} 