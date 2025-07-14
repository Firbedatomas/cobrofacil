import React from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { clearAllAuth, forceLogout, debugAuthState } from '../utils/auth';

const EmergencyLogout: React.FC = () => {
  const handleClearAuth = () => {
    if (confirm('¿Estás seguro de que deseas limpiar todas las sesiones? Esto cerrará la sesión actual.')) {
      clearAllAuth();
      alert('✅ Todas las sesiones han sido limpiadas. La página se recargará.');
      window.location.reload();
    }
  };

  const handleForceLogout = () => {
    if (confirm('¿Deseas forzar el logout completo? Esto limpiará todo y recargará la página.')) {
      forceLogout();
    }
  };

  const handleDebug = () => {
    debugAuthState();
    alert('Revisa la consola del navegador para ver el estado de autenticación');
  };

  return (
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 10, 
        right: 10, 
        zIndex: 9999,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 2,
        borderRadius: 2,
        border: '2px solid #f44336',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}
    >
      <Typography variant="h6" color="error" gutterBottom>
        🚨 Panel de Emergencia
      </Typography>
      
      <Alert severity="warning" sx={{ mb: 2, fontSize: '0.8rem' }}>
        Solo usar si hay problemas con la sesión
      </Alert>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button 
          variant="outlined" 
          color="info" 
          size="small"
          onClick={handleDebug}
        >
          🔍 Debug Estado
        </Button>
        
        <Button 
          variant="outlined" 
          color="warning" 
          size="small"
          onClick={handleClearAuth}
        >
          🧹 Limpiar Sesión
        </Button>
        
        <Button 
          variant="contained" 
          color="error" 
          size="small"
          onClick={handleForceLogout}
        >
          🚪 Logout Forzado
        </Button>
      </Box>
    </Box>
  );
};

export default EmergencyLogout; 