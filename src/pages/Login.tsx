import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Alert,
  CircularProgress,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  useTheme,
  Stack,
  Chip
} from '@mui/material';
import { 
  Login as LoginIcon, 
  Person, 
  AdminPanelSettings, 
  SupervisorAccount, 
  ShoppingCart,
  Visibility,
  VisibilityOff,
  Security,
  FlashOn,
  BugReport
} from '@mui/icons-material';
import { authService } from '../services/api';

interface LoginProps {
  onLoginSuccess?: () => void;
}

// Credenciales de prueba para desarrollo
const QUICK_ACCESS_USERS = [
  {
    rol: 'ADMIN',
    nombre: 'Administrador',
    email: 'admin@cobrofacil.io',
    password: 'admin123',
    icon: AdminPanelSettings,
    color: '#f44336',
    descripcion: 'Acceso completo al sistema'
  },
  {
    rol: 'SUPERVISOR',
    nombre: 'Supervisor',
    email: 'supervisor@cobrofacil.io',
    password: 'supervisor123',
    icon: SupervisorAccount,
    color: '#ff9800',
    descripcion: 'Gestión de personal y reportes'
  },
  {
    rol: 'CAJERO',
    nombre: 'Cajero',
    email: 'cajero1@cobrofacil.io',
    password: 'cajero123',
    icon: ShoppingCart,
    color: '#4caf50',
    descripcion: 'Operaciones de venta'
  }
];

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Estados principales
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'manual' | 'quick'>('manual');
  const [quickLoading, setQuickLoading] = useState<string | null>(null);

  const handleLogin = async (emailParam?: string, passwordParam?: string) => {
    const loginEmail = emailParam || email;
    const loginPassword = passwordParam || password;
    
    if (!loginEmail || !loginPassword) {
      setError('Por favor, ingresa email y contraseña');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔐 Intentando login con:', { email: loginEmail });

      const response = await authService.login(loginEmail, loginPassword);

      console.log('✅ Login exitoso:', response);

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      // Redirigir basado en el rol del usuario
      const user = authService.getCurrentUser();
      if (user?.rol === 'ADMIN') {
        navigate('/caja');
      } else if (user?.rol === 'SUPERVISOR') {
        navigate('/gestion-mesas');
      } else {
        navigate('/nueva-venta');
      }

    } catch (err: any) {
      console.error('❌ Error en login:', err);
      
      let errorMessage = 'Error de conexión';
      
      if (err.response?.status === 401) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (err.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Verifica que el backend esté funcionando.';
      } else if (err.response?.status === 400) {
        errorMessage = 'Datos inválidos. Verifica email y contraseña.';
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté iniciado.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Error de red. Verifica tu conexión a internet.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: typeof QUICK_ACCESS_USERS[0]) => {
    setQuickLoading(user.rol);
    setError('');
    
    try {
      await handleLogin(user.email, user.password);
    } catch (err) {
      console.error('❌ Error en quick login:', err);
    } finally {
      setQuickLoading(null);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleLogin(email, password);
  };

  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper 
          elevation={24} 
          sx={{ 
            p: 4, 
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: 2,
                fontSize: '2rem'
              }}
            >
              🏪
            </Avatar>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              CobroFácil POS
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Sistema de gestión integral
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Botones de acceso rápido solo en desarrollo */}
          {isDevelopment && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BugReport sx={{ color: '#ff9800' }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Acceso rápido para testing
                </Typography>
                <Chip 
                  label="DEV" 
                  size="small" 
                  color="warning" 
                  sx={{ fontSize: '0.7rem' }}
                />
              </Box>
              
              <Grid container spacing={2}>
                {QUICK_ACCESS_USERS.map((user) => {
                  const IconComponent = user.icon;
                  const isLoading = quickLoading === user.rol;
                  
                  return (
                    <Grid item xs={12} md={4} key={user.rol}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          textAlign: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[4],
                            borderColor: user.color
                          }
                        }}
                        onClick={() => !isLoading && handleQuickLogin(user)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <IconComponent 
                            sx={{ 
                              fontSize: 28, 
                              color: user.color, 
                              mb: 1 
                            }} 
                          />
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {user.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {user.descripcion}
                          </Typography>
                        </CardContent>
                        <CardActions sx={{ justifyContent: 'center', pt: 0 }}>
                          <Button 
                            size="small" 
                            variant="contained"
                            disabled={isLoading}
                            sx={{ 
                              bgcolor: user.color,
                              '&:hover': { bgcolor: user.color, opacity: 0.9 },
                              minWidth: 80
                            }}
                            startIcon={isLoading ? <CircularProgress size={14} /> : <FlashOn />}
                          >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  O usa el formulario manual
                </Typography>
              </Divider>
            </Box>
          )}

          {/* Formulario de login */}
          <Box component="form" onSubmit={handleManualLogin}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                InputProps={{
                  startAdornment: <Person sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
              
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                label="Contraseña"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                InputProps={{
                  startAdornment: <Security sx={{ color: 'text.secondary', mr: 1 }} />,
                  endAdornment: (
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ minWidth: 'auto', p: 1 }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </Button>
                  )
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || !email || !password}
                sx={{ 
                  py: 1.5,
                  fontSize: '1.1rem',
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
                  }
                }}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </Stack>
          </Box>

          {!isDevelopment && (
            <>
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Información del sistema
                </Typography>
              </Divider>

              {/* Información sobre roles */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', mb: 2 }}>
                  🛡️ Roles del Sistema
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <AdminPanelSettings sx={{ fontSize: 32, color: '#f44336', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Administrador
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Acceso completo al sistema
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <SupervisorAccount sx={{ fontSize: 32, color: '#ff9800', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Supervisor
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Gestión de personal y reportes
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined" sx={{ textAlign: 'center', p: 1 }}>
                      <CardContent sx={{ pb: 1 }}>
                        <ShoppingCart sx={{ fontSize: 32, color: '#4caf50', mb: 1 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          Cajero
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Operaciones de venta
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    💡 <strong>Nota:</strong> Contacta al administrador del sistema para obtener tus credenciales de acceso.
                  </Typography>
                </Alert>
              </Box>
            </>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              CobroFácil POS • Sistema de gestión integral para comercios
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login; 