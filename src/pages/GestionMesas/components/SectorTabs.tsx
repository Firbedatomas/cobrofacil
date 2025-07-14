import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Stack,
  useTheme,
  alpha,
  Badge
} from '@mui/material';
import { 
  MoreHoriz, 
  Edit, 
  Delete, 
  People, 
  Settings, 
  Palette, 
  Numbers,
  SwapVert,
  Visibility,
  VisibilityOff,
  Warning,
  OpenWith,
  Circle,
  Add
} from '@mui/icons-material';
import type { Sector } from '../../../types/mesas';

interface SectorTabsProps {
  sectores: Sector[];
  sectorActivo: string | null;
  onSectorChange: (sectorId: string) => void;
  onEditarSector: (sector: Sector) => void;
  onEliminarSector: (sectorId: string) => void;
  onEditarPlano?: (sectorId: string) => void;
  onCrearMesa?: (sectorId: string) => void;
  onCrearObjeto?: (sectorId: string) => void;
  modoEdicion?: boolean;
}

const SectorTabs: React.FC<SectorTabsProps> = ({
  sectores,
  sectorActivo,
  onSectorChange,
  onEditarSector,
  onEliminarSector,
  onEditarPlano,
  onCrearMesa,
  onCrearObjeto,
  modoEdicion = false
}) => {
  const theme = useTheme();
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, sectorId: string) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuAbierto(sectorId);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuAbierto(null);
  };

  const handleEditarSector = (sector: Sector) => {
    onEditarSector(sector);
    handleCloseMenu();
  };

  const handleEliminarSector = (sectorId: string) => {
    onEliminarSector(sectorId);
    handleCloseMenu();
  };

  const handleEditarPlano = (sectorId: string) => {
    onEditarPlano?.(sectorId);
    handleCloseMenu();
  };

  const handleCrearMesa = (sectorId: string) => {
    onCrearMesa?.(sectorId);
    handleCloseMenu();
  };

  const handleCrearObjeto = (sectorId: string) => {
    onCrearObjeto?.(sectorId);
    handleCloseMenu();
  };

  const getSectorStatus = (sector: Sector) => {
    const mesasCount = sector.mesas?.length || 0;
    const ocupadas = sector.mesas?.filter(m => m.estado === 'OCUPADA').length || 0;
    const esperando = sector.mesas?.filter(m => m.estado === 'ESPERANDO_PEDIDO').length || 0;
    const cuenta = sector.mesas?.filter(m => m.estado === 'CUENTA_PEDIDA').length || 0;
    const reservadas = sector.mesas?.filter(m => m.estado === 'RESERVADA').length || 0;
    const fuera = sector.mesas?.filter(m => m.estado === 'FUERA_DE_SERVICIO').length || 0;
    const libres = mesasCount - ocupadas - esperando - cuenta - reservadas - fuera;
    
    return {
      total: mesasCount,
      libres,
      ocupadas,
      esperando,
      cuenta,
      reservadas,
      fuera,
      porcentajeOcupacion: mesasCount > 0 ? Math.round((ocupadas / mesasCount) * 100) : 0
    };
  };

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje === 0) return theme.palette.success.main;
    if (porcentaje < 50) return theme.palette.warning.main;
    if (porcentaje < 80) return theme.palette.error.light;
    return theme.palette.error.main;
  };

  return (
    <Box sx={{ 
      p: 2,
      maxHeight: modoEdicion ? 'auto' : '120px',
      overflow: modoEdicion ? 'visible' : 'auto',
      transition: 'max-height 0.3s ease-in-out'
    }}>
      {/* Header minimalista */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 1.5,
        px: 1
      }}>
        <Typography variant="body2" color="text.secondary" fontWeight="medium">
          Sectores
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {sectores.length} disponibles
        </Typography>
      </Box>
      
      {/* Botones selectores compactos */}
      <Stack 
        direction="row" 
        spacing={1} 
        sx={{ 
          flexWrap: 'wrap',
          gap: 1,
          p: 1,
          bgcolor: alpha(theme.palette.grey[100], 0.5),
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.grey[300], 0.5)}`
        }}
      >
        {sectores.map((sector) => {
          const status = getSectorStatus(sector);
          const isActive = sectorActivo === sector.id;
          const ocupacionColor = getOcupacionColor(status.porcentajeOcupacion);
          
          return (
            <Box key={sector.id} sx={{ position: 'relative' }}>
              <Button
                variant={isActive ? 'contained' : 'outlined'}
                onClick={() => onSectorChange(sector.id)}
                sx={{
                  minWidth: 'auto',
                  px: 2,
                  py: 1,
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 'bold' : 'medium',
                  border: `1px solid ${isActive ? 'transparent' : alpha(theme.palette.grey[400], 0.5)}`,
                  bgcolor: isActive ? theme.palette.primary.main : 'white',
                  color: isActive ? 'white' : 'text.primary',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    bgcolor: isActive ? theme.palette.primary.dark : alpha(theme.palette.primary.main, 0.04),
                    borderColor: isActive ? 'transparent' : theme.palette.primary.main,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2]
                  },
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: ocupacionColor,
                    opacity: isActive ? 1 : 0.6
                  }
                }}
              >
                {/* Contenido del botón */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.75,
                  position: 'relative',
                  zIndex: 1
                }}>
                  {/* Indicador de color + Icono */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Circle 
                      sx={{ 
                        fontSize: '8px',
                        color: sector.color || '#4CAF50'
                      }} 
                    />
                    <Typography component="span" sx={{ fontSize: '1rem', lineHeight: 1 }}>
                      {sector.icono || '🏪'}
                    </Typography>
                  </Box>
                  
                  {/* Información del sector */}
                  <Box>
                    <Typography 
                      variant="body2" 
                      fontWeight="inherit"
                      sx={{ 
                        lineHeight: 1.1,
                        color: 'inherit'
                      }}
                    >
                      {sector.nombre}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: isActive ? alpha(theme.palette.common.white, 0.8) : 'text.secondary',
                        lineHeight: 1,
                        fontSize: '0.75rem'
                      }}
                    >
                      {status.total} mesas
                      {status.porcentajeOcupacion > 0 && (
                        <> · {status.porcentajeOcupacion}%</>
                      )}
                    </Typography>
                  </Box>

                  {/* Badge de estado si hay ocupación */}
                  {status.ocupadas > 0 && (
                    <Badge
                      badgeContent={status.ocupadas}
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '0.625rem',
                          height: '14px',
                          minWidth: '14px',
                          padding: '0 2px'
                        }
                      }}
                    >
                      <People sx={{ fontSize: '14px', opacity: 0.7 }} />
                    </Badge>
                  )}
                </Box>
              </Button>

              {/* Menú de opciones - FUERA del botón para evitar DOM nesting */}
              <IconButton
                size="small"
                onClick={(e) => handleOpenMenu(e, sector.id)}
                sx={{ 
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 20,
                  height: 20,
                  color: isActive ? alpha(theme.palette.common.white, 0.7) : 'text.secondary',
                  zIndex: 2,
                  '&:hover': {
                    bgcolor: alpha(isActive ? theme.palette.common.white : theme.palette.grey[500], 0.1)
                  }
                }}
              >
                <MoreHoriz sx={{ fontSize: '14px' }} />
              </IconButton>
            </Box>
          );
        })}
      </Stack>

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(menuAbierto)}
        onClose={handleCloseMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: { minWidth: 200, borderRadius: 2 }
        }}
      >
        {menuAbierto && (
          <>
            {/* Header del menú */}
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {sectores.find(s => s.id === menuAbierto)?.nombre}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Opciones del sector
              </Typography>
            </Box>
            
            <Divider />
            
            {/* Opciones principales */}
            {onCrearMesa && (
              <MenuItem onClick={() => handleCrearMesa(menuAbierto!)}>
                <ListItemIcon>
                  <Add fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Crear Mesa" 
                  secondary="Agregar nueva mesa"
                />
              </MenuItem>
            )}

            {onCrearObjeto && (
              <MenuItem onClick={() => handleCrearObjeto(menuAbierto!)}>
                <ListItemIcon>
                  <Add fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Crear Objeto" 
                  secondary="Agregar objeto decorativo"
                />
              </MenuItem>
            )}
            
            {/* Opciones de edición */}
            <MenuItem
              onClick={() => handleEditarSector(sectores.find(s => s.id === menuAbierto)!)}
            >
              <ListItemIcon>
                <Edit fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Editar sector" 
                secondary="Cambiar propiedades"
              />
            </MenuItem>

            {onEditarPlano && (
              <MenuItem onClick={() => handleEditarPlano(menuAbierto!)}>
                <ListItemIcon>
                  <OpenWith fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary="Editar Plano" 
                  secondary="Modificar diseño"
                />
              </MenuItem>
            )}
            
            <Divider />
            
            {/* Opciones peligrosas */}
            <MenuItem 
              onClick={() => handleEliminarSector(menuAbierto!)}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon>
                <Delete fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="Eliminar sector" 
                secondary="Acción irreversible"
              />
            </MenuItem>
          </>
        )}
      </Menu>
    </Box>
  );
};

export default SectorTabs; 