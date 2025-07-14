import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  LockOpen,
  Lock,
  AccessTime,
  Warning,
  Refresh,
  CreditCard,
  PlayArrow,
  AttachMoney,
  Speed
} from '@mui/icons-material';
import turnosService from '../services/turnosService';

interface BloqueoTurnoProps {
  children: React.ReactNode;
  requiereTurno?: boolean;
}

interface EstadoTurno {
  permitida: boolean;
  mensaje?: string;
  turnoActivo?: any;
  requiereAbrirTurno: boolean;
}

const BloqueoTurno: React.FC<BloqueoTurnoProps> = ({ 
  children, 
  requiereTurno = true 
}) => {
  const [estadoTurno, setEstadoTurno] = useState<EstadoTurno | null>(null);
  const [verificando, setVerificando] = useState(true);
  const [tipoError, setTipoError] = useState<'conexion' | 'turno-cerrado' | null>(null);
  const [openAperturaRapida, setOpenAperturaRapida] = useState(false);
  const [abriendo, setAbriendo] = useState(false);
  const [fondoInicial, setFondoInicial] = useState(0);
  const [proximoNumeroTurno, setProximoNumeroTurno] = useState(1);

  const verificarTurno = async () => {
    if (!requiereTurno) {
      setEstadoTurno({ permitida: true, requiereAbrirTurno: false });
      setVerificando(false);
      return;
    }

    try {
      setVerificando(true);
      setTipoError(null);
      console.log('🔍 Verificando estado del turno...');
      
      const resultado = await turnosService.verificarGestionMesasPermitida();
      setEstadoTurno(resultado);
      
      if (resultado.permitida) {
        console.log('✅ Gestión de mesas permitida:', resultado.mensaje);
      } else {
        console.log('🚫 Gestión de mesas bloqueada:', resultado.mensaje);
        // Distinguir entre error de conexión y turno cerrado
        if (resultado.mensaje?.includes('Error') || resultado.mensaje?.includes('conexión')) {
          setTipoError('conexion');
        } else {
          setTipoError('turno-cerrado');
          // Obtener próximo número de turno para apertura rápida
          try {
            const numero = await turnosService.obtenerProximoNumeroTurno();
            setProximoNumeroTurno(numero);
          } catch (error) {
            setProximoNumeroTurno(1);
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Error verificando turno:', error);
      
      // Distinguir tipos de error más específicamente
      if (error.message?.includes('500') || error.code === 'ERR_BAD_RESPONSE') {
        setTipoError('conexion');
        setEstadoTurno({
          permitida: false,
          mensaje: 'No se puede conectar con el servidor. Verifique que el backend esté iniciado.',
          requiereAbrirTurno: false
        });
      } else {
        setTipoError('turno-cerrado');
        setEstadoTurno({
          permitida: false,
          mensaje: 'No hay turno abierto en el sistema',
          requiereAbrirTurno: true
        });
      }
    } finally {
      setVerificando(false);
    }
  };

  // Función para abrir turno rápidamente
  const abrirTurnoRapido = async () => {
    try {
      setAbriendo(true);
      
      const ahora = new Date();
      const datosApertura = {
        nombre: `Turno ${proximoNumeroTurno}`,
        horaInicio: ahora.toTimeString().slice(0, 5),
        horaFin: '23:59',
        fondoInicial: fondoInicial,
        observacionesApertura: 'Apertura rápida desde gestión de mesas'
      };

      await turnosService.abrirTurno(datosApertura);
      
      setOpenAperturaRapida(false);
      setFondoInicial(0);
      
      // Recargar el estado
      await verificarTurno();
      
    } catch (error: any) {
      console.error('Error abriendo turno:', error);
      alert('Error al abrir turno: ' + (error.response?.data?.message || error.message));
    } finally {
      setAbriendo(false);
    }
  };

  useEffect(() => {
    verificarTurno();
  }, [requiereTurno]);

  // Función para ir a la página de caja
  const irACaja = () => {
    window.location.href = '/caja';
  };

  // Función para refrescar estado
  const refrescarEstado = () => {
    verificarTurno();
  };

  // Si no requiere turno, mostrar contenido directamente
  if (!requiereTurno) {
    return <>{children}</>;
  }

  // Mostrar loading mientras verifica
  if (verificando) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Verificando estado del turno...
        </Typography>
      </Box>
    );
  }

  // Si hay error de conexión
  if (tipoError === 'conexion') {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Stack spacing={3} alignItems="center">
            <Box sx={{ 
              p: 3, 
              borderRadius: '50%', 
              bgcolor: 'error.light',
              color: 'error.contrastText'
            }}>
              <Warning sx={{ fontSize: 48 }} />
            </Box>

            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                🔌 Backend no Disponible
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {estadoTurno?.mensaje}
              </Typography>
            </Box>

            <Alert severity="warning" sx={{ width: '100%' }}>
              <Typography variant="body2">
                <strong>¿Qué hacer?</strong>
                <br />
                1. Abra una terminal en el directorio del proyecto
                <br />
                2. Ejecute: <code>./start-backend.sh</code> (Linux/Mac) o <code>start-backend.bat</code> (Windows)
                <br />
                3. Espere a que aparezca "🚀 Servidor corriendo en puerto 3001"
                <br />
                4. Haga clic en "Verificar Nuevamente"
              </Typography>
            </Alert>

            <Button 
              variant="contained" 
              size="large"
              startIcon={<Refresh />}
              onClick={refrescarEstado}
              sx={{ minWidth: 200 }}
            >
              Verificar Nuevamente
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // Si la gestión está permitida, mostrar el contenido
  if (estadoTurno?.permitida) {
    return (
      <>
        {/* Indicador de turno activo */}
        <Box sx={{ mb: 1 }}>
          <Alert 
            severity="success" 
            icon={<LockOpen />}
            variant="outlined"
            action={
              <Button color="inherit" size="small" onClick={refrescarEstado}>
                <Refresh />
              </Button>
            }
          >
            <Typography variant="body2">
              {estadoTurno.mensaje}
            </Typography>
          </Alert>
        </Box>
        {children}
      </>
    );
  }

  // Si no hay turno abierto (amigable)
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 5 }}>
      <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Stack spacing={3} alignItems="center">
          {/* Icono principal */}
          <Box sx={{ 
            p: 3, 
            borderRadius: '50%', 
            bgcolor: 'info.light',
            color: 'info.contrastText'
          }}>
            <AccessTime sx={{ fontSize: 48 }} />
          </Box>

          {/* Título y mensaje amigable */}
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              🕐 No hay Turno Abierto
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Necesitas abrir un turno para acceder a la gestión de mesas
            </Typography>
          </Box>

          {/* Mensaje explicativo amigable */}
          <Alert severity="info" sx={{ width: '100%' }}>
            <Typography variant="body2">
              <strong>¿Por qué necesito un turno?</strong> El sistema requiere un turno abierto para 
              garantizar el control de caja y la trazabilidad de todas las operaciones.
            </Typography>
          </Alert>

          {/* Acciones principales */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button 
              variant="contained" 
              size="large"
              startIcon={<Speed />}
              onClick={() => setOpenAperturaRapida(true)}
              sx={{ 
                minWidth: 200,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                }
              }}
            >
              Abrir Turno Rápido
            </Button>
            <Button 
              variant="outlined" 
              size="large"
              startIcon={<CreditCard />}
              onClick={irACaja}
            >
              Ir a Sistema de Caja
            </Button>
          </Stack>

          <Button 
            variant="text" 
            size="small"
            startIcon={<Refresh />}
            onClick={refrescarEstado}
          >
            Verificar si ya hay turno abierto
          </Button>

          {/* Indicador de funcionalidad */}
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2, width: '100%' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Una vez que abras un turno, podrás acceder a:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }}>
              <Chip label="🍽️ Gestión de Mesas" size="small" variant="outlined" />
              <Chip label="🧾 Facturación" size="small" variant="outlined" />
              <Chip label="💰 Control de Ventas" size="small" variant="outlined" />
              <Chip label="📊 Reportes de Turno" size="small" variant="outlined" />
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Dialog de apertura rápida */}
      <Dialog 
        open={openAperturaRapida} 
        onClose={() => !abriendo && setOpenAperturaRapida(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PlayArrow />
            Apertura Rápida de Turno
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Turno {proximoNumeroTurno}</strong> se abrirá automáticamente con la fecha y hora actual.
              </Typography>
            </Alert>
            
            <TextField
              fullWidth
              label="Fondo Inicial de Caja"
              type="number"
              value={fondoInicial}
              onChange={(e) => setFondoInicial(parseFloat(e.target.value) || 0)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><AttachMoney /></InputAdornment>
              }}
              helperText="Ingrese el dinero en efectivo con el que inicia la caja"
            />

            <Typography variant="body2" color="text.secondary">
              ⏰ <strong>Horario:</strong> {new Date().toTimeString().slice(0, 5)} - 23:59<br />
              📅 <strong>Fecha:</strong> {new Date().toLocaleDateString()}<br />
              🎯 <strong>Nombre:</strong> Turno {proximoNumeroTurno}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenAperturaRapida(false)} 
            disabled={abriendo}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={abrirTurnoRapido}
            disabled={abriendo}
            startIcon={abriendo ? <CircularProgress size={20} /> : <PlayArrow />}
          >
            {abriendo ? 'Abriendo...' : `Abrir Turno ${proximoNumeroTurno}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BloqueoTurno; 