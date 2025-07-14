import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  alpha,
  Divider
} from '@mui/material';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Star, 
  Wrench, 
  TrendingUp,
  Circle
} from 'lucide-react';
import type { Mesa } from '../../../types/mesas';
import { EstadoMesa } from '../../../types/mesas';

interface OcupacionGeneralProps {
  mesas: Mesa[];
  sectorNombre: string;
  sectorColor?: string;
  sectorIcono?: string;
  className?: string;
}

const OcupacionGeneral: React.FC<OcupacionGeneralProps> = ({
  mesas,
  sectorNombre,
  sectorColor = '#4CAF50',
  sectorIcono = '🏠',
  className = ''
}) => {
  const theme = useTheme();

  const estadisticas = React.useMemo(() => {
    const total = mesas.length;
    const libre = mesas.filter(m => m.estado === EstadoMesa.LIBRE).length;
    const ocupadas = mesas.filter(m => m.estado === EstadoMesa.OCUPADA).length;
    const esperandoPedido = mesas.filter(m => m.estado === EstadoMesa.ESPERANDO_PEDIDO).length;
    const cuentaPedida = mesas.filter(m => m.estado === EstadoMesa.CUENTA_PEDIDA).length;
    const reservadas = mesas.filter(m => m.estado === EstadoMesa.RESERVADA).length;
    const fueraServicio = mesas.filter(m => m.estado === EstadoMesa.FUERA_DE_SERVICIO).length;
    
    const mesasEnUso = ocupadas + esperandoPedido + cuentaPedida + reservadas;
    const porcentajeOcupacion = total > 0 ? Math.round((mesasEnUso / total) * 100) : 0;

    return {
      total,
      libre,
      ocupadas,
      esperandoPedido,
      cuentaPedida,
      reservadas,
      fueraServicio,
      mesasEnUso,
      porcentajeOcupacion
    };
  }, [mesas]);

  const getOcupacionColor = (porcentaje: number) => {
    if (porcentaje === 0) return theme.palette.success.main;
    if (porcentaje < 50) return theme.palette.warning.main;
    if (porcentaje < 80) return theme.palette.error.light;
    return theme.palette.error.main;
  };

  const ocupacionColor = getOcupacionColor(estadisticas.porcentajeOcupacion);

  const indicadores = [
    {
      label: 'Libres',
      valor: estadisticas.libre,
      color: theme.palette.success.main,
      icon: CheckCircle,
      chipColor: 'success' as const
    },
    {
      label: 'Ocupadas',
      valor: estadisticas.ocupadas,
      color: theme.palette.error.main,
      icon: Users,
      chipColor: 'error' as const
    },
    {
      label: 'Esperando',
      valor: estadisticas.esperandoPedido,
      color: theme.palette.primary.main,
      icon: Clock,
      chipColor: 'primary' as const
    },
    {
      label: 'Cuenta',
      valor: estadisticas.cuentaPedida,
      color: theme.palette.warning.main,
      icon: AlertCircle,
      chipColor: 'warning' as const
    },
    {
      label: 'Reservadas',
      valor: estadisticas.reservadas,
      color: theme.palette.secondary.main,
      icon: Star,
      chipColor: 'secondary' as const
    },
    {
      label: 'Fuera',
      valor: estadisticas.fueraServicio,
      color: theme.palette.grey[500],
      icon: Wrench,
      chipColor: 'default' as const
    }
  ];

  return (
    <Box sx={{ 
      bgcolor: alpha(theme.palette.grey[50], 0.5),
      borderRadius: 1,
      p: 1.5,
      border: `1px solid ${alpha(theme.palette.grey[300], 0.3)}`
    }}>
      {/* Header ultracompacto en una sola línea */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 1
      }}>
        {/* Información del sector */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Circle size={8} color={sectorColor} fill={sectorColor} />
          <Typography variant="body2" fontWeight="medium" color="text.secondary">
            {sectorNombre}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {estadisticas.total} mesas
          </Typography>
        </Box>
        
        {/* Indicador de ocupación */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="body2" 
            fontWeight="bold"
            sx={{ color: ocupacionColor }}
          >
            {estadisticas.porcentajeOcupacion}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {estadisticas.mesasEnUso}/{estadisticas.total}
          </Typography>
        </Box>
      </Box>

      {/* Barra de progreso ultracompacta */}
      <Box sx={{ mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={estadisticas.porcentajeOcupacion}
          sx={{ 
            height: 4, 
            borderRadius: 0.5,
            backgroundColor: alpha(ocupacionColor, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 0.5,
              backgroundColor: ocupacionColor
            }
          }}
        />
      </Box>

      {/* Estadísticas en línea - solo las que tienen valores */}
      <Stack 
        direction="row" 
        spacing={0.5} 
        sx={{ 
          flexWrap: 'wrap',
          gap: 0.5,
          justifyContent: 'flex-start'
        }}
      >
        {indicadores
          .filter(indicador => indicador.valor > 0)
          .map((indicador) => {
            const Icon = indicador.icon;
            return (
              <Chip
                key={indicador.label}
                size="small"
                variant="outlined"
                color={indicador.chipColor}
                icon={<Icon size={12} />}
                label={`${indicador.valor} ${indicador.label.toLowerCase()}`}
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  '& .MuiChip-icon': {
                    width: 12,
                    height: 12
                  },
                  '& .MuiChip-label': {
                    px: 0.5
                  }
                }}
              />
            );
          })}
      </Stack>
    </Box>
  );
};

export default OcupacionGeneral; 