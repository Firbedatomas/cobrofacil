import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Typography,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { Close, Palette, EmojiEmotions } from '@mui/icons-material';
import type { Sector, CrearSectorForm } from '../../../types/mesas';

interface FormularioSectorProps {
  sector?: Sector | null;
  onGuardar: (datos: CrearSectorForm) => void;
  onCancelar: () => void;
}

const FormularioSector: React.FC<FormularioSectorProps> = ({
  sector,
  onGuardar,
  onCancelar
}) => {
  const [formData, setFormData] = useState<CrearSectorForm>({
    nombre: '',
    descripcion: '',
    color: '#4CAF50',
    icono: '', // Sin icono por defecto
    orden: 0
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sector) {
      setFormData({
        nombre: sector.nombre,
        descripcion: sector.descripcion || '',
        color: sector.color || '#4CAF50',
        icono: '', // Sin icono
        orden: sector.orden
      });
    }
  }, [sector]);

  const coloresPreestablecidos = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0',
    '#F44336', '#795548', '#607D8B', '#E91E63',
    '#3F51B5', '#009688', '#FF5722', '#FFC107'
  ];



  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre del sector es requerido';
    } else if (formData.nombre.length > 50) {
      nuevosErrores.nombre = 'El nombre no puede tener más de 50 caracteres';
    }

    if (formData.descripcion && formData.descripcion.length > 200) {
      nuevosErrores.descripcion = 'La descripción no puede tener más de 200 caracteres';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;
    
    setLoading(true);
    try {
      await onGuardar(formData);
    } catch (error) {
      console.error('Error al guardar sector:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CrearSectorForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <DialogTitle sx={{ p: 3, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            {sector ? 'Editar Sector' : 'Nuevo Sector'}
          </Typography>
          <IconButton onClick={onCancelar} edge="end">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Nombre */}
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nombre del sector"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                error={!!errores.nombre}
                helperText={errores.nombre}
                placeholder="Ej: Terraza, Interior, VIP..."
                required
              />
            </Grid>

            {/* Vista previa */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  backgroundColor: formData.color,
                  color: 'white',
                  borderRadius: 2
                }}
              >
                <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                  {formData.nombre || 'Nuevo Sector'}
                </Typography>
              </Paper>
            </Grid>

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción (opcional)"
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                error={!!errores.descripcion}
                helperText={errores.descripcion}
                multiline
                rows={2}
                placeholder="Descripción opcional del sector..."
              />
            </Grid>

            {/* Color */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                <Palette sx={{ mr: 1, verticalAlign: 'middle' }} />
                Color del sector
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {coloresPreestablecidos.map((color) => (
                  <Chip
                    key={color}
                    sx={{
                      backgroundColor: color,
                      color: 'white',
                      border: formData.color === color ? '3px solid #000' : '1px solid #ccc',
                      '&:hover': { transform: 'scale(1.1)' }
                    }}
                    label=" "
                    onClick={() => handleChange('color', color)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>



            {/* Orden */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Orden de visualización"
                type="number"
                value={formData.orden}
                onChange={(e) => handleChange('orden', parseInt(e.target.value) || 0)}
                inputProps={{ min: 0 }}
                helperText="Los sectores se ordenan de menor a mayor número"
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={onCancelar} 
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {sector ? 'Guardar cambios' : 'Crear sector'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormularioSector; 