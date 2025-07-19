import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Star, LocalOffer } from '@mui/icons-material';

interface Cliente {
  id: string;
  nombre: string;
  email: string;
  puntos: number;
}

interface ModalPuntosProps {
  open: boolean;
  onClose: () => void;
  onAplicarPuntos: (clienteId: string, puntosACanjear: number, descuento: number) => void;
  totalVenta: number;
}

const ModalPuntos: React.FC<ModalPuntosProps> = ({
  open,
  onClose,
  onAplicarPuntos,
  totalVenta
}) => {
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [puntosACanjear, setPuntosACanjear] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Simulación de búsqueda de cliente
  const buscarCliente = async (termino: string) => {
    if (!termino.trim()) {
      setClienteSeleccionado(null);
      return;
    }

    setCargando(true);
    setError('');

    try {
      // Simulación de cliente con puntos
      const clienteDemo: Cliente = {
        id: '1',
        nombre: 'Juan Pérez',
        email: 'juan.perez@email.com',
        puntos: 1250
      };

      // Simular delay de búsqueda
      await new Promise(resolve => setTimeout(resolve, 500));

      if (termino.toLowerCase().includes('juan') || termino.includes('juan.perez')) {
        setClienteSeleccionado(clienteDemo);
      } else {
        setClienteSeleccionado(null);
        setError('Cliente no encontrado');
      }
    } catch (err) {
      setError('Error al buscar cliente');
      setClienteSeleccionado(null);
    } finally {
      setCargando(false);
    }
  };

  const calcularDescuento = (puntos: number) => {
    // 1 punto = $1 de descuento
    return puntos;
  };

  const handleAplicar = () => {
    if (!clienteSeleccionado) return;

    const descuento = calcularDescuento(puntosACanjear);
    onAplicarPuntos(clienteSeleccionado.id, puntosACanjear, descuento);
    onClose();
  };

  const handleCancelar = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente('');
    setPuntosACanjear(0);
    setError('');
    onClose();
  };

  const descuentoCalculado = calcularDescuento(puntosACanjear);
  const maxPuntos = clienteSeleccionado ? Math.min(clienteSeleccionado.puntos, totalVenta) : 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancelar}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Star color="primary" />
          Sistema de Puntos de Fidelización
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Búsqueda de cliente */}
          <TextField
            fullWidth
            label="Buscar cliente"
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                buscarCliente(busquedaCliente);
              }
            }}
            placeholder="Nombre, email o teléfono del cliente"
            sx={{ mb: 2 }}
          />

          <Button
            variant="outlined"
            onClick={() => buscarCliente(busquedaCliente)}
            disabled={cargando || !busquedaCliente.trim()}
            fullWidth
            sx={{ mb: 2 }}
          >
            {cargando ? <CircularProgress size={20} /> : 'Buscar Cliente'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Información del cliente */}
          {clienteSeleccionado && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {clienteSeleccionado.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {clienteSeleccionado.email}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="primary" />
                  <Typography variant="h6" color="primary">
                    {clienteSeleccionado.puntos} puntos disponibles
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Selección de puntos */}
          {clienteSeleccionado && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Puntos a canjear:
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8}>
                  <TextField
                    fullWidth
                    type="number"
                    value={puntosACanjear}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setPuntosACanjear(Math.min(value, maxPuntos));
                    }}
                    inputProps={{ min: 0, max: maxPuntos }}
                    helperText={`Máximo ${maxPuntos} puntos`}
                  />
                </Grid>
                <Grid item xs={4}>
                  <Button
                    variant="outlined"
                    onClick={() => setPuntosACanjear(maxPuntos)}
                    disabled={maxPuntos === 0}
                    fullWidth
                  >
                    Usar todos
                  </Button>
                </Grid>
              </Grid>

              {/* Resumen del descuento */}
              {puntosACanjear > 0 && (
                <Card sx={{ mt: 2, bgcolor: 'primary.light' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <LocalOffer color="primary" />
                      <Typography variant="h6" color="primary">
                        Descuento a aplicar
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="primary">
                      ${descuentoCalculado}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Usando {puntosACanjear} puntos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total final: ${totalVenta - descuentoCalculado}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}

          {/* Información del sistema */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Sistema de puntos:</strong><br />
              • 1 punto = $1 de descuento<br />
              • Los puntos se acumulan con cada compra<br />
              • Máximo descuento: hasta el total de la venta
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelar} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleAplicar} 
          variant="contained" 
          color="primary"
          disabled={!clienteSeleccionado || puntosACanjear === 0}
        >
          Aplicar Descuento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalPuntos; 