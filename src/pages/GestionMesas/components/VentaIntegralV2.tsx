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
  Divider
} from '@mui/material';
import {
  Search,
  ShoppingCart,
  Grid3x3,
  Timer,
  Close as X,
  Add,
  Remove,
  Delete,
  Send,
  Receipt,
  Person,
  Edit
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
}

const VentaIntegralV2: React.FC<VentaIntegralV2Props> = ({
  mesa,
  isOpen,
  onClose,
  onCambiarEstado,
  mesasDisponibles = [],
  onValidarEstado,
  onValidarMesasGlobal
}) => {
  // Estados principales
  const [ventaActiva, setVentaActiva] = useState<VentaActiva | null>(null);
  
  // Estados de búsqueda
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
  
  // Funciones wrapper para los botones del toolbar
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

  const agregarProducto = async (producto: ProductoCompleto) => {
    if (!mesa) {
      mostrarNotificacion('Error: No hay mesa seleccionada', 'error');
      return;
    }

    // ✅ CRITERIO 4: Verificar que hay mozo asignado antes de permitir venta
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

    try {
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

      const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
      setVentaActiva(ventaLocal);

      if (mesa.estado === EstadoMesa.LIBRE) {
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
        toastService.success(`Mesa ${mesa.numero} ocupada - Venta iniciada`);
      }

      setTerminoBusqueda('');
      setResultadosBusqueda([]);
      setIndiceSeleccionado(0);
      
      // ✅ Validar estado de mesa después de agregar ítem
      if (onValidarEstado) {
        setTimeout(() => onValidarEstado(), 200);
      }
      
      toastService.success(`${producto.nombre} agregado a la venta`);
    } catch (error: any) {
      console.error('❌ Error agregando producto:', error);
      mostrarNotificacion('Error al agregar el producto', 'error');
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

  // Función para obtener productos recomendados
  const obtenerProductosRecomendados = async () => {
    setCargandoRecomendados(true);
    try {
      // Obtener los primeros 6 productos como recomendados (en una implementación real esto sería productos más vendidos)
      const productos = await productosService.buscarProductos({ 
        limite: 6, 
        activo: true 
      });
      
      // Adaptar los productos del servicio al tipo esperado
      const productosAdaptados = (productos.productos || []).map(producto => ({
        ...producto,
        categoria: typeof producto.categoria === 'object' ? producto.categoria.nombre : producto.categoria,
        descripcion: producto.descripcion || '',
        costo: 0,
        stock: 0,
        stockMinimo: 0,
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString()
      }));
      
      setProductosRecomendados(productosAdaptados);
    } catch (error) {
      console.error('❌ Error cargando productos recomendados:', error);
      toastService.error('Error al cargar productos recomendados');
    } finally {
      setCargandoRecomendados(false);
    }
  };

  // Effects
  useEffect(() => {
    if (mesa && isOpen) {
      inicializarVenta();
      obtenerProductosRecomendados();
    }
  }, [mesa, isOpen]);

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
        {false ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Header */}
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
                </Grid>
                <Grid item>
                  <Chip 
                    label={tiempoTranscurrido || 'Nueva'}
                    color="secondary"
                    variant="filled"
                    icon={<Timer fontSize="small" />}
                  />
                </Grid>
                <Grid item>
                  <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <X fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            </Box>

            {/* Buscador */}
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

              {resultadosBusqueda.length > 0 && (
                <Paper elevation={2} sx={{ maxHeight: 300, overflowY: 'auto', mt: 1 }}>
                  <List dense>
                    {resultadosBusqueda.map((producto, index) => (
                      <ListItem key={producto.id} disablePadding>
                        <ListItemButton 
                          selected={index === indiceSeleccionado}
                          onClick={() => agregarProducto(producto)}
                        >
                          <ListItemText
                            primary={producto.nombre}
                            secondary={`${producto.codigo} - $${producto.precio}`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}

              {/* Productos Recomendados */}
              {productosRecomendados.length > 0 && !terminoBusqueda && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box className="recommended-products" sx={{ mt: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', fontWeight: 'medium' }}>
                      📍 Productos Recomendados
                    </Typography>
                    <Grid container spacing={0.5}>
                      {productosRecomendados.map((producto) => (
                        <Grid item xs={4} key={producto.id}>
                          <Paper 
                            className="recommended-product"
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
                    {cargandoRecomendados && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                        <CircularProgress size={20} />
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>

            {/* Lista de items */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {!ventaActiva || ventaActiva.items.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%'
                }}>
                  <ShoppingCart fontSize="large" sx={{ color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No hay productos en la venta
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Busca y agrega productos para comenzar
                  </Typography>
                </Box>
              ) : (
                <List>
                  {ventaActiva.items.map((item) => (
                    <Paper key={item.id} elevation={1} sx={{ mb: 2 }}>
                      <ListItem>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {item.producto.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Código: {item.producto.codigo} | Precio: ${item.precio}
                          </Typography>
                          {item.especificaciones && (
                            <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                              📝 {item.especificaciones}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                            color="primary"
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography variant="body1" sx={{ minWidth: 30, textAlign: 'center' }}>
                            {item.cantidad}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                            color="primary"
                          >
                            <Add fontSize="small" />
                          </IconButton>
                          <Typography variant="body1" sx={{ ml: 1, minWidth: 60, textAlign: 'right' }}>
                            ${item.subtotal}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleEspecificaciones(item.id, item.producto.nombre, item.especificaciones)}
                            color="primary"
                            title="Agregar especificaciones"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => eliminarProducto(item.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Box>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              )}
            </Box>

            {/* Total y Acciones */}
            {ventaActiva && (
              <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
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

                {/* Toolbar de herramientas */}
                <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleEspecificaciones()}
                        title="Agregar especificaciones"
                      >
                        ESPECIFIC.
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleIncluir()}
                        title="Enfocar barra de búsqueda"
                      >
                        INCLUIR
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleFusion()}
                        title="Fusionar cuentas"
                      >
                        FUSIÓN
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handlePuntos()}
                        title="Sistema de puntos"
                      >
                        PUNTOS
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleTicket()}
                        title="Generar ticket"
                      >
                        TICKET
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleFacturaA()}
                        title="Generar factura A"
                      >
                        FAC. A
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleFacturaB()}
                        title="Generar factura B"
                      >
                        FAC. B
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleDescuento()}
                        title="Aplicar descuento"
                      >
                        DESCUENTO
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleDividirCuenta()}
                        title="Dividir cuenta"
                      >
                        CUENTA
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleRecParcial()}
                        title="Recaudación parcial"
                      >
                        REC. PARCIAL
                      </Button>
                    </Grid>
                    <Grid item xs={4}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        onClick={() => handleTransferir()}
                        title="Transferir mesa"
                      >
                        TRANSFERIR
                      </Button>
                    </Grid>
                  </Grid>
                </Box>

                {/* Estado de la venta */}
                {ventaActiva.estado !== 'activa' && (
                  <Box sx={{ p: 1, bgcolor: 'primary.light', textAlign: 'center' }}>
                    <Typography variant="body2" color="primary.contrastText">
                      {ventaActiva.estado === 'enviada' ? '📨 Comanda enviada a cocina' : '🧾 Cuenta solicitada'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={cerrarNotificacion}
      >
        <Alert severity={snackbar.severity} onClose={cerrarNotificacion}>
          {snackbar.message}
        </Alert>
      </Snackbar>

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