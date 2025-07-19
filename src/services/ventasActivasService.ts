// ===============================================
// SERVICIO DE VENTAS ACTIVAS
// Manejo de persistencia de ventas en progreso
// ===============================================

import { toastService } from './toastService';
import api from './api';

export interface VentaActiva {
  id: string;
  mesaId: string;
  items: ItemVentaActiva[];
  total: number;
  estado: 'activa' | 'pausada' | 'completada';
  fechaApertura: Date;
  fechaUltimaModificacion: Date;
  camarero: string;
  observaciones?: string;
  clienteId?: string;
  clienteNombre?: string;
  descuentoAplicado?: number;
  metodoPago?: 'EFECTIVO' | 'TARJETA_DEBITO' | 'TARJETA_CREDITO' | 'TRANSFERENCIA' | 'QR_MERCADOPAGO';
}

export interface ItemVentaActiva {
  id: string;
  productoId: string;
  productoNombre: string;
  productoCodigo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  observaciones?: string;
  fechaAgregado: Date;
}

// SERVICIO DE VENTAS ACTIVAS - SINCRONIZACIÓN CON BACKEND
// Ahora sincroniza con el backend para consistencia entre dispositivos

class VentasActivasService {
  private static instance: VentasActivasService;
  private ventasActivas: Map<string, VentaActiva> = new Map();

  private constructor() {
    console.log('🚀 VentasActivasService iniciado con sincronización backend');
  }

  static getInstance(): VentasActivasService {
    if (!VentasActivasService.instance) {
      VentasActivasService.instance = new VentasActivasService();
    }
    return VentasActivasService.instance;
  }

  // ===============================================
  // MÉTODOS PRINCIPALES
  // ===============================================

  /**
   * Verificar si hay cache local para una mesa (sin hacer llamada al API)
   */
  tieneCache(mesaId: string): boolean {
    return this.ventasActivas.has(mesaId);
  }

  /**
   * Obtener venta desde cache local únicamente (sin API)
   */
  obtenerDesdeCache(mesaId: string): VentaActiva | null {
    return this.ventasActivas.get(mesaId) || null;
  }

  /**
   * Obtener venta activa de una mesa - CON SINCRONIZACIÓN BACKEND
   */
  async obtenerVentaActiva(mesaId: string): Promise<VentaActiva | null> {
    // VALIDACIÓN ESTRICTA: Verificar que mesaId sea válido
    if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
      console.warn('⚠️ obtenerVentaActiva: mesaId inválido:', mesaId);
      return null;
    }

    try {
      // Intentar obtener desde backend primero
      const response = await api.get(`/ventas/mesa/${mesaId}`);
      
      if (response.data.success && response.data.data) {
        const ventaBackend = response.data.data;
        
        // Convertir formato backend a formato frontend
        const ventaLocal: VentaActiva = {
          id: ventaBackend.ventaId,
          mesaId: ventaBackend.mesaId,
          items: ventaBackend.detalles.map((detalle: any) => ({
            id: detalle.id,
            productoId: detalle.productoId,
            productoNombre: detalle.producto.nombre,
            productoCodigo: detalle.producto.codigo,
            cantidad: detalle.cantidad,
            precioUnitario: detalle.precioUnitario,
            subtotal: detalle.subtotal,
            observaciones: detalle.observaciones,
            fechaAgregado: new Date(detalle.fechaCreacion || Date.now())
          })),
          total: ventaBackend.total,
          estado: 'activa',
          fechaApertura: new Date(ventaBackend.fechaCreacion),
          fechaUltimaModificacion: new Date(),
          camarero: ventaBackend.usuario?.nombre || 'Usuario',
          observaciones: ventaBackend.observaciones,
          clienteId: ventaBackend.cliente?.id,
          clienteNombre: ventaBackend.cliente?.nombre,
          descuentoAplicado: ventaBackend.descuento || 0
        };

        // Actualizar cache local
        this.ventasActivas.set(mesaId, ventaLocal);
        
        console.log('✅ Venta obtenida desde backend para mesa:', mesaId, 'Items:', ventaLocal.items.length);
        return ventaLocal;
      } else if (response.data.success && !response.data.data) {
        console.log('ℹ️ No hay venta activa para mesa:', mesaId);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('ℹ️ No hay venta activa para mesa:', mesaId);
        return null;
      }
      console.error('❌ Error obteniendo venta desde backend:', error);
      // Fallback a cache local
      const ventaLocal = this.ventasActivas.get(mesaId);
      if (ventaLocal) {
        console.log('📦 Usando venta desde cache local para mesa:', mesaId);
        return ventaLocal;
      }
    }
    
