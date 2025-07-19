import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, CssBaseline, createTheme, Box, CircularProgress, Typography, Alert } from '@mui/material';
import { store } from './store';
import { Navigation } from './components/Navigation';
import AuthGuard from './components/AuthGuard';
import React, { Suspense, Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import ReportesFiscales from './pages/ReportesFiscales';
import { initAuthUtils } from './utils/auth';

// Lazy load components con preload
const Login = React.lazy(() => 
  import('./pages/Login').then(module => ({ default: module.default }))
);
const NuevaVenta = React.lazy(() => 
  import('./pages/NuevaVenta').then(module => ({ default: module.default }))
);
const Productos = React.lazy(() => 
  import('./pages/ProductosSimplificado').then(module => ({ default: module.default }))
);
const Clientes = React.lazy(() => 
  import('./pages/Clientes').then(module => ({ default: module.default }))
);
const Historial = React.lazy(() => 
  import('./pages/Historial').then(module => ({ default: module.default }))
);
const Caja = React.lazy(() => 
  import('./pages/Caja').then(module => ({ default: module.default }))
);
const ConfiguracionAfip = React.lazy(() => 
  import('./pages/ConfiguracionAfip').then(module => ({ default: module.default }))
);
const GestionMesas = React.lazy(() => 
  import('./pages/GestionMesas/GestionMesas').then(module => ({ default: module.default }))
);

// Tema mejorado y consistente
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#667eea',
      light: '#8c9eff',
      dark: '#3f51b5',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#a575d3',
      dark: '#512da8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#546e7a',
    },
    error: {
      main: '#f44336',
      light: '#ef5350',
      dark: '#c62828',
    },
    success: {
      main: '#4caf50',
      light: '#66bb6a',
      dark: '#2e7d32',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    info: {
      main: '#2196f3',
      light: '#42a5f5',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontWeight: 600, fontSize: '2rem' },
    h3: { fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontWeight: 600, fontSize: '1.5rem', color: '#2c3e50' },
    h5: { fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontWeight: 500, fontSize: '1.1rem', color: '#34495e' },
    body1: { fontSize: '1rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 500, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: '#f1f1f1',
          borderRadius: '10px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: '#c1c1c1',
          borderRadius: '10px',
          '&:hover': {
            backgroundColor: '#a8a8a8',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
          },
        },
        contained: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '0px !important',
          paddingRight: '0px !important',
          maxWidth: 'none !important',
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
  },
});

// Componente de Loading mejorado
const LoadingFallback = () => (
  <Box sx={{ 
    display: 'flex', 
    flexDirection: 'column',
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1,
    minHeight: '400px',
    gap: 2
  }}>
    <CircularProgress size={48} thickness={4} />
    <Typography variant="h6" color="text.secondary">
      Cargando...
    </Typography>
  </Box>
);

// Error Boundary personalizado
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          flex: 1,
          p: 3,
          gap: 2
        }}>
          <Alert 
            severity="error" 
            sx={{ 
              width: '100%', 
              maxWidth: 500,
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="h6" gutterBottom>
              ⚠️ Error en la Aplicación
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ha ocurrido un error inesperado. Por favor, actualiza la página.
            </Typography>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Componente wrapper para rutas protegidas
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard>
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh',
      width: '100vw',
      bgcolor: 'background.default',
      overflow: 'hidden'
    }}>
      <Navigation />
      <Box 
        component="main" 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          width: '100%',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {children}
      </Box>
    </Box>
  </AuthGuard>
);

function App() {
  useEffect(() => {
    // Inicializar utilidades de autenticación
    initAuthUtils();
    
    const handleGlobalError = (event: ErrorEvent) => {
      // Filtrar errores específicos de extensiones del navegador
      if (
        event.filename?.includes('solanaActionsContentScript.js') ||
        event.message?.includes('MutationObserver') ||
        event.message?.includes('Failed to execute \'observe\' on \'MutationObserver\'')
      ) {
        // Suprimir estos errores específicos de extensiones
        console.warn('Error de extensión del navegador suprimido:', event.message);
        event.preventDefault();
        return true;
      }
      
      // Dejar pasar otros errores
      return false;
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Filtrar rechazos de promesas relacionados con extensiones
      if (
        event.reason?.message?.includes('MutationObserver') ||
        event.reason?.stack?.includes('solanaActionsContentScript')
      ) {
        console.warn('Promise rejection de extensión del navegador suprimido:', event.reason);
        event.preventDefault();
        return true;
      }
      
      return false;
    };

    // Agregar listeners para errores globales
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Limpiar listeners al desmontar
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ErrorBoundary>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedLayout><GestionMesas /></ProtectedLayout>} />
                <Route path="/nueva-venta" element={<ProtectedLayout><NuevaVenta /></ProtectedLayout>} />
                <Route path="/productos" element={<ProtectedLayout><Productos /></ProtectedLayout>} />
                <Route path="/clientes" element={<ProtectedLayout><Clientes /></ProtectedLayout>} />
                <Route path="/historial" element={<ProtectedLayout><Historial /></ProtectedLayout>} />
                <Route path="/caja" element={<ProtectedLayout><Caja /></ProtectedLayout>} />
                <Route path="/reportes-fiscales" element={<ProtectedLayout><ReportesFiscales /></ProtectedLayout>} />
                <Route path="/configuracion-afip" element={<ProtectedLayout><ConfiguracionAfip /></ProtectedLayout>} />
                <Route path="/gestion-mesas" element={<ProtectedLayout><GestionMesas /></ProtectedLayout>} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ErrorBoundary>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
