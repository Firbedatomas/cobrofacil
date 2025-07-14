import React from 'react';
import { Users, Clock, CheckCircle, AlertCircle, Star, Wrench } from 'lucide-react';
import type { Sector } from '../../../types/mesas';

interface EstadisticasSectorProps {
  sector: Sector;
  estadisticas: {
    total: number;
    libres: number;
    ocupadas: number;
    esperandoPedido: number;
    cuentaPedida: number;
    reservadas: number;
    fueraServicio: number;
    porcentajeOcupacion: number;
  };
  className?: string;
}

const EstadisticasSector: React.FC<EstadisticasSectorProps> = ({
  sector,
  estadisticas,
  className = ''
}) => {
  const estadisticasItems = [
    {
      label: 'Libres',
      valor: estadisticas.libres,
      color: 'text-green-600',
      bg: 'bg-green-50',
      icono: CheckCircle
    },
    {
      label: 'Ocupadas',
      valor: estadisticas.ocupadas,
      color: 'text-red-600',
      bg: 'bg-red-50',
      icono: Users
    },
    {
      label: 'Esperando Pedido',
      valor: estadisticas.esperandoPedido,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icono: Clock
    },
    {
      label: 'Cuenta Pedida',
      valor: estadisticas.cuentaPedida,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      icono: AlertCircle
    },
    {
      label: 'Reservadas',
      valor: estadisticas.reservadas,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icono: Star
    },
    {
      label: 'Fuera de Servicio',
      valor: estadisticas.fueraServicio,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      icono: Wrench
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: sector.color || '#4CAF50' }}
          />
          <h3 className="text-lg font-semibold text-gray-900">
            {sector.icono} {sector.nombre}
          </h3>
          {sector.descripcion && (
            <span className="text-sm text-gray-500">• {sector.descripcion}</span>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {estadisticas.porcentajeOcupacion}%
          </div>
          <div className="text-sm text-gray-500">Ocupación</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {estadisticasItems.map((item) => {
          const IconoComponente = item.icono;
          return (
            <div
              key={item.label}
              className={`${item.bg} rounded-lg p-4 text-center`}
            >
              <div className="flex justify-center mb-2">
                <IconoComponente className={`h-6 w-6 ${item.color}`} />
              </div>
              <div className={`text-2xl font-bold ${item.color} mb-1`}>
                {item.valor}
              </div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          );
        })}
      </div>

      {/* Barra de progreso visual */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Estado de las mesas</span>
          <span>{estadisticas.total} mesas en total</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className="h-full flex">
            {/* Libres */}
            {estadisticas.libres > 0 && (
              <div
                className="bg-green-500"
                style={{ width: `${(estadisticas.libres / estadisticas.total) * 100}%` }}
                title={`${estadisticas.libres} mesas libres`}
              />
            )}
            {/* Ocupadas */}
            {estadisticas.ocupadas > 0 && (
              <div
                className="bg-red-500"
                style={{ width: `${(estadisticas.ocupadas / estadisticas.total) * 100}%` }}
                title={`${estadisticas.ocupadas} mesas ocupadas`}
              />
            )}
            {/* Esperando pedido */}
            {estadisticas.esperandoPedido > 0 && (
              <div
                className="bg-blue-500"
                style={{ width: `${(estadisticas.esperandoPedido / estadisticas.total) * 100}%` }}
                title={`${estadisticas.esperandoPedido} mesas esperando pedido`}
              />
            )}
            {/* Cuenta pedida */}
            {estadisticas.cuentaPedida > 0 && (
              <div
                className="bg-orange-500"
                style={{ width: `${(estadisticas.cuentaPedida / estadisticas.total) * 100}%` }}
                title={`${estadisticas.cuentaPedida} mesas con cuenta pedida`}
              />
            )}
            {/* Reservadas */}
            {estadisticas.reservadas > 0 && (
              <div
                className="bg-purple-500"
                style={{ width: `${(estadisticas.reservadas / estadisticas.total) * 100}%` }}
                title={`${estadisticas.reservadas} mesas reservadas`}
              />
            )}
            {/* Fuera de servicio */}
            {estadisticas.fueraServicio > 0 && (
              <div
                className="bg-gray-500"
                style={{ width: `${(estadisticas.fueraServicio / estadisticas.total) * 100}%` }}
                title={`${estadisticas.fueraServicio} mesas fuera de servicio`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasSector; 