    return null;
  }

  /**
   * Crear nueva venta activa - CON SINCRONIZACIÓN BACKEND
   */
  async crearVentaActiva(mesaId: string, camarero: string = 'Usuario Actual'): Promise<VentaActiva> {
    try {
      // Crear venta vacía en backend
      const response = await api.post('/ventas/mesa', {
        mesaId,
        productos: [], // Inicialmente vacía
        observaciones: `Venta iniciada por ${camarero}`
      });

      if (response.data.success) {
        const ventaBackend = response.data.data;
        
        const nuevaVenta: VentaActiva = {
          id: ventaBackend.ventaId,
          mesaId,
          items: [],
          total: 0,
          estado: 'activa',
          fechaApertura: new Date(ventaBackend.fechaCreacion),
          fechaUltimaModificacion: new Date(),
          camarero
        };

        // Actualizar cache local
        this.ventasActivas.set(mesaId, nuevaVenta);
        
        console.log('✅ Venta creada en backend y cache local:', nuevaVenta.id);
        return nuevaVenta;
      }
    } catch (error: any) {
      console.error('❌ Error creando venta en backend:', error);
      
      // Fallback: crear solo en memoria temporalmente
      const ventaFallback: VentaActiva = {
        id: `venta-${mesaId}-${Date.now()}`,
        mesaId,
        items: [],
        total: 0,
        estado: 'activa',
        fechaApertura: new Date(),
        fechaUltimaModificacion: new Date(),
        camarero
      };

      this.ventasActivas.set(mesaId, ventaFallback);
      
      toastService.warning('Venta creada temporalmente - Problemas de conectividad');
      return ventaFallback;
    }

    throw new Error('No se pudo crear la venta');
  }

  /**
   * Agregar producto a venta activa - CON SINCRONIZACIÓN BACKEND
   */
  async agregarProducto(
    mesaId: string,
    producto: {
      id: string;
      nombre: string;
      codigo: string;
      precio: number;
    },
    cantidad: number = 1,
    observaciones?: string
  ): Promise<VentaActiva> {
    // VALIDACIÓN ESTRICTA: Verificar parámetros
    if (!mesaId || typeof mesaId !== 'string' || mesaId.trim() === '') {
      throw new Error('mesaId inválido para agregar producto');
    }
    
    if (!producto || !producto.id || !producto.nombre) {
      throw new Error('Producto inválido para agregar');
    }
    
    console.log('🛒 Agregando producto a mesa:', mesaId, 'Producto:', producto.nombre);
    
    // Obtener venta activa (desde backend)
    let venta = await this.obtenerVentaActiva(mesaId);
    
    if (!venta) {
      console.log('📝 Creando nueva venta para mesa:', mesaId);
      venta = await this.crearVentaActiva(mesaId);
    }

    try {
      // Enviar producto al backend
      const response = await api.post(`/ventas/${venta.id}/productos`, {
        productoId: producto.id,
        cantidad,
        precio: producto.precio,
        observaciones
      });

      if (response.data.success) {
        // Actualizar venta completa desde backend
        const ventaActualizada = await this.obtenerVentaActiva(mesaId);
        
        if (ventaActualizada) {
          console.log('✅ Producto agregado correctamente:', producto.nombre, 'Total items:', ventaActualizada.items.length);
          return ventaActualizada;
        }
      }
    } catch (error: any) {
      console.error('❌ Error agregando producto en backend:', error);
      
      // Fallback: agregar solo en memoria
      const itemExistente = venta.items.find(item => 
        item.productoId === producto.id && item.observaciones === observaciones
      );

      if (itemExistente) {
        itemExistente.cantidad += cantidad;
        itemExistente.subtotal = itemExistente.cantidad * itemExistente.precioUnitario;
        itemExistente.fechaAgregado = new Date();
      } else {
        const nuevoItem: ItemVentaActiva = {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          productoId: producto.id,
          productoNombre: producto.nombre,
          productoCodigo: producto.codigo,
          cantidad,
          precioUnitario: producto.precio,
          subtotal: cantidad * producto.precio,
          observaciones,
          fechaAgregado: new Date()
        };
        venta.items.push(nuevoItem);
      }

      // Recalcular total
      venta.total = venta.items.reduce((sum, item) => sum + item.subtotal, 0);
      venta.fechaUltimaModificacion = new Date();

      this.ventasActivas.set(mesaId, venta);
      
      toastService.warning('Producto agregado temporalmente - Problemas de conectividad');
    }
    
    return venta;
  }

  /**
   * Verificar si hay venta activa
   */
  async tieneVentaActiva(mesaId: string): Promise<boolean> {
    const venta = await this.obtenerVentaActiva(mesaId);
    return venta !== null && venta.items.length > 0;
  }

  /**
   * Completar venta (eliminar de activas)
   */
  async completarVenta(mesaId: string): Promise<void> {
    const venta = await this.obtenerVentaActiva(mesaId);
    if (venta) {
      // Eliminar de cache local
      this.ventasActivas.delete(mesaId);
      
      console.log('✅ Venta completada y eliminada de activas:', venta.id);
      toastService.success('Venta completada correctamente');
    }
  }

  /**
   * Eliminar producto de venta activa
   */
  async eliminarProducto(mesaId: string, itemId: string): Promise<VentaActiva | null> {
    const venta = await this.obtenerVentaActiva(mesaId);
    if (!venta) return null;

    try {
      // TODO: Implementar endpoint para eliminar producto en backend
      // Por ahora, solo eliminar localmente
      venta.items = venta.items.filter(item => item.id !== itemId);
      venta.total = venta.items.reduce((sum, item) => sum + item.subtotal, 0);
      venta.fechaUltimaModificacion = new Date();

      if (venta.items.length === 0) {
        // Si no quedan productos, eliminar la venta
        this.ventasActivas.delete(mesaId);
        return null;
      }

      this.ventasActivas.set(mesaId, venta);
      return venta;
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      return venta;
    }
  }

  /**
   * Modificar cantidad de un producto
   */
  async modificarCantidad(mesaId: string, itemId: string, nuevaCantidad: number): Promise<VentaActiva | null> {
    const venta = await this.obtenerVentaActiva(mesaId);
    if (!venta) return null;

    if (nuevaCantidad <= 0) {
      return this.eliminarProducto(mesaId, itemId);
    }

    try {
      // TODO: Implementar endpoint para modificar cantidad en backend
      // Por ahora, solo modificar localmente
      const item = venta.items.find(item => item.id === itemId);
      if (!item) return null;

      item.cantidad = nuevaCantidad;
      item.subtotal = item.cantidad * item.precioUnitario;
      item.fechaAgregado = new Date();

      venta.total = venta.items.reduce((sum, item) => sum + item.subtotal, 0);
      venta.fechaUltimaModificacion = new Date();

      this.ventasActivas.set(mesaId, venta);
      return venta;
    } catch (error) {
      console.error('❌ Error modificando cantidad:', error);
      return venta;
    }
  }

  /**
   * Limpiar todas las ventas activas
   */
  limpiarTodas(): void {
    this.ventasActivas.clear();
    console.log('🧹 Todas las ventas activas limpiadas');
  }

  /**
   * Obtener todas las ventas activas
   */
  obtenerTodas(): VentaActiva[] {
    return Array.from(this.ventasActivas.values());
  }

  /**
   * Obtener estadísticas
   */
  obtenerEstadisticas(): {
    totalVentas: number;
    totalItems: number;
    totalMonto: number;
  } {
    const ventas = this.obtenerTodas();
    return {
      totalVentas: ventas.length,
      totalItems: ventas.reduce((sum, venta) => sum + venta.items.length, 0),
      totalMonto: ventas.reduce((sum, venta) => sum + venta.total, 0)
    };
  }
}

// Exportar instancia singleton
export const ventasActivasService = VentasActivasService.getInstance();
export default ventasActivasService; 