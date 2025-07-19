import React, { useState, useEffect } from 'react';
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
  Checkbox,
  Alert,
  Chip,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  SwapHoriz, 
  TableRestaurant, 
  SelectAll, 
  CheckCircle,
  Warning
} from '@mui/icons-material';

interface ItemVenta {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  especificaciones?: string;
}

interface Mesa {
  id: string;
  numero: string;
  estado: 'libre' | 'ocupada' | 'facturada';
  capacidad: number;
  sector: string;
}

interface ModalTransferirProps {
  open: boolean;
  onClose: () => void;
  onTransferir: (mesaDestino: string, items: string[], tipoTransferencia: 'completa' | 'items') => void;
  mesaOrigen: Mesa;
  items: ItemVenta[];
  mesasDisponibles: Mesa[];
}

const ModalTransferir: React.FC<ModalTransferirProps> = ({
  open,
  onClose,
  onTransferir,
  mesaOrigen,
  items,
  mesasDisponibles
}) => {
  const [pasoActual, setPasoActual] = useState(0);
  const [tipoTransferencia, setTipoTransferencia] = useState<'completa' | 'items'>('completa');
  const [mesaDestino, setMesaDestino] = useState<string>('');
  const [itemsSeleccionados, setItemsSeleccionados] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);

  const pasos = ['Tipo de Transferencia', 'Selección de Mesa', 'Confirmación'];

  // Resetear estado al abrir/cerrar
  useEffect(() => {
    if (open) {
      setPasoActual(0);
      setTipoTransferencia('completa');
      setMesaDestino('');
      setItemsSeleccionados([]);
    }
  }, [open]);

  const handleSeleccionarItem = (itemId: string) => {
    setItemsSeleccionados(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSeleccionarTodos = () => {
    if (itemsSeleccionados.length === items.length) {
      setItemsSeleccionados([]);
    } else {
      setItemsSeleccionados(items.map(item => item.id));
    }
  };

  const handleSiguiente = () => {
    setPasoActual(prev => prev + 1);
  };

  const handleAnterior = () => {
    setPasoActual(prev => prev - 1);
  };

  const handleConfirmar = async () => {
    setCargando(true);
    try {
      const itemsATransferir = tipoTransferencia === 'completa' 
        ? items.map(item => item.id)
        : itemsSeleccionados;
      
      await onTransferir(mesaDestino, itemsATransferir, tipoTransferencia);
      onClose();
    } catch (error) {
      console.error('Error al transferir:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleCancelar = () => {
    setPasoActual(0);
    setTipoTransferencia('completa');
    setMesaDestino('');
    setItemsSeleccionados([]);
    onClose();
  };

  const mesaDestinoInfo = mesasDisponibles.find(mesa => mesa.id === mesaDestino);
  const itemsATransferir = tipoTransferencia === 'completa' ? items : items.filter(item => itemsSeleccionados.includes(item.id));
  const totalATransferir = itemsATransferir.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  // Agrupar mesas por sector
  const mesasPorSector = mesasDisponibles.reduce((grupos, mesa) => {
    const sector = mesa.sector || 'Sin Sector';
    if (!grupos[sector]) {
      grupos[sector] = [];
    }
    grupos[sector].push(mesa);
    return grupos;
  }, {} as Record<string, Mesa[]>);

  const renderPaso = () => {
    switch (pasoActual) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              ¿Qué desea transferir?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    border: tipoTransferencia === 'completa' ? 2 : 1,
                    borderColor: tipoTransferencia === 'completa' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setTipoTransferencia('completa')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TableRestaurant color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Mesa Completa
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transferir todos los ítems de la mesa {mesaOrigen.numero}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                      ${items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    border: tipoTransferencia === 'items' ? 2 : 1,
                    borderColor: tipoTransferencia === 'items' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setTipoTransferencia('items')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <SelectAll color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Ítems Específicos
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seleccionar ítems individuales para transferir
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {items.length} ítems disponibles
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Selección de ítems específicos */}
            {tipoTransferencia === 'items' && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">
                      Seleccionar Ítems
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={handleSeleccionarTodos}
                      startIcon={<SelectAll />}
                    >
                      {itemsSeleccionados.length === items.length ? 'Deseleccionar' : 'Seleccionar'} Todos
                    </Button>
                  </Box>
                  <List>
                    {items.map((item) => (
                      <ListItem key={item.id} divider>
                        <Checkbox
                          checked={itemsSeleccionados.includes(item.id)}
                          onChange={() => handleSeleccionarItem(item.id)}
                        />
                        <Box sx={{ flexGrow: 1, ml: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.nombre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Cantidad: {item.cantidad} | Precio: ${item.precio} | Subtotal: ${(Number(item.subtotal) || 0).toFixed(2)}
                          </Typography>
                          {item.especificaciones && (
                            <Typography variant="body2" color="primary" sx={{ fontStyle: 'italic' }}>
                              📝 {item.especificaciones}
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                  {itemsSeleccionados.length > 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        {itemsSeleccionados.length} ítems seleccionados - Total: ${itemsATransferir.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0).toFixed(2)}
                      </Typography>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Seleccionar Mesa Destino
            </Typography>
            
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {Object.entries(mesasPorSector).length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    No hay mesas disponibles para transferir
                  </Typography>
                </Alert>
              ) : (
                Object.entries(mesasPorSector)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([sector, mesas]) => (
                <Card key={sector} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" color="primary" gutterBottom>
                      📍 {sector}
                    </Typography>
                    <Grid container spacing={1}>
                      {mesas.map((mesa) => (
                        <Grid item xs={12} sm={6} md={4} key={mesa.id}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              cursor: 'pointer',
                              border: mesaDestino === mesa.id ? '2px solid' : '1px solid',
                              borderColor: mesaDestino === mesa.id ? 'primary.main' : 'divider',
                              bgcolor: mesaDestino === mesa.id ? 'primary.light' : 'background.paper',
                              '&:hover': {
                                bgcolor: mesaDestino === mesa.id ? 'primary.light' : 'action.hover'
                              }
                            }}
                            onClick={() => setMesaDestino(mesa.id)}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <TableRestaurant 
                                  color={mesaDestino === mesa.id ? 'primary' : 'action'} 
                                  fontSize="small" 
                                />
                                <Typography variant="subtitle2" fontWeight="bold">
                                  Mesa {mesa.numero}
                                </Typography>
                                {mesaDestino === mesa.id && (
                                  <CheckCircle color="primary" fontSize="small" />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {mesa.capacidad} personas
                                </Typography>
                                <Chip 
                                  label={mesa.estado} 
                                  color={mesa.estado === 'libre' ? 'success' : 'warning'} 
                                  size="small" 
                                />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    </CardContent>
                  </Card>
                  ))
                )}
              </Box>

            {mesaDestinoInfo && (
              <Card sx={{ mt: 2, bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✅ Mesa Seleccionada
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Número:
                      </Typography>
                      <Typography variant="h6">
                        Mesa {mesaDestinoInfo.numero}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Estado:
                      </Typography>
                      <Chip 
                        label={mesaDestinoInfo.estado} 
                        color={mesaDestinoInfo.estado === 'libre' ? 'success' : 'warning'} 
                        size="small" 
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Capacidad:
                      </Typography>
                      <Typography variant="h6">
                        {mesaDestinoInfo.capacidad} personas
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Sector:
                      </Typography>
                      <Typography variant="h6">
                        {mesaDestinoInfo.sector}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {mesaDestinoInfo?.estado === 'ocupada' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <Warning sx={{ mr: 1 }} />
                  La mesa destino ya tiene ítems. Los ítems transferidos se agregarán a la cuenta existente.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmación de Transferencia
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error">
                      Mesa Origen
                    </Typography>
                    <Typography variant="h5" gutterBottom>
                      Mesa {mesaOrigen.numero}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tipoTransferencia === 'completa' ? 'Transferir todos los ítems' : `Transferir ${itemsSeleccionados.length} ítems`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      Mesa Destino
                    </Typography>
                    <Typography variant="h5" gutterBottom>
                      Mesa {mesaDestinoInfo?.numero}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {mesaDestinoInfo?.sector}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Resumen de ítems a transferir */}
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ítems a Transferir
                </Typography>
                <List>
                  {itemsATransferir.map((item) => (
                    <ListItem key={item.id} divider>
                      <ListItemText
                        primary={item.nombre}
                        secondary={`Cantidad: ${item.cantidad} | Subtotal: $${(Number(item.subtotal) || 0).toFixed(2)}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                  Total a transferir: ${totalATransferir.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Confirmación de transferencia:</strong><br />
                • Los ítems se moverán de la Mesa {mesaOrigen.numero} a la Mesa {mesaDestinoInfo?.numero}<br />
                • La operación no se puede deshacer<br />
                • Se registrará la transferencia en el historial
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  const puedeAvanzar = () => {
    switch (pasoActual) {
      case 0:
        return tipoTransferencia === 'completa' || itemsSeleccionados.length > 0;
      case 1:
        return mesaDestino !== '';
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancelar}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SwapHoriz color="primary" />
          Transferir Mesa - {mesaOrigen.numero}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={pasoActual} sx={{ mb: 3 }}>
            {pasos.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {renderPaso()}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelar} color="secondary">
          Cancelar
        </Button>
        {pasoActual > 0 && (
          <Button onClick={handleAnterior} disabled={cargando}>
            Anterior
          </Button>
        )}
        {pasoActual < pasos.length - 1 ? (
          <Button 
            onClick={handleSiguiente}
            variant="contained"
            disabled={!puedeAvanzar()}
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            onClick={handleConfirmar}
            variant="contained"
            color="primary"
            disabled={!puedeAvanzar() || cargando}
            startIcon={cargando ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {cargando ? 'Transfiriendo...' : 'Confirmar Transferencia'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalTransferir; 