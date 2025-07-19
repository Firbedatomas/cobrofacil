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
  // ✅ CORREGIDO: Inicialización mejorada del estado del formulario
  const [formData, setFormData] = useState<CrearMesaForm>({
    numero: '',
    sectorId: sectorId || '', // ✅ Asegurar que nunca sea undefined
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

  // ✅ DEBUGGING: Logs detallados para identificar el problema
  useEffect(() => {
    console.log('🔍 FormularioMesa - Props recibidas:', { 
      mesa, 
      sectorId, 
      tipoSectorId: typeof sectorId,
      sectorIdVacio: !sectorId,
      formDataActual: formData
    });
  }, [mesa, sectorId, formData]);

  // ✅ CORREGIDO: useEffect mejorado para manejo de props
  useEffect(() => {
    console.log('📝 FormularioMesa - Inicializando formulario:', { mesa, sectorId });
    
    if (mesa) {
      // Editar mesa existente
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
      // ✅ CORREGIDO: Asegurar que sectorId esté presente para nueva mesa
      if (sectorId) {
        setFormData(prev => ({
          ...prev,
          sectorId: sectorId
        }));
        console.log('✅ FormularioMesa - Nueva mesa, sectorId asignado:', sectorId);
      } else {
        console.error('❌ FormularioMesa - sectorId no válido:', sectorId);
      }
    }
  }, [mesa, sectorId]);

  const formasDisponibles: { valor: FormaMesa; etiqueta: string; icono: string }[] = [
    { valor: FormaMesaEnum.REDONDA, etiqueta: 'Redonda', icono: '⭕' },
    { valor: FormaMesaEnum.CUADRADA, etiqueta: 'Cuadrada', icono: '⬜' }
  ];

  // ✅ CORREGIDO: Validación mejorada del formulario
  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.numero.trim()) {
      nuevosErrores.numero = 'El número de mesa es requerido';
    }

    if (formData.numero.length > 20) {
      nuevosErrores.numero = 'El número no puede tener más de 20 caracteres';
    }

    // ✅ CORREGIDO: Validación crítica del sectorId
    if (!formData.sectorId) {
      nuevosErrores.sectorId = 'El sector es requerido';
      console.error('❌ Error crítico: sectorId no está presente en formData:', formData);
    }

    if (formData.observaciones && formData.observaciones.length > 300) {
      nuevosErrores.observaciones = 'Las observaciones no pueden tener más de 300 caracteres';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // ✅ CORREGIDO: Submit mejorado con logging detallado
  const handleSubmit = () => {
    console.log('🚀 FormularioMesa - Intentando enviar:', formData);
    
    if (validarFormulario()) {
      // ✅ DEBUGGING: Log detallado antes de enviar
      console.log('✅ FormularioMesa - Datos válidos, enviando:', {
        ...formData,
        sectorIdPresente: !!formData.sectorId,
        numeroPresente: !!formData.numero.trim()
      });
      
      // ✅ CRITERIO 1: Validación adicional para evitar AxiosError
      if (!formData.sectorId || !formData.numero.trim()) {
        console.error('❌ FormularioMesa - Datos críticos faltantes:', {
          sectorId: formData.sectorId,
          numero: formData.numero.trim()
        });
        return;
      }
      
      onGuardar(formData);
    } else {
      console.error('❌ FormularioMesa - Errores de validación:', errores);
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

      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={3}>
          {/* ✅ DEBUGGING: Mostrar información del sector en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 1, 
                bgcolor: 'info.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'info.200'
              }}>
                <Typography variant="caption" color="info.main">
                  DEBUG: sectorId = {formData.sectorId || 'undefined'}
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información básica
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Número de mesa"
              fullWidth
              value={formData.numero}
              onChange={(e) => handleChange('numero', e.target.value)}
              error={!!errores.numero}
              helperText={errores.numero || 'Ejemplo: A01, B12, M5'}
              placeholder="Ej: A01"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth error={!!errores.forma}>
              <InputLabel>Forma de la mesa</InputLabel>
              <Select
                value={formData.forma}
                onChange={(e) => handleChange('forma', e.target.value as FormaMesa)}
                label="Forma de la mesa"
              >
                {formasDisponibles.map((forma) => (
                  <MenuItem key={forma.valor} value={forma.valor}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography>{forma.icono}</Typography>
                      <Typography>{forma.etiqueta}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observaciones"
              fullWidth
              multiline
              rows={3}
              value={formData.observaciones}
              onChange={(e) => handleChange('observaciones', e.target.value)}
              error={!!errores.observaciones}
              helperText={errores.observaciones || 'Información adicional sobre la mesa (opcional)'}
              placeholder="Ejemplo: Mesa junto a la ventana, para grupos grandes..."
            />
          </Grid>

          {/* ✅ DEBUGGING: Mostrar errores si existen */}
          {Object.keys(errores).length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'error.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'error.200'
              }}>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Errores encontrados:
                </Typography>
                {Object.entries(errores).map(([campo, error]) => (
                  <Typography key={campo} variant="body2" color="error">
                    • {error}
                  </Typography>
                ))}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onCancelar} variant="outlined">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!formData.sectorId} // ✅ CORREGIDO: Deshabilitar si no hay sectorId
        >
          {mesa ? 'Actualizar Mesa' : 'Crear Mesa'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioMesa; 