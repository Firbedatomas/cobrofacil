import React, { useState, useEffect } from 'react';

import {
  Box,
  Drawer,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Divider,
  Breadcrumbs
} from '@mui/material';
import {
  Search,
  Grid3x3,
  Timer,
  Close as X,
  Add,
  Remove,
  Person,
  Group,
  NavigateNext
} from '@mui/icons-material';
import { toastService } from '../../../services/toastService';
import { ventasActivasService } from '../../../services/ventasActivasService';
import { productosService } from '../../../services/productosService';
import { EstadoMesa, type Mesa, type Producto as ProductoCompleto } from '../../../types/mesas';
import { useVentaHandlers } from './VentaIntegralHandlers';
import ModalEspecificaciones from './ModalEspecificaciones';
import ModalPuntos from './ModalPuntos';
import ModalDescuento from './ModalDescuento';
import ModalDivisionCuenta from './ModalDivisionCuenta';
import ModalPagoParcial from './ModalPagoParcial';
import ModalTransferir from './ModalTransferir';
import api from '../../../services/api';

// Interfaces para mozo
interface Mozo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

// Interfaces
interface VentaActivaPersistente {
  id: string;
  mesaId: string;
  items: Array<{
    id: string;
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    observaciones?: string;
    fechaAgregado: Date;
  }>;
  total: number;
  estado: 'activa' | 'pausada' | 'completada';
  fechaApertura: Date;
  fechaUltimaModificacion: Date;
  camarero: string;
  observaciones?: string;
  clienteId?: string;
  clienteNombre?: string;
  descuentoAplicado?: number;
}

interface ItemVenta {
  id: string;
  producto: ProductoCompleto;
  cantidad: number;
  precio: number;
  subtotal: number;
  esInvitacion: boolean;
  noDisponible: boolean;
  especificaciones?: string;
}

interface VentaActiva {
  id: string;
  mesaId: string;
  items: ItemVenta[];
  total: number;
  estado: 'activa' | 'enviada' | 'cuenta_pedida';
  fechaApertura: Date;
  camarero?: string;
}

interface VentaIntegralV2Props {
  mesa: Mesa | null;
  isOpen: boolean;
  onClose: () => void;
  onCambiarEstado: (mesa: Mesa, estado: EstadoMesa) => void;
  onVentaCompleta: (venta: VentaActiva) => void;
  mesasDisponibles?: Mesa[];
  onValidarEstado?: () => Promise<void>;
  onValidarMesasGlobal?: (mesaIds: string[]) => Promise<void>;
  usuarioActual?: any;
}

