import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Avatar,
  Badge,
  Tooltip,
  Snackbar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  MenuItem
} from '@mui/material';
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CAJERO' | 'MOZO';
  activo: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

interface ConfiguracionSistema {
  clave: string;
  valor: string;
  descripcion: string;
}

interface NuevoUsuario {
  email: string;
  nombre: string;
  apellido: string;
  password: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'CAJERO' | 'MOZO';
  activo: boolean;
}

const ConfiguracionGeneral = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionSistema[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  // Estados para gestión de usuarios
  const [dialogUsuario, setDialogUsuario] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState<NuevoUsuario>({
    email: '',
    nombre: '',
    apellido: '',
    password: '',
    rol: 'MOZO',
    activo: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Estados para configuraciones
  const [configuracionEmpresa, setConfiguracionEmpresa] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    cuit: ''
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [usuariosRes, configRes] = await Promise.all([
        api.get('/usuarios'),
        api.get('/configuracion-sistema')
      ]);

      if (usuariosRes.data.success) {
        setUsuarios(usuariosRes.data.data.usuarios || []);
      }

      if (configRes.data.success) {
        setConfiguraciones(configRes.data.data || []);
        cargarConfiguracionEmpresa(configRes.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      mostrarMensaje('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarConfiguracionEmpresa = (configs: ConfiguracionSistema[]) => {
    const empresaConfig = {
      nombre: configs.find(c => c.clave === 'EMPRESA_NOMBRE')?.valor || '',
      direccion: configs.find(c => c.clave === 'EMPRESA_DIRECCION')?.valor || '',
      telefono: configs.find(c => c.clave === 'EMPRESA_TELEFONO')?.valor || '',
      email: configs.find(c => c.clave === 'EMPRESA_EMAIL')?.valor || '',
      cuit: configs.find(c => c.clave === 'EMPRESA_CUIT')?.valor || ''
    };
    setConfiguracionEmpresa(empresaConfig);
  };

  const mostrarMensaje = (mensaje: string, severidad: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbarMessage(mensaje);
    setSnackbarSeverity(severidad);
    setSnackbarOpen(true);
  };

  const handleCrearUsuario = () => {
    setEditingUsuario(null);
    setNuevoUsuario({
      email: '',
      nombre: '',
      apellido: '',
      password: '',
      rol: 'MOZO',
      activo: true
    });
    setShowPassword(false);
    setDialogUsuario(true);
  };

  const handleEditarUsuario = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setNuevoUsuario({
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      password: '',
      rol: usuario.rol,
      activo: usuario.activo
    });
    setShowPassword(false);
    setDialogUsuario(true);
  };

  const handleGuardarUsuario = async () => {
    if (!nuevoUsuario.nombre || !nuevoUsuario.apellido) {
      mostrarMensaje('Complete todos los campos obligatorios', 'warning');
      return;
    }

    // Para mozos, email y contraseña son opcionales
    if (nuevoUsuario.rol !== 'MOZO') {
      if (!nuevoUsuario.email) {
        mostrarMensaje('El email es obligatorio para usuarios que no son mozos', 'warning');
        return;
      }

      if (!editingUsuario && !nuevoUsuario.password) {
        mostrarMensaje('La contraseña es obligatoria para nuevos usuarios', 'warning');
        return;
      }
    }

    try {
      setLoading(true);
      let response;

      if (editingUsuario) {
        // Actualizar usuario existente
        const datosActualizacion = {
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          rol: nuevoUsuario.rol,
          activo: nuevoUsuario.activo
        };

        if (nuevoUsuario.password) {
          (datosActualizacion as any).password = nuevoUsuario.password;
        }

        response = await api.put(`/usuarios/${editingUsuario.id}`, datosActualizacion);
      } else {
        // Crear nuevo usuario
        const datosCreacion = {
          nombre: nuevoUsuario.nombre,
          apellido: nuevoUsuario.apellido,
          rol: nuevoUsuario.rol,
          activo: nuevoUsuario.activo
        };

        // Solo incluir email y password si no es mozo o si se proporcionaron
        if (nuevoUsuario.rol !== 'MOZO' || nuevoUsuario.email) {
          (datosCreacion as any).email = nuevoUsuario.email;
        }
        if (nuevoUsuario.rol !== 'MOZO' || nuevoUsuario.password) {
          (datosCreacion as any).password = nuevoUsuario.password;
        }

        response = await api.post('/usuarios', datosCreacion);
      }

      if (response.data.success) {
        const mensaje = editingUsuario 
          ? 'Usuario actualizado correctamente' 
          : nuevoUsuario.rol === 'MOZO'
            ? 'Mozo creado correctamente (email y contraseña generados automáticamente)'
            : 'Usuario creado correctamente';
        
        mostrarMensaje(mensaje, 'success');
        setDialogUsuario(false);
        cargarDatos();
      }
    } catch (error: any) {
      console.error('Error guardando usuario:', error);
      mostrarMensaje(
        error.response?.data?.message || 'Error al guardar usuario',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarUsuario = async (usuario: Usuario) => {
    if (!window.confirm(`¿Está seguro de eliminar al usuario ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/usuarios/${usuario.id}`);
      
      if (response.data.success) {
        mostrarMensaje('Usuario eliminado correctamente');
        cargarDatos();
      }
    } catch (error: any) {
      console.error('Error eliminando usuario:', error);
      mostrarMensaje(
        error.response?.data?.message || 'Error al eliminar usuario',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarConfiguracionEmpresa = async () => {
    try {
      setLoading(true);
      
      const configuracionesActualizadas = [
        { clave: 'EMPRESA_NOMBRE', valor: configuracionEmpresa.nombre },
        { clave: 'EMPRESA_DIRECCION', valor: configuracionEmpresa.direccion },
        { clave: 'EMPRESA_TELEFONO', valor: configuracionEmpresa.telefono },
        { clave: 'EMPRESA_EMAIL', valor: configuracionEmpresa.email },
        { clave: 'EMPRESA_CUIT', valor: configuracionEmpresa.cuit }
      ];

      await Promise.all(
        configuracionesActualizadas.map(config =>
          api.post('/configuracion-sistema', config)
        )
      );

      mostrarMensaje('Configuración de empresa guardada correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      mostrarMensaje('Error al guardar configuración', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return 'error';
      case 'SUPERVISOR': return 'warning';
      case 'CAJERO': return 'primary';
      case 'MOZO': return 'success';
      default: return 'default';
    }
  };

  const getRolIcon = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return '👑';
      case 'SUPERVISOR': return '👨‍💼';
      case 'CAJERO': return '💰';
      case 'MOZO': return '👨‍🍳';
      default: return '👤';
    }
  };

  const mozosActivos = usuarios.filter(u => u.rol === 'MOZO' && u.activo).length;
  const totalUsuarios = usuarios.length;

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando configuración...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto', position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          ⚙️ Configuración General
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Box>
      </Box>

      {/* Estadísticas rápidas */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary">
                {totalUsuarios}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Usuarios
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {mozosActivos}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mozos Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {usuarios.filter(u => u.rol === 'CAJERO' && u.activo).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cajeros Activos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {usuarios.filter(u => !u.activo).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Usuarios Inactivos
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs principales */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<PeopleIcon />} 
            label="Gestión de Usuarios" 
            iconPosition="start"
          />
          <Tab 
            icon={<BusinessIcon />} 
            label="Configuración Empresa" 
            iconPosition="start"
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Configuración Sistema" 
            iconPosition="start"
          />
        </Tabs>

        {/* Tab Panel - Gestión de Usuarios */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              👥 Gestión de Usuarios y Mozos
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCrearUsuario}
            >
              Crear Usuario
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>💡 Información:</strong> Los mozos son usuarios con rol "MOZO" que pueden ser asignados a las mesas. 
              Solo los usuarios con rol ADMIN pueden gestionar usuarios.
            </Typography>
          </Alert>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha Creación</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usuarios
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                          {usuario.nombre.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {usuario.nombre} {usuario.apellido}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2">
                            {usuario.email}
                          </Typography>
                          {usuario.rol === 'MOZO' && usuario.email.includes('@mozos.local') && (
                            <Typography variant="caption" color="text.secondary">
                              Email automático
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={<span>{getRolIcon(usuario.rol)}</span>}
                        label={usuario.rol}
                        color={getRolColor(usuario.rol) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={usuario.activo ? 'Activo' : 'Inactivo'}
                        color={usuario.activo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(usuario.fechaCreacion).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Editar usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleEditarUsuario(usuario)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar usuario">
                          <IconButton
                            size="small"
                            onClick={() => handleEliminarUsuario(usuario)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={usuarios.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        </TabPanel>

        {/* Tab Panel - Configuración Empresa */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            🏢 Configuración de la Empresa
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>💡 Información:</strong> Estos datos se utilizan en los comprobantes fiscales y reportes del sistema.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre de la Empresa"
                value={configuracionEmpresa.nombre}
                onChange={(e) => setConfiguracionEmpresa(prev => ({
                  ...prev,
                  nombre: e.target.value
                }))}
                helperText="Nombre legal de la empresa"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="CUIT"
                value={configuracionEmpresa.cuit}
                onChange={(e) => setConfiguracionEmpresa(prev => ({
                  ...prev,
                  cuit: e.target.value
                }))}
                helperText="CUIT de la empresa (formato: XX-XXXXXXXX-X)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                value={configuracionEmpresa.direccion}
                onChange={(e) => setConfiguracionEmpresa(prev => ({
                  ...prev,
                  direccion: e.target.value
                }))}
                helperText="Dirección completa de la empresa"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={configuracionEmpresa.telefono}
                onChange={(e) => setConfiguracionEmpresa(prev => ({
                  ...prev,
                  telefono: e.target.value
                }))}
                helperText="Teléfono de contacto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={configuracionEmpresa.email}
                onChange={(e) => setConfiguracionEmpresa(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                helperText="Email de contacto"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleGuardarConfiguracionEmpresa}
              disabled={loading}
            >
              Guardar Configuración
            </Button>
          </Box>
        </TabPanel>

        {/* Tab Panel - Configuración Sistema */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            ⚙️ Configuración del Sistema
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>💡 Información:</strong> Configuraciones avanzadas del sistema. 
              Solo modifique si conoce el impacto de los cambios.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {configuraciones.map((config) => (
              <Grid item xs={12} md={6} key={config.clave}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {config.descripcion}
                    </Typography>
                    <TextField
                      fullWidth
                      label="Valor"
                      value={config.valor}
                      size="small"
                      disabled
                    />
                    <Typography variant="caption" color="text.secondary">
                      Clave: {config.clave}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>⚠️ Advertencia:</strong> Las configuraciones del sistema son avanzadas. 
              Para modificar estas configuraciones, contacte al administrador del sistema.
            </Typography>
          </Alert>
        </TabPanel>
      </Paper>

      {/* Dialog para crear/editar usuario */}
      <Dialog 
        open={dialogUsuario} 
        onClose={() => setDialogUsuario(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: 1400,
          '& .MuiDialog-paper': {
            zIndex: 1400
          }
        }}
      >
        <DialogTitle>
          {editingUsuario ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
        </DialogTitle>
        <DialogContent>
          {!editingUsuario && nuevoUsuario.rol === 'MOZO' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>💡 Para mozos:</strong> Solo necesitas nombre y apellido. 
                El sistema generará automáticamente un email y contraseña.
              </Typography>
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario(prev => ({
                  ...prev,
                  nombre: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={nuevoUsuario.apellido}
                onChange={(e) => setNuevoUsuario(prev => ({
                  ...prev,
                  apellido: e.target.value
                }))}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={nuevoUsuario.email}
                onChange={(e) => setNuevoUsuario(prev => ({
                  ...prev,
                  email: e.target.value
                }))}
                required={nuevoUsuario.rol !== 'MOZO'}
                helperText={nuevoUsuario.rol === 'MOZO' ? 'Opcional para mozos' : 'Obligatorio para otros roles'}
                disabled={nuevoUsuario.rol === 'MOZO'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario(prev => ({
                  ...prev,
                  password: e.target.value
                }))}
                required={!editingUsuario && nuevoUsuario.rol !== 'MOZO'}
                helperText={
                  nuevoUsuario.rol === 'MOZO' 
                    ? 'No requerida para mozos' 
                    : editingUsuario 
                      ? 'Dejar vacío para mantener la contraseña actual' 
                      : 'Contraseña obligatoria'
                }
                disabled={nuevoUsuario.rol === 'MOZO'}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={nuevoUsuario.rol === 'MOZO'}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Rol"
                value={nuevoUsuario.rol}
                onChange={(e) => {
                  const nuevoRol = e.target.value as any;
                  setNuevoUsuario(prev => ({
                    ...prev,
                    rol: nuevoRol
                  }));
                  
                  // Si se cambia a mozo, limpiar email y contraseña
                  if (nuevoRol === 'MOZO') {
                    setNuevoUsuario(prev => ({
                      ...prev,
                      email: '',
                      password: ''
                    }));
                  }
                }}
                required
              >
                <MenuItem value="MOZO">👨‍🍳 Mozo</MenuItem>
                <MenuItem value="CAJERO">💰 Cajero</MenuItem>
                <MenuItem value="SUPERVISOR">👨‍💼 Supervisor</MenuItem>
                <MenuItem value="ADMIN">👑 Administrador</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={nuevoUsuario.activo}
                    onChange={(e) => setNuevoUsuario(prev => ({
                      ...prev,
                      activo: e.target.checked
                    }))}
                  />
                }
                label="Usuario Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogUsuario(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleGuardarUsuario}
            disabled={loading}
            startIcon={<SaveIcon />}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ConfiguracionGeneral; 