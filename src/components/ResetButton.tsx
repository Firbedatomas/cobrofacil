import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Typography,
  Box,
  Alert,
  Chip
} from '@mui/material';
import { Trash2, AlertTriangle } from 'lucide-react';
import { resetService } from '../services/resetService';

interface ResetButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ResetButton: React.FC<ResetButtonProps> = ({ 
  variant = 'outlined', 
  size = 'small',
  className 
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [diagnostico, setDiagnostico] = useState<{
    ventasActivas: number;
    datosLocalStorage: string[];
    recomendaciones: string[];
  } | null>(null);

  const handleOpenDialog = () => {
    // Ejecutar diagnóstico antes de abrir el diálogo
    const resultado = resetService.diagnosticarDatosResiduales();
    setDiagnostico(resultado);
    setDialogOpen(true);
  };

  const handleLimpiarVentas = () => {
    resetService.limpiarVentasActivas();
    setDialogOpen(false);
    
    // Actualizar diagnóstico
    setTimeout(() => {
      const resultado = resetService.diagnosticarDatosResiduales();
      setDiagnostico(resultado);
    }, 100);
  };

  const handleResetCompleto = () => {
    if (window.confirm('¿Está seguro que desea hacer un reset completo?\n\nEsto eliminará TODOS los datos locales y requerirá reiniciar la aplicación.')) {
      resetService.resetCompleto();
      setDialogOpen(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        startIcon={<Trash2 />}
        onClick={handleOpenDialog}
        color="warning"
      >
        Reset
      </Button>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AlertTriangle size={24} />
            Diagnóstico y Reset de Datos
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {diagnostico && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Diagnóstico Actual
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${diagnostico.ventasActivas} Ventas Activas`} 
                  color={diagnostico.ventasActivas > 0 ? 'error' : 'success'}
                />
                <Chip 
                  label={`${diagnostico.datosLocalStorage.length} Datos en localStorage`} 
                  color={diagnostico.datosLocalStorage.length > 0 ? 'warning' : 'success'}
                />
              </Box>

              {diagnostico.recomendaciones.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recomendaciones:
                  </Typography>
                  {diagnostico.recomendaciones.map((recomendacion, index) => (
                    <Typography key={index} variant="body2">
                      • {recomendacion}
                    </Typography>
                  ))}
                </Alert>
              )}
            </Box>
          )}

          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>⚠️ ATENCIÓN:</strong> Use estas opciones solo si experimenta problemas con productos 
              que aparecen automáticamente en las mesas o datos residuales.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                🧹 Limpiar Ventas Activas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elimina solo las ventas activas en localStorage. Mantiene otros datos intactos.
              </Typography>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                🔄 Reset Completo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elimina TODOS los datos locales. Requiere reiniciar la aplicación (F5).
              </Typography>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>💡 Tip:</strong> También puedes usar las funciones en la consola del navegador:
              <br />
              • <code>limpiarVentas()</code> - Limpia solo ventas activas
              <br />
              • <code>diagnosticarApp()</code> - Ejecuta diagnóstico
              <br />
              • <code>resetApp()</code> - Reset completo
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          
          {diagnostico && diagnostico.ventasActivas > 0 && (
            <Button 
              onClick={handleLimpiarVentas}
              color="warning"
              variant="outlined"
            >
              Limpiar Ventas Activas
            </Button>
          )}
          
          <Button 
            onClick={handleResetCompleto}
            color="error"
            variant="contained"
          >
            Reset Completo
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ResetButton; 