const VentaIntegralV2: React.FC<VentaIntegralV2Props> = ({
  mesa,
  isOpen,
  onClose,
  onCambiarEstado,
  mesasDisponibles = [],
  onValidarEstado,
  onValidarMesasGlobal,
  usuarioActual
}) => {
  // ✅ FLUJO MOZO->VENTA: Estados principales
  const [panelVentasActivo, setPanelVentasActivo] = useState(false);
  const [mozoSeleccionado, setMozoSeleccionado] = useState<Mozo | null>(null);
  const [mozosDisponibles, setMozosDisponibles] = useState<Mozo[]>([]);
  const [searchTermMozo, setSearchTermMozo] = useState('');
  const [loadingMozos, setLoadingMozos] = useState(false);
  
  // Estados principales de ventas
  const [ventaActiva, setVentaActiva] = useState<VentaActiva | null>(null);
  
  // Estados de búsqueda de productos
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ProductoCompleto[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  
  // Estados para productos recomendados
  const [productosRecomendados, setProductosRecomendados] = useState<ProductoCompleto[]>([]);
  const [cargandoRecomendados, setCargandoRecomendados] = useState(false);
  
  // Estados de interfaz
  const [tiempoTranscurrido] = useState<string>('');
  
  // Estados de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  
  // Estados para modales
  const [modalEspecificaciones, setModalEspecificaciones] = useState({
    open: false,
    itemId: '',
    itemNombre: '',
    especificacionesIniciales: ''
  });
  
  const [modalPuntos, setModalPuntos] = useState({ open: false });
  const [modalDescuento, setModalDescuento] = useState({ open: false });
  const [modalDivisionCuenta, setModalDivisionCuenta] = useState({ open: false });
  const [modalPagoParcial, setModalPagoParcial] = useState({ open: false });
  const [modalTransferir, setModalTransferir] = useState({ open: false });
  
  // Estados para manejar el flujo de facturación
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState<'TICKET' | 'FACTURA_A' | 'FACTURA_B' | null>(null);
  
  // Handlers para las herramientas
  const handlers = useVentaHandlers();

  // ✅ FLUJO MOZO->VENTA: Verificar mozo asignado al abrir modal
  useEffect(() => {
    if (mesa && isOpen) {
      verificarMozoAsignado();
    }
  }, [mesa, isOpen]);

  const verificarMozoAsignado = async () => {
    if (!mesa) return;
    
    try {
      const { default: asignacionesMozoService } = await import('../../../services/asignacionesMozoService');
      const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesa.id);
      
      if (mozoAsignado) {
        // Ya hay mozo asignado → abrir panel de ventas directamente
        console.log('✅ Mesa ya tiene mozo asignado:', mozoAsignado.nombre);
        setMozoSeleccionado({
          id: mozoAsignado.id,
          nombre: mozoAsignado.nombre,
          apellido: mozoAsignado.apellido || '',
          email: mozoAsignado.email || '',
          activo: true
        });
        setPanelVentasActivo(true);
        inicializarVenta();
        obtenerProductosRecomendados();
      } else {
        // No hay mozo → mostrar selector de mozo
        console.log('🎯 Mesa sin mozo, mostrando selector');
        setPanelVentasActivo(false);
        cargarMozos();
      }
    } catch (error) {
      console.error('❌ Error verificando mozo:', error);
      // En caso de error, mostrar selector de mozo
      setPanelVentasActivo(false);
      cargarMozos();
    }
  };

  const cargarMozos = async () => {
    setLoadingMozos(true);
    try {
      const response = await api.get('/usuarios?rol=MOZO&activo=true');
      if (response.data && Array.isArray(response.data.usuarios)) {
        setMozosDisponibles(response.data.usuarios);
      }
    } catch (error) {
      console.error('Error cargando mozos:', error);
      toastService.error('Error al cargar mozos');
    } finally {
      setLoadingMozos(false);
    }
  };

  // ✅ FLUJO MOZO->VENTA: Seleccionar mozo y transicionar al panel de ventas
  const handleSeleccionarMozo = async (mozo: Mozo) => {
    try {
      if (!mesa) throw new Error('No hay mesa seleccionada');

      console.log('🚀 Asignando mozo:', mozo.nombre);
      
      const { default: asignacionesMozoService } = await import('../../../services/asignacionesMozoService');
      
      await asignacionesMozoService.asignarMozo(
        mesa.id,
        mozo.id,
        'Asignación desde modal integrado'
      );

      // ✅ CRITERIO CRÍTICO: NO cerrar modal, transformar contenido
      setMozoSeleccionado(mozo);
      setPanelVentasActivo(true);
      
      // Inicializar venta y productos
      inicializarVenta();
      obtenerProductosRecomendados();
      
      toastService.success(`Mozo asignado: ${mozo.nombre} ${mozo.apellido}`);
      
    } catch (error) {
      console.error('❌ Error asignando mozo:', error);
      toastService.error('Error al asignar mozo');
    }
  };

  const mozosFiltrados = mozosDisponibles.filter(mozo => 
    `${mozo.nombre} ${mozo.apellido}`.toLowerCase().includes(searchTermMozo.toLowerCase())
  );

  // ✅ FACTURACIÓN SIMPLIFICADA: Botones directos según regla sistemafacturacion
  const handleFacturacionDirecta = async (tipoComprobante: 'TICKET' | 'FACTURA_A' | 'FACTURA_B', metodoPago: string) => {
    if (!ventaActiva) return;

    try {
      console.log('🎫 Facturación directa:', { tipoComprobante, metodoPago });
      
      const formasPago = [{ metodo: metodoPago, monto: ventaActiva.total }];
      
      const resultado = await handlers.handleFacturacion(
        ventaActiva.id, 
        tipoComprobante.toLowerCase(), 
        undefined,
        formasPago
      );

      if (resultado) {
        toastService.success(`${tipoComprobante} emitido correctamente`);
        onClose(); // Cerrar modal al completar facturación
      }
    } catch (error) {
      console.error('❌ Error en facturación directa:', error);
      toastService.error('Error al procesar facturación');
    }
  };

  const handleEspecificaciones = (itemId?: string, itemNombre?: string, especificacionesIniciales?: string) => {
    if (!itemId) {
      toastService.warning('Seleccione un ítem para agregar especificaciones');
      return;
    }
    
    setModalEspecificaciones({
      open: true,
      itemId,
      itemNombre: itemNombre || 'Ítem',
      especificacionesIniciales: especificacionesIniciales || ''
    });
  };
  
  const handleGuardarEspecificaciones = async (especificaciones: string) => {
    try {
      await handlers.handleEspecificaciones(modalEspecificaciones.itemId, especificaciones);
      
      // Actualizar las especificaciones en el estado local
      setVentaActiva(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          items: prev.items.map(item =>
            item.id === modalEspecificaciones.itemId
              ? { ...item, especificaciones }
              : item
          )
        };
      });
      
      toastService.success('Especificaciones guardadas correctamente');
    } catch (error) {
      toastService.error('Error al guardar especificaciones');
    }
  };

  const handleAplicarPuntos = async (clienteId: string, puntosACanjear: number, descuento: number) => {
    try {
      await handlers.handlePuntos(clienteId, puntosACanjear);
      
      // Actualizar el total con el descuento
      setVentaActiva(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total: prev.total - descuento
        };
      });
      
      toastService.success(`Descuento de $${descuento} aplicado usando ${puntosACanjear} puntos`);
    } catch (error) {
      toastService.error('Error al aplicar puntos');
    }
  };

  const handleAplicarDescuento = async (tipo: 'porcentaje' | 'fijo', valor: number, descuento: number) => {
    try {
      await handlers.handleDescuento(ventaActiva?.id || '', tipo, valor);
      
      // Actualizar el total con el descuento
      setVentaActiva(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          total: prev.total - descuento
        };
      });
      
      toastService.success(`Descuento de $${descuento} aplicado`);
    } catch (error) {
      toastService.error('Error al aplicar descuento');
    }
  };

  const handleDividirCuentaConfirmar = async (divisiones: any[]) => {
    try {
      await handlers.handleDivisionCuenta(ventaActiva?.id || '', divisiones);
      toastService.success('Cuenta dividida correctamente');
    } catch (error) {
      toastService.error('Error al dividir cuenta');
    }
  };

  const handleRegistrarPagoParcial = async (pagos: any[]) => {
    try {
      // Si hay un tipo de comprobante seleccionado, procesar facturación
      if (tipoComprobanteSeleccionado && ventaActiva) {
        console.log('🎫 Procesando facturación con formas de pago:', { 
          tipoComprobante: tipoComprobanteSeleccionado, 
          pagos 
        });

        // Convertir pagos al formato esperado por el backend
        const formasPago = pagos.map(pago => ({
          metodo: pago.metodo,
          monto: pago.monto
        }));

        const resultado = await handlers.handleFacturacion(
          ventaActiva.id, 
          tipoComprobanteSeleccionado.toLowerCase(), 
          undefined, // datosCliente
          formasPago
        );

        if (resultado) {
          toastService.success(`${tipoComprobanteSeleccionado} emitido correctamente`);
          // Cerrar modal de pago
          setModalPagoParcial({ open: false });
          // Resetear tipo de comprobante
          setTipoComprobanteSeleccionado(null);
          // Cerrar modal de ventas si es necesario
          onClose();
        }
      } else {
        // Si no hay tipo de comprobante, es un pago parcial normal
        for (const pago of pagos) {
          await handlers.handlePagoParcial(ventaActiva?.id || '', pago.monto, pago.metodo);
        }
        toastService.success('Pagos parciales registrados');
        setModalPagoParcial({ open: false });
      }
    } catch (error) {
      console.error('Error en handleRegistrarPagoParcial:', error);
      toastService.error('Error al procesar los pagos');
      setTipoComprobanteSeleccionado(null);
    }
  };

  const handleTransferirConfirmar = async (mesaDestino: string, items: string[], tipoTransferencia: 'completa' | 'items') => {
    try {
      if (!mesa) {
        toastService.error('No hay mesa seleccionada');
        return;
      }
      
      const transferirTodos = tipoTransferencia === 'completa';
      const resultado = await handlers.handleTransferir(mesa.id, mesaDestino, items, transferirTodos);
      
      if (resultado) {
        // ✅ Cerrar modal de transferir
        setModalTransferir({ open: false });
        
        // ✅ Si es transferencia completa, cerrar modal de ventas
        if (tipoTransferencia === 'completa') {
          onClose();
        }
        
        // ✅ Validar estados de AMBAS mesas: origen y destino
        if (onValidarEstado) {
          // Validar mesa origen (actual)
          setTimeout(() => onValidarEstado(), 300);
        }
        
        // ✅ Validar mesa destino desde el componente padre
        if (onValidarMesasGlobal) {
          setTimeout(() => onValidarMesasGlobal([mesa.id, mesaDestino]), 500);
        }
        
        // ✅ Mensaje ya mostrado por el handler
      }
    } catch (error) {
      console.error('Error en transferir:', error);
      toastService.error('Error al transferir');
    }
  };
  
  const handleIncluir = () => {
    // Enfocar la barra de búsqueda
    const searchInput = document.querySelector('input[placeholder="Busca productos..."]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      toastService.success('Barra de búsqueda enfocada');
    }
  };
  
  const handleFusion = () => {
    if (ventaActiva && mesa) {
      handlers.handleFusion(mesa.id);
    }
  };
  
  const handlePuntos = () => {
    if (ventaActiva) {
      setModalPuntos({ open: true });
    }
  };
  
  const handleTicket = () => {
    if (ventaActiva) {
      setTipoComprobanteSeleccionado('TICKET');
      setModalPagoParcial({ open: true });
    }
  };
  
  const handleFacturaA = () => {
    if (ventaActiva) {
      setTipoComprobanteSeleccionado('FACTURA_A');
      setModalPagoParcial({ open: true });
    }
  };
  
  const handleFacturaB = () => {
    if (ventaActiva) {
      setTipoComprobanteSeleccionado('FACTURA_B');
      setModalPagoParcial({ open: true });
    }
  };
  
  const handleDescuento = () => {
    if (ventaActiva) {
      setModalDescuento({ open: true });
    }
  };
  
  const handleDividirCuenta = () => {
    if (ventaActiva) {
      setModalDivisionCuenta({ open: true });
    }
  };
  
  const handleRecParcial = () => {
    if (ventaActiva) {
      setModalPagoParcial({ open: true });
    }
  };
  
  const handleTransferir = () => {
    if (ventaActiva) {
      setModalTransferir({ open: true });
    }
  };



  // Funciones helper
  const mostrarNotificacion = (mensaje: string, severidad: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message: mensaje, severity: severidad });
  };

  const cerrarNotificacion = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const adaptarVentaPersistentaALocal = (ventaPersistente: VentaActivaPersistente): VentaActiva => {
    return {
      id: ventaPersistente.id,
      mesaId: ventaPersistente.mesaId,
      items: ventaPersistente.items.map(item => ({
        id: item.id,
        producto: {
          id: item.productoId,
          nombre: item.productoNombre,
          codigo: item.productoCodigo,
          precio: item.precioUnitario,
          descripcion: '',
          costo: 0,
          stock: 0,
          stockMinimo: 0,
          activo: true,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          categoria: ''
        } as ProductoCompleto,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.subtotal,
        esInvitacion: false,
        noDisponible: false,
        especificaciones: item.observaciones
      })),
      total: ventaPersistente.total,
      estado: 'activa' as const,
      fechaApertura: ventaPersistente.fechaApertura,
      camarero: ventaPersistente.camarero
    };
  };

  // Funciones principales
  const inicializarVenta = async () => {
    if (!mesa) return;
    
    try {
      const ventaExistente = await ventasActivasService.obtenerVentaActiva(mesa.id);
      
      if (ventaExistente) {
        const ventaLocal = adaptarVentaPersistentaALocal(ventaExistente);
        setVentaActiva(ventaLocal);
      } else {
        setVentaActiva(null);
      }
    } catch (error) {
      console.error('❌ Error inicializando venta:', error);
      mostrarNotificacion('Error al inicializar venta', 'error');
    }
  };

  // ✅ CORREGIDO: Función optimizada para agregar productos
  const agregarProducto = async (producto: ProductoCompleto) => {
    if (!mesa) {
      mostrarNotificacion('Error: No hay mesa seleccionada', 'error');
      return;
    }

    console.log('🛒 Intentando agregar producto:', producto.nombre, 'a mesa:', mesa.numero);

    // ✅ OPTIMIZACIÓN: Si ya tenemos mozoSeleccionado, no hacer verificación extra
    if (!mozoSeleccionado) {
      console.log('⚠️ No hay mozo seleccionado en el estado local, verificando en BD...');
      try {
        const { default: asignacionesMozoService } = await import('../../../services/asignacionesMozoService');
        const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesa.id);
        
        if (!mozoAsignado) {
          mostrarNotificacion('Error: Debe asignar un mozo antes de iniciar la venta', 'error');
          console.error('❌ Intento de venta sin mozo asignado - Mesa:', mesa.numero);
          return;
        }
        
        console.log('✅ Mozo verificado para venta:', mozoAsignado.nombre);
      } catch (error) {
        console.error('❌ Error verificando mozo:', error);
        mostrarNotificacion('Error: No se pudo verificar el mozo asignado', 'error');
        return;
      }
    } else {
      console.log('✅ Mozo ya seleccionado:', mozoSeleccionado.nombre);
    }

    try {
      console.log('📤 Enviando producto al servicio de ventas...');
      
      const ventaActualizada = await ventasActivasService.agregarProducto(
        mesa.id,
        {
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          precio: producto.precio
        },
        1
      );

      console.log('📥 Respuesta del servicio:', ventaActualizada);
      
      const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
      setVentaActiva(ventaLocal);

      if (mesa.estado === EstadoMesa.LIBRE) {
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
        toastService.success(`Mesa ${mesa.numero} ocupada - Venta iniciada`);
      }

      // Limpiar búsqueda
      setTerminoBusqueda('');
      setResultadosBusqueda([]);
      setIndiceSeleccionado(0);
      
      // ✅ Validar estado de mesa después de agregar ítem
      if (onValidarEstado) {
        setTimeout(() => onValidarEstado(), 200);
      }
      
      toastService.success(`${producto.nombre} agregado a la venta`);
      console.log('✅ Producto agregado exitosamente');
      
    } catch (error: any) {
      console.error('❌ Error agregando producto:', error);
      
      // Mensajes de error más específicos
      if (error.response?.status === 404) {
        mostrarNotificacion('Error: Producto no encontrado', 'error');
      } else if (error.response?.status === 401) {
        mostrarNotificacion('Error: No autorizado', 'error');
      } else if (error.message?.includes('mozo')) {
        mostrarNotificacion('Error: Problema con asignación de mozo', 'error');
      } else {
        mostrarNotificacion(`Error al agregar producto: ${error.message || 'Error desconocido'}`, 'error');
      }
    }
  };

  const modificarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (!mesa || !ventaActiva) return;
    
    try {
      if (nuevaCantidad <= 0) {
        await eliminarProducto(itemId);
        return;
      }

      const ventaActualizada = await ventasActivasService.modificarCantidad(
        mesa.id,
        itemId,
        nuevaCantidad
      );

      if (ventaActualizada) {
        const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
        setVentaActiva(ventaLocal);
      }
      
      toastService.success('Cantidad actualizada');
    } catch (error: any) {
      console.error('❌ Error modificando cantidad:', error);
      mostrarNotificacion('Error al modificar cantidad', 'error');
    }
  };

  const eliminarProducto = async (itemId: string) => {
    if (!mesa || !ventaActiva) return;
    
    try {
      const ventaActualizada = await ventasActivasService.eliminarProducto(mesa.id, itemId);
      
      if (ventaActualizada && ventaActualizada.items.length === 0) {
        // Si no quedan items, cambiar estado a libre
        onCambiarEstado(mesa, EstadoMesa.LIBRE);
        toastService.success(`Mesa ${mesa.numero} liberada - Sin productos`);
        setVentaActiva(null);
      } else if (ventaActualizada) {
        const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
        setVentaActiva(ventaLocal);
      }
      
      // ✅ Validar estado de mesa después de eliminar ítem
      if (onValidarEstado) {
        setTimeout(() => onValidarEstado(), 200);
      }
      
      toastService.success('Producto eliminado');
    } catch (error: any) {
      console.error('❌ Error eliminando producto:', error);
      mostrarNotificacion('Error al eliminar producto', 'error');
    }
  };



  const buscarProductos = async () => {
    if (!terminoBusqueda || terminoBusqueda.length < 2) return;
    
    setBuscandoProductos(true);
    try {
      const productos = await productosService.buscarEnTiempoReal(terminoBusqueda, 20);
      setResultadosBusqueda(productos as ProductoCompleto[]);
      setIndiceSeleccionado(0);
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      mostrarNotificacion('Error al buscar productos', 'error');
    } finally {
      setBuscandoProductos(false);
    }
  };

  // ✅ CORREGIDO: Función para obtener productos recomendados
  const obtenerProductosRecomendados = async () => {
    setCargandoRecomendados(true);
    try {
      console.log('🔍 Cargando productos recomendados...');
      
      // Obtener los primeros 6 productos activos
      const resultado = await productosService.buscarProductos({ 
        limite: 6, 
        activo: true 
      });
      
      console.log('📦 Resultado de productosService:', resultado);
      
      // Verificar que la respuesta tenga el formato esperado
      if (!resultado || !resultado.productos) {
        console.warn('⚠️ Formato de respuesta inesperado:', resultado);
        setProductosRecomendados([]);
        return;
      }
      
             // Adaptar los productos del servicio al tipo esperado
       const productosAdaptados = resultado.productos.map(producto => ({
         ...producto,
         categoria: typeof producto.categoria === 'object' ? producto.categoria.nombre : (producto.categoria || 'Sin categoría'),
         descripcion: producto.descripcion || '',
         fechaCreacion: producto.fechaCreacion || new Date().toISOString(),
         fechaActualizacion: producto.fechaActualizacion || new Date().toISOString()
       }));
      
      console.log('✅ Productos adaptados:', productosAdaptados.length, productosAdaptados);
      setProductosRecomendados(productosAdaptados);
      
    } catch (error) {
      console.error('❌ Error cargando productos recomendados:', error);
      toastService.error('Error al cargar productos recomendados');
      setProductosRecomendados([]); // Evitar estado indefinido
    } finally {
      setCargandoRecomendados(false);
    }
  };

  // Effects
  useEffect(() => {
    if (terminoBusqueda.length >= 2) {
      buscarProductos();
    } else {
      setResultadosBusqueda([]);
      setBuscandoProductos(false);
    }
  }, [terminoBusqueda]);

  if (!mesa) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480, md: 550 },
            maxWidth: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Header con breadcrumb */}
        <Box sx={{ 
          p: 2, 
          bgcolor: 'primary.main', 
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderBottom: '2px solid rgba(255,255,255,0.1)'
        }}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item xs>
              <Typography variant="h6" sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                fontWeight: 'bold'
              }}>
                <Grid3x3 fontSize="small" />
                Mesa {mesa.numero}
              </Typography>
              
              {/* Breadcrumb para mostrar el flujo */}
              <Breadcrumbs 
                separator={<NavigateNext fontSize="small" />}
                sx={{ mt: 0.5, color: 'rgba(255,255,255,0.8)' }}
              >
                <Typography variant="caption" color="inherit">
                  Mesa
                </Typography>
                {mozoSeleccionado && (
                  <Typography variant="caption" color="inherit">
                    Mozo: {mozoSeleccionado.nombre}
                  </Typography>
                )}
                {panelVentasActivo && (
                  <Typography variant="caption" color="inherit">
                    Venta Activa
                  </Typography>
                )}
              </Breadcrumbs>
            </Grid>
            <Grid item>
              {panelVentasActivo && (
                <Chip 
                  label={tiempoTranscurrido || 'Nueva'}
                  color="secondary"
                  variant="filled"
                  icon={<Timer fontSize="small" />}
                />
              )}
            </Grid>
            <Grid item>
              <IconButton onClick={onClose} sx={{ color: 'white' }}>
                <X fontSize="small" />
              </IconButton>
            </Grid>
          </Grid>
        </Box>

        {/* ✅ RENDERIZADO CONDICIONAL: Selector de mozo O Panel de ventas */}
        {!panelVentasActivo ? (
          // SELECTOR DE MOZO
          <Box sx={{ flex: 1, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group />
              Seleccionar Mozo para Mesa {mesa.numero}
            </Typography>

            <TextField
              fullWidth
              placeholder="Buscar mozo..."
              value={searchTermMozo}
              onChange={(e) => setSearchTermMozo(e.target.value)}
              sx={{ mb: 2 }}
            />

            {loadingMozos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {/* Usuario actual como primera opción */}
                {usuarioActual && (
                  <ListItem disablePadding sx={{ mb: 1 }}>
                    <Paper elevation={2} sx={{ width: '100%', bgcolor: 'primary.light' }}>
                      <ListItemButton onClick={() => handleSeleccionarMozo({
                        id: usuarioActual.id,
                        nombre: usuarioActual.nombre,
                        apellido: usuarioActual.apellido || '',
                        email: usuarioActual.email,
                        activo: true
                      })}>
                        <Person sx={{ mr: 2, color: 'primary.main' }} />
                        <ListItemText
                          primary={`${usuarioActual.nombre} (Yo mismo)`}
                          secondary={usuarioActual.email}
                        />
                      </ListItemButton>
                    </Paper>
                  </ListItem>
                )}

                {/* Lista de mozos */}
                {mozosFiltrados.map((mozo) => (
                  <ListItem key={mozo.id} disablePadding sx={{ mb: 1 }}>
                    <Paper elevation={1} sx={{ width: '100%' }}>
                      <ListItemButton onClick={() => handleSeleccionarMozo(mozo)}>
                        <Person sx={{ mr: 2 }} />
                        <ListItemText
                          primary={`${mozo.nombre} ${mozo.apellido}`}
                          secondary={mozo.email}
                        />
                      </ListItemButton>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ) : (
          // PANEL DE VENTAS (contenido simplificado)
          <>
            {/* Buscador de productos */}
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Busca productos..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
                InputProps={{
                  startAdornment: <Search fontSize="small" style={{ marginRight: 8 }} />,
                  endAdornment: buscandoProductos && <CircularProgress size="small" />
                }}
              />

              {/* Productos recomendados */}
              {productosRecomendados.length > 0 && !terminoBusqueda && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'medium' }}>
                      📍 Productos Recomendados
                    </Typography>
                    <Grid container spacing={0.5}>
                      {productosRecomendados.map((producto) => (
                        <Grid item xs={4} key={producto.id}>
                          <Paper 
                            elevation={1} 
                            sx={{ 
                              p: 0.5, 
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              '&:hover': {
                                elevation: 3,
                                bgcolor: 'action.hover'
                              }
                            }}
                            onClick={() => agregarProducto(producto)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="caption" 
                                  sx={{ 
                                    fontWeight: 'medium',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {producto.nombre}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  ${producto.precio}
                                </Typography>
                              </Box>
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  agregarProducto(producto);
                                }}
                              >
                                <Add fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </>
              )}
            </Box>

            {/* Lista de productos en la venta */}
            {ventaActiva && ventaActiva.items.length > 0 && (
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>
                  🛒 Productos seleccionados ({ventaActiva.items.length})
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  {ventaActiva.items.map((item) => (
                    <Paper 
                      key={item.id}
                      elevation={1}
                      sx={{ 
                        p: 1.5,
                        mb: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.producto.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${item.precio} × {item.cantidad} = ${item.subtotal}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                          sx={{ width: 28, height: 28 }}
                        >
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', fontWeight: 'bold' }}>
                          {item.cantidad}
                        </Typography>
                        <IconButton 
                          size="small"
                          onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                          sx={{ width: 28, height: 28 }}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Total y Facturación Directa */}
            {ventaActiva && (
              <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', mt: 'auto' }}>
                {/* Total */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Grid container alignItems="center" justifyContent="space-between">
                    <Grid item>
                      <Typography variant="h6">TOTAL:</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                        ${ventaActiva.total}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* ✅ FACTURACIÓN SIMPLIFICADA: Botones directos por forma de pago */}
                <Box sx={{ p: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    🎫 FACTURACIÓN RÁPIDA
                  </Typography>
                  <Grid container spacing={1}>
                    {/* Efectivo */}
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={() => handleFacturacionDirecta('TICKET', 'efectivo')}
                      >
                        💵 EFECTIVO
                      </Button>
                    </Grid>
                    {/* Tarjeta */}
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        onClick={() => handleFacturacionDirecta('TICKET', 'tarjeta')}
                      >
                        💳 TARJETA
                      </Button>
                    </Grid>
                    {/* QR */}
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        onClick={() => handleFacturacionDirecta('TICKET', 'qr')}
                      >
                        📱 QR
                      </Button>
                    </Grid>
                    {/* Transferencia */}
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => handleFacturacionDirecta('TICKET', 'transferencia')}
                      >
                        🏦 TRANSFER
                      </Button>
                    </Grid>
                    {/* Pago múltiple */}
                    <Grid item xs={8}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => setModalPagoParcial({ open: true })}
                      >
                        🔄 PAGO MÚLTIPLE
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}
          </>
        )}
      </Drawer>

      {/* Snackbar y modales existentes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={cerrarNotificacion}
      >
        <Alert severity={snackbar.severity} onClose={cerrarNotificacion}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modal de pago múltiple */}
      <ModalPagoParcial
        open={modalPagoParcial.open}
        onClose={() => setModalPagoParcial({ open: false })}
        onRegistrarPago={async (pagos: any[]) => {
          try {
            if (ventaActiva) {
              const formasPago = pagos.map(pago => ({
                metodo: pago.metodo,
                monto: pago.monto
              }));

              const resultado = await handlers.handleFacturacion(
                ventaActiva.id, 
                'ticket',
                undefined,
                formasPago
              );

              if (resultado) {
                toastService.success('Ticket emitido correctamente');
                setModalPagoParcial({ open: false });
                onClose();
              }
            }
          } catch (error) {
            console.error('Error en pago múltiple:', error);
            toastService.error('Error al procesar pago múltiple');
          }
        }}
        totalVenta={ventaActiva?.total || 0}
        titulo="Pago con Múltiples Métodos"
      />

      {/* Modal de especificaciones */}
      <ModalEspecificaciones
        open={modalEspecificaciones.open}
        onClose={() => setModalEspecificaciones(prev => ({ ...prev, open: false }))}
        onSave={handleGuardarEspecificaciones}
        especificacionesIniciales={modalEspecificaciones.especificacionesIniciales}
        itemNombre={modalEspecificaciones.itemNombre}
      />

      {/* Modal de puntos */}
      <ModalPuntos
        open={modalPuntos.open}
        onClose={() => setModalPuntos({ open: false })}
        onAplicarPuntos={handleAplicarPuntos}
        totalVenta={ventaActiva?.total || 0}
      />

      {/* Modal de descuento */}
      <ModalDescuento
        open={modalDescuento.open}
        onClose={() => setModalDescuento({ open: false })}
        onAplicarDescuento={handleAplicarDescuento}
        totalVenta={ventaActiva?.total || 0}
      />

      {/* Modal de división de cuenta */}
      <ModalDivisionCuenta
        open={modalDivisionCuenta.open}
        onClose={() => setModalDivisionCuenta({ open: false })}
        onDividirCuenta={handleDividirCuentaConfirmar}
        items={ventaActiva?.items.map(item => ({
          id: item.id,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal
        })) || []}
        totalVenta={ventaActiva?.total || 0}
      />

      {/* Modal de pago parcial */}
      <ModalPagoParcial
        open={modalPagoParcial.open}
        onClose={() => {
          setModalPagoParcial({ open: false });
          setTipoComprobanteSeleccionado(null);
        }}
        onRegistrarPago={handleRegistrarPagoParcial}
        totalVenta={ventaActiva?.total || 0}
        titulo={tipoComprobanteSeleccionado ? 
          `Procesar ${tipoComprobanteSeleccionado} - Seleccionar Formas de Pago` : 
          "Registro de Pagos Parciales"
        }
      />

      {/* Modal de transferir */}
      <ModalTransferir
        open={modalTransferir.open}
        onClose={() => setModalTransferir({ open: false })}
        onTransferir={handleTransferirConfirmar}
        mesaOrigen={mesa ? {
          id: mesa.id,
          numero: mesa.numero,
          estado: mesa.estado === 'LIBRE' ? 'libre' : mesa.estado === 'OCUPADA' ? 'ocupada' : 'facturada',
          capacidad: mesa.capacidad || 0,
          sector: mesa.sectorId || ''
        } : { id: '', numero: '', estado: 'libre', capacidad: 0, sector: '' }}
        items={ventaActiva?.items.map(item => ({
          id: item.id,
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.subtotal,
          especificaciones: item.especificaciones
        })) || []}
        mesasDisponibles={mesasDisponibles.map(mesa => ({
          id: mesa.id,
          numero: mesa.numero,
          estado: mesa.estado === 'LIBRE' ? 'libre' : mesa.estado === 'OCUPADA' ? 'ocupada' : 'facturada',
          capacidad: mesa.capacidad || 0,
          sector: mesa.sector?.nombre || 'Sin Sector'
        }))}
      />
    </>
  );
};

export default VentaIntegralV2; 