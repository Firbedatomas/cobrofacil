import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
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
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Fab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  RestaurantMenu as RestaurantIcon,
  Kitchen as KitchenIcon,
  LocalBar as BarIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { formatearPrecio } from '../utils/formatters';
import { productosService } from '../services/productosService';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  precio: number;
  categoria: string;
  comandera?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface FormProducto {
  codigo: string;
  nombre: string;
  precio: number;
  categoria: string;
  comandera: string;
}

const COMANDERAS = [
  { value: '', label: 'Sin comandera', icon: <StoreIcon /> },
  { value: 'cocina', label: 'Cocina', icon: <KitchenIcon /> },
  { value: 'salon', label: 'Salón', icon: <RestaurantIcon /> },
  { value: 'barra', label: 'Barra', icon: <BarIcon /> },
];

const ProductosSimplificado: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<string[]>(['Todas']);
  const [categoriasCompletas, setCategoriasCompletas] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [formProducto, setFormProducto] = useState<FormProducto>({
    codigo: '',
    nombre: '',
    precio: 0,
    categoria: '',
    comandera: ''
  });

  const [mostrarCrearCategoria, setMostrarCrearCategoria] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [creandoCategoria, setCreandoCategoria] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarProductos(),
        cargarCategorias()
      ]);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarSnackbar('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
             const data = await productosService.obtenerTodos();
      
      // Transformar datos del backend al formato esperado
      const productosTransformados = data.map((producto: any) => ({
        id: producto.id,
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: producto.categoria?.nombre || 'Sin categoría',
        comandera: producto.comandera || '',
        fechaCreacion: producto.fechaCreacion,
        fechaActualizacion: producto.fechaActualizacion,
      }));
      
      setProductos(productosTransformados);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  };

  const cargarCategorias = async () => {
    try {
      const data = await productosService.obtenerCategorias();
      const nombresCategorias = data.map((cat: any) => cat.nombre);
      setCategorias(['Todas', ...nombresCategorias]);
      setCategoriasCompletas(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      throw error;
    }
  };

  const mostrarSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const abrirDialog = (producto?: Producto) => {
    if (producto) {
      setModoEdicion(true);
      setProductoEditando(producto);
      setFormProducto({
        codigo: producto.codigo,
        nombre: producto.nombre,
        precio: producto.precio,
        categoria: producto.categoria,
        comandera: producto.comandera || ''
      });
    } else {
      setModoEdicion(false);
      setProductoEditando(null);
      setFormProducto({
        codigo: '',
        nombre: '',
        precio: 0,
        categoria: '',
        comandera: ''
      });
    }
    setOpenDialog(true);
  };

  const cerrarDialog = () => {
    setOpenDialog(false);
    setModoEdicion(false);
    setProductoEditando(null);
    setMostrarCrearCategoria(false);
    setNuevaCategoria('');
  };

  const crearNuevaCategoria = async () => {
    if (!nuevaCategoria.trim()) {
      mostrarSnackbar('El nombre de la categoría es requerido', 'error');
      return;
    }

    try {
      setCreandoCategoria(true);
      const categoriaCreada = await productosService.crearCategoria({
        nombre: nuevaCategoria.trim()
      });

      // Actualizar listas locales
      setCategorias(prev => [...prev, categoriaCreada.nombre]);
      setCategoriasCompletas(prev => [...prev, categoriaCreada]);
      
      // Seleccionar la nueva categoría automáticamente
      setFormProducto(prev => ({ ...prev, categoria: categoriaCreada.nombre }));
      
      // Limpiar y cerrar modal de creación
      setNuevaCategoria('');
      setMostrarCrearCategoria(false);
      
      mostrarSnackbar('Categoría creada exitosamente');
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      const errorMessage = error.response?.data?.error || 'Error al crear categoría';
      mostrarSnackbar(errorMessage, 'error');
    } finally {
      setCreandoCategoria(false);
    }
  };

  const handleGuardar = async () => {
    // Validaciones
    if (!formProducto.nombre.trim()) {
      mostrarSnackbar('El nombre del producto es obligatorio', 'error');
      return;
    }

    if (!formProducto.categoria.trim()) {
      mostrarSnackbar('La categoría del producto es obligatoria', 'error');
      return;
    }

    if (formProducto.precio <= 0) {
      mostrarSnackbar('El precio debe ser mayor a 0', 'error');
      return;
    }

    try {
      // Encontrar la categoría seleccionada
      const categoriaSeleccionada = categoriasCompletas.find(
        cat => cat.nombre === formProducto.categoria
      );

      if (!categoriaSeleccionada) {
        mostrarSnackbar('Categoría no válida. Por favor, seleccione una categoría válida.', 'error');
        return;
      }

      if (modoEdicion && productoEditando) {
        // Actualizar producto existente
        const productoActualizado = {
          codigo: formProducto.codigo.trim() || undefined,
          nombre: formProducto.nombre.trim(),
          precio: formProducto.precio,
          comandera: formProducto.comandera.trim() || undefined,
          categoriaId: categoriaSeleccionada.id
        };

        await productosService.actualizarProducto(productoEditando.id, productoActualizado);
        mostrarSnackbar('Producto actualizado exitosamente');
      } else {
        // Crear nuevo producto
        const nuevoProducto = {
          codigo: formProducto.codigo.trim() || undefined,
          nombre: formProducto.nombre.trim(),
          precio: formProducto.precio,
          comandera: formProducto.comandera.trim() || undefined,
          categoriaId: categoriaSeleccionada.id
        };

        await productosService.crearProducto(nuevoProducto);
        mostrarSnackbar('Producto creado exitosamente');
      }

      // Recargar productos
      await cargarProductos();
      cerrarDialog();
    } catch (error: any) {
      console.error('Error al guardar producto:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Error al guardar producto';
      mostrarSnackbar(errorMessage, 'error');
    }
  };

  const handleEliminar = async (producto: Producto) => {
    if (window.confirm(`¿Está seguro de eliminar "${producto.nombre}"?`)) {
      try {
        await productosService.eliminarProducto(producto.id);
        mostrarSnackbar('Producto eliminado correctamente');
        await cargarProductos();
      } catch (error: any) {
        console.error('Error al eliminar producto:', error);
        const errorMessage = error.response?.data?.error || 'Error al eliminar producto';
        mostrarSnackbar(errorMessage, 'error');
      }
    }
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                            producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  const getIconoComanderas = (comandera?: string) => {
    const config = COMANDERAS.find(c => c.value === comandera);
    return config ? config.icon : <StoreIcon />;
  };

  const getLabelComanderas = (comandera?: string) => {
    const config = COMANDERAS.find(c => c.value === comandera);
    return config ? config.label : 'Sin comandera';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Productos
      </Typography>

      {/* Controles de filtrado */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Buscar productos"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                label="Categoría"
              >
                {categorias.map(categoria => (
                  <MenuItem key={categoria} value={categoria}>
                    {categoria}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => abrirDialog()}
            >
              Nuevo
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de productos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Comandera</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productosFiltrados.map((producto) => (
              <TableRow key={producto.id}>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {producto.codigo}
                  </Typography>
                </TableCell>
                <TableCell>{producto.nombre}</TableCell>
                <TableCell>
                  <Chip label={producto.categoria} size="small" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    {formatearPrecio(producto.precio)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getIconoComanderas(producto.comandera)}
                    <Typography variant="body2">
                      {getLabelComanderas(producto.comandera)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => abrirDialog(producto)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEliminar(producto)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para crear/editar producto */}
      <Dialog open={openDialog} onClose={cerrarDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {modoEdicion ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Código (opcional)"
                  value={formProducto.codigo}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, codigo: e.target.value }))}
                  helperText="Si no se especifica, se generará automáticamente"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre *"
                  value={formProducto.nombre}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio *"
                  type="number"
                  value={formProducto.precio}
                  onChange={(e) => setFormProducto(prev => ({ ...prev, precio: Number(e.target.value) }))}
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Categoría *</InputLabel>
                  <Select
                    value={formProducto.categoria}
                    onChange={(e) => {
                      if (e.target.value === 'CREAR_NUEVA') {
                        setMostrarCrearCategoria(true);
                      } else {
                        setFormProducto(prev => ({ ...prev, categoria: e.target.value }));
                      }
                    }}
                    label="Categoría *"
                  >
                    {categorias.filter(cat => cat !== 'Todas').map(categoria => (
                      <MenuItem key={categoria} value={categoria}>
                        {categoria}
                      </MenuItem>
                    ))}
                    <MenuItem value="CREAR_NUEVA">
                      <em>+ Crear nueva categoría</em>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Comandera</InputLabel>
                  <Select
                    value={formProducto.comandera}
                    onChange={(e) => setFormProducto(prev => ({ ...prev, comandera: e.target.value }))}
                    label="Comandera"
                  >
                    {COMANDERAS.map(comandera => (
                      <MenuItem key={comandera.value} value={comandera.value}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {comandera.icon}
                          {comandera.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Modal para crear nueva categoría */}
            {mostrarCrearCategoria && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom>
                  Crear Nueva Categoría
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <TextField
                    fullWidth
                    label="Nombre de la categoría"
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    disabled={creandoCategoria}
                  />
                  <Button
                    variant="contained"
                    onClick={crearNuevaCategoria}
                    disabled={creandoCategoria}
                  >
                    {creandoCategoria ? <CircularProgress size={20} /> : 'Crear'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setMostrarCrearCategoria(false);
                      setNuevaCategoria('');
                    }}
                    disabled={creandoCategoria}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarDialog}>Cancelar</Button>
          <Button onClick={handleGuardar} variant="contained">
            {modoEdicion ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductosSimplificado; 