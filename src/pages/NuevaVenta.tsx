import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Chip,
  Badge,
  Autocomplete,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  ListItemAvatar,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import DiscountIcon from '@mui/icons-material/Discount';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import AdvertenciaAfip from '../components/AdvertenciaAfip';
import type { RootState, AppDispatch } from '../store';
import type { Producto, Cliente } from '../types';
import { agregarItem, eliminarItem, finalizarVenta, iniciarVenta } from '../store/ventasSlice';
import { cargarProductos } from '../store/productosSlice'; // Importar el thunk
import { buscarClientePorDni, seleccionarCliente, agregarCliente, actualizarCliente, registrarCompra } from '../store/clientesSlice';
import { formatearPrecio } from '../utils/formatters';
import api from '../services/api';

const NuevaVenta = () => {
  const dispatch = useDispatch<AppDispatch>();
  const productos = useSelector((state: RootState) => state.productos.items);
  const productosLoading = useSelector((state: RootState) => state.productos.loading);
  const productosError = useSelector((state: RootState) => state.productos.error);
  const ventaActual = useSelector((state: RootState) => state.ventas.ventaActual);
  const clientes = useSelector((state: RootState) => state.clientes.clientes);
  const clienteSeleccionado = useSelector((state: RootState) => state.clientes.clienteSeleccionado);
  const historialVentas = useSelector((state: RootState) => state.ventas.historial);
  
  // Estados para funcionalidades avanzadas
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [descuento, setDescuento] = useState<number>(0);
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'monto'>('porcentaje');
  const [clienteNombre, setClienteNombre] = useState<string>('');
  const [openDescuentoDialog, setOpenDescuentoDialog] = useState(false);
  const [openClienteDialog, setOpenClienteDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<string>('');

  // Estados específicos para clientes y fidelización
  const [dniCliente, setDniCliente] = useState('');
  const [usarPuntos, setUsarPuntos] = useState(false);
  const [puntosAUtilizar, setPuntosAUtilizar] = useState(0);
  const [aplicarDescuentoFidelidadActivo, setAplicarDescuentoFidelidadActivo] = useState(false);
  const [openPerfilCliente, setOpenPerfilCliente] = useState(false);
  const [openEditarCliente, setOpenEditarCliente] = useState(false);
  const [openNuevoCliente, setOpenNuevoCliente] = useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
  });

  // Estados para AFIP y tipos de comprobante
  const [tipoComprobante, setTipoComprobante] = useState('TICKET_NO_FISCAL');
  const [tiposComprobante, setTiposComprobante] = useState([]);
  const [estadoAfip, setEstadoAfip] = useState({ configurado: false, advertencias: [] });

  // Cargar productos al montar el componente
  useEffect(() => {
    if (productos.length === 0 && !productosLoading && !productosError) {
      console.log('🔄 Cargando productos desde la API...');
      dispatch(cargarProductos());
    }
  }, [dispatch, productos.length, productosLoading, productosError]);

  // Filtrar productos por búsqueda - usar codigo en lugar de categoria para búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar clientes por búsqueda en tiempo real
  useEffect(() => {
    if (busquedaCliente.trim()) {
      const filtrados = clientes.filter(cliente =>
        cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
        cliente.dni.includes(busquedaCliente) ||
        (cliente.telefono && cliente.telefono.includes(busquedaCliente))
      );
      setClientesFiltrados(filtrados);
    } else {
      setClientesFiltrados(clientes.slice(0, 10)); // Mostrar primeros 10 clientes
    }
  }, [busquedaCliente, clientes]);

  useEffect(() => {
    if (!ventaActual) {
      dispatch(iniciarVenta());
    }
  }, [dispatch, ventaActual]);

  // Cargar tipos de comprobante AFIP
  useEffect(() => {
    const cargarTiposComprobante = async () => {
      try {
        const response = await api.get('/afip/tipos-comprobante');
        setTiposComprobante(response.data);
      } catch (error) {
        console.error('Error cargando tipos de comprobante:', error);
      }
    };

    cargarTiposComprobante();
  }, []);

  const handleAgregarProducto = () => {
    if (!selectedProduct) {
      setSnackbarMessage('Por favor selecciona un producto');
      setSnackbarOpen(true);
      return;
    }
    
            // Stock eliminado - todos los productos están disponibles

    dispatch(agregarItem({ producto: selectedProduct, cantidad }));
    setSelectedProduct(null);
    setCantidad(1);
    setSnackbarMessage(`${selectedProduct.nombre} agregado al carrito`);
    setSnackbarOpen(true);
  };

  const handleEliminarProducto = (productoId: string) => {
    dispatch(eliminarItem(productoId));
  };

  const handleCambiarCantidad = (productoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      handleEliminarProducto(productoId);
      return;
    }
    
    const producto = productos.find(p => p.id === productoId);
          if (producto) {
      // Primero eliminar el item actual
      dispatch(eliminarItem(productoId));
      // Luego agregar con la nueva cantidad
      dispatch(agregarItem({ producto, cantidad: nuevaCantidad }));
    }
  };

  const calcularSubtotal = () => {
    return ventaActual?.items.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0) || 0;
  };

  const calcularDescuentoAplicado = () => {
    const subtotal = calcularSubtotal();
    if (tipoDescuento === 'porcentaje') {
      return (subtotal * descuento) / 100;
    }
    return descuento;
  };

  const calcularTotal = () => {
    const subtotal = calcularSubtotal();
    const descuentoAplicado = calcularDescuentoAplicado();
    const descuentoPuntos = puntosAUtilizar; // 1 punto = $1
    return Math.max(0, subtotal - descuentoAplicado - descuentoPuntos);
  };

  const handleFinalizarVenta = (formaPago: 'efectivo' | 'tarjeta' | 'transferencia') => {
    if (!ventaActual || ventaActual.items.length === 0) {
      setSnackbarMessage('No hay productos en la venta');
      setSnackbarOpen(true);
      return;
    }

    const subtotal = calcularSubtotal();
    const descuentoTotal = calcularDescuentoAplicado() + puntosAUtilizar;
    const totalFinal = Math.max(0, subtotal - descuentoTotal);
    
    // Calcular puntos ganados (1 punto por cada $100 gastados)
    const puntosGanados = Math.floor(totalFinal / 100);

    // Preparar datos de la venta
    const ventaCompleta = {
      ...ventaActual,
      formaPago,
      total: totalFinal,
      cliente: clienteSeleccionado || undefined,
      descuentoAplicado: descuentoTotal,
      puntosGanados: clienteSeleccionado ? puntosGanados : 0,
      puntosUtilizados: puntosAUtilizar,
      observaciones: `Venta ${clienteSeleccionado ? `a ${clienteSeleccionado.nombre}` : 'sin cliente'}`
    };

    // Finalizar la venta
    dispatch(finalizarVenta({ 
      formaPago, 
      observaciones: ventaCompleta.observaciones 
    }));

    // Si hay cliente, registrar la compra en su historial
    if (clienteSeleccionado) {
      dispatch(registrarCompra({
        clienteId: clienteSeleccionado.id,
        totalVenta: totalFinal,
        puntosUtilizados: puntosAUtilizar
      }));
    }
    
    // Resetear todos los estados
    setDescuento(0);
    setClienteNombre('');
    setPuntosAUtilizar(0);
    setAplicarDescuentoFidelidadActivo(false);
    dispatch(seleccionarCliente(null));
    
    setSnackbarMessage(`💰 Venta finalizada: $${totalFinal} con ${formaPago}${clienteSeleccionado ? ` - Cliente: ${clienteSeleccionado.nombre}` : ''}`);
    setSnackbarOpen(true);
  };

  const aplicarDescuentoRapido = (porcentaje: number) => {
    setDescuento(porcentaje);
    setTipoDescuento('porcentaje');
  };

  const handleCrearCliente = () => {
    if (!formCliente.nombre || !formCliente.dni) {
      setSnackbarMessage('Nombre y DNI son obligatorios');
      setSnackbarOpen(true);
      return;
    }

    // Verificar si el DNI ya existe
    if (clientes.some(c => c.dni === formCliente.dni)) {
      setSnackbarMessage('Ya existe un cliente con ese DNI');
      setSnackbarOpen(true);
      return;
    }

    dispatch(agregarCliente(formCliente));
    const nuevoCliente = {
      ...formCliente,
      id: Date.now().toString(),
      fechaRegistro: new Date().toISOString().split('T')[0],
      puntosFidelidad: 0,
      totalCompras: 0,
      cantidadCompras: 0,
      nivelFidelidad: 'Bronce' as const,
      descuentoPreferencial: 3,
    };
    
    dispatch(seleccionarCliente(nuevoCliente));
    setSnackbarMessage(`Cliente ${formCliente.nombre} creado y asignado`);
    setSnackbarOpen(true);
    setOpenNuevoCliente(false);
    resetFormCliente();
  };

  const handleEditarCliente = () => {
    if (!clienteSeleccionado) return;
    
    if (!formCliente.nombre || !formCliente.dni) {
      setSnackbarMessage('Nombre y DNI son obligatorios');
      setSnackbarOpen(true);
      return;
    }

    const clienteActualizado = {
      ...clienteSeleccionado,
      ...formCliente,
    };

    dispatch(actualizarCliente(clienteActualizado));
    dispatch(seleccionarCliente(clienteActualizado));
    setSnackbarMessage('Cliente actualizado correctamente');
    setSnackbarOpen(true);
    setOpenEditarCliente(false);
  };

  const resetFormCliente = () => {
    setFormCliente({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
    });
  };

  const abrirEditarCliente = () => {
    if (!clienteSeleccionado) return;
    setFormCliente({
      nombre: clienteSeleccionado.nombre,
      dni: clienteSeleccionado.dni,
      telefono: clienteSeleccionado.telefono || '',
      email: clienteSeleccionado.email || '',
    });
    setOpenEditarCliente(true);
  };

  const getComprasCliente = () => {
    if (!clienteSeleccionado) return [];
    return historialVentas.filter(venta => venta.cliente?.id === clienteSeleccionado.id)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10); // Últimas 10 compras
  };

  // Obtener color del nivel de fidelidad
  const getColorNivel = (nivel: Cliente['nivelFidelidad']) => {
    switch (nivel) {
      case 'Platino': return '#9c27b0';
      case 'Oro': return '#ff9800';
      case 'Plata': return '#607d8b';
      case 'Bronce': return '#795548';
      default: return '#9e9e9e';
    }
  };

  const handleUsarCliente = () => {
    if (!clienteSeleccionado) return;
    
    // Asignar cliente a la venta actual
    setClienteNombre(clienteSeleccionado.nombre);
    
    // Aplicar descuento de fidelidad automáticamente
    setDescuento(clienteSeleccionado.descuentoPreferencial);
    setTipoDescuento('porcentaje');
    setAplicarDescuentoFidelidadActivo(true);
    
    // Mostrar mensaje de confirmación
    setSnackbarMessage(`Cliente ${clienteSeleccionado.nombre} asignado con ${clienteSeleccionado.descuentoPreferencial}% de descuento`);
    setSnackbarOpen(true);
    
    // Cerrar el diálogo
    setOpenClienteDialog(false);
  };

  const handleRemoverCliente = () => {
    setClienteNombre('');
    dispatch(seleccionarCliente(null));
    setDescuento(0);
    setAplicarDescuentoFidelidadActivo(false);
    setSnackbarMessage('Cliente removido de la venta');
    setSnackbarOpen(true);
  };

  // Mostrar loading si los productos se están cargando
  if (productosLoading) {
    return (
      <Box sx={{ p: 3, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando productos desde la base de datos...</Typography>
      </Box>
    );
  }

  // Mostrar error si hay problemas cargando productos
  if (productosError) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="error">
          Error al cargar productos: {productosError}
          <Button 
            onClick={() => dispatch(cargarProductos())} 
            sx={{ ml: 2 }}
            variant="outlined"
            size="small"
          >
            Reintentar
          </Button>
        </Alert>
      </Box>
    );
  }

  if (!productos.length) {
    return (
      <Box sx={{ p: 3, width: '100%' }}>
        <Alert severity="info">
          No hay productos disponibles en la base de datos. 
          <br />
          Por favor, agregue algunos productos en la sección "Gestión de Productos".
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      p: 2,
      bgcolor: 'background.default'
    }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          💰 Nueva Venta
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => setOpenClienteDialog(true)}
            sx={{ 
              bgcolor: clienteNombre ? 'primary.light' : 'transparent',
              color: clienteNombre ? 'white' : 'inherit'
            }}
          >
            {clienteNombre ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography>{clienteNombre}</Typography>
                {clienteSeleccionado && (
                  <Chip 
                    label={clienteSeleccionado.nivelFidelidad} 
                    size="small"
                    sx={{ 
                      bgcolor: getColorNivel(clienteSeleccionado.nivelFidelidad),
                      color: 'white',
                      height: '20px'
                    }}
                  />
                )}
              </Box>
            ) : (
              'Cliente'
            )}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DiscountIcon />}
            onClick={() => setOpenDescuentoDialog(true)}
          >
            Descuento
          </Button>
        </Box>
      </Box>

      {/* Advertencia AFIP */}
      <AdvertenciaAfip />

      <Grid container spacing={2} sx={{ height: 'calc(100vh - 150px)' }}>
        <Grid item xs={12} lg={8}>
          {/* Panel de búsqueda y productos */}
          <Paper sx={{ p: 3, mb: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              🔍 Buscar y Agregar Productos
            </Typography>
            
            {/* Búsqueda avanzada */}
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                options={productosFiltrados}
                getOptionLabel={(option) => `${option.nombre} - ${formatearPrecio(option.precio)}`}
                value={selectedProduct}
                onChange={(_, newValue) => setSelectedProduct(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Buscar producto por nombre o categoría"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">{option.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.categoria} - ${option.precio}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`Stock: ${option.stock}`} 
                      size="small" 
                      color={option.stock > 10 ? 'success' : option.stock > 0 ? 'warning' : 'error'}
                    />
                  </Box>
                )}
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                type="number"
                label="Cantidad"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 120 }}
              />
              <Button
                variant="contained"
                onClick={handleAgregarProducto}
                startIcon={<AddShoppingCartIcon />}
                disabled={!selectedProduct}
                size="large"
              >
                Agregar al Carrito
              </Button>
            </Box>

            {/* Productos en la venta */}
            {ventaActual && ventaActual.items.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  🛒 Productos en la Venta
                </Typography>
                <List>
                  {ventaActual.items.map((item, index) => (
                    <ListItem
                      key={`${item.producto.id}-${index}`}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 2,
                        mb: 1,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">{item.producto.nombre}</Typography>
                            <Typography variant="h6" color="primary">
                              ${item.cantidad * item.producto.precio}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2">
                              ${item.producto.precio} × {item.cantidad}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleCambiarCantidad(item.producto.id, item.cantidad - 1)}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography variant="body1" sx={{ minWidth: 20, textAlign: 'center' }}>
                                {item.cantidad}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleCambiarCantidad(item.producto.id, item.cantidad + 1)}
                                disabled={item.cantidad >= item.producto.stock}
                              >
                                <AddIcon />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleEliminarProducto(item.producto.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          {/* Panel de resumen y pago */}
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📊 Resumen de Venta
              </Typography>
              
              {/* Información del cliente asignado */}
              {clienteNombre && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {clienteSeleccionado && (
                        <Avatar sx={{ bgcolor: getColorNivel(clienteSeleccionado.nivelFidelidad), width: 40, height: 40 }}>
                          {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="h6" sx={{ color: 'white' }}>
                          👤 {clienteNombre}
                        </Typography>
                        {clienteSeleccionado && (
                          <>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              {clienteSeleccionado.nivelFidelidad} • {clienteSeleccionado.puntosFidelidad} puntos
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              Descuento: {clienteSeleccionado.descuentoPreferencial}%
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={handleRemoverCliente}
                      sx={{ color: 'white' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              )}

              {/* Control de puntos para clientes */}
              {clienteSeleccionado && clienteSeleccionado.puntosFidelidad > 0 && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light' }}>
                  <Typography variant="subtitle2" sx={{ color: 'white', mb: 1 }}>
                    🌟 Usar Puntos (1 punto = $1)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      Disponibles: {clienteSeleccionado.puntosFidelidad}
                    </Typography>
                    <TextField
                      size="small"
                      type="number"
                      value={puntosAUtilizar}
                      onChange={(e) => {
                        const puntos = Math.min(
                          Math.max(0, Number(e.target.value)),
                          clienteSeleccionado.puntosFidelidad,
                          calcularTotal()
                        );
                        setPuntosAUtilizar(puntos);
                      }}
                      inputProps={{ 
                        min: 0, 
                        max: Math.min(clienteSeleccionado.puntosFidelidad, calcularTotal()) 
                      }}
                      sx={{ width: 80 }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        const maxPuntos = Math.min(
                          clienteSeleccionado.puntosFidelidad,
                          calcularTotal()
                        );
                        setPuntosAUtilizar(maxPuntos);
                      }}
                    >
                      Usar Todos
                    </Button>
                  </Box>
                </Paper>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>{formatearPrecio(calcularSubtotal())}</Typography>
                </Box>
                
                {descuento > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="success.main">
                      Descuento ({tipoDescuento === 'porcentaje' ? `${descuento}%` : formatearPrecio(descuento)}):
                    </Typography>
                    <Typography color="success.main">
                      -{formatearPrecio(calcularDescuentoAplicado())}
                    </Typography>
                  </Box>
                )}
                
                {puntosAUtilizar > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="secondary.main">
                      Puntos utilizados ({puntosAUtilizar} pts):
                    </Typography>
                    <Typography color="secondary.main">
                      -{formatearPrecio(puntosAUtilizar)}
                    </Typography>
                  </Box>
                )}
                
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h5" fontWeight="bold">Total:</Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary">
                    {formatearPrecio(calcularTotal())}
                  </Typography>
                </Box>
              </Box>

              {/* Descuentos rápidos */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Descuentos Rápidos:</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20].map(porcentaje => (
                    <Button
                      key={porcentaje}
                      size="small"
                      variant={descuento === porcentaje && tipoDescuento === 'porcentaje' ? 'contained' : 'outlined'}
                      onClick={() => aplicarDescuentoRapido(porcentaje)}
                    >
                      {porcentaje}%
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Selector de tipo de comprobante */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>📋 Tipo de Comprobante:</Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={tipoComprobante}
                    onChange={(e) => setTipoComprobante(e.target.value)}
                    displayEmpty
                    sx={{ mb: 1 }}
                  >
                    {tiposComprobante.map((tipo: any) => (
                      <MenuItem key={tipo.codigo} value={tipo.codigo}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>{tipo.nombre}</Typography>
                          {tipo.requiereAfip && (
                            <Chip 
                              label="AFIP" 
                              size="small" 
                              color="primary" 
                              sx={{ fontSize: '0.7rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary">
                  {tipoComprobante === 'TICKET_NO_FISCAL' && '📄 Ticket interno sin validez fiscal'}
                  {tipoComprobante === 'TICKET_FISCAL' && '🏛️ Ticket con validez fiscal (requiere AFIP)'}
                  {tipoComprobante === 'FACTURA_A' && '📋 Factura A - IVA responsable inscripto'}
                  {tipoComprobante === 'FACTURA_B' && '📋 Factura B - Consumidor final o monotributo'}
                  {tipoComprobante === 'NOTA_DE_CREDITO' && '📝 Nota de Crédito (requiere AFIP)'}
                  {tipoComprobante === 'NOTA_DE_DEBITO' && '📝 Nota de Débito (requiere AFIP)'}
                </Typography>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                💳 Método de Pago
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={() => handleFinalizarVenta('efectivo')}
                    startIcon={<PaymentIcon />}
                    disabled={!ventaActual || ventaActual.items.length === 0}
                    size="large"
                  >
                    💵 Efectivo
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="info"
                    onClick={() => handleFinalizarVenta('tarjeta')}
                    startIcon={<PaymentIcon />}
                    disabled={!ventaActual || ventaActual.items.length === 0}
                    size="large"
                  >
                    💳 Tarjeta
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    onClick={() => handleFinalizarVenta('transferencia')}
                    startIcon={<PaymentIcon />}
                    disabled={!ventaActual || ventaActual.items.length === 0}
                    size="large"
                  >
                    📱 Transferencia
                  </Button>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  disabled={!ventaActual || ventaActual.items.length === 0}
                >
                  Imprimir Ticket
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Diálogos */}
      <Dialog open={openDescuentoDialog} onClose={() => setOpenDescuentoDialog(false)}>
        <DialogTitle>Aplicar Descuento</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Tipo de Descuento</InputLabel>
            <Select
              value={tipoDescuento}
              onChange={(e) => setTipoDescuento(e.target.value as 'porcentaje' | 'monto')}
            >
              <MenuItem value="porcentaje">Porcentaje (%)</MenuItem>
              <MenuItem value="monto">Monto Fijo ($)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label={tipoDescuento === 'porcentaje' ? 'Porcentaje' : 'Monto'}
            value={descuento}
            onChange={(e) => setDescuento(Number(e.target.value))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {tipoDescuento === 'porcentaje' ? '%' : '$'}
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDescuentoDialog(false)}>Cancelar</Button>
          <Button onClick={() => setOpenDescuentoDialog(false)} variant="contained">
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para buscar/gestionar cliente */}
      <Dialog open={openClienteDialog} onClose={() => setOpenClienteDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Gestión de Cliente
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setOpenNuevoCliente(true);
                  setOpenClienteDialog(false);
                }}
                sx={{ mr: 1 }}
              >
                Nuevo Cliente
              </Button>
              {clienteSeleccionado && (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setOpenPerfilCliente(true);
                      setOpenClienteDialog(false);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Ver Perfil
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      abrirEditarCliente();
                      setOpenClienteDialog(false);
                    }}
                  >
                    Editar
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Buscar Cliente"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              placeholder="Buscar por nombre, DNI o teléfono..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* Lista de clientes encontrados */}
          {clientesFiltrados.length > 0 && (
            <Paper sx={{ mb: 3, maxHeight: 300, overflow: 'auto' }}>
              <List>
                {clientesFiltrados.map((cliente) => (
                  <ListItem
                    key={cliente.id}
                    button
                    onClick={() => {
                      dispatch(seleccionarCliente(cliente));
                      setSnackbarMessage(`Cliente ${cliente.nombre} seleccionado`);
                      setSnackbarOpen(true);
                    }}
                    sx={{
                      border: clienteSeleccionado?.id === cliente.id ? '2px solid' : '1px solid',
                      borderColor: clienteSeleccionado?.id === cliente.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: clienteSeleccionado?.id === cliente.id ? 'primary.light' : 'background.paper'
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getColorNivel(cliente.nivelFidelidad) }}>
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6">{cliente.nombre}</Typography>
                          <Chip
                            label={cliente.nivelFidelidad}
                            size="small"
                            sx={{ 
                              bgcolor: getColorNivel(cliente.nivelFidelidad),
                              color: 'white'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2">DNI: {cliente.dni}</Typography>
                          {cliente.telefono && (
                            <Typography variant="body2">📞 {cliente.telefono}</Typography>
                          )}
                          <Typography variant="body2" color="primary">
                            {cliente.puntosFidelidad} puntos • ${cliente.totalCompras} gastados • {cliente.descuentoPreferencial}% descuento
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {busquedaCliente && clientesFiltrados.length === 0 && (
            <Paper sx={{ p: 3, textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" color="text.secondary">
                No se encontraron clientes
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setFormCliente(prev => ({ ...prev, dni: busquedaCliente }));
                  setOpenNuevoCliente(true);
                  setOpenClienteDialog(false);
                }}
                sx={{ mt: 2 }}
              >
                Crear Cliente con "{busquedaCliente}"
              </Button>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenClienteDialog(false)}>Cerrar</Button>
          {clienteSeleccionado && (
            <Button 
              onClick={handleUsarCliente} 
              variant="contained"
            >
              Usar Cliente
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog para perfil completo del cliente */}
      <Dialog open={openPerfilCliente} onClose={() => setOpenPerfilCliente(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: getColorNivel(clienteSeleccionado?.nivelFidelidad || 'Bronce') }}>
              {clienteSeleccionado?.nombre.charAt(0).toUpperCase()}
            </Avatar>
            Perfil de {clienteSeleccionado?.nombre}
            <Chip
              label={clienteSeleccionado?.nivelFidelidad}
              sx={{ 
                bgcolor: getColorNivel(clienteSeleccionado?.nivelFidelidad || 'Bronce'),
                color: 'white',
                fontWeight: 'bold'
              }}
              icon={<StarIcon />}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {clienteSeleccionado && (
            <Grid container spacing={3}>
              {/* Información del cliente */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Información Personal</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>DNI:</strong> {clienteSeleccionado.dni}</Typography>
                    <Typography><strong>Teléfono:</strong> {clienteSeleccionado.telefono || 'No registrado'}</Typography>
                    <Typography><strong>Email:</strong> {clienteSeleccionado.email || 'No registrado'}</Typography>
                    <Typography><strong>Fecha de registro:</strong> {new Date(clienteSeleccionado.fechaRegistro).toLocaleDateString()}</Typography>
                    <Typography><strong>Última compra:</strong> {clienteSeleccionado.ultimaCompra ? new Date(clienteSeleccionado.ultimaCompra).toLocaleDateString() : 'Sin compras'}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Estadísticas */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Estadísticas</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ color: 'white' }}>
                          {clienteSeleccionado.puntosFidelidad}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Puntos Disponibles
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ color: 'white' }}>
                          ${clienteSeleccionado.totalCompras}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Total Gastado
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ color: 'white' }}>
                          {clienteSeleccionado.cantidadCompras}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Total Compras
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'secondary.light', borderRadius: 2 }}>
                        <Typography variant="h4" sx={{ color: 'white' }}>
                          {clienteSeleccionado.descuentoPreferencial}%
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          Descuento Actual
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Historial de compras */}
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>Últimas Compras</Typography>
                  {getComprasCliente().length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Productos</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell>Método Pago</TableCell>
                            <TableCell align="right">Puntos Ganados</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getComprasCliente().map((venta, index) => (
                            <TableRow key={venta.id}>
                              <TableCell>
                                {new Date(venta.fecha).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Box>
                                  {venta.items.slice(0, 3).map(item => (
                                    <Typography key={item.producto.id} variant="body2">
                                      {item.cantidad}x {item.producto.nombre}
                                    </Typography>
                                  ))}
                                  {venta.items.length > 3 && (
                                    <Typography variant="body2" color="text.secondary">
                                      +{venta.items.length - 3} más...
                                    </Typography>
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="h6" color="success.main">
                                  ${venta.total}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={venta.formaPago} 
                                  size="small"
                                  color={venta.formaPago === 'efectivo' ? 'success' : venta.formaPago === 'tarjeta' ? 'info' : 'secondary'}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Badge badgeContent={venta.puntosGanados} color="primary">
                                  <StarIcon color="action" />
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="text.secondary">
                        Sin compras registradas
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPerfilCliente(false)}>Cerrar</Button>
          <Button onClick={abrirEditarCliente} variant="outlined">
            Editar Cliente
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para crear nuevo cliente */}
      <Dialog open={openNuevoCliente} onClose={() => setOpenNuevoCliente(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                value={formCliente.nombre}
                onChange={(e) => setFormCliente(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DNI *"
                value={formCliente.dni}
                onChange={(e) => setFormCliente(prev => ({ ...prev, dni: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formCliente.telefono}
                onChange={(e) => setFormCliente(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formCliente.email}
                onChange={(e) => setFormCliente(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenNuevoCliente(false);
            resetFormCliente();
          }}>
            Cancelar
          </Button>
          <Button onClick={handleCrearCliente} variant="contained">
            Crear y Asignar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar cliente */}
      <Dialog open={openEditarCliente} onClose={() => setOpenEditarCliente(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Cliente</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                value={formCliente.nombre}
                onChange={(e) => setFormCliente(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DNI *"
                value={formCliente.dni}
                onChange={(e) => setFormCliente(prev => ({ ...prev, dni: e.target.value }))}
                disabled
                helperText="El DNI no se puede modificar"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formCliente.telefono}
                onChange={(e) => setFormCliente(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formCliente.email}
                onChange={(e) => setFormCliente(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditarCliente(false)}>Cancelar</Button>
          <Button onClick={handleEditarCliente} variant="contained">
            Actualizar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default NuevaVenta; 