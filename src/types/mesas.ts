// Tipos para el sistema de gestión de mesas

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  rol?: string;
}

export interface Sector {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden: number;
  color?: string;
  icono?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  usuarioId: string;
  usuario?: Usuario;
  mesas?: Mesa[];
  objetosDecorativos?: ObjetoDecorativo[];
}

export interface Mesa {
  id: string;
  numero: string;
  capacidad: number;
  posicionX: number;
  posicionY: number;
  size: number; // Tamaño personalizado en píxeles (50px por defecto)
  estado: EstadoMesa;
  forma: FormaMesa;
  color?: string;
  observaciones?: string;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  sectorId: string;
  sector?: Pick<Sector, 'id' | 'nombre' | 'color'>;
  usuarioId: string;
  usuario?: Usuario;
  ventas?: VentaMesa[];
  comanderas?: ConfiguracionComanderas;
}

export interface ConfiguracionComanderas {
  habilitado: boolean;
  cantidad: number; // Máximo 3
  impresoras: ImpresoraComanderas[];
}

export interface ImpresoraComanderas {
  id: string;
  nombre: string;
  tipo: TipoComanderas;
  activa: boolean;
  prioridad: number; // 1 = principal, 2 = secundaria, 3 = terciaria
}

export interface ObjetoDecorativo {
  id: string;
  nombre: string;
  tipo: TipoObjeto;
  posicionX: number;
  posicionY: number;
  ancho: number;
  alto: number;
  color?: string;
  icono?: string;
  forma?: string;
  descripcion?: string;
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  sectorId: string;
  sector?: Pick<Sector, 'id' | 'nombre' | 'color'>;
  usuarioId: string;
  usuario?: Usuario;
}

export interface VentaMesa {
  id: string;
  numeroVenta: string;
  total: number;
  subtotal: number;
  impuesto: number;
  descuento: number;
  metodoPago: string;
  estado: string;
  fechaVenta: string;
  mesaId?: string;
  detalles?: DetalleVenta[];
}

export interface DetalleVenta {
  id: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  ventaId: string;
  productoId: string;
  producto?: Producto;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  activo: boolean;
  categoria?: string;
}

// Enums
export enum EstadoMesa {
  LIBRE = 'LIBRE',
  OCUPADA = 'OCUPADA',
  ESPERANDO_PEDIDO = 'ESPERANDO_PEDIDO',
  CUENTA_PEDIDA = 'CUENTA_PEDIDA',
  RESERVADA = 'RESERVADA',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO'
}

export enum FormaMesa {
  REDONDA = 'REDONDA',
  CUADRADA = 'CUADRADA',
  RECTANGULAR = 'RECTANGULAR',
  OVALADA = 'OVALADA'
}

export enum TipoObjeto {
  DECORATIVO = 'DECORATIVO',
  BARRA = 'BARRA',
  ESCENARIO = 'ESCENARIO',
  BANO = 'BANO',
  COCINA = 'COCINA',
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  OTROS = 'OTROS'
}

export enum TipoComanderas {
  COCINA = 'COCINA',
  BAR = 'BAR',
  POSTRES = 'POSTRES'
}

// Tipos para formularios
export interface CrearSectorForm {
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  orden?: number;
}

export interface ActualizarSectorForm extends Partial<CrearSectorForm> {
  activo?: boolean;
}

export interface CrearMesaForm {
  numero: string;
  sectorId: string;
  capacidad: number;
  forma?: FormaMesa;
  posicionX?: number;
  posicionY?: number;
  size?: number; // Tamaño personalizado opcional
  color?: string;
  observaciones?: string;
  comanderas?: ConfiguracionComanderas;
}

export interface ActualizarMesaForm extends Partial<CrearMesaForm> {
  activa?: boolean;
}

export interface CrearObjetoDecorativoForm {
  nombre: string;
  sectorId: string;
  tipo?: TipoObjeto;
  posicionX?: number;
  posicionY?: number;
  ancho?: number;
  alto?: number;
  color?: string;
  icono?: string;
  forma?: string;
  descripcion?: string;
}

export interface ActualizarObjetoDecorativoForm extends Partial<CrearObjetoDecorativoForm> {
  activo?: boolean;
}

// Tipos para respuestas de la API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Tipos para eventos de drag & drop
export interface DragEvent {
  id: string;
  type: 'mesa' | 'objeto';
  posicionX: number;
  posicionY: number;
}

// Tipos para configuración del canvas
export interface CanvasConfig {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

// Colores para estados de mesa
export const COLORES_ESTADO_MESA = {
  'LIBRE': '#4CAF50',
  'OCUPADA': '#F44336',
  'ESPERANDO_PEDIDO': '#2196F3',
  'CUENTA_PEDIDA': '#FF9800',
  'RESERVADA': '#9C27B0',
  'FUERA_DE_SERVICIO': '#9E9E9E'
};

// Etiquetas para estados de mesa
export const ETIQUETAS_ESTADO_MESA = {
  'LIBRE': 'Libre',
  'OCUPADA': 'Ocupada',
  'ESPERANDO_PEDIDO': 'Esperando Pedido',
  'CUENTA_PEDIDA': 'Cuenta Pedida',
  'RESERVADA': 'Reservada',
  'FUERA_DE_SERVICIO': 'Fuera de Servicio'
};

// Iconos para tipos de objetos
export const ICONOS_TIPO_OBJETO = {
  'DECORATIVO': '🎨',
  'BARRA': '🍺',
  'ESCENARIO': '🎭',
  'BANO': '🚻',
  'COCINA': '🍳',
  'ENTRADA': '🚪',
  'SALIDA': '🚪',
  'OTROS': '📦'
}; 