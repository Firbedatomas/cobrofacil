import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import { 
  AccountBalance, 
  CreditCard, 
  QrCode, 
  AttachMoney, 
  Delete,
  Add,
  Receipt
} from '@mui/icons-material';

interface PagoParcial {
  id: string;
  metodo: 'efectivo' | 'tarjeta' | 'qr' | 'transferencia';
  monto: number;
  referencia?: string;
  fecha: Date;
}

interface ModalPagoParcialProps {
  open: boolean;
  onClose: () => void;
  onRegistrarPago: (pagos: PagoParcial[]) => void;
  totalVenta: number;
  pagosExistentes?: PagoParcial[];
  titulo?: string;
}

const ModalPagoParcial: React.FC<ModalPagoParcialProps> = ({
  open,
  onClose,
  onRegistrarPago,
  totalVenta,
  pagosExistentes = [],
  titulo = "Pago Parcial"
}) => {
  const [pagos, setPagos] = useState<PagoParcial[]>(pagosExistentes);
  const [nuevoMetodo, setNuevoMetodo] = useState<'efectivo' | 'tarjeta' | 'qr' | 'transferencia'>('efectivo');
  const [nuevoMonto, setNuevoMonto] = useState<number>(0);
  const [nuevaReferencia, setNuevaReferencia] = useState('');

  const metodosConfig = {
    efectivo: { 
      icon: <AttachMoney />, 
      label: 'Efectivo', 
      color: 'success' as const,
      requiresReference: false
    },
    tarjeta: { 
      icon: <CreditCard />, 
      label: 'Tarjeta', 
      color: 'primary' as const,
      requiresReference: true
    },
    qr: { 
      icon: <QrCode />, 
      label: 'QR', 
      color: 'secondary' as const,
      requiresReference: true
    },
    transferencia: { 
      icon: <AccountBalance />, 
      label: 'Transferencia', 
      color: 'info' as const,
      requiresReference: true
    }
  };

  // Cálculos
  const totalPagado = pagos.reduce((sum, pago) => sum + pago.monto, 0);
  const saldoPendiente = Number(totalVenta) - totalPagado;
  const porcentajePagado = Number(totalVenta) > 0 ? (totalPagado / Number(totalVenta)) * 100 : 0;

  // Convertir a números para evitar errores de tipado
  const totalVentaNum = Number(totalVenta) || 0;
  const totalPagadoNum = Number(totalPagado) || 0;
  const saldoPendienteNum = Number(saldoPendiente) || 0;

  const agregarPago = () => {
    if (nuevoMonto <= 0) return;
    if (nuevoMonto > saldoPendienteNum) return;

    const nuevoPago: PagoParcial = {
      id: Date.now().toString(),
      metodo: nuevoMetodo,
      monto: nuevoMonto,
      referencia: nuevaReferencia || undefined,
      fecha: new Date()
    };

    setPagos([...pagos, nuevoPago]);
    setNuevoMonto(0);
    setNuevaReferencia('');
  };

  const eliminarPago = (pagoId: string) => {
    setPagos(pagos.filter(pago => pago.id !== pagoId));
  };

  const handleConfirmar = () => {
    onRegistrarPago(pagos);
    onClose();
  };

  const handleCancelar = () => {
    setPagos(pagosExistentes);
    setNuevoMonto(0);
    setNuevaReferencia('');
    onClose();
  };

  const pagoCompleto = totalPagado >= totalVenta;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancelar}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt color="primary" />
          {titulo}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Resumen de la venta */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Venta:
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${totalVentaNum.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Total Pagado:
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    ${totalPagadoNum.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Pendiente:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={saldoPendienteNum > 0 ? 'error.main' : 'success.main'}
                  >
                    ${saldoPendienteNum.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
              {pagoCompleto && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  ✅ Pago completado - La venta está totalmente pagada
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Agregar nuevo pago */}
          {!pagoCompleto && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Agregar Pago
                </Typography>
                
                {/* Selección de método */}
                <Typography variant="subtitle2" gutterBottom>
                  Método de pago:
                </Typography>
                <ToggleButtonGroup
                  value={nuevoMetodo}
                  exclusive
                  onChange={(_, value) => value && setNuevoMetodo(value)}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {Object.entries(metodosConfig).map(([key, config]) => (
                    <ToggleButton key={key} value={key}>
                      {config.icon}
                      <Typography sx={{ ml: 1 }}>{config.label}</Typography>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {/* Monto y referencia */}
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Monto a pagar"
                      value={nuevoMonto}
                      onChange={(e) => setNuevoMonto(parseFloat(e.target.value) || 0)}
                                          inputProps={{ 
                      min: 0, 
                      max: saldoPendienteNum,
                      step: 0.01 
                    }}
                    helperText={`Máximo: $${saldoPendienteNum.toFixed(2)}`}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label={`Referencia ${metodosConfig[nuevoMetodo].requiresReference ? '*' : '(opcional)'}`}
                      value={nuevaReferencia}
                      onChange={(e) => setNuevaReferencia(e.target.value)}
                      placeholder={
                        nuevoMetodo === 'tarjeta' ? 'Últimos 4 dígitos' :
                        nuevoMetodo === 'qr' ? 'ID de transacción' :
                        nuevoMetodo === 'transferencia' ? 'Número de operación' :
                        'Observaciones'
                      }
                      required={metodosConfig[nuevoMetodo].requiresReference}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={agregarPago}
                                          disabled={
                        nuevoMonto <= 0 ||
                        nuevoMonto > saldoPendienteNum ||
                      (metodosConfig[nuevoMetodo].requiresReference && !nuevaReferencia.trim())
                    }
                    startIcon={<Add />}
                  >
                    Agregar Pago
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Lista de pagos registrados */}
          {pagos.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Pagos Registrados
                </Typography>
                <List>
                  {pagos.map((pago, index) => (
                    <React.Fragment key={pago.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {metodosConfig[pago.metodo].icon}
                              <Typography variant="subtitle1">
                                {metodosConfig[pago.metodo].label}
                              </Typography>
                              <Chip
                                label={`$${pago.monto.toFixed(2)}`}
                                color={metodosConfig[pago.metodo].color}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {pago.fecha.toLocaleString()}
                              </Typography>
                              {pago.referencia && (
                                <Typography variant="body2" color="text.secondary">
                                  Ref: {pago.referencia}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => eliminarPago(pago.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < pagos.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Información del sistema */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Pagos parciales:</strong><br />
              • Los pagos se registran y acumulan hasta completar el total<br />
              • Cada pago queda registrado con método, monto y referencia<br />
              • La mesa permanece activa hasta completar el pago total
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelar} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleConfirmar} 
          variant="contained" 
          color="primary"
          disabled={pagos.length === 0}
        >
          {pagoCompleto ? 'Finalizar Venta' : 'Registrar Pagos'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalPagoParcial; 