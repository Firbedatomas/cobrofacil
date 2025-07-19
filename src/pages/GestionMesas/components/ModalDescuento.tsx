import React, { useState } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Alert
} from '@mui/material';
import { LocalOffer, Percent, AttachMoney } from '@mui/icons-material';

interface ModalDescuentoProps {
  open: boolean;
  onClose: () => void;
  onAplicarDescuento: (tipo: 'porcentaje' | 'fijo', valor: number, descuento: number) => void;
  totalVenta: number;
}

const ModalDescuento: React.FC<ModalDescuentoProps> = ({
  open,
  onClose,
  onAplicarDescuento,
  totalVenta
}) => {
  const [tipoDescuento, setTipoDescuento] = useState<'porcentaje' | 'fijo'>('porcentaje');
  const [valor, setValor] = useState<number>(0);
  const [motivo, setMotivo] = useState('');

  const calcularDescuento = (tipo: 'porcentaje' | 'fijo', valor: number) => {
    if (tipo === 'porcentaje') {
      return (totalVenta * valor) / 100;
    } else {
      return valor;
    }
  };

  const handleAplicar = () => {
    if (valor <= 0) return;

    const descuento = calcularDescuento(tipoDescuento, valor);
    onAplicarDescuento(tipoDescuento, valor, descuento);
    onClose();
  };

  const handleCancelar = () => {
    setTipoDescuento('porcentaje');
    setValor(0);
    setMotivo('');
    onClose();
  };

  const descuentoCalculado = calcularDescuento(tipoDescuento, valor);
  const totalFinal = totalVenta - descuentoCalculado;

  const validarValor = (valor: number) => {
    if (tipoDescuento === 'porcentaje') {
      return valor > 0 && valor <= 100;
    } else {
      return valor > 0 && valor <= totalVenta;
    }
  };

  const descuentosRapidos = [
    { label: '5%', tipo: 'porcentaje' as const, valor: 5 },
    { label: '10%', tipo: 'porcentaje' as const, valor: 10 },
    { label: '15%', tipo: 'porcentaje' as const, valor: 15 },
    { label: '20%', tipo: 'porcentaje' as const, valor: 20 },
    { label: '$100', tipo: 'fijo' as const, valor: 100 },
    { label: '$500', tipo: 'fijo' as const, valor: 500 }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={handleCancelar}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalOffer color="primary" />
          Aplicar Descuento
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Tipo de descuento */}
          <Typography variant="subtitle1" gutterBottom>
            Tipo de descuento:
          </Typography>
          <ToggleButtonGroup
            value={tipoDescuento}
            exclusive
            onChange={(_, newValue) => {
              if (newValue) {
                setTipoDescuento(newValue);
                setValor(0);
              }
            }}
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="porcentaje">
              <Percent sx={{ mr: 1 }} />
              Porcentaje
            </ToggleButton>
            <ToggleButton value="fijo">
              <AttachMoney sx={{ mr: 1 }} />
              Monto Fijo
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Valor del descuento */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label={tipoDescuento === 'porcentaje' ? 'Porcentaje (%)' : 'Monto ($)'}
                value={valor}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value) || 0;
                  setValor(newValue);
                }}
                inputProps={{
                  min: 0,
                  max: tipoDescuento === 'porcentaje' ? 100 : totalVenta,
                  step: tipoDescuento === 'porcentaje' ? 1 : 10
                }}
                helperText={
                  tipoDescuento === 'porcentaje' 
                    ? 'Entre 0% y 100%' 
                    : `Entre $0 y $${totalVenta}`
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Motivo (opcional)"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ej: Descuento por cliente frecuente"
              />
            </Grid>
          </Grid>

          {/* Descuentos rápidos */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Descuentos rápidos:
          </Typography>
          <Grid container spacing={1}>
            {descuentosRapidos.map((desc, index) => (
              <Grid item xs={4} key={index}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => {
                    setTipoDescuento(desc.tipo);
                    setValor(desc.valor);
                  }}
                  disabled={desc.tipo === 'fijo' && desc.valor > totalVenta}
                >
                  {desc.label}
                </Button>
              </Grid>
            ))}
          </Grid>

          {/* Vista previa del descuento */}
          {valor > 0 && validarValor(valor) && (
            <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
              <CardContent>
                <Typography variant="h6" color="success.dark" gutterBottom>
                  Vista previa del descuento
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Subtotal:
                    </Typography>
                    <Typography variant="h6">
                      ${totalVenta}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Descuento:
                    </Typography>
                    <Typography variant="h6" color="error">
                      -${descuentoCalculado.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Total final:
                    </Typography>
                    <Typography variant="h4" color="success.dark">
                      ${totalFinal.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                {motivo && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Motivo: {motivo}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Validación de errores */}
          {valor > 0 && !validarValor(valor) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {tipoDescuento === 'porcentaje' 
                ? 'El porcentaje debe estar entre 0% y 100%'
                : `El monto debe estar entre $0 y $${totalVenta}`
              }
            </Alert>
          )}

          {/* Información adicional */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Tipos de descuento:</strong><br />
              • <strong>Porcentaje:</strong> Se aplica sobre el total de la venta<br />
              • <strong>Monto fijo:</strong> Se descuenta un valor exacto<br />
              • El descuento se registra en el sistema para auditoría
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
          disabled={!validarValor(valor) || valor <= 0}
        >
          Aplicar Descuento
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalDescuento; 