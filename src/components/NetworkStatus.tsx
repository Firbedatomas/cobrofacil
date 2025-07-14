import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton
} from '@mui/material';
import {
  NetworkCheck,
  Wifi,
  WifiOff,
  Settings,
  Refresh,
  Computer,
  Router,
  ExpandMore,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import networkService, { type NetworkInfo, type ConnectivityTest } from '../services/networkService';

interface NetworkStatusProps {
  showDetailed?: boolean;
  onConnectionChange?: (connected: boolean) => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ 
  showDetailed = false, 
  onConnectionChange 
}) => {
  const [connectionStatus, setConnectionStatus] = useState(networkService.getConnectionStatus());
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityTest | null>(null);
  const [loading, setLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [serverIP, setServerIP] = useState('');
  const [serverPort, setServerPort] = useState('3000');
  const [scanning, setScanning] = useState(false);
  const [foundServers, setFoundServers] = useState<string[]>([]);

  // Actualizar estado cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      const status = networkService.getConnectionStatus();
      setConnectionStatus(status);
      
      if (onConnectionChange) {
        onConnectionChange(status.connected);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [onConnectionChange]);

  // Cargar información inicial
  useEffect(() => {
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    if (!connectionStatus.connected) return;
    
    setLoading(true);
    try {
      const info = await networkService.getNetworkInfo();
      setNetworkInfo(info);
      
      const conn = await networkService.testConnectivity();
      setConnectivity(conn);
    } catch (error) {
      console.error('Error cargando información de red:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await networkService.ping();
      await loadNetworkInfo();
    } catch (error) {
      console.error('Error refrescando conexión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureServer = async () => {
    if (!serverIP) return;
    
    setLoading(true);
    try {
      const success = await networkService.configureForServer(serverIP, parseInt(serverPort));
      if (success) {
        setConnectionStatus(networkService.getConnectionStatus());
        setConfigDialogOpen(false);
        await loadNetworkInfo();
      } else {
        alert('No se pudo conectar al servidor especificado');
      }
    } catch (error) {
      console.error('Error configurando servidor:', error);
      alert('Error configurando servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleScanNetwork = async () => {
    setScanning(true);
    try {
      const servers = await networkService.scanLocalNetwork();
      setFoundServers(servers);
    } catch (error) {
      console.error('Error escaneando red:', error);
    } finally {
      setScanning(false);
    }
  };

  const renderConnectionStatus = () => {
    const { connected, serverIP, baseURL, reconnectAttempts } = connectionStatus;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {connected ? (
          <>
            <Chip 
              icon={<CheckCircle />}
              label="Conectado"
              color="success"
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {serverIP ? `Servidor: ${serverIP}` : baseURL}
            </Typography>
          </>
        ) : (
          <>
            <Chip 
              icon={reconnectAttempts > 0 ? <Warning /> : <Error />}
              label={reconnectAttempts > 0 ? "Reconectando..." : "Desconectado"}
              color={reconnectAttempts > 0 ? "warning" : "error"}
              size="small"
            />
            {reconnectAttempts > 0 && (
              <Typography variant="body2" color="text.secondary">
                Intento {reconnectAttempts}/5
              </Typography>
            )}
          </>
        )}
      </Box>
    );
  };

  const renderNetworkInfo = () => {
    if (!networkInfo) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            <Computer sx={{ mr: 1, verticalAlign: 'middle' }} />
            Información del Servidor
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>IP Principal:</strong> {networkInfo.ipLocal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Hostname:</strong> {networkInfo.hostname}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Puerto:</strong> {networkInfo.puerto}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Sistema:</strong> {networkInfo.platform} {networkInfo.arch}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>URLs de Acceso:</strong>
              </Typography>
              <List dense>
                {networkInfo.urlsAcceso.map((url, index) => (
                  <ListItem key={index} dense>
                    <ListItemIcon>
                      <Router fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={url}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { fontFamily: 'monospace' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderConnectivityInfo = () => {
    if (!connectivity) return null;

    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            <NetworkCheck sx={{ mr: 1, verticalAlign: 'middle' }} />
            Estado de Conectividad
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Estado:</strong> {connectivity.status}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Conectividad:</strong> {connectivity.conectividad ? 'OK' : 'Error'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>IP Servidor:</strong> {connectivity.ipLocal}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Puerto:</strong> {connectivity.puerto}
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  if (!showDetailed) {
    // Versión compacta para barra de estado
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {renderConnectionStatus()}
        <Button
          size="small"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? <CircularProgress size={16} /> : 'Refrescar'}
        </Button>
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          {connectionStatus.connected ? (
            <Wifi sx={{ mr: 1, verticalAlign: 'middle' }} />
          ) : (
            <WifiOff sx={{ mr: 1, verticalAlign: 'middle' }} />
          )}
          Estado de Red
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refrescar
          </Button>
          <Button
            size="small"
            startIcon={<Settings />}
            onClick={() => setConfigDialogOpen(true)}
          >
            Configurar
          </Button>
        </Box>
      </Box>

      {renderConnectionStatus()}

      {!connectionStatus.connected && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          No se puede conectar al servidor. Verifique la configuración de red.
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {networkInfo && renderNetworkInfo()}
      {connectivity && renderConnectivityInfo()}

      {/* Dialog de configuración */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)}>
        <DialogTitle>Configurar Conexión de Red</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="IP del Servidor"
            type="text"
            fullWidth
            variant="outlined"
            value={serverIP}
            onChange={(e) => setServerIP(e.target.value)}
            placeholder="192.168.1.100"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Puerto del Servidor"
            type="number"
            fullWidth
            variant="outlined"
            value={serverPort}
            onChange={(e) => setServerPort(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleScanNetwork}
              disabled={scanning}
              startIcon={scanning ? <CircularProgress size={16} /> : <Router />}
            >
              {scanning ? 'Escaneando...' : 'Escanear Red'}
            </Button>
          </Box>

          {foundServers.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Servidores encontrados:
              </Typography>
              <List dense>
                {foundServers.map((server, index) => (
                  <ListItemButton 
                    key={index} 
                    onClick={() => setServerIP(server)}
                  >
                    <ListItemText primary={server} />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfigureServer}
            disabled={!serverIP || loading}
            variant="contained"
          >
            {loading ? <CircularProgress size={16} /> : 'Conectar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default NetworkStatus; 