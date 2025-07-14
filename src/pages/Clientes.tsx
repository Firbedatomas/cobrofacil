import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
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
  InputAdornment,
  Fab,
  Badge,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import type { RootState, AppDispatch } from '../store';
import type { Cliente } from '../types';
import { 
  cargarClientes,
  agregarCliente, 
  actualizarCliente, 
  eliminarCliente, 
  seleccionarCliente,
  limpiarError,
  calcularEstadisticasClientes
} from '../store/clientesSlice';

const Clientes = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clientes, clienteSeleccionado, cargando, error } = useSelector((state: RootState) => state.clientes);
  const historialVentas = useSelector((state: RootState) => state.ventas.historial);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>('success');
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
  });

  // Cargar clientes al inicializar el componente
  useEffect(() => {
    dispatch(cargarClientes());
  }, [dispatch]);

  // Mostrar errores del slice
  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      dispatch(limpiarError());
    }
  }, [error, dispatch]);

  // Calcular estadísticas
  const estadisticas = calcularEstadisticasClientes(clientes);

  // Filtrar clientes por búsqueda
  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.dni.includes(searchTerm) ||
    (cliente.telefono && cliente.telefono.includes(searchTerm)) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  // Manejar formulario
  const handleInputChange = (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = () => {
    if (!formData.nombre.trim() || !formData.dni.trim()) {
      mostrarMensaje('Nombre y DNI son obligatorios', 'error');
      return;
    }

    // Verificar si el DNI ya existe (solo para nuevos clientes)
    if (!clienteEditando && clientes.some(c => c.dni === formData.dni.trim())) {
      mostrarMensaje('Ya existe un cliente con ese DNI', 'error');
      return;
    }

    if (clienteEditando) {
      const clienteActualizado: Cliente = {
        ...clienteEditando,
        ...formData,
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
      };
      dispatch(actualizarCliente(clienteActualizado));
      mostrarMensaje('Cliente actualizado correctamente', 'success');
    } else {
      dispatch(agregarCliente({
        nombre: formData.nombre.trim(),
        dni: formData.dni.trim(),
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
      }));
      mostrarMensaje('Cliente agregado correctamente', 'success');
    }

    handleCloseDialog();
  };

  const handleEdit = (cliente: Cliente) => {
    setClienteEditando(cliente);
    setFormData({
      nombre: cliente.nombre,
      dni: cliente.dni,
      telefono: cliente.telefono || '',
      email: cliente.email || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = (clienteId: string, nombreCliente: string) => {
    if (window.confirm(`¿Está seguro de que desea eliminar al cliente "${nombreCliente}"?\n\nEsta acción no se puede deshacer.`)) {
      dispatch(eliminarCliente(clienteId));
      mostrarMensaje('Cliente eliminado correctamente', 'success');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setClienteEditando(null);
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
    });
  };

  const handleSelectClient = (cliente: Cliente) => {
    dispatch(seleccionarCliente(cliente));
    mostrarMensaje(`Cliente ${cliente.nombre} seleccionado para ventas`, 'success');
  };

  const mostrarMensaje = (mensaje: string, tipo: 'success' | 'error' | 'warning') => {
    setSnackbarMessage(mensaje);
    setSnackbarSeverity(tipo);
    setSnackbarOpen(true);
  };

  // Estado de carga
  if (cargando) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={50} />
          <Typography variant="h6" color="text.secondary">
            Cargando clientes...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Estado vacío - sin clientes
  if (clientes.length === 0 && !searchTerm) {
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            👥 Gestión de Clientes
          </Typography>
        </Box>

        {/* Estado vacío */}
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <GroupIcon sx={{ fontSize: 120, color: 'text.disabled', mb: 3 }} />
          
          <Typography variant="h4" gutterBottom sx={{ color: 'text.secondary' }}>
            ¡Comienza agregando tu primer cliente!
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Los clientes son el corazón de tu negocio. Aquí podrás gestionar toda su información, 
            llevar un registro de sus compras, puntos de fidelidad y niveles de descuento.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenDialog(true)}
              sx={{ py: 1.5, px: 4 }}
            >
              Agregar Primer Cliente
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              sx={{ py: 1.5, px: 4 }}
            >
              Importar Clientes
            </Button>
          </Stack>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2, color: 'info.dark' }}>
            <Typography variant="subtitle2" gutterBottom>
              💡 Beneficios del sistema de clientes:
            </Typography>
            <Typography variant="body2">
              • Puntos de fidelidad automáticos • Descuentos por nivel • Historial de compras • Búsqueda rápida por DNI
            </Typography>
          </Box>
        </Paper>

        {/* Dialog para agregar cliente */}
        {renderClientDialog()}

        {/* Snackbar */}
        {renderSnackbar()}
      </Box>
    );
  }

  // Función para renderizar el diálogo de cliente
  function renderClientDialog() {
    return (
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {clienteEditando ? 'Editar Cliente' : 'Nuevo Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre Completo *"
                value={formData.nombre}
                onChange={handleInputChange('nombre')}
                error={!formData.nombre.trim()}
                helperText={!formData.nombre.trim() ? 'El nombre es requerido' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="DNI *"
                value={formData.dni}
                onChange={handleInputChange('dni')}
                disabled={!!clienteEditando}
                error={!formData.dni.trim()}
                helperText={
                  clienteEditando 
                    ? 'El DNI no se puede modificar' 
                    : !formData.dni.trim() 
                      ? 'El DNI es requerido' 
                      : 'Ingrese entre 7 y 9 dígitos'
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Teléfono"
                value={formData.telefono}
                onChange={handleInputChange('telefono')}
                placeholder="+54 11 1234-5678"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                placeholder="cliente@ejemplo.com"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.nombre.trim() || !formData.dni.trim()}
          >
            {clienteEditando ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Función para renderizar el snackbar
  function renderSnackbar() {
    return (
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
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
    );
  }

  // Vista principal con clientes
  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            👥 Gestión de Clientes
          </Typography>
          {clienteSeleccionado && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Cliente seleccionado: <strong>{clienteSeleccionado.nombre}</strong>
            </Alert>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => setOpenDialog(true)}
          size="large"
        >
          Nuevo Cliente
        </Button>
      </Box>

      {/* Estadísticas generales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonAddIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{estadisticas.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Clientes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <StarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{estadisticas.porNivel.Platino}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Platino
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AttachMoneyIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    ${clientes.reduce((sum, c) => sum + c.totalCompras, 0).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Facturado
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{estadisticas.clienteActivo}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Clientes Activos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre, DNI, teléfono o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Lista de clientes */}
      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Nivel</TableCell>
                <TableCell align="right">Puntos</TableCell>
                <TableCell align="right">Total Compras</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Última Compra</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: getColorNivel(cliente.nivelFidelidad) }}>
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {cliente.nombre}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          DNI: {cliente.dni}
                        </Typography>
                        {cliente.telefono && (
                          <Typography variant="body2" color="text.secondary">
                            📞 {cliente.telefono}
                          </Typography>
                        )}
                        {cliente.email && (
                          <Typography variant="body2" color="text.secondary">
                            ✉️ {cliente.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cliente.nivelFidelidad}
                      sx={{ 
                        bgcolor: getColorNivel(cliente.nivelFidelidad),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                      icon={<StarIcon />}
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {cliente.descuentoPreferencial}% descuento
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Badge badgeContent={cliente.puntosFidelidad} color="primary" max={9999}>
                      <StarIcon color="action" />
                    </Badge>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6" color="success.main">
                      ${cliente.totalCompras.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="h6">
                      {cliente.cantidadCompras}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {cliente.ultimaCompra ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {new Date(cliente.ultimaCompra).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin compras
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleSelectClient(cliente)}
                        title="Seleccionar para venta"
                        color={clienteSeleccionado?.id === cliente.id ? 'primary' : 'default'}
                      >
                        <ShoppingCartIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(cliente)}
                        title="Editar"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(cliente.id, cliente.nombre)}
                        title="Eliminar"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {clientesFiltrados.length === 0 && searchTerm && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron clientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay clientes que coincidan con "{searchTerm}"
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => setSearchTerm('')}
              sx={{ mt: 2 }}
            >
              Limpiar búsqueda
            </Button>
          </Box>
        )}
      </Paper>

      {/* Dialog para agregar/editar cliente */}
      {renderClientDialog()}

      {/* Snackbar */}
      {renderSnackbar()}
    </Box>
  );
};

export default Clientes; 