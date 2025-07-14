import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import {
  GetApp,
  Refresh,
  ShareRounded,
  InstallMobile,
  CloudDownload,
  Cached,
  Wifi,
  WifiOff,
  Storage,
  Delete,
  CheckCircle,
  Error,
  Warning,
  Info,
  Close,
  Launch,
  Notifications,
  PhoneIphone,
  Computer,
  Download
} from '@mui/icons-material';
import pwaService, { type CacheStatus } from '../services/pwaService';

interface PWAControlsProps {
  showDetailed?: boolean;
  compact?: boolean;
}

const PWAControls: React.FC<PWAControlsProps> = ({ 
  showDetailed = false, 
  compact = false 
}) => {
  const [isInstalled, setIsInstalled] = useState(pwaService.isAppInstalled);
  const [isOnline, setIsOnline] = useState(pwaService.isAppOnline);
  const [updateAvailable, setUpdateAvailable] = useState(pwaService.isUpdateAvailable);
  const [installPromptAvailable, setInstallPromptAvailable] = useState(pwaService.isInstallPromptAvailable);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({ caches: 0, static: 0, dynamic: 0, total: 0 });
  
  const [installing, setInstalling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showCacheDialog, setShowCacheDialog] = useState(false);
  const [showIOSDialog, setShowIOSDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  useEffect(() => {
    // Cargar estado inicial
    loadCacheStatus();

    // Configurar listeners
    pwaService.on('installPromptAvailable', () => {
      setInstallPromptAvailable(true);
    });

    pwaService.on('appInstalled', () => {
      setIsInstalled(true);
      setInstallPromptAvailable(false);
      showSnackbar('✅ Aplicación instalada correctamente', 'success');
    });

    pwaService.on('updateAvailable', () => {
      setUpdateAvailable(true);
      setShowUpdateDialog(true);
    });

    pwaService.on('connectivityChange', (data: { online: boolean }) => {
      setIsOnline(data.online);
      showSnackbar(
        data.online ? '🌐 Conexión restaurada' : '🔌 Trabajando offline',
        data.online ? 'success' : 'warning'
      );
    });

    pwaService.on('showIOSInstructions', () => {
      setShowIOSDialog(true);
    });

    pwaService.on('cacheUpdated', () => {
      loadCacheStatus();
    });

    return () => {
      // Limpiar listeners si fuera necesario
    };
  }, []);

  const loadCacheStatus = async () => {
    try {
      const status = await pwaService.getCacheStatus();
      setCacheStatus(status);
    } catch (error) {
      console.error('Error cargando estado del cache:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const result = await pwaService.showInstallPrompt();
      if (result) {
        setShowInstallDialog(false);
      } else {
        showSnackbar('Instalación cancelada', 'info');
      }
    } catch (error) {
      console.error('Error instalando aplicación:', error);
      showSnackbar('Error al instalar la aplicación', 'error');
    } finally {
      setInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await pwaService.applyUpdate();
      setShowUpdateDialog(false);
      showSnackbar('Actualizando aplicación...', 'info');
    } catch (error) {
      console.error('Error actualizando aplicación:', error);
      showSnackbar('Error al actualizar la aplicación', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const result = await pwaService.clearCache();
      if (result) {
        showSnackbar('Cache limpiado correctamente', 'success');
        loadCacheStatus();
      } else {
        showSnackbar('Error al limpiar cache', 'error');
      }
    } catch (error) {
      console.error('Error limpiando cache:', error);
      showSnackbar('Error al limpiar cache', 'error');
    } finally {
      setClearing(false);
    }
  };

  const handleShare = async () => {
    const shared = await pwaService.shareContent({
      title: 'CobroFacil POS',
      text: 'Sistema de punto de venta intuitivo y profesional',
      url: window.location.href
    });

    if (!shared) {
      // Fallback para navegadores sin soporte
      try {
        await navigator.clipboard.writeText(window.location.href);
        showSnackbar('URL copiada al portapapeles', 'success');
      } catch (error) {
        showSnackbar('No se pudo compartir la aplicación', 'error');
      }
    }
  };

  const handleRequestNotifications = async () => {
    const granted = await pwaService.requestNotificationPermission();
    if (granted) {
      showSnackbar('Notificaciones habilitadas', 'success');
      await pwaService.showNotification('CobroFacil POS', {
        body: 'Las notificaciones están habilitadas correctamente',
        icon: '/icons/icon-192x192.png'
      });
    } else {
      showSnackbar('Permisos de notificación denegados', 'warning');
    }
  };

  // Renderizado compacto para barra de estado
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          icon={isOnline ? <Wifi /> : <WifiOff />}
          label={isOnline ? 'Online' : 'Offline'}
          color={isOnline ? 'success' : 'warning'}
          size="small"
        />
        
        {isInstalled && (
          <Chip
            icon={<CheckCircle />}
            label="Instalado"
            color="success"
            size="small"
          />
        )}
        
        {updateAvailable && (
          <Chip
            icon={<Download />}
            label="Actualización"
            color="info"
            size="small"
            onClick={() => setShowUpdateDialog(true)}
          />
        )}
        
        {installPromptAvailable && !isInstalled && (
          <IconButton
            size="small"
            onClick={() => setShowInstallDialog(true)}
            color="primary"
          >
            <GetApp />
          </IconButton>
        )}
      </Box>
    );
  }

  // Renderizado completo
  return (
    <Box>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Estado de la Aplicación
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {isOnline ? <Wifi color="success" /> : <WifiOff color="warning" />}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {isOnline ? 'Conectado' : 'Sin conexión'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {isOnline 
                    ? 'Todas las funcionalidades están disponibles'
                    : 'Funcionando en modo offline limitado'
                  }
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  {isInstalled ? <CheckCircle color="success" /> : <Computer color="info" />}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {isInstalled ? 'Instalado' : 'Navegador Web'}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {isInstalled 
                    ? 'Ejecutándose como aplicación nativa'
                    : 'Ejecutándose en navegador web'
                  }
                </Typography>
              </CardContent>
              
              {!isInstalled && installPromptAvailable && (
                <CardActions>
                  <Button
                    startIcon={<GetApp />}
                    onClick={() => setShowInstallDialog(true)}
                    variant="contained"
                    size="small"
                  >
                    Instalar App
                  </Button>
                </CardActions>
              )}
            </Card>
          </Grid>
        </Grid>

        {showDetailed && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Opciones Avanzadas
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<Storage />}
                  onClick={() => setShowCacheDialog(true)}
                  variant="outlined"
                >
                  Gestionar Cache
                </Button>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<ShareRounded />}
                  onClick={handleShare}
                  variant="outlined"
                >
                  Compartir App
                </Button>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  startIcon={<Notifications />}
                  onClick={handleRequestNotifications}
                  variant="outlined"
                >
                  Notificaciones
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Dialog de instalación */}
      <Dialog open={showInstallDialog} onClose={() => setShowInstallDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <GetApp sx={{ mr: 1 }} />
            Instalar CobroFacil POS
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            ¿Deseas instalar CobroFacil POS como aplicación nativa?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ventajas de la instalación:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon><Launch /></ListItemIcon>
              <ListItemText primary="Acceso directo desde el escritorio" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Cached /></ListItemIcon>
              <ListItemText primary="Funcionamiento offline mejorado" />
            </ListItem>
            <ListItem>
              <ListItemIcon><Notifications /></ListItemIcon>
              <ListItemText primary="Notificaciones nativas" />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleInstall}
            disabled={installing}
            variant="contained"
            startIcon={installing ? <LinearProgress /> : <GetApp />}
          >
            {installing ? 'Instalando...' : 'Instalar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de actualización */}
      <Dialog open={showUpdateDialog} onClose={() => setShowUpdateDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Refresh sx={{ mr: 1 }} />
            Actualización Disponible
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Hay una nueva versión de CobroFacil POS disponible.
          </Alert>
          <Typography>
            Se recomienda actualizar para obtener las últimas mejoras y correcciones.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUpdateDialog(false)}>
            Más tarde
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={updating}
            variant="contained"
            startIcon={updating ? <LinearProgress /> : <Refresh />}
          >
            {updating ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de cache */}
      <Dialog open={showCacheDialog} onClose={() => setShowCacheDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Storage sx={{ mr: 1 }} />
            Gestión de Cache
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Estado actual del cache:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Archivos estáticos"
                secondary={`${cacheStatus.static} archivos`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Datos dinámicos"
                secondary={`${cacheStatus.dynamic} archivos`}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Total"
                secondary={`${cacheStatus.total} archivos en ${cacheStatus.caches} caches`}
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Limpiar el cache eliminará todos los datos offline guardados.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCacheDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleClearCache}
            disabled={clearing}
            color="warning"
            startIcon={clearing ? <LinearProgress /> : <Delete />}
          >
            {clearing ? 'Limpiando...' : 'Limpiar Cache'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de instrucciones iOS */}
      <Dialog open={showIOSDialog} onClose={() => setShowIOSDialog(false)}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PhoneIphone sx={{ mr: 1 }} />
            Instalar en iOS
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Para instalar CobroFacil POS en iOS:
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="1. Toca el botón 'Compartir' en Safari"
                secondary="Icono de cuadrado con flecha hacia arriba"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="2. Selecciona 'Agregar a la pantalla de inicio'"
                secondary="Desplázate hacia abajo para encontrar la opción"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="3. Toca 'Agregar' para confirmar"
                secondary="La aplicación aparecerá en tu pantalla de inicio"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIOSDialog(false)}>
            Entendido
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default PWAControls; 