import { useState, useEffect } from 'react';
import {
  Alert,
  Collapse,
  IconButton,
  Typography,
  Box,
  Chip,
  Button
} from '@mui/material';
import {
  Warning as WarningIcon,
  Close as CloseIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface EstadoAfip {
  configurado: boolean;
  advertencias: string[];
  estado: string;
}

const AdvertenciaAfip = () => {
  const navigate = useNavigate();
  const [estadoAfip, setEstadoAfip] = useState<EstadoAfip | null>(null);
  const [mostrar, setMostrar] = useState(true);
  const [minimizado, setMinimizado] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verificarEstadoAfip();
  }, []);

  const verificarEstadoAfip = async () => {
    try {
      const response = await api.get('/afip/estado');
      setEstadoAfip(response.data);
      
      // Auto-minimizar si AFIP está configurado
      if (response.data.configurado) {
        setMinimizado(true);
      }
    } catch (error) {
      console.error('Error verificando estado AFIP:', error);
      setEstadoAfip({
        configurado: false,
        advertencias: ['No se pudo conectar con el servicio AFIP'],
        estado: 'ERROR'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !estadoAfip || !mostrar) {
    return null;
  }

  const getSeverity = () => {
    if (estadoAfip.configurado) return 'success';
    if (estadoAfip.estado === 'ERROR') return 'error';
    return 'warning';
  };

  const getIcon = () => {
    if (estadoAfip.configurado) return <CheckCircleIcon />;
    return <SettingsIcon />;
  };

  const handleConfigurarAfip = () => {
    navigate('/configuracion-afip');
  };

  return (
    <Collapse in={mostrar}>
      <Alert
        severity={getSeverity()}
        icon={getIcon()}
        sx={{
          mb: 1,
          borderRadius: 2,
          minHeight: minimizado ? '48px' : 'auto',
          '& .MuiAlert-message': {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }
        }}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!estadoAfip.configurado && (
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={handleConfigurarAfip}
                sx={{ mr: 1 }}
              >
                Configurar
              </Button>
            )}
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setMinimizado(!minimizado)}
              sx={{ mr: 1 }}
            >
              {minimizado ? <WarningIcon fontSize="small" /> : <WarningIcon fontSize="small" />}
            </IconButton>
            <IconButton
              color="inherit"
              size="small"
              onClick={() => setMostrar(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          {minimizado ? (
            <Box 
              component="span" 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '0.875rem',
                fontWeight: 'medium'
              }}
            >
              🏛️ AFIP: {estadoAfip.configurado ? 'Configurado' : 'Sin configurar'} 
              {!estadoAfip.configurado && (
                <Chip 
                  label={`${estadoAfip.advertencias.length} pendientes`}
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1, fontSize: '0.7rem' }}
                />
              )}
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                🏛️ Estado AFIP
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {estadoAfip.advertencias.slice(0, 3).map((advertencia, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={advertencia}
                      size="small"
                      variant="outlined"
                      color={getSeverity()}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Box>
                ))}
                {estadoAfip.advertencias.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{estadoAfip.advertencias.length - 3} advertencias más...
                  </Typography>
                )}
              </Box>

              {!estadoAfip.configurado && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  💡 Sistema funcionando sin AFIP. Haga clic en "Configurar" para habilitar facturación electrónica.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Alert>
    </Collapse>
  );
};

export default AdvertenciaAfip; 