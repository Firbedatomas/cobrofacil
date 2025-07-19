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
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import { People, Receipt, CallSplit, CheckCircle } from '@mui/icons-material';

interface ItemVenta {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

interface PersonaDivision {
  id: string;
  nombre: string;
  items: string[];
  total: number;
}

interface ModalDivisionCuentaProps {
  open: boolean;
  onClose: () => void;
  onDividirCuenta: (divisiones: PersonaDivision[]) => void;
  items: ItemVenta[];
  totalVenta: number;
}

const ModalDivisionCuenta: React.FC<ModalDivisionCuentaProps> = ({
  open,
  onClose,
  onDividirCuenta,
  items,
  totalVenta
}) => {
  const [pasoActual, setPasoActual] = useState(0);
  const [tipoDivision, setTipoDivision] = useState<'personas' | 'items'>('personas');
  const [numeroPersonas, setNumeroPersonas] = useState(2);
  const [personas, setPersonas] = useState<PersonaDivision[]>([]);
  const [seleccionItems, setSeleccionItems] = useState<{ [itemId: string]: string[] }>({});

  const pasos = ['Tipo de División', 'Configuración', 'Distribución', 'Confirmación'];

  const inicializarPersonas = () => {
    const nuevasPersonas: PersonaDivision[] = [];
    for (let i = 1; i <= numeroPersonas; i++) {
      nuevasPersonas.push({
        id: `persona-${i}`,
        nombre: `Persona ${i}`,
        items: [],
        total: 0
      });
    }
    setPersonas(nuevasPersonas);
    
    // Inicializar selección de items
    const nuevaSeleccion: { [itemId: string]: string[] } = {};
    items.forEach(item => {
      nuevaSeleccion[item.id] = [];
    });
    setSeleccionItems(nuevaSeleccion);
  };

  const calcularTotalPersona = (personaId: string) => {
    let total = 0;
    items.forEach(item => {
      if (seleccionItems[item.id]?.includes(personaId)) {
        const personasEnItem = seleccionItems[item.id].length;
        total += item.subtotal / personasEnItem;
      }
    });
    return total;
  };

  const dividirAutomaticamente = () => {
    const totalPorPersona = totalVenta / numeroPersonas;
    const nuevasPersonas = personas.map(persona => ({
      ...persona,
      total: totalPorPersona
    }));
    setPersonas(nuevasPersonas);
  };

  const manejarSeleccionItem = (itemId: string, personaId: string) => {
    setSeleccionItems(prev => {
      const nuevaSeleccion = { ...prev };
      if (nuevaSeleccion[itemId].includes(personaId)) {
        nuevaSeleccion[itemId] = nuevaSeleccion[itemId].filter(id => id !== personaId);
      } else {
        nuevaSeleccion[itemId] = [...nuevaSeleccion[itemId], personaId];
      }
      return nuevaSeleccion;
    });
  };

  const actualizarTotales = () => {
    const nuevasPersonas = personas.map(persona => ({
      ...persona,
      total: calcularTotalPersona(persona.id)
    }));
    setPersonas(nuevasPersonas);
  };

  const handleSiguiente = () => {
    if (pasoActual === 1) {
      inicializarPersonas();
    } else if (pasoActual === 2) {
      actualizarTotales();
    }
    setPasoActual(prev => prev + 1);
  };

  const handleAnterior = () => {
    setPasoActual(prev => prev - 1);
  };

  const handleConfirmar = () => {
    actualizarTotales();
    onDividirCuenta(personas);
    onClose();
  };

  const handleCancelar = () => {
    setPasoActual(0);
    setTipoDivision('personas');
    setNumeroPersonas(2);
    setPersonas([]);
    setSeleccionItems({});
    onClose();
  };

  const renderPaso = () => {
    switch (pasoActual) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              ¿Cómo desea dividir la cuenta?
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    border: tipoDivision === 'personas' ? 2 : 1,
                    borderColor: tipoDivision === 'personas' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setTipoDivision('personas')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Por Personas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Dividir el total entre un número específico de personas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    border: tipoDivision === 'items' ? 2 : 1,
                    borderColor: tipoDivision === 'items' ? 'primary.main' : 'divider'
                  }}
                  onClick={() => setTipoDivision('items')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Receipt color="primary" sx={{ fontSize: 48, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Por Ítems
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Asignar ítems específicos a cada persona
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Configuración de la División
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número de personas"
                  value={numeroPersonas}
                  onChange={(e) => setNumeroPersonas(Math.max(2, parseInt(e.target.value) || 2))}
                  inputProps={{ min: 2, max: 10 }}
                  helperText="Entre 2 y 10 personas"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Total a dividir:
                    </Typography>
                    <Typography variant="h5" color="primary">
                      ${totalVenta}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Por persona: ${(totalVenta / numeroPersonas).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Distribución de Ítems
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                onClick={dividirAutomaticamente}
                sx={{ mr: 1 }}
              >
                División Automática
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Seleccione los ítems para cada persona:
              </Typography>
            </Box>
            
            <List>
              {items.map((item) => (
                <Card key={item.id} sx={{ mb: 1 }}>
                  <ListItem>
                    <ListItemText
                      primary={item.nombre}
                      secondary={`Cantidad: ${item.cantidad} | Precio: $${item.precio} | Subtotal: $${item.subtotal}`}
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {personas.map((persona) => (
                          <Chip
                            key={persona.id}
                            label={persona.nombre}
                            color={seleccionItems[item.id]?.includes(persona.id) ? 'primary' : 'default'}
                            variant={seleccionItems[item.id]?.includes(persona.id) ? 'filled' : 'outlined'}
                            onClick={() => manejarSeleccionItem(item.id, persona.id)}
                            size="small"
                          />
                        ))}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Card>
              ))}
            </List>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmación de División
            </Typography>
            <Grid container spacing={2}>
              {personas.map((persona) => (
                <Grid item xs={12} md={6} key={persona.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {persona.nombre}
                      </Typography>
                      <Typography variant="h4" color="primary" gutterBottom>
                        ${persona.total.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ítems asignados:
                      </Typography>
                      <List dense>
                        {items.filter(item => seleccionItems[item.id]?.includes(persona.id)).map((item) => (
                          <ListItem key={item.id}>
                            <ListItemText
                              primary={item.nombre}
                              secondary={`Compartido con ${seleccionItems[item.id].length} persona(s)`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Se generarán {personas.length} cuentas separadas para el cobro.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
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
          <CallSplit color="primary" />
          División de Cuenta
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
          <Button onClick={handleAnterior}>
            Anterior
          </Button>
        )}
        {pasoActual < pasos.length - 1 ? (
          <Button 
            onClick={handleSiguiente}
            variant="contained"
            disabled={pasoActual === 0 && !tipoDivision}
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            onClick={handleConfirmar}
            variant="contained"
            color="primary"
            disabled={personas.some(p => p.total === 0)}
          >
            Confirmar División
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalDivisionCuenta; 