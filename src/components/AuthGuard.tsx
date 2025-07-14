import React, { useEffect, useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert, Button } from '@mui/material';
import { authService, initializeAuth } from '../services/api';
import { clearAllAuth } from '../utils/auth';
import Login from '../pages/Login';

interface AuthGuardProps {
  children: React.ReactNode;
}

type AuthState = 'checking' | 'authenticated' | 'unauthenticated' | 'error';

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>('checking');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isFirstTime, setIsFirstTime] = useState(true);

  // Función para verificar el estado de autenticación
  const checkAuthenticationStatus = useCallback(async (silent = false) => {
    try {
      setAuthState('checking');
      setError(null);

      // Verificar si el usuario tiene credenciales básicas
      const hasCredentials = authService.isAuthenticated();
      
      if (!hasCredentials) {
        setAuthState('unauthenticated');
        setIsFirstTime(true);
        return;
      }

      // Inicializar autenticación
      const result = await initializeAuth(silent);
      
      if (result.isValid) {
        if (!silent) console.log('✅ Autenticación exitosa');
        setAuthState('authenticated');
        setRetryCount(0);
        setIsFirstTime(false);
      } else {
        // Manejar diferentes razones de falla
        switch (result.reason) {
          case 'no_credentials':
            setAuthState('unauthenticated');
            setIsFirstTime(true);
            break;
          case 'invalid_token':
            setAuthState('unauthenticated');
            setError(isFirstTime ? null : 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setIsFirstTime(false);
            break;
          case 'initialization_error':
            setAuthState('error');
            setError('Error de conexión con el servidor. Verifica tu conexión a internet.');
            break;
          default:
            setAuthState('unauthenticated');
            setError(isFirstTime ? null : 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setIsFirstTime(false);
        }
      }
    } catch (error: any) {
      console.error('❌ Error verificando autenticación:', error);
      
      // Si hay credentials pero falló la verificación
      if (authService.isAuthenticated() && retryCount < 2) {
        setAuthState('error');
        setError(`Error de conexión (intento ${retryCount + 1}/3). ¿Deseas reintentar?`);
      } else {
        setAuthState('unauthenticated');
        setError(isFirstTime ? null : 'No se pudo verificar tu sesión. Por favor, inicia sesión nuevamente.');
        setIsFirstTime(false);
      }
    }
  }, [retryCount, isFirstTime]);

  // Verificar autenticación al cargar
  useEffect(() => {
    checkAuthenticationStatus();
  }, [checkAuthenticationStatus]);

  // Verificar sesión periódicamente si está autenticado
  useEffect(() => {
    if (authState === 'authenticated') {
      const interval = setInterval(() => {
        checkAuthenticationStatus(true); // Verificación silenciosa
      }, 5 * 60 * 1000); // Cada 5 minutos

      return () => clearInterval(interval);
    }
  }, [authState, checkAuthenticationStatus]);

  // Manejadores de eventos
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    checkAuthenticationStatus();
  };

  const handleClearAndRetry = () => {
    clearAllAuth();
    setRetryCount(0);
    setIsFirstTime(true);
    setTimeout(() => {
      checkAuthenticationStatus();
    }, 500);
  };

  const handleLoginSuccess = () => {
    setRetryCount(0);
    setIsFirstTime(false);
    checkAuthenticationStatus();
  };

  // Pantalla de carga
  if (authState === 'checking') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 2,
        bgcolor: 'background.default'
      }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Verificando autenticación...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.7 }}>
          {retryCount > 0 ? `Reintentando (${retryCount}/3)...` : 'Esto solo toma unos segundos'}
        </Typography>
      </Box>
    );
  }

  // Pantalla de error de conexión
  if (authState === 'error') {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        gap: 3,
        p: 3,
        bgcolor: 'background.default'
      }}>
        <Alert severity="warning" sx={{ maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ Error de Conexión
          </Typography>
          <Typography variant="body2">
            {error}
          </Typography>
        </Alert>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleRetry}
            disabled={retryCount >= 3}
          >
            🔄 Reintentar
          </Button>
          <Button 
            variant="outlined" 
            onClick={handleClearAndRetry}
          >
            🧹 Limpiar y Reintentar
          </Button>
        </Box>
        
        {retryCount >= 3 && (
          <Typography variant="body2" color="text.secondary">
            Si el problema persiste, contacta al administrador del sistema.
          </Typography>
        )}
      </Box>
    );
  }

  // Si no está autenticado, mostrar login
  if (authState === 'unauthenticated') {
    return (
      <Box>
        {error && (
          <Alert 
            severity="info" 
            sx={{ 
              position: 'fixed', 
              top: 16, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 9999,
              maxWidth: 500
            }}
          >
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}
        <Login onLoginSuccess={handleLoginSuccess} />
      </Box>
    );
  }

  // Si está autenticado, mostrar el contenido protegido
  return <>{children}</>;
};

export default AuthGuard; 