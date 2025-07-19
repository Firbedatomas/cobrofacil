import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box
} from '@mui/material';

interface ModalEspecificacionesProps {
  open: boolean;
  onClose: () => void;
  onSave: (especificaciones: string) => void;
  especificacionesIniciales?: string;
  itemNombre?: string;
}

const ModalEspecificaciones: React.FC<ModalEspecificacionesProps> = ({
  open,
  onClose,
  onSave,
  especificacionesIniciales = '',
  itemNombre = 'Ítem'
}) => {
  const [especificaciones, setEspecificaciones] = useState(especificacionesIniciales);

  const handleGuardar = () => {
    onSave(especificaciones);
    onClose();
  };

  const handleCancelar = () => {
    setEspecificaciones(especificacionesIniciales);
    onClose();
  };

  const caracteresRestantes = 200 - especificaciones.length;

  return (
    <Dialog 
      open={open} 
      onClose={handleCancelar}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Especificaciones - {itemNombre}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Especificaciones"
            value={especificaciones}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 200) {
                setEspecificaciones(value);
              }
            }}
            placeholder="Escriba las especificaciones del producto..."
            helperText={`${caracteresRestantes} caracteres restantes`}
          />
          <Typography 
            variant="caption" 
            color={caracteresRestantes < 20 ? 'error' : 'textSecondary'}
            sx={{ mt: 1, display: 'block' }}
          >
            Máximo 200 caracteres
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelar} color="secondary">
          Cancelar
        </Button>
        <Button 
          onClick={handleGuardar} 
          variant="contained" 
          color="primary"
          disabled={especificaciones.trim() === ''}
        >
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalEspecificaciones; 