import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  IconButton,
  Divider,
  Paper,
  Slider,
  alpha,
  useTheme
} from '@mui/material';
import { Close, Palette, AspectRatio, Tag, Save, Cancel, Delete } from '@mui/icons-material';

import type { ObjetoDecorativo, CrearObjetoDecorativoForm } from '../../../types/mesas';
import { ICONOS_TIPO_OBJETO, TipoObjeto } from '../../../types/mesas';

interface FormularioObjetoDecorativoProps {
  objeto?: ObjetoDecorativo | null;
  sectorId: string;
  onGuardar: (objeto: CrearObjetoDecorativoForm) => void;
  onCancelar: () => void;
  onEliminar?: (objetoId: string) => void;
}

const FormularioObjetoDecorativo: React.FC<FormularioObjetoDecorativoProps> = ({
  objeto,
  sectorId,
  onGuardar,
  onCancelar,
  onEliminar
}) => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState<CrearObjetoDecorativoForm>({
    nombre: '',
    sectorId,
    tipo: 'DECORATIVO' as TipoObjeto,
    posicionX: Math.floor(Math.random() * 400) + 100,
    posicionY: Math.floor(Math.random() * 300) + 100,
    ancho: 80,
    alto: 80,
    color: '#9E9E9E',
    icono: '🎨',
    descripcion: ''
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mostrarColorPicker, setMostrarColorPicker] = useState(false);

  // Cargar datos del objeto si se está editando
  useEffect(() => {
    if (objeto) {
      setFormData({
        nombre: objeto.nombre,
        sectorId: objeto.sectorId,
        tipo: objeto.tipo,
        posicionX: objeto.posicionX,
        posicionY: objeto.posicionY,
        ancho: objeto.ancho,
        alto: objeto.alto,
        color: objeto.color || '#9E9E9E',
        icono: objeto.icono || ICONOS_TIPO_OBJETO[objeto.tipo],
        descripcion: objeto.descripcion || ''
      });
    }
  }, [objeto]);

  const tiposDisponibles = Object.values(TipoObjeto).map(tipo => ({
    valor: tipo,
    etiqueta: tipo.charAt(0) + tipo.slice(1).toLowerCase().replace('_', ' '),
    icono: ICONOS_TIPO_OBJETO[tipo] || '📦'
  }));

  const coloresPredefnidos = [
    { nombre: 'Gris', valor: '#9E9E9E' },
    { nombre: 'Marrón', valor: '#8B4513' },
    { nombre: 'Azul', valor: '#87CEEB' },
    { nombre: 'Rojo', valor: '#FF6347' },
    { nombre: 'Púrpura', valor: '#DDA0DD' },
    { nombre: 'Verde', valor: '#32CD32' },
    { nombre: 'Naranja', valor: '#FF4500' },
    { nombre: 'Amarillo', valor: '#FFD700' },
    { nombre: 'Rosa', valor: '#FFB6C1' },
    { nombre: 'Cyan', valor: '#00FFFF' }
  ];

  const handleChange = (campo: keyof CrearObjetoDecorativoForm, valor: any) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Limpiar error si existe
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const handleTipoChange = (nuevoTipo: TipoObjeto) => {
    setFormData(prev => ({
      ...prev,
      tipo: nuevoTipo,
      icono: ICONOS_TIPO_OBJETO[nuevoTipo] || '📦'
    }));
  };

  const validarFormulario = () => {
    const nuevosErrores: Record<string, string> = {};

    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if ((formData.ancho || 80) < 30 || (formData.ancho || 80) > 600) {
      nuevosErrores.ancho = 'El ancho debe estar entre 30 y 600 píxeles';
    }

    if ((formData.alto || 80) < 30 || (formData.alto || 80) > 200) {
      nuevosErrores.alto = 'El alto debe estar entre 30 y 200 píxeles';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleSubmit = () => {
    if (validarFormulario()) {
      onGuardar(formData);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onCancelar}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2, minHeight: '60vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Palette color="primary" />
          <Typography variant="h6">
            {objeto ? 'Editar Objeto Decorativo' : 'Nuevo Objeto Decorativo'}
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
              <Tag fontSize="small" />
              Información básica
            </Typography>
          </Grid>

          {/* Nombre */}
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre del objeto"
              value={formData.nombre}
              onChange={(e) => handleChange('nombre', e.target.value)}
              error={!!errores.nombre}
              helperText={errores.nombre || 'Ej: Barra principal, Decoración 1, etc.'}
              required
              autoFocus
            />
          </Grid>

          {/* Tipo */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de objeto</InputLabel>
              <Select
                value={formData.tipo}
                label="Tipo de objeto"
                onChange={(e) => handleTipoChange(e.target.value as TipoObjeto)}
              >
                {tiposDisponibles.map((tipo) => (
                  <MenuItem key={tipo.valor} value={tipo.valor}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{tipo.icono}</span>
                      {tipo.etiqueta}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Color */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette fontSize="small" />
              Color
            </Typography>
            
            {/* Colores predefinidos */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {coloresPredefnidos.map((color) => (
                <Box
                  key={color.valor}
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: color.valor,
                    border: formData.color === color.valor ? `3px solid ${theme.palette.primary.main}` : '2px solid #ccc',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      transition: 'transform 0.2s'
                    }
                  }}
                  onClick={() => handleChange('color', color.valor)}
                  title={color.nombre}
                />
              ))}
            </Box>

            {/* Selector de color personalizado */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Color personalizado"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                size="small"
                sx={{ width: 120 }}
              />
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  backgroundColor: formData.color,
                  border: '2px solid #ccc',
                  borderRadius: 1,
                  cursor: 'pointer'
                }}
                onClick={() => setMostrarColorPicker(!mostrarColorPicker)}
              />
            </Box>
          </Grid>

          {/* Tamaño */}
          <Grid item xs={12}>
                      <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AspectRatio fontSize="small" />
            Tamaño
          </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Ancho: {formData.ancho}px
                </Typography>
                <Slider
                  value={formData.ancho}
                  onChange={(_, value) => handleChange('ancho', value)}
                  min={30}
                  max={600}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                  color="primary"
                />
                {errores.ancho && (
                  <Typography variant="caption" color="error">
                    {errores.ancho}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" gutterBottom>
                  Alto: {formData.alto}px
                </Typography>
                <Slider
                  value={formData.alto}
                  onChange={(_, value) => handleChange('alto', value)}
                  min={30}
                  max={200}
                  step={5}
                  marks
                  valueLabelDisplay="auto"
                  color="primary"
                />
                {errores.alto && (
                  <Typography variant="caption" color="error">
                    {errores.alto}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Grid>

          {/* Vista previa */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Vista previa
            </Typography>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: alpha(theme.palette.grey[100], 0.3),
                minHeight: 120
              }}
            >
              <Box
                sx={{
                  width: `${formData.ancho}px`,
                  height: `${formData.alto}px`,
                  backgroundColor: formData.color,
                  border: '2px solid #ccc',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  color: theme.palette.getContrastText(formData.color || '#9E9E9E'),
                  fontWeight: 'bold'
                }}
              >
                {formData.icono} {formData.nombre || 'Objeto'}
              </Box>
            </Paper>
          </Grid>

          {/* Descripción */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (opcional)"
              multiline
              rows={3}
              value={formData.descripcion}
              onChange={(e) => handleChange('descripcion', e.target.value)}
              helperText="Descripción adicional del objeto..."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Box>
          {/* Botón de eliminar solo cuando se está editando */}
          {objeto && onEliminar && (
            <Button 
              onClick={() => {
                if (window.confirm(`¿Estás seguro de que quieres eliminar "${objeto.nombre}"?`)) {
                  onEliminar(objeto.id);
                }
              }}
              color="error"
                             startIcon={<Delete />}
              sx={{ mr: 1 }}
            >
              Eliminar
            </Button>
          )}
        </Box>
        
        <Box>
          <Button onClick={onCancelar} color="inherit" startIcon={<Cancel />} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            startIcon={<Save />}
            sx={{ minWidth: 140 }}
          >
            {objeto ? 'Actualizar' : 'Crear Objeto'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default FormularioObjetoDecorativo; 