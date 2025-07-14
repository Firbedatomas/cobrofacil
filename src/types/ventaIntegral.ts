import type { ProductoCompleto } from '../services/productosService';
import type { Mesa, EstadoMesa } from './mesas';

// ===============================================
// TIPOS PARA LA INTERFAZ DE VENTA INTEGRAL
// ===============================================

export interface ItemVentaIntegral {
  id: string;
  producto: ProductoCompleto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  descuento: number;
  especificaciones?: string; // Ej: "sin hielo", "al punto"
  esInvitacion: boolean;
  noDisponible: boolean;
  fechaAgregado: string;
  orden: number; // Para reordenar items
}

export interface VentaIntegralActiva {
  id: string;
  mesaId: string;
  mesa: Mesa;
  items: ItemVentaIntegral[];
  subtotal: number;
  descuentoTotal: number;
  total: number;
  estado: EstadoVentaIntegral;
  tiempoInicio: Date;
  tiempoUltimaActividad: Date;
  camarero: string;
  observaciones?: string;
  // Información adicional
  clienteId?: string;
  clienteNombre?: string;
  metodoPago?: MetodoPago;
  comanda?: ComandaInfo;
  pagos?: PagosParciales[];
}

export enum EstadoVentaIntegral {
  ACTIVA = 'ACTIVA',
  MARCHADA = 'MARCHADA', // Enviada a cocina/bar
  LISTA = 'LISTA',
  CUENTA_PEDIDA = 'CUENTA_PEDIDA',
  PAGADA = 'PAGADA',
  CERRADA = 'CERRADA'
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  QR_MERCADOPAGO = 'QR_MERCADOPAGO',
  PUNTOS_FIDELIDAD = 'PUNTOS_FIDELIDAD',
  MIXTO = 'MIXTO'
}

export interface ComandaInfo {
  numero: string;
  fechaEnvio: Date;
  items: string[]; // IDs de los items enviados
  estado: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTA' | 'SERVIDA';
}

export interface PagosParciales {
  id: string;
  monto: number;
  metodo: MetodoPago;
  fecha: Date;
  observaciones?: string;
  transaccionId?: string;
}

export interface DescuentoAplicado {
  tipo: 'PORCENTAJE' | 'MONTO_FIJO';
  valor: number;
  aplicadoA: 'TOTAL' | 'ITEM';
  itemId?: string;
  descripcion: string;
  fechaAplicacion: Date;
}

export interface FusionCuenta {
  mesaOrigenId: string;
  mesaDestinoId: string;
  itemsTransferidos: string[];
  fecha: Date;
  observaciones?: string;
}

export interface TransferenciaMesa {
  mesaOrigenId: string;
  mesaDestinoId: string;
  itemsTransferidos: string[];
  fecha: Date;
  usuario: string;
  observaciones?: string;
}

// ===============================================
// TIPOS PARA FACTURACIÓN
// ===============================================

export enum TipoComprobante {
  TICKET_NO_FISCAL = 'TICKET_NO_FISCAL',
  FACTURA_A = 'FACTURA_A',
  FACTURA_B = 'FACTURA_B',
  NOTA_CREDITO_A = 'NOTA_CREDITO_A',
  NOTA_CREDITO_B = 'NOTA_CREDITO_B'
}

export interface ComprobanteConfig {
  tipo: TipoComprobante;
  numero?: string;
  cae?: string;
  vencimientoCae?: Date;
  puntoVenta: string;
  clienteRazonSocial?: string;
  clienteCuit?: string;
  clienteCondicionIva?: string;
  clienteDomicilio?: string;
}

export interface PuntosFidelidad {
  ganados: number;
  utilizados: number;
  saldo: number;
  equivalenciaEfectivo: number;
}

// ===============================================
// TIPOS PARA HERRAMIENTAS DE GESTIÓN
// ===============================================

export interface AccionItem {
  tipo: 'SUBIR' | 'BAJAR' | 'BORRAR' | 'REUBICAR' | 'ESPECIFICAR' | 'NO_EXISTE';
  itemId: string;
  parametros?: any;
  fecha: Date;
  usuario: string;
}

export interface AccionVenta {
  tipo: 'SUMAR' | 'RESTAR' | 'INCLUIR' | 'INVITAR' | 'MARCHAR' | 'DESCUENTO';
  itemId?: string;
  parametros?: any;
  fecha: Date;
  usuario: string;
}

export interface AccionFacturacion {
  tipo: 'FACTURA' | 'FAC_A_FISCAL' | 'FAC_B_FISCAL' | 'PUNTOS';
  parametros?: any;
  fecha: Date;
  usuario: string;
}

export interface AccionComercial {
  tipo: 'DESCUENTO' | 'CUENTA' | 'TRANSFERIR' | 'REC_PARCIAL';
  parametros?: any;
  fecha: Date;
  usuario: string;
}

// ===============================================
// TIPOS PARA BÚSQUEDA DE PRODUCTOS
// ===============================================

export interface BusquedaProductoResultado {
  producto: ProductoCompleto;
  relevancia: number;
  destacado: boolean;
  promocion?: PromocionProducto;
}

export interface PromocionProducto {
  id: string;
  nombre: string;
  descuento: number;
  vigenciaHasta: Date;
  aplicaA: 'PRODUCTO' | 'CATEGORIA';
  condiciones?: string;
}

// ===============================================
// TIPOS PARA CONFIGURACIÓN
// ===============================================

export interface ConfiguracionVentaIntegral {
  mostrarCodigos: boolean;
  mostrarStock: boolean;
  mostrarCategorias: boolean;
  autocompletarCantidad: boolean;
  cantidadPorDefecto: number;
  permitirVentaSinStock: boolean;
  aplicarDescuentosAutomaticos: boolean;
  enviarComandaAutomatica: boolean;
  tiempoLimiteVenta: number; // minutos
  monedaPrincipal: 'ARS' | 'USD' | 'EUR';
  decimalesPrecios: number;
  formatoNumeros: 'PUNTO' | 'COMA';
}

export interface EstadisticasVenta {
  tiempoPromedio: number;
  itemsPromedio: number;
  montoPromedio: number;
  metodoPagoMasUsado: MetodoPago;
  productoMasVendido: ProductoCompleto;
  horasPico: number[];
  tendenciaSemanal: { dia: string; ventas: number }[];
}

// Todos los tipos y enums se exportan individualmente arriba 