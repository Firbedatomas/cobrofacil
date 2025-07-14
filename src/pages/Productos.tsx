import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Avatar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tabs,
  Tab,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  QrCode as QrCodeIcon,
  LocalOffer as OfferIcon,
  Category as CategoryIcon,
  Business as BusinessIcon,
  PhotoCamera as PhotoIcon,
  GetApp as ExportIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { formatearPrecio } from '../utils/formatters';
import { productosService, type ProductoCompleto } from '../services/productosService';

interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string; // Siempre string, convertido desde el backend
  stock: number;
  descripcion?: string;
  proveedor?: string;
  codigoBarras?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  ventasTotal?: number;
  stockMinimo: number;
  stockMaximo: number;
  ubicacion?: string;
  imagen?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`productos-tabpanel-${index}`}
      aria-labelledby={`productos-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Productos = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetalle, setOpenDetalle] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [productoDetalle, setProductoDetalle] = useState<Producto | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const [formProducto, setFormProducto] = useState({
    nombre: '',
    precio: 0,
    categoria: '',
    stock: 0,
    descripcion: '',
    proveedor: '',
    codigoBarras: '',
    stockMinimo: 0,
    stockMaximo: 0,
    ubicacion: ''
  });

  const [categorias, setCategorias] = useState<string[]>(['Todas']);
  const [categoriasCompletas, setCategoriasCompletas] = useState<{ id: string; nombre: string }[]>([]);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [mostrarCrearCategoria, setMostrarCrearCategoria] = useState(false);

  // Función helper para obtener el nombre de la categoría
  const obtenerNombreCategoria = (categoria: string): string => {
    return categoria || 'Sin categoría';
  };

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      // Usar el servicio real de productos
      const productosData: ProductoCompleto[] = await productosService.obtenerTodos();
      
      // Convertir a formato esperado por el componente
      const productosFormateados: Producto[] = productosData.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        precio: p.precio,
        categoria: typeof p.categoria === 'object' ? p.categoria.nombre : p.categoria || 'Sin categoría', // Maneja tanto objeto como string
        stock: p.stock,
        descripcion: p.descripcion,
        proveedor: '', // Campo opcional
        codigoBarras: p.codigo,
        fechaCreacion: p.fechaCreacion || new Date().toISOString(),
        fechaActualizacion: p.fechaActualizacion || new Date().toISOString(),
        ventasTotal: 0, // Campo opcional
        stockMinimo: p.stockMinimo || 5, // Usar valor del backend o por defecto
        stockMaximo: 1000, // Valor por defecto
        ubicacion: '' // Campo opcional
      }));
      
      setProductos(productosFormateados);
      
    } catch (error) {
      console.error('Error cargando productos:', error);
      setSnackbarMessage('Error al cargar productos desde la base de datos');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      const categoriasData = await productosService.obtenerCategorias();
      setCategoriasCompletas(categoriasData);
      
      // Mantener array simple para la UI
      const nombresCategoria = ['Todas', ...categoriasData.map(c => c.nombre)];
      setCategorias(nombresCategoria);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setSnackbarMessage('Error al cargar categorías');
      setSnackbarOpen(true);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const nombreCategoria = obtenerNombreCategoria(producto.categoria);
    const matchBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                         nombreCategoria.toLowerCase().includes(busqueda.toLowerCase()) ||
                         producto.codigoBarras?.includes(busqueda) ||
                         producto.proveedor?.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaFiltro === '' || categoriaFiltro === 'Todas' || nombreCategoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const productosStockBajo = productos.filter(p => p.stock <= p.stockMinimo);
  const productosAgotados = productos.filter(p => p.stock === 0);
  const valorTotalInventario = productos.reduce((total, p) => total + (p.precio * p.stock), 0);
  const ventasTotales = productos.reduce((total, p) => total + (p.ventasTotal || 0), 0);

  const abrirDialog = (producto?: Producto) => {
    if (producto) {
      setModoEdicion(true);
      setProductoEditando(producto);
      setFormProducto({
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: obtenerNombreCategoria(producto.categoria),
        stock: producto.stock,
        descripcion: producto.descripcion || '',
        proveedor: producto.proveedor || '',
        codigoBarras: producto.codigoBarras || '',
        stockMinimo: producto.stockMinimo,
        stockMaximo: producto.stockMaximo,
        ubicacion: producto.ubicacion || ''
      });
    } else {
      setModoEdicion(false);
      setProductoEditando(null);
      setFormProducto({
        nombre: '',
        precio: 0,
        categoria: '',
        stock: 0,
        descripcion: '',
        proveedor: '',
        codigoBarras: '',
        stockMinimo: 0,
        stockMaximo: 0,
        ubicacion: ''
      });
    }
    setOpenDialog(true);
  };

  const verDetalle = (producto: Producto) => {
    setProductoDetalle(producto);
    setOpenDetalle(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    setModoEdicion(false);
    setProductoEditando(null);
  };

  const handleGuardar = async () => {
    // Validación simplificada: solo nombre y categoría son obligatorios
    if (!formProducto.nombre || !formProducto.nombre.trim()) {
      setSnackbarMessage('El nombre del producto es obligatorio');
      setSnackbarOpen(true);
      return;
    }

    if (!formProducto.categoria || !formProducto.categoria.trim()) {
      setSnackbarMessage('La categoría del producto es obligatoria');
      setSnackbarOpen(true);
      return;
    }

    try {
      if (modoEdicion) {
        // TODO: Implementar actualización de producto
        setSnackbarMessage('Función de edición no implementada aún');
      } else {
        // Buscar el ID de la categoría seleccionada
        const categoriaSeleccionada = categoriasCompletas.find(c => c.nombre === formProducto.categoria);
        if (!categoriaSeleccionada) {
          setSnackbarMessage('Categoría no válida');
          setSnackbarOpen(true);
          return;
        }

        // Crear nuevo producto usando la API
        const nuevoProducto = {
          nombre: formProducto.nombre.trim(),
          descripcion: formProducto.descripcion?.trim() || undefined,
          precio: formProducto.precio || 0,
          stock: formProducto.stock || 0,
          stockMinimo: formProducto.stockMinimo || 5,
          categoriaId: categoriaSeleccionada.id,
          codigo: formProducto.codigoBarras?.trim() || undefined // Opcional - se autogenera si no se proporciona
        };
        
        // Crear producto usando el servicio
        await productosService.crearProducto(nuevoProducto);
        
        setSnackbarMessage('Producto creado exitosamente');
        
        // Recargar productos para mostrar el nuevo
        await cargarProductos();
      }
      
      setSnackbarOpen(true);
      cerrarDialog();
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      
      // Mostrar error específico del backend si está disponible
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al guardar producto';
      
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    }
  };

  const handleEliminar = (producto: Producto) => {
    if (window.confirm(`¿Está seguro de eliminar "${producto.nombre}"?`)) {
      setSnackbarMessage('Producto eliminado correctamente');
      setSnackbarOpen(true);
    }
  };

  const getEstadoStock = (producto: Producto) => {
    if (producto.stock === 0) return { color: 'error', texto: 'Agotado', icon: '🚫' };
    if (producto.stock <= producto.stockMinimo) return { color: 'warning', texto: 'Stock Bajo', icon: '⚠️' };
    if (producto.stock >= producto.stockMaximo) return { color: 'info', texto: 'Stock Alto', icon: '📈' };
    return { color: 'success', texto: 'En Stock', icon: '✅' };
  };

  const exportarProductos = () => {
    const datos = productos.map(p => ({
      ID: p.id,
      Nombre: p.nombre,
      Precio: p.precio,
      Categoria: p.categoria,
      Stock: p.stock,
      'Stock Mínimo': p.stockMinimo,
      'Stock Máximo': p.stockMaximo,
      Proveedor: p.proveedor,
      'Código de Barras': p.codigoBarras,
      Ubicación: p.ubicacion,
      'Ventas Totales': p.ventasTotal
    }));

    const csvContent = [
      Object.keys(datos[0]).join(','),
      ...datos.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `productos-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    setSnackbarMessage('Productos exportados correctamente');
    setSnackbarOpen(true);
  };

  const imprimirEtiqueta = (producto: Producto) => {
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Etiqueta ${producto.nombre}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .etiqueta { 
                border: 2px solid #000; 
                padding: 10px; 
                width: 300px; 
                text-align: center;
                margin: 20px auto;
              }
              .nombre { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
              .precio { font-size: 24px; color: #e74c3c; font-weight: bold; }
              .codigo { font-size: 12px; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="etiqueta">
              <div class="nombre">${producto.nombre}</div>
              <div class="precio">${formatearPrecio(producto.precio)}</div>
              <div class="codigo">Código: ${producto.codigoBarras || producto.id}</div>
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
      ventana.print();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Cargando productos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <InventoryIcon sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              📦 Gestión de Productos
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Control completo de inventario y catálogo
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={exportarProductos}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => abrirDialog()}
            size="large"
          >
            Nuevo Producto
          </Button>
        </Box>
      </Box>

      {/* Estadísticas principales */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'primary.light', color: 'white', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <InventoryIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {productos.length}
                    </Typography>
                    <Typography variant="body2">Total Productos</Typography>
                    <Typography variant="caption">
                      {categorias.length - 1} categorías
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'warning.light', color: 'white', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WarningIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {productosStockBajo.length}
                    </Typography>
                    <Typography variant="body2">Stock Bajo</Typography>
                    <Typography variant="caption">
                      Requieren reposición
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'error.light', color: 'white', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ShoppingCartIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {productosAgotados.length}
                    </Typography>
                    <Typography variant="body2">Agotados</Typography>
                    <Typography variant="caption">
                      Sin stock disponible
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'success.light', color: 'white', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {formatearPrecio(valorTotalInventario)}
                    </Typography>
                    <Typography variant="body2">Valor Total</Typography>
                    <Typography variant="caption">
                      Inventario completo
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Alertas importantes */}
      {productosStockBajo.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            ⚠️ Productos con stock bajo que requieren reposición inmediata:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {productosStockBajo.slice(0, 5).map(p => (
              <Chip 
                key={p.id} 
                label={`${p.nombre}: ${p.stock} unidades`}
                size="small"
                color="warning"
                variant="outlined"
              />
            ))}
            {productosStockBajo.length > 5 && (
              <Chip label={`+${productosStockBajo.length - 5} más`} size="small" />
            )}
          </Box>
        </Alert>
      )}

      {/* Tabs de gestión */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="📋 Lista de Productos" />
          <Tab label="📊 Análisis de Stock" />
          <Tab label="🏆 Top Ventas" />
          <Tab label="🏷️ Por Categorías" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Filtros */}
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  placeholder="Buscar por nombre, código, proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    label="Categoría"
                  >
                    {categorias.map(cat => (
                      <MenuItem key={cat} value={cat === 'Todas' ? '' : cat}>
                        {cat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Typography variant="body2" color="text.secondary">
                  {productosFiltrados.length} productos
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* Tabla de productos */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Producto</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Precio</TableCell>
                  <TableCell align="center">Stock</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productosFiltrados.map((producto) => {
                  const estadoStock = getEstadoStock(producto);
                  return (
                    <TableRow key={producto.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography sx={{ fontSize: '24px' }}>
                            {producto.imagen}
                          </Typography>
                          <Box>
                            <Typography variant="h6">{producto.nombre}</Typography>
                            {producto.descripcion && (
                              <Typography variant="body2" color="text.secondary">
                                {producto.descripcion.substring(0, 50)}...
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              ID: {producto.id} | {producto.codigoBarras}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={obtenerNombreCategoria(producto.categoria)} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" color="primary">
                          {formatearPrecio(producto.precio)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Badge
                          badgeContent={producto.stock <= producto.stockMinimo ? '!' : null}
                          color="error"
                        >
                          <Typography variant="h6">
                            {producto.stock}
                          </Typography>
                        </Badge>
                        <Typography variant="caption" display="block" color="text.secondary">
                          Min: {producto.stockMinimo}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={`${estadoStock.icon} ${estadoStock.texto}`}
                          color={estadoStock.color as "success" | "warning" | "error"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {producto.ubicacion || 'No especificada'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {producto.proveedor}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Ver detalle">
                            <IconButton
                              size="small"
                              onClick={() => verDetalle(producto)}
                              color="primary"
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => abrirDialog(producto)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Imprimir etiqueta">
                            <IconButton
                              size="small"
                              onClick={() => imprimirEtiqueta(producto)}
                              color="secondary"
                            >
                              <PrintIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => handleEliminar(producto)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {['success', 'warning', 'error'].map((estado, index) => {
              const filteredProducts = productos.filter(p => {
                const estadoProd = getEstadoStock(p);
                return estadoProd.color === estado;
              });
              
              return (
                <Grid item xs={12} md={4} key={estado}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color={`${estado}.main`}>
                        {estado === 'success' && '✅ Stock Normal'}
                        {estado === 'warning' && '⚠️ Stock Bajo'}
                        {estado === 'error' && '🚫 Agotados'}
                      </Typography>
                      <Typography variant="h4" color={`${estado}.main`} gutterBottom>
                        {filteredProducts.length}
                      </Typography>
                      <List dense>
                        {filteredProducts.slice(0, 5).map(producto => (
                          <ListItem key={producto.id}>
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: `${estado}.light` }}>
                                {producto.imagen}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={producto.nombre}
                              secondary={`Stock: ${producto.stock}/${producto.stockMinimo}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={2}>
            {productos
              .sort((a, b) => (b.ventasTotal || 0) - (a.ventasTotal || 0))
              .slice(0, 6)
              .map((producto, index) => (
                <Grid item xs={12} sm={6} md={4} key={producto.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          {index + 1}
                        </Avatar>
                        <Typography sx={{ fontSize: '32px' }}>
                          {producto.imagen}
                        </Typography>
                      </Box>
                      <Typography variant="h6" gutterBottom noWrap>
                        {producto.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {obtenerNombreCategoria(producto.categoria)}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Typography variant="body2">
                          Ventas: {producto.ventasTotal}
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {formatearPrecio(producto.precio)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {categorias.filter(c => c !== 'Todas').map(categoria => {
              const productosCategoria = productos.filter(p => p.categoria === categoria);
              const stockTotal = productosCategoria.reduce((sum, p) => sum + p.stock, 0);
              const valorTotal = productosCategoria.reduce((sum, p) => sum + (p.precio * p.stock), 0);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={categoria}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <CategoryIcon color="primary" />
                        <Typography variant="h6">{categoria}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Productos:</Typography>
                        <Typography fontWeight="bold">{productosCategoria.length}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Stock Total:</Typography>
                        <Typography fontWeight="bold">{stockTotal}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography>Valor:</Typography>
                        <Typography fontWeight="bold" color="success.main">
                          {formatearPrecio(valorTotal)}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>
      </Paper>

      {/* FAB para agregar */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => abrirDialog()}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* Dialog detalle producto */}
      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ fontSize: '32px' }}>
              {productoDetalle?.imagen}
            </Typography>
            Detalle de {productoDetalle?.nombre}
          </Box>
        </DialogTitle>
        <DialogContent>
          {productoDetalle && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Información General</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography><strong>Nombre:</strong> {productoDetalle.nombre}</Typography>
                  <Typography><strong>Categoría:</strong> {obtenerNombreCategoria(productoDetalle.categoria)}</Typography>
                  <Typography><strong>Precio:</strong> {formatearPrecio(productoDetalle.precio)}</Typography>
                  <Typography><strong>Proveedor:</strong> {productoDetalle.proveedor}</Typography>
                  <Typography><strong>Código de Barras:</strong> {productoDetalle.codigoBarras}</Typography>
                  <Typography><strong>Ubicación:</strong> {productoDetalle.ubicacion}</Typography>
                </Box>
                
                <Typography variant="h6" gutterBottom>Descripción</Typography>
                <Typography paragraph>{productoDetalle.descripcion}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Control de Stock</Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography><strong>Stock Actual:</strong> {productoDetalle.stock}</Typography>
                  <Typography><strong>Stock Mínimo:</strong> {productoDetalle.stockMinimo}</Typography>
                  <Typography><strong>Stock Máximo:</strong> {productoDetalle.stockMaximo}</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Chip 
                      label={getEstadoStock(productoDetalle).texto}
                      color={getEstadoStock(productoDetalle).color as "success" | "warning" | "error"}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="h6" gutterBottom>Historial</Typography>
                <Typography><strong>Ventas Totales:</strong> {productoDetalle.ventasTotal}</Typography>
                <Typography><strong>Fecha Creación:</strong> {productoDetalle.fechaCreacion}</Typography>
                <Typography><strong>Última Actualización:</strong> {productoDetalle.fechaActualizacion}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
          {productoDetalle && (
            <>
              <Button onClick={() => imprimirEtiqueta(productoDetalle)} variant="outlined">
                Imprimir Etiqueta
              </Button>
              <Button onClick={() => abrirDialog(productoDetalle)} variant="contained">
                Editar
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog crear/editar producto */}
      <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre del Producto *"
                value={formProducto.nombre}
                onChange={(e) => setFormProducto(prev => ({ ...prev, nombre: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Categoría *</InputLabel>
                <Select
                  value={formProducto.categoria}
                  onChange={(e) => {
                    if (e.target.value === '__crear_nueva__') {
                      setMostrarCrearCategoria(true);
                    } else {
                      setFormProducto(prev => ({ ...prev, categoria: e.target.value }));
                    }
                  }}
                  label="Categoría *"
                >
                  {categorias.filter(c => c !== 'Todas').map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value="__crear_nueva__" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    <AddIcon sx={{ mr: 1, fontSize: 16 }} />
                    Crear nueva categoría
                  </MenuItem>
                </Select>
              </FormControl>
              
              {/* Campo para crear nueva categoría */}
              {mostrarCrearCategoria && (
                <Box sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Nueva Categoría
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="Nombre de la categoría"
                      value={nuevaCategoria}
                      onChange={(e) => setNuevaCategoria(e.target.value)}
                      sx={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && nuevaCategoria.trim()) {
                          const categoriasActualizadas = [...categorias, nuevaCategoria.trim()];
                          setCategorias(categoriasActualizadas);
                          setFormProducto(prev => ({ ...prev, categoria: nuevaCategoria.trim() }));
                          setNuevaCategoria('');
                          setMostrarCrearCategoria(false);
                        }
                      }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => {
                        if (nuevaCategoria.trim()) {
                          const categoriasActualizadas = [...categorias, nuevaCategoria.trim()];
                          setCategorias(categoriasActualizadas);
                          setFormProducto(prev => ({ ...prev, categoria: nuevaCategoria.trim() }));
                          setNuevaCategoria('');
                          setMostrarCrearCategoria(false);
                        }
                      }}
                      disabled={!nuevaCategoria.trim()}
                    >
                      Crear
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        setMostrarCrearCategoria(false);
                        setNuevaCategoria('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Precio *"
                type="number"
                value={formProducto.precio}
                onChange={(e) => setFormProducto(prev => ({ ...prev, precio: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Actual"
                type="number"
                value={formProducto.stock}
                onChange={(e) => setFormProducto(prev => ({ ...prev, stock: Number(e.target.value) }))}
                helperText="Opcional - Dejar en 0 si no se maneja stock"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Código de Barras"
                value={formProducto.codigoBarras}
                onChange={(e) => setFormProducto(prev => ({ ...prev, codigoBarras: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Mínimo"
                type="number"
                value={formProducto.stockMinimo}
                onChange={(e) => setFormProducto(prev => ({ ...prev, stockMinimo: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Stock Máximo"
                type="number"
                value={formProducto.stockMaximo}
                onChange={(e) => setFormProducto(prev => ({ ...prev, stockMaximo: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ubicación"
                value={formProducto.ubicacion}
                onChange={(e) => setFormProducto(prev => ({ ...prev, ubicacion: e.target.value }))}
                placeholder="Ej: Estante A1"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Proveedor"
                value={formProducto.proveedor}
                onChange={(e) => setFormProducto(prev => ({ ...prev, proveedor: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formProducto.descripcion}
                onChange={(e) => setFormProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción detallada del producto..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained">
            {modoEdicion ? 'Actualizar' : 'Crear'}
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

export default Productos; 