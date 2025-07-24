import { AppBar, Toolbar, Typography, Button, Box, Badge, Avatar, Menu, MenuItem, Divider, IconButton, Chip } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  Analytics as AnalyticsIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  Restaurant as RestaurantIcon
} from '@mui/icons-material';
import type { RootState } from '../store';
import { formatearPrecio } from '../utils/formatters';
import { authService, type User } from '../services/api';

export const Navigation = () => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Datos del estado global
  const ventaActual = useSelector((state: RootState) => state.ventas.ventaActual);
  const historialVentas = useSelector((state: RootState) => state.ventas.historial);
  const clientes = useSelector((state: RootState) => state.clientes.clientes);
  const productos = useSelector((state: RootState) => state.productos.items);

  // Obtener usuario actual al cargar el componente
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Cerrar menú cuando cambie la ruta
  useEffect(() => {
    if (anchorEl) {
      setAnchorEl(null);
    }
  }, [location.pathname]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Cerrar menú al hacer click fuera
  const handleClickOutside = (event: MouseEvent) => {
    if (anchorEl && !anchorEl.contains(event.target as Node)) {
      setAnchorEl(null);
    }
  };

  // Agregar event listener para click fuera
  useEffect(() => {
    if (anchorEl) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setAnchorEl(null);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [anchorEl]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      handleMenuClose();
      // La página se recargará automáticamente debido a la lógica en ProtectedRoute
      window.location.reload();
    } catch (error) {
      console.error('Error en logout:', error);
      // Forzar logout local en caso de error
      authService.clearAuth();
      window.location.reload();
    }
  };

  // Obtener iniciales del usuario
  const getUserInitials = (user: User | null): string => {
    if (!user) return 'U';
    return `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase();
  };

  // Obtener color según el rol
  const getRoleColor = (rol: string) => {
    switch (rol) {
      case 'ADMIN': return '#f44336';
      case 'SUPERVISOR': return '#ff9800';
      case 'CAJERO': return '#4caf50';
      default: return '#2196f3';
    }
  };

  // Calcular estadísticas rápidas
  const ventasHoy = historialVentas.filter(venta => 
    new Date(venta.fecha).toDateString() === new Date().toDateString()
  );
  const totalVentasHoy = ventasHoy.reduce((sum, venta) => sum + venta.total, 0);
  const itemsEnCarrito = ventaActual?.items.length || 0;
  const productosStockBajo = productos.filter(p => (p as any).stock <= 5).length;

  const navigationItems = [
    {
      path: '/',
      label: 'Mesas',
      icon: <DashboardIcon />,
      badge: null,
      color: 'primary' as const
    },
    {
      path: '/productos',
      label: 'Productos',
      icon: <InventoryIcon />,
      badge: productosStockBajo > 0 ? productosStockBajo : null,
      color: 'warning' as const
    },
    {
      path: '/clientes',
      label: 'Clientes',
      icon: <PeopleIcon />,
      badge: clientes.length > 0 ? clientes.length : null,
      color: 'info' as const
    },
    {
      path: '/caja',
      label: 'Caja',
      icon: <AccountBalanceIcon />,
      badge: null,
      color: 'success' as const
    },
    {
      path: '/historial',
      label: 'Historial',
      icon: <HistoryIcon />,
      badge: ventasHoy.length > 0 ? ventasHoy.length : null,
      color: 'secondary' as const
    },
    {
      path: '/reportes-fiscales',
      label: 'Reportes',
      icon: <AnalyticsIcon />,
      badge: null,
      color: 'error' as const
    }
  ];

  const buttonStyle = (path: string) => ({
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 2,
    py: 1.2,
    borderRadius: 1,
    textTransform: 'none',
    backgroundColor: isActive(path) ? 'rgba(255,255,255,0.2)' : 'transparent',
    backdropFilter: isActive(path) ? 'blur(10px)' : 'none',
    border: isActive(path) ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
    transition: 'all 0.3s ease',
    minWidth: 'auto',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
  });

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar 
        disableGutters 
        sx={{ 
          width: '100%',
          px: 3,
          justifyContent: 'space-between',
          minHeight: '64px'
        }}
      >
        {/* Logo y título */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              px: 2,
              py: 0.8,
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: '0 3px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#f8f9fa',
                transform: 'translateY(-1px)',
                boxShadow: '0 5px 16px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {/* Icono de restaurante */}
            <Box sx={{
              width: 28,
              height: 28,
              borderRadius: 1.5,
              backgroundColor: '#4caf50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
            }}>
              <RestaurantIcon sx={{ 
                color: 'white', 
                fontSize: '1.1rem'
              }} />
            </Box>
            
            {/* Texto CobroFacil */}
            <Typography sx={{
              color: '#333',
              fontSize: '1.2rem',
              fontWeight: 700,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              letterSpacing: '-0.3px'
            }}>
              CobroFacil
            </Typography>
          </Button>
        </Box>

        {/* Navegación principal - centrada */}
        <Box sx={{ 
          display: 'flex', 
          gap: 0.5,
          flex: 1,
          justifyContent: 'center',
          maxWidth: '600px'
        }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              sx={buttonStyle(item.path)}
            >
              <Badge 
                badgeContent={item.badge} 
                color={item.color}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px',
                    fontWeight: 'bold'
                  }
                }}
              >
                {item.icon}
              </Badge>
              <Typography variant="body2" fontWeight="medium" sx={{ 
                fontSize: '0.85rem',
                display: { xs: 'none', md: 'block' }
              }}>
                {item.label}
              </Typography>
            </Button>
          ))}
        </Box>

        {/* Panel de información y usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Estadísticas rápidas */}
          {totalVentasHoy > 0 && (
            <Chip
              icon={<TrendingUpIcon />}
              label={formatearPrecio(totalVentasHoy)}
              variant="outlined"
              size="small"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.3)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                fontWeight: 'bold',
                fontSize: '0.75rem',
                '& .MuiChip-icon': {
                  color: 'white'
                }
              }}
            />
          )}

          {/* Notificaciones */}
          {productosStockBajo > 0 && (
            <IconButton 
              color="inherit" 
              size="small"
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Badge 
                badgeContent={productosStockBajo} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px'
                  }
                }}
              >
                <NotificationsIcon fontSize="small" />
              </Badge>
            </IconButton>
          )}

          {/* Menú de usuario */}
          <IconButton
            onClick={handleMenuOpen}
            sx={{ 
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
            aria-controls={Boolean(anchorEl) ? 'user-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={Boolean(anchorEl)}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: getRoleColor(currentUser?.rol || ''),
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              {getUserInitials(currentUser)}
            </Avatar>
          </IconButton>
          


          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onBlur={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 2,
                minWidth: 220,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid rgba(255,255,255,0.1)',
                zIndex: 9999
              }
            }}
            sx={{
              zIndex: 9999
            }}
            keepMounted
          >
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <Avatar 
                sx={{ 
                  width: 28, 
                  height: 28, 
                  mr: 2, 
                  fontSize: '0.8rem',
                  bgcolor: getRoleColor(currentUser?.rol || '')
                }}
              >
                {getUserInitials(currentUser)}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {currentUser?.nombre} {currentUser?.apellido}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentUser?.rol}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem 
              component={RouterLink} 
              to="/configuracion-general" 
              onClick={() => {
                handleMenuClose();
                // Asegurar que el menú se cierre inmediatamente
                setAnchorEl(null);
              }}
            >
              <SettingsIcon sx={{ mr: 2, fontSize: '1.2rem' }} />
              Configuración General
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <AnalyticsIcon sx={{ mr: 2, fontSize: '1.2rem' }} />
              Reportes Avanzados
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <LogoutIcon sx={{ mr: 2, fontSize: '1.2rem' }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}; 