import api from './api';

export interface ProductoCompleto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria: { id: string; nombre: string } | string; // Puede ser objeto o string
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export interface BusquedaProductosParams {
  termino?: string;
  categoria?: string;
  activo?: boolean;
  limite?: number;
  offset?: number;
}

export interface ResultadoBusqueda {
  productos: ProductoCompleto[];
  total: number;
  hasMore: boolean;
}

class ProductosService {
  
  // Obtener todos los productos
  async obtenerTodos(): Promise<ProductoCompleto[]> {
    try {
      const response = await api.get('/productos');
      return response.data.productos || [];
    } catch (error) {
      console.error('Error al obtener productos de la API:', error);
      throw error;
    }
  }

  // Buscar productos por término (nombre o código)
  async buscarProductos(params: BusquedaProductosParams): Promise<ResultadoBusqueda> {
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/productos/buscar?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar productos en la API:', error);
      throw error;
    }
  }

  // Buscar productos en tiempo real (para autocompletado)
  async buscarEnTiempoReal(termino: string, limite: number = 10): Promise<ProductoCompleto[]> {
    if (!termino || termino.length < 1) {
      return [];
    }

    try {
      const url = `/productos/buscar-rapido?q=${encodeURIComponent(termino)}&limite=${limite}`;
      const response = await api.get(url);
      return response.data.productos || [];
    } catch (error) {
      console.error('Error en búsqueda rápida:', error);
      throw error;
    }
  }

  // Obtener producto por ID
  async obtenerPorId(id: string): Promise<ProductoCompleto | null> {
    try {
      const response = await api.get(`/productos/${id}`);
      return response.data.producto || null;
    } catch (error) {
      console.error('Error al obtener producto por ID:', error);
      throw error;
    }
  }

  // Obtener producto por código
  async obtenerPorCodigo(codigo: string): Promise<ProductoCompleto | null> {
    try {
      const response = await api.get(`/productos/codigo/${codigo}`);
      return response.data.producto || null;
    } catch (error) {
      console.error('Error al obtener producto por código:', error);
      throw error;
    }
  }

  // Obtener categorías disponibles
  async obtenerCategorias(): Promise<{ id: string; nombre: string }[]> {
    try {
      const response = await api.get('/categorias');
      return response.data.categorias || [];
    } catch (error) {
      console.error('Error al obtener categorías:', error);
      throw error;
    }
  }

  // Crear nueva categoría
  async crearCategoria(datos: { nombre: string; descripcion?: string }): Promise<{ id: string; nombre: string }> {
    try {
      const response = await api.post('/categorias/rapida', datos);
      return response.data.categoria;
    } catch (error) {
      console.error('Error al crear categoría:', error);
      throw error;
    }
  }

  // Crear nuevo producto
  async crearProducto(datosProducto: {
    codigo?: string;
    nombre: string;
    descripcion?: string;
    precio?: number;
    categoriaId: string;
  }): Promise<ProductoCompleto> {
    try {
      const response = await api.post('/productos', datosProducto);
      return response.data.producto;
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }

  // Actualizar producto
  async actualizarProducto(id: string, datosProducto: {
    codigo?: string;
    nombre?: string;
    descripcion?: string;
    precio?: number;
    categoriaId?: string;
  }): Promise<ProductoCompleto> {
    try {
      const response = await api.put(`/productos/${id}`, datosProducto);
      return response.data.producto;
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  }

  // Eliminar producto
  async eliminarProducto(id: string): Promise<void> {
    try {
      await api.delete(`/productos/${id}`);
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }
}

export const productosService = new ProductosService();
export default productosService; 