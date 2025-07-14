import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import { Close, TableRestaurant } from '@mui/icons-material';
import type { Mesa, CrearMesaForm, FormaMesa } from '../../../types/mesas';
import { FormaMesa as FormaMesaEnum } from '../../../types/mesas';

interface FormularioMesaProps {
  mesa?: Mesa | null;
  sectorId: string;
  onGuardar: (datos: CrearMesaForm) => void;
  onCancelar: () => void;
}

const FormularioMesa: React.FC<FormularioMesaProps> = ({
  mesa,
  sectorId,
  onGuardar,
  onCancelar
}) => {
  const [formData, setFormData] = useState<CrearMesaForm>({
    numero: '',
    sectorId,
    capacidad: 4, // Campo oculto pero necesario para la API
    forma: FormaMesaEnum.REDONDA,
    posicionX: Math.floor(Math.random() * 400) + 100, // Posición automática
    posicionY: Math.floor(Math.random() * 300) + 100, // Posición automática
    color: '#4CAF50', // Color por defecto, se controlará por estado
    observaciones: '',
    comanderas: {
      habilitado: true, // Siempre habilitadas
      cantidad: 1,
      impresoras: []
    }
  });

  const [errores, setErrores] = useState<Record<string, string>>({});

  // Cargar datos de la mesa si se está editando
  useEffect(() => {
    console.log('📝 FormularioMesa - Mesa prop:', mesa);
    if (mesa) {
      setFormData({
        numero: mesa.numero,
        sectorId: mesa.sectorId,
        capacidad: mesa.capacidad,
        forma: mesa.forma,
        posicionX: mesa.posicionX, // Mantener posición existente
        posicionY: mesa.posicionY, // Mantener posición existente
        color: '#4CAF50', // Color fijo, controlado por estado
        observaciones: mesa.observaciones || '',
        comanderas: {
          habilitado: true, // Siempre habilitadas
          cantidad: 1,
          impresoras: []
        }
      });
    } else {
      console.log('📝 FormularioMesa - Nueva mesa, sectorId:', sectorId);
    }
  }, [mesa, sectorId]);

  const formasDisponibles: { valor: FormaMesa; etiqueta: string; icono: string }[] = [
    { valor: FormaMesaEnum.REDONDA, etiqueta: 'Redonda', icono: '⭕' },
    { valor: FormaMesaEnum.CUADRADA, etiqueta: 'Cuadrada', icono: '⬜' }
  ];





  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.numero.trim()) {
      nuevosErrores.numero = 'El número de mesa es requerido';
    }

    if (formData.numero.length > 20) {
      nuevosErrores.numero = 'El número no puede tener más de 20 caracteres';
    }





    if (formData.observaciones && formData.observaciones.length > 300) {
      nuevosErrores.observaciones = 'Las observaciones no pueden tener más de 300 caracteres';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = () => {
    if (validarFormulario()) {
      onGuardar(formData);
    }
  };

  const handleChange = (field: keyof CrearMesaForm, value: string | number | FormaMesa) => {
    console.log('🔄 Cambiando campo:', field, 'Valor:', value);
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error si existe
    if (errores[field]) {
      setErrores(prev => ({ ...prev, [field]: '' }));
    }
  };



  return (
    <Dialog
      open={true}
      onClose={onCancelar}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TableRestaurant color="primary" />
          <Typography variant="h6">
            {mesa ? 'Editar Mesa' : 'Nueva Mesa'}
          </Typography>
        </Box>
        <IconButton onClick={onCancelar} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      
      <Divider />

      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TableRestaurant fontSize="small" />
              Información básica
            </Typography>
          </Grid>

          {/* Número de mesa */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Número de mesa"
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              error={!!errores.numero}
              helperText={errores.numero || 'Ej: 1, T1, VIP1...'}
              required
              autoFocus
            />
          </Grid>



          {/* Forma de la mesa */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Forma de la mesa</InputLabel>
              <Select
                value={formData.forma}
                label="Forma de la mesa"
                onChange={(e) => handleChange('forma', e.target.value as FormaMesa)}
              >
                {formasDisponibles.map((forma) => (
                  <MenuItem key={forma.valor} value={forma.valor}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{forma.icono}</span>
                      {forma.etiqueta}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>







          {/* Observaciones */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              error={!!errores.observaciones}
              helperText={errores.observaciones || 'Observaciones especiales sobre la mesa...'}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancelar} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          sx={{ minWidth: 120 }}
        >
          {mesa ? 'Actualizar' : 'Crear Mesa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioMesa; 