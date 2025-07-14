import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  Person,
  PersonAdd,
  Group,
  Badge,
  Save,
  Cancel
} from '@mui/icons-material';
import api from '../../../services/api';
import { toastService } from '../../../services/toastService';

interface Mozo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

interface SeleccionMozoProps {
  open: boolean;
  onClose: () => void;
  onSeleccionar: (mozo: Mozo) => void;
  usuarioActual: any;
}

const SeleccionMozo: React.FC<SeleccionMozoProps> = ({
  open,
  onClose,
  onSeleccionar,
  usuarioActual
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mozosDisponibles, setMozosDisponibles] = useState<Mozo[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCrearMozo, setShowCrearMozo] = useState(false);
  const [nuevoMozo, setNuevoMozo] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    activo: true
  });
  const [creandoMozo, setCreandoMozo] = useState(false);

  useEffect(() => {
    if (open) {
      cargarMozos();
    }
  }, [open]);

  const cargarMozos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/usuarios?rol=MOZO&activo=true');
      if (response.data && Array.isArray(response.data.usuarios)) {
        setMozosDisponibles(response.data.usuarios);
      }
    } catch (error) {
      console.error('Error cargando mozos:', error);
      toastService.error('Error al cargar mozos');
    } finally {
      setLoading(false);
    }
  };

  const crearMozo = async () => {
    if (!nuevoMozo.nombre || !nuevoMozo.apellido || !nuevoMozo.email || !nuevoMozo.password) {
      toastService.error('Todos los campos son obligatorios');
      return;
    }

    setCreandoMozo(true);
    try {
      const response = await api.post('/usuarios', {
        ...nuevoMozo,
        rol: 'MOZO'
      });
      
      if (response.data) {
        toastService.success('Mozo creado exitosamente');
        setNuevoMozo({
          nombre: '',
          apellido: '',
          email: '',
          password: '',
          activo: true
        });
        setShowCrearMozo(false);
        cargarMozos();
      }
    } catch (error: any) {
      console.error('Error creando mozo:', error);
      toastService.error(error.response?.data?.error || 'Error al crear mozo');
    } finally {
      setCreandoMozo(false);
    }
  };

  const mozosFiltrados = mozosDisponibles.filter(mozo => 
    `${mozo.nombre} ${mozo.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSeleccionar = (mozo: Mozo) => {
    onSeleccionar(mozo);
    onClose();
  };

  const handleSeleccionarUsuarioActual = () => {
    if (usuarioActual) {
      onSeleccionar({
        id: usuarioActual.id,
        nombre: usuarioActual.nombre,
        apellido: usuarioActual.apellido,
        email: usuarioActual.email,
        activo: true
      });
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open && !showCrearMozo} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group color="primary" />
            Seleccionar Mozo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar mozo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {/* Opción por defecto - Usuario actual */}
              <ListItemButton
                onClick={handleSeleccionarUsuarioActual}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: 'primary.50'
                }}
              >
                <ListItemIcon>
                  <Badge color="primary">
                    <Person />
                  </Badge>
                </ListItemIcon>
                <ListItemText
                  primary={`${usuarioActual?.nombre || ''} ${usuarioActual?.apellido || ''}`}
                  secondary="Usuario actual (por defecto)"
                />
                <Chip label="Predeterminado" color="primary" size="small" />
              </ListItemButton>

              {mozosFiltrados.length > 0 ? (
                mozosFiltrados.map((mozo) => (
                  <ListItemButton
                    key={mozo.id}
                    onClick={() => handleSeleccionar(mozo)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {mozo.nombre.charAt(0)}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${mozo.nombre} ${mozo.apellido}`}
                      secondary={mozo.email}
                    />
                    <Chip 
                      label={mozo.activo ? 'Activo' : 'Inactivo'} 
                      color={mozo.activo ? 'success' : 'default'} 
                      size="small" 
                    />
                  </ListItemButton>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron mozos
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Puedes crear uno nuevo usando el botón de abajo
                  </Typography>
                </Box>
              )}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<PersonAdd />}
            onClick={() => setShowCrearMozo(true)}
            color="primary"
            variant="outlined"
          >
            Crear Nuevo Mozo
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal para crear mozo */}
      <Dialog open={showCrearMozo} onClose={() => setShowCrearMozo(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd color="primary" />
            Crear Nuevo Mozo
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={nuevoMozo.nombre}
                onChange={(e) => setNuevoMozo({...nuevoMozo, nombre: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={nuevoMozo.apellido}
                onChange={(e) => setNuevoMozo({...nuevoMozo, apellido: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={nuevoMozo.email}
                onChange={(e) => setNuevoMozo({...nuevoMozo, email: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={nuevoMozo.password}
                onChange={(e) => setNuevoMozo({...nuevoMozo, password: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={nuevoMozo.activo}
                    onChange={(e) => setNuevoMozo({...nuevoMozo, activo: e.target.checked})}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowCrearMozo(false)} 
            disabled={creandoMozo}
          >
            Cancelar
          </Button>
          <Button
            onClick={crearMozo}
            variant="contained"
            disabled={creandoMozo}
            startIcon={creandoMozo ? <CircularProgress size={20} /> : <Save />}
          >
            Crear Mozo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SeleccionMozo; 