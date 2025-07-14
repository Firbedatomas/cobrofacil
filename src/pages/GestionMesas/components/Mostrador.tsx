import React from 'react';
import { ShoppingCart, Plus, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface MostradorProps {
  onIniciarVenta: () => void;
  onVerVentasActivas: () => void;
  className?: string;
}

const Mostrador: React.FC<MostradorProps> = ({
  onIniciarVenta,
  onVerVentasActivas,
  className = ''
}) => {
  // Datos de ejemplo para estadísticas
  const estadisticas = {
    ventasHoy: 12,
    montoTotal: 145600,
    ventasActivas: 3,
    promedioVenta: 12133
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Header del mostrador */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShoppingCart className="h-8 w-8 mr-3 text-blue-600" />
            Mostrador
          </h2>
          <p className="text-gray-600">Ventas directas sin mesa asignada</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={onVerVentasActivas}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
          >
            <Clock className="h-5 w-5" />
            <span>Ventas Activas ({estadisticas.ventasActivas})</span>
          </button>
          
          <button
            onClick={onIniciarVenta}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Nueva Venta</span>
          </button>
        </div>
      </div>

      {/* Estadísticas del mostrador */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.ventasHoy}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Recaudado</p>
              <p className="text-2xl font-bold text-gray-900">
                ${estadisticas.montoTotal.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Activas</p>
              <p className="text-2xl font-bold text-gray-900">{estadisticas.ventasActivas}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-gray-900">
                ${estadisticas.promedioVenta.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={onIniciarVenta}
            className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-6 w-6 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Nueva Venta</p>
              <p className="text-sm text-gray-600">Iniciar venta al mostrador</p>
            </div>
          </button>

          <button
            onClick={onVerVentasActivas}
            className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <Clock className="h-6 w-6 text-yellow-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Ventas Activas</p>
              <p className="text-sm text-gray-600">Ver ventas en proceso</p>
            </div>
          </button>

          <button
            onClick={() => console.log('Ver historial')}
            className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <TrendingUp className="h-6 w-6 text-gray-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Historial</p>
              <p className="text-sm text-gray-600">Ver ventas del día</p>
            </div>
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-blue-800">
            <strong>Mostrador:</strong> Utiliza esta sección para ventas directas sin asignar mesa específica. 
            Ideal para take-away, delivery o ventas rápidas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Mostrador; 