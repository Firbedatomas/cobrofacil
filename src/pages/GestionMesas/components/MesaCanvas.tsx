import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Users, Plus, MoreVertical, ShoppingCart, Calculator, Star, Wrench, Settings } from 'lucide-react';
import type { Mesa, ObjetoDecorativo, Sector } from '../../../types/mesas';
import { EstadoMesa } from '../../../types/mesas';

interface MesaCanvasProps {
  sector: Sector;
  mesas: Mesa[];
  objetosDecorativos: ObjetoDecorativo[];
  onMesaClick: (mesa: Mesa) => void;
  onMesaDoubleClick: (mesa: Mesa) => void;
  onMesaContextMenu: (mesa: Mesa, e: React.MouseEvent) => void;
  onMesaMove: (mesaId: string, posicionX: number, posicionY: number) => void;
  onNuevaMesa: (posicionX: number, posicionY: number) => void;
  onObjetoMove: (objetoId: string, posicionX: number, posicionY: number) => void;
  modoEdicion?: boolean;
  className?: string;
}

const MesaCanvas: React.FC<MesaCanvasProps> = ({
  sector,
  mesas,
  objetosDecorativos,
  onMesaClick,
  onMesaDoubleClick,
  onMesaContextMenu,
  onMesaMove,
  onNuevaMesa,
  onObjetoMove,
  modoEdicion = false,
  className = ''
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<{
    id: string;
    type: 'mesa' | 'objeto';
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mesa: Mesa;
  } | null>(null);

  // Manejar doble clic para crear nueva mesa
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Asegurar que esté dentro de los límites del canvas
        const boundedX = Math.max(30, Math.min(rect.width - 90, x));
        const boundedY = Math.max(30, Math.min(rect.height - 90, y));
        onNuevaMesa(boundedX, boundedY);
      }
    }
  }, [onNuevaMesa]);

  // Manejar inicio de drag
  const handleMouseDown = useCallback((e: React.MouseEvent, item: Mesa | ObjetoDecorativo, type: 'mesa' | 'objeto') => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const offsetX = e.clientX - rect.left - (item.posicionX || 0);
      const offsetY = e.clientY - rect.top - (item.posicionY || 0);
      
      setDragItem({
        id: item.id,
        type,
        offsetX,
        offsetY
      });
      setIsDragging(true);
    }
  }, []);

  // Manejar movimiento del drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragItem) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left - dragItem.offsetX;
      const y = e.clientY - rect.top - dragItem.offsetY;
      
      // Limitar a los bounds del canvas
      const boundedX = Math.max(0, Math.min(rect.width - 80, x));
      const boundedY = Math.max(0, Math.min(rect.height - 80, y));
      
      if (dragItem.type === 'mesa') {
        onMesaMove(dragItem.id, boundedX, boundedY);
      } else {
        onObjetoMove(dragItem.id, boundedX, boundedY);
      }
    }
  }, [isDragging, dragItem, onMesaMove, onObjetoMove]);

  // Manejar fin de drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragItem(null);
  }, []);

  // Manejar zoom (deshabilitado por simplicidad)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    // Zoom deshabilitado por ahora
  }, []);

  // Obtener color según estado de mesa
  const getEstadoColor = (estado: EstadoMesa) => {
    switch (estado) {
      case EstadoMesa.LIBRE:
        return { bg: '#4caf50', text: '#ffffff' }; // Verde - mesas libres
      case EstadoMesa.OCUPADA:
        return { bg: '#f44336', text: '#ffffff' }; // Rojo - mesas ocupadas
      case EstadoMesa.ESPERANDO_PEDIDO:
        return { bg: '#2196f3', text: '#ffffff' }; // Azul - ticket/factura emitidos
      case EstadoMesa.CUENTA_PEDIDA:
        return { bg: '#ff9800', text: '#ffffff' }; // Naranja - cuenta pedida
      case EstadoMesa.RESERVADA:
        return { bg: '#9c27b0', text: '#ffffff' }; // Púrpura - reservadas
      case EstadoMesa.FUERA_DE_SERVICIO:
        return { bg: '#757575', text: '#ffffff' }; // Gris - fuera de servicio
      default:
        return { bg: '#4caf50', text: '#ffffff' }; // Verde por defecto
    }
  };

  // Obtener icono según estado de mesa
  const getEstadoIcon = (estado: EstadoMesa) => {
    switch (estado) {
      case EstadoMesa.LIBRE:
        return null;
      case EstadoMesa.OCUPADA:
        return <Users className="h-3 w-3" />;
      case EstadoMesa.ESPERANDO_PEDIDO:
        return <ShoppingCart className="h-3 w-3" />;
      case EstadoMesa.CUENTA_PEDIDA:
        return <Calculator className="h-3 w-3" />;
      case EstadoMesa.RESERVADA:
        return <Star className="h-3 w-3" />;
      case EstadoMesa.FUERA_DE_SERVICIO:
        return <Wrench className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Obtener forma CSS según forma de mesa
  const getMesaStyle = (mesa: Mesa) => {
    const colors = getEstadoColor(mesa.estado);
    
    // Asegurar que las posiciones sean válidas
    const posX = Math.max(0, mesa.posicionX || 0);
    const posY = Math.max(0, mesa.posicionY || 0);
    
    const baseStyle = {
      position: 'absolute' as const,
      left: `${posX}px`,
      top: `${posY}px`,
      width: '60px',
      height: '60px',
      backgroundColor: colors.bg,
      color: colors.text,
      border: '2px solid #ffffff',
      cursor: isDragging ? 'grabbing' : 'grab',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      zIndex: 10,
      fontSize: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column' as const,
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };

    switch (mesa.forma) {
      case 'REDONDA':
        return { ...baseStyle, borderRadius: '50%' };
      case 'CUADRADA':
        return { ...baseStyle, borderRadius: '8px' };
      case 'RECTANGULAR':
        return { ...baseStyle, borderRadius: '8px', width: '80px' };
      case 'OVALADA':
        return { ...baseStyle, borderRadius: '50%', width: '80px' };
      default:
        return { ...baseStyle, borderRadius: '50%' };
    }
  };

  // Obtener estilo para objeto decorativo
  const getObjetoStyle = (objeto: ObjetoDecorativo) => {
    const posX = Math.max(0, objeto.posicionX || 0);
    const posY = Math.max(0, objeto.posicionY || 0);
    
    return {
      position: 'absolute' as const,
      left: `${posX}px`,
      top: `${posY}px`,
      width: `${objeto.ancho || 60}px`,
      height: `${objeto.alto || 60}px`,
      backgroundColor: objeto.color || '#e5e7eb',
      borderRadius: '4px',
      border: '1px solid #d1d5db',
      cursor: isDragging ? 'grabbing' : 'grab',
      transition: isDragging ? 'none' : 'all 0.2s ease',
      zIndex: 5,
      fontSize: '10px',
      minWidth: '30px',
      minHeight: '30px'
    };
  };

  // Configurar event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`relative overflow-hidden bg-gray-50 border border-gray-200 rounded-lg ${className}`}>


      {/* Información del sector */}
      <div className="absolute top-4 left-4 z-20 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: sector.color || '#4CAF50' }}
          />
          <span className="text-sm font-medium">{sector.icono} {sector.nombre}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {mesas.length} mesas • {objetosDecorativos.length} objetos
        </div>
      </div>

      {/* Canvas principal */}
      <div
        ref={canvasRef}
        className="relative w-full h-96 lg:h-[500px] cursor-crosshair overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle, #d1d5db 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
        onDoubleClick={handleCanvasDoubleClick}
        onWheel={handleWheel}
      >
        {/* Objetos decorativos */}
        {objetosDecorativos.map((objeto) => (
          <div
            key={objeto.id}
            style={getObjetoStyle(objeto)}
            onMouseDown={(e) => handleMouseDown(e, objeto, 'objeto')}
            className="flex items-center justify-center text-xs font-medium text-gray-700 select-none"
            title={objeto.descripcion || objeto.nombre}
          >
            {objeto.icono && (
              <span className="mr-1">{objeto.icono}</span>
            )}
            <span>{objeto.nombre}</span>
          </div>
        ))}

        {/* Mesas */}
        {mesas.map((mesa) => {
          const colors = getEstadoColor(mesa.estado);
          const icon = getEstadoIcon(mesa.estado);
          
          return (
            <div
              key={mesa.id}
              style={getMesaStyle(mesa)}
              onMouseDown={(e) => handleMouseDown(e, mesa, 'mesa')}
              onClick={() => onMesaClick(mesa)}
              onDoubleClick={() => onMesaDoubleClick(mesa)}
              onContextMenu={(e) => {
                e.preventDefault();
                onMesaContextMenu(mesa, e);
              }}
              className="flex flex-col items-center justify-center text-white font-medium select-none shadow-lg hover:shadow-xl"
              title={`Mesa ${mesa.numero} - ${mesa.estado}`}
            >
              {/* Solo número de mesa al centro */}
              <div className="font-bold text-lg">
                {mesa.numero}
              </div>
            </div>
          );
        })}

        {/* Indicador de nueva mesa */}
        {!isDragging && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm text-xs text-gray-500">
            <Plus className="h-4 w-4 inline mr-1" />
            Doble clic para crear nueva mesa
          </div>
        )}
      </div>

      {/* Menú contextual */}
      {contextMenu && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 min-w-[180px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y
          }}
        >
          <button
            onClick={() => {
              onMesaClick(contextMenu.mesa);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Abrir venta</span>
          </button>
          <button
            onClick={() => {
              onMesaDoubleClick(contextMenu.mesa);
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Editar mesa</span>
          </button>
          <hr className="my-1" />
          
          {/* Cambiar estado */}
          <div className="px-3 py-1 text-xs text-gray-500 font-medium">Cambiar estado:</div>
          
          {Object.values(EstadoMesa).map((estado) => {
            if (estado === contextMenu.mesa.estado) return null;
            const colors = getEstadoColor(estado);
            return (
              <button
                key={estado}
                onClick={() => {
                  // Aquí se podría agregar lógica para cambiar estado
                  console.log('Cambiar estado a:', estado);
                  setContextMenu(null);
                }}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colors.bg }}
                />
                <span>
                  {estado === EstadoMesa.LIBRE ? 'Libre' :
                   estado === EstadoMesa.OCUPADA ? 'Ocupada' :
                   estado === EstadoMesa.ESPERANDO_PEDIDO ? 'Esperando pedido' :
                   estado === EstadoMesa.CUENTA_PEDIDA ? 'Cuenta pedida' :
                   estado === EstadoMesa.RESERVADA ? 'Reservada' :
                   estado === EstadoMesa.FUERA_DE_SERVICIO ? 'Fuera de servicio' : estado}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Leyenda de estados */}
      <div className="absolute bottom-4 right-4 z-20 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="text-xs font-medium text-gray-700 mb-2">Estados:</div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.values(EstadoMesa).map((estado) => {
            const colors = getEstadoColor(estado);
            return (
              <div key={estado} className="flex items-center space-x-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.bg }}
                />
                <span className="text-gray-600 truncate">
                  {estado === EstadoMesa.LIBRE ? 'Libre' :
                   estado === EstadoMesa.OCUPADA ? 'Ocupada' :
                   estado === EstadoMesa.ESPERANDO_PEDIDO ? 'Esperando' :
                   estado === EstadoMesa.CUENTA_PEDIDA ? 'Cuenta' :
                   estado === EstadoMesa.RESERVADA ? 'Reservada' :
                   estado === EstadoMesa.FUERA_DE_SERVICIO ? 'Fuera' : estado}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MesaCanvas; 