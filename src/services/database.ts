import type { Producto, Cliente, Venta, EstadoCaja } from '../types';

// Claves para localStorage
const STORAGE_KEYS = {
  PRODUCTOS: 'cordobashot_productos',
  CLIENTES: 'cordobashot_clientes', 
  VENTAS: 'cordobashot_ventas',
  CAJA: 'cordobashot_caja',
  SETTINGS: 'cordobashot_settings'
} as const;

// Estructura inicial VACÍA - sin datos hardcodeados
const EMPTY_INITIAL_DATA = {
  productos: [] as Producto[],
  clientes: [] as Cliente[],
  ventas: [] as Venta[],
  caja: {
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0,
    totalVentas: 0
  } as EstadoCaja
} as const;

/**
 * Sistema de base de datos local usando localStorage
 * Inicia completamente vacío - solo almacena datos reales creados por el usuario
 */
export class Database {
  private static instance: Database;

  private constructor() {
    this.initializeDatabase();
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Inicializar la base de datos con estructura vacía
   * Solo crea las llaves si no existen, sin datos por defecto
   */
  private initializeDatabase(): void {
    // Inicializar solo estructura vacía - sin datos hardcodeados
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTOS)) {
      this.saveToStorage(STORAGE_KEYS.PRODUCTOS, EMPTY_INITIAL_DATA.productos);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTES)) {
      this.saveToStorage(STORAGE_KEYS.CLIENTES, EMPTY_INITIAL_DATA.clientes);
    }
    if (!localStorage.getItem(STORAGE_KEYS.VENTAS)) {
      this.saveToStorage(STORAGE_KEYS.VENTAS, EMPTY_INITIAL_DATA.ventas);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CAJA)) {
      this.saveToStorage(STORAGE_KEYS.CAJA, EMPTY_INITIAL_DATA.caja);
    }
  }

  /**
   * Guardar datos en localStorage con manejo de errores
   */
  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error guardando en localStorage [${key}]:`, error);
      throw new Error(`No se pudo guardar los datos en el almacenamiento local`);
    }
  }

  /**
   * Cargar datos desde localStorage con manejo de errores
   */
  private loadFromStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error cargando desde localStorage [${key}]:`, error);
      return defaultValue;
    }
  }

  // ===== GESTIÓN DE PRODUCTOS =====
  getProductos(): Producto[] {
    return this.loadFromStorage(STORAGE_KEYS.PRODUCTOS, []);
  }

  saveProductos(productos: Producto[]): void {
    this.saveToStorage(STORAGE_KEYS.PRODUCTOS, productos);
  }

  agregarProducto(producto: Producto): void {
    const productos = this.getProductos();
    productos.push(producto);
    this.saveProductos(productos);
  }

  actualizarProducto(productoActualizado: Producto): boolean {
    const productos = this.getProductos();
    const index = productos.findIndex(p => p.id === productoActualizado.id);
    
    if (index === -1) return false;
    
    productos[index] = productoActualizado;
    this.saveProductos(productos);
    return true;
  }

  eliminarProducto(productoId: string): boolean {
    const productos = this.getProductos();
    const nuevosProductos = productos.filter(p => p.id !== productoId);
    
    if (nuevosProductos.length === productos.length) return false;
    
    this.saveProductos(nuevosProductos);
    return true;
  }

  // ===== GESTIÓN DE CLIENTES =====
  getClientes(): Cliente[] {
    return this.loadFromStorage(STORAGE_KEYS.CLIENTES, []);
  }

  saveClientes(clientes: Cliente[]): void {
    this.saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
  }

  agregarCliente(cliente: Cliente): void {
    const clientes = this.getClientes();
    clientes.push(cliente);
    this.saveClientes(clientes);
  }

  actualizarCliente(clienteActualizado: Cliente): boolean {
    const clientes = this.getClientes();
    const index = clientes.findIndex(c => c.id === clienteActualizado.id);
    
    if (index === -1) return false;
    
    clientes[index] = clienteActualizado;
    this.saveClientes(clientes);
    return true;
  }

  eliminarCliente(clienteId: string): boolean {
    const clientes = this.getClientes();
    const nuevosClientes = clientes.filter(c => c.id !== clienteId);
    
    if (nuevosClientes.length === clientes.length) return false;
    
    this.saveClientes(nuevosClientes);
    return true;
  }

  buscarClientePorDni(dni: string): Cliente | null {
    const clientes = this.getClientes();
    return clientes.find(c => c.dni === dni) || null;
  }

  // ===== GESTIÓN DE VENTAS =====
  getVentas(): Venta[] {
    return this.loadFromStorage(STORAGE_KEYS.VENTAS, []);
  }

  saveVentas(ventas: Venta[]): void {
    this.saveToStorage(STORAGE_KEYS.VENTAS, ventas);
  }

  agregarVenta(venta: Venta): void {
    const ventas = this.getVentas();
    ventas.push(venta);
    this.saveVentas(ventas);
  }

  // ===== GESTIÓN DE CAJA =====
  getCaja(): EstadoCaja {
    return this.loadFromStorage(STORAGE_KEYS.CAJA, EMPTY_INITIAL_DATA.caja);
  }

  saveCaja(caja: EstadoCaja): void {
    this.saveToStorage(STORAGE_KEYS.CAJA, caja);
  }

  // ===== UTILIDADES =====
  /**
   * Verificar si la base de datos está vacía
   */
  estaVacia(): {
    productos: boolean;
    clientes: boolean;
    ventas: boolean;
    todosVacios: boolean;
  } {
    const productos = this.getProductos();
    const clientes = this.getClientes();
    const ventas = this.getVentas();
    
    return {
      productos: productos.length === 0,
      clientes: clientes.length === 0,
      ventas: ventas.length === 0,
      todosVacios: productos.length === 0 && clientes.length === 0 && ventas.length === 0
    };
  }

  /**
   * Exportar todos los datos para backup
   */
  exportarDatos(): string {
    const data = {
      productos: this.getProductos(),
      clientes: this.getClientes(), 
      ventas: this.getVentas(),
      caja: this.getCaja(),
      exportadoEn: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(data, null, 2);
  }

  /**
   * Importar datos desde backup
   */
  importarDatos(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validar estructura mínima
      if (!data || typeof data !== 'object') {
        throw new Error('Formato de datos inválido');
      }
      
      // Importar datos si existen
      if (Array.isArray(data.productos)) {
        this.saveProductos(data.productos);
      }
      if (Array.isArray(data.clientes)) {
        this.saveClientes(data.clientes);
      }
      if (Array.isArray(data.ventas)) {
        this.saveVentas(data.ventas);
      }
      if (data.caja && typeof data.caja === 'object') {
        this.saveCaja(data.caja);
      }
      
      return true;
    } catch (error) {
      console.error('Error importando datos:', error);
      return false;
    }
  }

  /**
   * Limpiar completamente la base de datos (CUIDADO!)
   */
  limpiarTodo(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.initializeDatabase();
  }

  /**
   * Reset solo a estructura vacía manteniendo configuraciones
   */
  resetearDatos(): void {
    this.saveProductos([]);
    this.saveClientes([]);
    this.saveVentas([]);
    this.saveCaja(EMPTY_INITIAL_DATA.caja);
  }
}

// Instancia singleton
export const db = Database.getInstance();

// Re-exportar tipos para facilidad de uso
export type { Producto, Cliente, Venta, EstadoCaja }; 