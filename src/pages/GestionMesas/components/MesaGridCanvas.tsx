import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Tooltip,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Slider,
  ButtonGroup,
  Popper,
  ClickAwayListener,
  Grow,
  MenuList,
  Stack,
  alpha,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Users, 
  ShoppingCart, 
  Calculator, 
  Star, 
  Wrench, 
  MoreVertical, 
  Plus,
  Edit,
  Delete,
  CircleCheck,
  Circle,
  Clock,
  Receipt,
  Ban,
  PersonStanding,
  Move,
  Copy,
  Maximize,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid3x3,
  Minus,
  Settings,
  Keyboard
} from 'lucide-react';
import type { Mesa, Sector, ObjetoDecorativo, TipoObjeto } from '../../../types/mesas';
import { EstadoMesa, FormaMesa } from '../../../types/mesas';
import { objetosDecorativosApi } from '../../../services/mesasApi';
import FormularioObjetoDecorativo from './FormularioObjetoDecorativo';

// Estilos CSS para animaciones
const pulseAnimation = `
  @keyframes pulse {
    0% {
      transform: translateX(-50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translateX(-50%) scale(1.1);
      opacity: 0.8;
    }
    100% {
      transform: translateX(-50%) scale(1);
      opacity: 1;
    }
  }
`;

// Inyectar estilos CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseAnimation;
  document.head.appendChild(style);
}

interface MesaGridCanvasProps {
  sector: Sector;
  mesas: Mesa[];
  onMesaClick: (mesa: Mesa) => void;
  onMesaDoubleClick: (mesa: Mesa) => void;
  onMesaContextMenu: (mesa: Mesa, e: React.MouseEvent) => void;
  onNuevaMesa: (posicionX: number, posicionY: number) => void;
  modoEdicion?: boolean;
  onCambiarEstadoMesa?: (mesaId: string, nuevoEstado: EstadoMesa) => void;
  onEliminarMesa?: (mesaId: string) => void;
  onActualizarTamanoMesa?: (mesaId: string, nuevoTamano: number) => void;
  onMoverMesa?: (mesaId: string, nuevaPosicionX: number, nuevaPosicionY: number, soloGuardarEnBD?: boolean) => void;
  onMoverObjeto?: (objetoId: string, nuevaPosicionX: number, nuevaPosicionY: number, soloGuardarEnBD?: boolean) => void;
  // ==========================================
  // 🎯 SISTEMA DE CAMBIOS PENDIENTES
  // ==========================================
  onCambiosPendientes?: (cambios: { 
    mesas: { id: string; posicionX: number; posicionY: number }[];
    objetos: { id: string; posicionX: number; posicionY: number }[];
  }) => void;
  onGuardarCambios?: () => void;
  onCancelarCambios?: () => void;
  className?: string;
}

const MesaGridCanvas: React.FC<MesaGridCanvasProps> = ({
  sector,
  mesas,
  onMesaClick,
  onMesaDoubleClick,
  onMesaContextMenu,
  onNuevaMesa,
  modoEdicion = false,
  onCambiarEstadoMesa,
  onEliminarMesa,
  onActualizarTamanoMesa,
  onMoverMesa,
  onMoverObjeto,
  onCambiosPendientes,
  onGuardarCambios,
  onCancelarCambios,
  className = ''
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    mesa: Mesa;
  } | null>(null);
  
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean;
    mesa: Mesa | null;
  }>({
    open: false,
    mesa: null
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(false);
  const [editingMesa, setEditingMesa] = useState<Mesa | null>(null);
  const [editAnchor, setEditAnchor] = useState<HTMLElement | null>(null);
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  
  // Estados para objetos decorativos
  const [objetosDecorativos, setObjetosDecorativos] = useState<ObjetoDecorativo[]>([]);
  const [loadingObjetos, setLoadingObjetos] = useState(false);
  const [objetoEditando, setObjetoEditando] = useState<ObjetoDecorativo | null>(null);
  const [dialogoObjeto, setDialogoObjeto] = useState(false);
  
  // Estado local para mesas durante el arrastre (para actualización visual inmediata)
  const [mesasLocales, setMesasLocales] = useState<Mesa[]>([]);
  
  // Estados para drag and drop
  const [dragging, setDragging] = useState<{
    tipo: 'mesa' | 'objeto';
    mesa?: Mesa;
    objeto?: ObjetoDecorativo;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  
  // ==========================================
  // 🎯 SISTEMA DE CAMBIOS PENDIENTES
  // ==========================================
  // Este sistema permite:
  // - Actualización visual inmediata durante el arrastre
  // - Guardado en BD solo al confirmar "Guardar Cambios"
  // - Posibilidad de cancelar cambios y revertir
  // - Sincronización entre pantallas solo después del guardado
  // ==========================================
  const [cambiosPendientes, setCambiosPendientes] = useState<{
    mesas: { id: string; posicionX: number; posicionY: number }[];
    objetos: { id: string; posicionX: number; posicionY: number }[];
  }>({
    mesas: [],
    objetos: []
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavePositionRef = useRef<{ x: number; y: number } | null>(null);
  const gridSize = 20; // Tamaño de la grilla en píxeles
  const minZoom = 0.5;
  const maxZoom = 3;
  const defaultSize = 50; // Tamaño por defecto de las mesas

  const mostrarNotificacion = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ==========================================
  // 🎯 FUNCIÓN PARA CARGAR OBJETOS DECORATIVOS
  // ==========================================
  const cargarObjetosDecorativos = async () => {
    if (!sector.id) return;
    
    setLoadingObjetos(true);
    try {
      const objetos = await objetosDecorativosApi.obtenerTodos(sector.id);
      setObjetosDecorativos(objetos);
    } catch (error) {
      console.error('Error al cargar objetos decorativos:', error);
    } finally {
      setLoadingObjetos(false);
    }
  };

  // Debounce para guardado en BD - EVITA SPAM DE PETICIONES
  const debouncedSave = useCallback((tipo: 'mesa' | 'objeto', id: string, x: number, y: number) => {
    // Limpiar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Verificar si la posición realmente cambió
    const currentPos = { x, y };
    if (lastSavePositionRef.current && 
        lastSavePositionRef.current.x === x && 
        lastSavePositionRef.current.y === y) {
      return; // No hay cambios, no guardar
    }

    // Programar guardado después de 300ms sin más movimientos
    saveTimeoutRef.current = setTimeout(() => {
      lastSavePositionRef.current = currentPos;
      
      if (tipo === 'mesa') {
        onMoverMesa?.(id, x, y);
      } else if (tipo === 'objeto') {
        onMoverObjeto?.(id, x, y);
      }
    }, 300);
  }, [onMoverMesa, onMoverObjeto]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Inicializar mesas locales con las props (solo la primera vez)
  useEffect(() => {
    if (mesasLocales.length === 0) {
      setMesasLocales(mesas);
    }
  }, [mesas, mesasLocales.length]);

  // ==========================================
  // 🎯 SINCRONIZACIÓN INTELIGENTE DE MESAS
  // ==========================================
  // Solo sincronizar cuando:
  // 1. No hay cambios pendientes
  // 2. No se está arrastrando
  // 3. No estamos en modo edición con cambios
  // ==========================================
  useEffect(() => {
    const tieneCambiosPendientes = cambiosPendientes.mesas.length > 0 || cambiosPendientes.objetos.length > 0;
    
    if (!dragging && !tieneCambiosPendientes && (!modoEdicion || !tieneCambiosPendientes)) {
      console.log('🔄 Sincronizando mesas desde BD (sin cambios pendientes)');
      setMesasLocales(mesas);
    } else if (tieneCambiosPendientes) {
      console.log('⏸️ Evitando sincronización - hay cambios pendientes:', cambiosPendientes.mesas.length, 'mesas');
    }
  }, [mesas, dragging, cambiosPendientes, modoEdicion]);

  // ==========================================
  // 🎯 NOTIFICAR CAMBIOS PENDIENTES AL PADRE
  // ==========================================
  useEffect(() => {
    onCambiosPendientes?.(cambiosPendientes);
  }, [cambiosPendientes, onCambiosPendientes]);

  // ==========================================
  // 🎯 LIMPIAR CAMBIOS AL SALIR DEL MODO EDICIÓN
  // ==========================================
  useEffect(() => {
    if (!modoEdicion) {
      // Al salir del modo edición, limpiar cambios pendientes
      setCambiosPendientes({ mesas: [], objetos: [] });
      // Restaurar mesas y objetos al estado original (solo cuando se sale del modo edición)
      setMesasLocales(mesas);
      cargarObjetosDecorativos();
    }
  }, [modoEdicion]); // ✅ Solo cuando cambia el modo edición, no cuando cambian las mesas

  // ==========================================
  // 🎯 FUNCIONES PARA GESTIONAR CAMBIOS PENDIENTES
  // ==========================================
  
  const guardarCambiosPendientes = async () => {
    try {
      console.log('🚀 Guardando cambios pendientes en BD:', cambiosPendientes);
      
      const totalCambios = cambiosPendientes.mesas.length + cambiosPendientes.objetos.length;
      
      // ==========================================
      // 🎯 GUARDADO COMPLETO (BD + ESTADO)
      // ==========================================
      // Guardar en BD y actualizar estado en una sola operación
      // ==========================================
      
      // Guardar cambios de mesas (BD + estado)
      for (const cambioMesa of cambiosPendientes.mesas) {
        await onMoverMesa?.(cambioMesa.id, cambioMesa.posicionX, cambioMesa.posicionY, false);
      }
      
      // Guardar cambios de objetos (BD + estado)
      for (const cambioObjeto of cambiosPendientes.objetos) {
        await onMoverObjeto?.(cambioObjeto.id, cambioObjeto.posicionX, cambioObjeto.posicionY, false);
      }
      
      // Limpiar cambios pendientes después de actualizar todo
      setCambiosPendientes({ mesas: [], objetos: [] });
      
      mostrarNotificacion(`✅ ${totalCambios} cambios guardados exitosamente`, 'success');
      
      console.log('✅ Todos los cambios guardados exitosamente - BD y estado actualizados');
    } catch (error) {
      console.error('❌ Error guardando cambios:', error);
      mostrarNotificacion('❌ Error al guardar cambios', 'error');
    }
  };
  
  const cancelarCambiosPendientes = () => {
    console.log('🔄 Cancelando cambios pendientes');
    
    // Restaurar mesas al estado original
    setMesasLocales(mesas);
    
    // Restaurar objetos al estado original
    cargarObjetosDecorativos();
    
    // Limpiar cambios pendientes
    setCambiosPendientes({ mesas: [], objetos: [] });
    
    const totalCambios = cambiosPendientes.mesas.length + cambiosPendientes.objetos.length;
    mostrarNotificacion(`🔄 ${totalCambios} cambios cancelados`, 'info');
    
    console.log('🔄 Cambios cancelados - estado restaurado');
  };

  // Exponer funciones al padre cuando se proporcionen los handlers
  useEffect(() => {
    if (onGuardarCambios) {
      (window as any).guardarCambiosPendientes = guardarCambiosPendientes;
    }
    if (onCancelarCambios) {
      (window as any).cancelarCambiosPendientes = cancelarCambiosPendientes;
    }
  }, [onGuardarCambios, onCancelarCambios, cambiosPendientes]);

  // Cargar objetos decorativos cuando cambie el sector
  useEffect(() => {
    cargarObjetosDecorativos();
  }, [sector.id]);

  // Configurar atajos de teclado específicos del canvas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo procesar si el canvas tiene el focus
      if (document.activeElement !== canvasRef.current) return;
      
      switch (e.key.toLowerCase()) {
        case 'delete':
        case 'backspace':
          e.preventDefault();
          if (contextMenu && contextMenu.mesa) {
            handleEliminarMesa(contextMenu.mesa);
            setContextMenu(null);
          }
          break;
        case 'enter':
          e.preventDefault();
          if (contextMenu && contextMenu.mesa) {
            handleMesaClick(contextMenu.mesa);
            setContextMenu(null);
          }
          break;
        case 'escape':
          e.preventDefault();
          setContextMenu(null);
          setEditingMesa(null);
          setEditAnchor(null);
          break;
        case 'f2':
          e.preventDefault();
          if (contextMenu && contextMenu.mesa) {
            handleMesaDoubleClick(contextMenu.mesa);
            setContextMenu(null);
          }
          break;
        case 'g':
          e.preventDefault();
          if (modoEdicion) {
            handleToggleGrid();
          }
          break;
        case '+':
        case '=':
          e.preventDefault();
          if (e.ctrlKey) {
            handleZoomIn();
          }
          break;
        case '-':
          e.preventDefault();
          if (e.ctrlKey) {
            handleZoomOut();
          }
          break;
        case '0':
          e.preventDefault();
          if (e.ctrlKey) {
            handleResetZoom();
          }
          break;
        case 'o':
          e.preventDefault();
          if (modoEdicion) {
            handleCrearObjeto();
          }
          break;
      }
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [contextMenu, modoEdicion]);

  // Manejar eventos de mouse para drag and drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !modoEdicion) return;

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Calcular posición del mouse relativa al canvas
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Calcular nueva posición (mouse - offset) / zoom
        const nuevaPosicionX = (mouseX - dragging.offsetX) / zoomLevel;
        const nuevaPosicionY = (mouseY - dragging.offsetY) / zoomLevel;

        if (dragging.tipo === 'mesa' && dragging.mesa) {
          // Restringir dentro del canvas para mesa
          const mesaSize = dragging.mesa.size || defaultSize;
          const maxX = 1200 - mesaSize;
          const maxY = 800 - mesaSize;
          
          const clampedX = Math.max(0, Math.min(nuevaPosicionX, maxX));
          const clampedY = Math.max(0, Math.min(nuevaPosicionY, maxY));

          // ==========================================
          // 🎯 ACTUALIZACIÓN VISUAL INMEDIATA (SIN BD)
          // ==========================================
          // Solo actualiza la UI para mostrar el movimiento
          // NO guarda en BD hasta que el usuario confirme
          // ==========================================
          const mesaActualizada = { ...dragging.mesa, posicionX: clampedX, posicionY: clampedY };
          
          // Actualizar en el estado dragging para que handleMouseUp use la posición correcta
          setDragging(prev => prev ? { ...prev, mesa: mesaActualizada } : null);

          // Actualizar también en el estado de mesas locales para renderizado
          setMesasLocales(prev => prev.map(mesa => 
            mesa.id === dragging.mesa!.id ? mesaActualizada : mesa
          ));

          // Registrar cambio pendiente (sin guardar en BD)
          setCambiosPendientes(prev => {
            const mesasActualizadas = prev.mesas.filter(m => m.id !== dragging.mesa!.id);
            mesasActualizadas.push({ id: dragging.mesa!.id, posicionX: clampedX, posicionY: clampedY });
            return { ...prev, mesas: mesasActualizadas };
          });

          // Log para debug
          console.log(`🎯 Moviendo mesa ${dragging.mesa.numero} (VISUAL):`, {
            mousePos: { x: mouseX, y: mouseY },
            offset: { x: dragging.offsetX, y: dragging.offsetY },
            nuevaPosicion: { x: nuevaPosicionX, y: nuevaPosicionY },
            clampedPos: { x: clampedX, y: clampedY },
            zoomLevel,
            guardadoEn: 'PENDIENTE (no en BD)'
          });
        } else if (dragging.tipo === 'objeto' && dragging.objeto) {
          // Restringir dentro del canvas para objeto
          const objetoAncho = dragging.objeto.ancho || 60;
          const objetoAlto = dragging.objeto.alto || 60;
          const maxX = 1200 - objetoAncho;
          const maxY = 800 - objetoAlto;
          
          const clampedX = Math.max(0, Math.min(nuevaPosicionX, maxX));
          const clampedY = Math.max(0, Math.min(nuevaPosicionY, maxY));

          // ==========================================
          // 🎯 ACTUALIZACIÓN VISUAL INMEDIATA (SIN BD)
          // ==========================================
          // Solo actualiza la UI para mostrar el movimiento
          // NO guarda en BD hasta que el usuario confirme
          // ==========================================
          const objetoActualizado = { ...dragging.objeto, posicionX: clampedX, posicionY: clampedY };
          
          // Actualizar en el estado dragging para que handleMouseUp use la posición correcta
          setDragging(prev => prev ? { ...prev, objeto: objetoActualizado } : null);

          // Actualizar también en el estado de objetos decorativos para renderizado
          setObjetosDecorativos(prev => prev.map(obj => 
            obj.id === dragging.objeto!.id ? objetoActualizado : obj
          ));

          // Registrar cambio pendiente (sin guardar en BD)
          setCambiosPendientes(prev => {
            const objetosActualizados = prev.objetos.filter(o => o.id !== dragging.objeto!.id);
            objetosActualizados.push({ id: dragging.objeto!.id, posicionX: clampedX, posicionY: clampedY });
            return { ...prev, objetos: objetosActualizados };
          });

          // Log para debug
          console.log(`🎯 Moviendo objeto ${dragging.objeto.nombre} (VISUAL):`, {
            mousePos: { x: mouseX, y: mouseY },
            offset: { x: dragging.offsetX, y: dragging.offsetY },
            nuevaPosicion: { x: nuevaPosicionX, y: nuevaPosicionY },
            clampedPos: { x: clampedX, y: clampedY },
            zoomLevel,
            guardadoEn: 'PENDIENTE (no en BD)'
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragging) {
        setJustFinishedDragging(true);
        
        // ==========================================
        // 🎯 FINALIZACIÓN DEL ARRASTRE (SIN BD)
        // ==========================================
        // Solo registra que terminó el arrastre
        // NO guarda en BD - eso se hace al confirmar "Guardar Cambios"
        // ==========================================
        
        if (dragging.tipo === 'mesa' && dragging.mesa) {
          mostrarNotificacion(`Mesa ${dragging.mesa.numero} movida (cambios pendientes)`, 'warning');
          console.log(`⏳ Mesa ${dragging.mesa.numero} finalizada - cambios pendientes: x=${dragging.mesa.posicionX}, y=${dragging.mesa.posicionY}`);
        } else if (dragging.tipo === 'objeto' && dragging.objeto) {
          mostrarNotificacion(`Objeto ${dragging.objeto.nombre} movido (cambios pendientes)`, 'warning');
          console.log(`⏳ Objeto ${dragging.objeto.nombre} finalizado - cambios pendientes: x=${dragging.objeto.posicionX}, y=${dragging.objeto.posicionY}`);
        }
        
        // Limpiar la bandera después de un breve delay
        setTimeout(() => setJustFinishedDragging(false), 100);
      }
      setDragging(null);
    };

    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, modoEdicion, zoomLevel, onMoverMesa, onMoverObjeto, debouncedSave]);

  const handleMouseDown = (e: React.MouseEvent, mesa: Mesa) => {
    if (!modoEdicion) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calcular posición del mouse relativa al canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcular posición de la mesa en el canvas (aplicando zoom)
      const mesaXEnCanvas = mesa.posicionX * zoomLevel;
      const mesaYEnCanvas = mesa.posicionY * zoomLevel;
      
      // Calcular offset: diferencia entre mouse y posición de mesa
      const offsetX = mouseX - mesaXEnCanvas;
      const offsetY = mouseY - mesaYEnCanvas;

      console.log(`🚀 Iniciando arrastre de mesa ${mesa.numero}:`, {
        mesaPos: { x: mesa.posicionX, y: mesa.posicionY },
        mesaEnCanvas: { x: mesaXEnCanvas, y: mesaYEnCanvas },
        mousePos: { x: mouseX, y: mouseY },
        offset: { x: offsetX, y: offsetY },
        zoomLevel
      });

      setDragging({
        tipo: 'mesa',
        mesa,
        offsetX,
        offsetY
      });
      mostrarNotificacion(`Arrastrando mesa ${mesa.numero}`, 'info');
    }
  };

  const handleMouseDownObjeto = (e: React.MouseEvent, objeto: ObjetoDecorativo) => {
    if (!modoEdicion) return;
    
    e.preventDefault();
    e.stopPropagation();

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      
      // Calcular posición del mouse relativa al canvas
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcular posición del objeto en el canvas (aplicando zoom)
      const objetoXEnCanvas = objeto.posicionX * zoomLevel;
      const objetoYEnCanvas = objeto.posicionY * zoomLevel;
      
      // Calcular offset: diferencia entre mouse y posición de objeto
      const offsetX = mouseX - objetoXEnCanvas;
      const offsetY = mouseY - objetoYEnCanvas;

      console.log(`🚀 Iniciando arrastre de objeto ${objeto.nombre}:`, {
        objetoPos: { x: objeto.posicionX, y: objeto.posicionY },
        objetoEnCanvas: { x: objetoXEnCanvas, y: objetoYEnCanvas },
        mousePos: { x: mouseX, y: mouseY },
        offset: { x: offsetX, y: offsetY },
        zoomLevel
      });

      setDragging({
        tipo: 'objeto',
        objeto,
        offsetX,
        offsetY
      });
      mostrarNotificacion(`Arrastrando objeto ${objeto.nombre}`, 'info');
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 0.1, maxZoom);
      mostrarNotificacion(`Zoom: ${Math.round(newZoom * 100)}%`, 'info');
      return newZoom;
    });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.1, minZoom);
      mostrarNotificacion(`Zoom: ${Math.round(newZoom * 100)}%`, 'info');
      return newZoom;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    mostrarNotificacion('Zoom restablecido al 100%', 'info');
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
    mostrarNotificacion(`Grilla ${!showGrid ? 'activada' : 'desactivada'}`, 'info');
  };

  // Obtener estilos para tipos de objetos decorativos
  const getObjetoDecorativoStyles = (tipo: TipoObjeto) => {
    switch (tipo) {
      case 'BARRA':
        return {
          bg: '#8B4513',
          color: '#FFFFFF'
        };
      case 'BANO':
        return {
          bg: '#87CEEB',
          color: '#000000'
        };
      case 'COCINA':
        return {
          bg: '#FF6347',
          color: '#FFFFFF'
        };
      case 'ESCENARIO':
        return {
          bg: '#DDA0DD',
          color: '#000000'
        };
      case 'ENTRADA':
        return {
          bg: '#32CD32',
          color: '#000000'
        };
      case 'SALIDA':
        return {
          bg: '#FF4500',
          color: '#FFFFFF'
        };
      case 'DECORATIVO':
      default:
        return {
          bg: '#9E9E9E',
          color: '#000000'
        };
    }
  };

  // Obtener color según estado de mesa
  const getEstadoColor = (estado: EstadoMesa) => {
    switch (estado) {
      case EstadoMesa.LIBRE:
        return { 
          bg: '#4caf50', 
          hover: '#45a049',
          text: '#ffffff',
          border: '#4caf50'
        };
      case EstadoMesa.OCUPADA:
        return { 
          bg: '#f44336', 
          hover: '#d32f2f',
          text: '#ffffff',
          border: '#f44336'
        };
      case EstadoMesa.ESPERANDO_PEDIDO:
        return { 
          bg: '#2196f3', 
          hover: '#1976d2',
          text: '#ffffff',
          border: '#2196f3'
        };
      case EstadoMesa.CUENTA_PEDIDA:
        return { 
          bg: '#ff9800', 
          hover: '#f57c00',
          text: '#ffffff',
          border: '#ff9800'
        };
      case EstadoMesa.RESERVADA:
        return { 
          bg: '#9c27b0', 
          hover: '#7b1fa2',
          text: '#ffffff',
          border: '#9c27b0'
        };
      case EstadoMesa.FUERA_DE_SERVICIO:
        return { 
          bg: '#757575', 
          hover: '#616161',
          text: '#ffffff',
          border: '#757575'
        };
      default:
        return { 
          bg: '#4caf50', 
          hover: '#45a049',
          text: '#ffffff',
          border: '#4caf50'
        };
    }
  };

  // Obtener icono según estado de mesa
  const getEstadoIcon = (estado: EstadoMesa, size: number) => {
    const iconSize = Math.max(12, size * 0.2);
    switch (estado) {
      case EstadoMesa.LIBRE:
        return <CircleCheck size={iconSize} />;
      case EstadoMesa.OCUPADA:
        return <Users size={iconSize} />;
      case EstadoMesa.ESPERANDO_PEDIDO:
        return <ShoppingCart size={iconSize} />;
      case EstadoMesa.CUENTA_PEDIDA:
        return <Receipt size={iconSize} />;
      case EstadoMesa.RESERVADA:
        return <Star size={iconSize} />;
      case EstadoMesa.FUERA_DE_SERVICIO:
        return <Ban size={iconSize} />;
      default:
        return <CircleCheck size={iconSize} />;
    }
  };

  // Obtener texto del estado
  const getEstadoText = (estado: EstadoMesa) => {
    switch (estado) {
      case EstadoMesa.LIBRE:
        return 'Libre';
      case EstadoMesa.OCUPADA:
        return 'Ocupada';
      case EstadoMesa.ESPERANDO_PEDIDO:
        return 'Esperando Pedido';
      case EstadoMesa.CUENTA_PEDIDA:
        return 'Cuenta Pedida';
      case EstadoMesa.RESERVADA:
        return 'Reservada';
      case EstadoMesa.FUERA_DE_SERVICIO:
        return 'Fuera de Servicio';
      default:
        return 'Desconocido';
    }
  };

  // Renderizar grilla de fondo
  const renderGrid = () => {
    if (!showGrid) return null;

    const gridLines = [];
    const containerWidth = 1200;
    const containerHeight = 800;

    // Líneas verticales
    for (let x = 0; x <= containerWidth; x += gridSize) {
      gridLines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={containerHeight}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
      );
    }

    // Líneas horizontales
    for (let y = 0; y <= containerHeight; y += gridSize) {
      gridLines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={containerWidth}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth="1"
        />
      );
    }

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {gridLines}
      </svg>
    );
  };

  // Opciones del menú contextual según estado
  const getMenuOptions = (mesa: Mesa) => {
    const options = [];
    
    // Cambiar estado
    if (mesa.estado !== EstadoMesa.LIBRE) {
      options.push({
        text: 'Marcar como libre',
        icon: <CircleCheck size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.LIBRE),
        color: '#4caf50'
      });
    }
    
    if (mesa.estado !== EstadoMesa.OCUPADA) {
      options.push({
        text: 'Marcar como ocupada',
        icon: <Users size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.OCUPADA),
        color: '#f44336'
      });
    }
    
    if (mesa.estado !== EstadoMesa.ESPERANDO_PEDIDO) {
      options.push({
        text: 'Esperando pedido',
        icon: <ShoppingCart size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.ESPERANDO_PEDIDO),
        color: '#2196f3'
      });
    }
    
    if (mesa.estado !== EstadoMesa.CUENTA_PEDIDA) {
      options.push({
        text: 'Cuenta pedida',
        icon: <Receipt size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.CUENTA_PEDIDA),
        color: '#ff9800'
      });
    }
    
    if (mesa.estado !== EstadoMesa.RESERVADA) {
      options.push({
        text: 'Reservar mesa',
        icon: <Star size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.RESERVADA),
        color: '#9c27b0'
      });
    }
    
    if (mesa.estado !== EstadoMesa.FUERA_DE_SERVICIO) {
      options.push({
        text: 'Fuera de servicio',
        icon: <Ban size={16} />,
        action: () => onCambiarEstadoMesa?.(mesa.id, EstadoMesa.FUERA_DE_SERVICIO),
        color: '#757575'
      });
    }
    
    return options;
  };

  // Handlers de eventos
  const handleMesaClick = (mesa: Mesa) => {
    // Evitar clicks inmediatamente después de un drag en modo edición
    if (modoEdicion && justFinishedDragging) {
      return;
    }
    onMesaClick(mesa);
  };

  const handleMesaDoubleClick = (mesa: Mesa) => {
    onMesaDoubleClick(mesa);
  };

  const handleContextMenu = (e: React.MouseEvent, mesa: Mesa) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      mesa
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  const handleEliminarMesa = (mesa: Mesa) => {
    setConfirmDelete({
      open: true,
      mesa
    });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.mesa && onEliminarMesa) {
      onEliminarMesa(confirmDelete.mesa.id);
      mostrarNotificacion(`Mesa ${confirmDelete.mesa.numero} eliminada`, 'success');
    }
    setConfirmDelete({ open: false, mesa: null });
  };

  const handleCancelDelete = () => {
    setConfirmDelete({ open: false, mesa: null });
  };

  const handleNuevaMesa = (posicionX?: number, posicionY?: number) => {
    // Usar posición específica o calcular una aleatoria
    const x = posicionX ?? Math.floor(Math.random() * 400);
    const y = posicionY ?? Math.floor(Math.random() * 300);
    onNuevaMesa(x, y);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Crear mesa en la posición del doble clic
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / zoomLevel;
      const y = (e.clientY - rect.top) / zoomLevel;
      onNuevaMesa(x, y);
    }
  };

  const handleEditSize = (mesa: Mesa, event: React.MouseEvent<HTMLButtonElement>) => {
    setEditingMesa(mesa);
    setEditAnchor(event.currentTarget);
  };

  const handleCloseEditSize = () => {
    setEditingMesa(null);
    setEditAnchor(null);
  };

  const handleSizeChange = (newSize: number) => {
    if (editingMesa && onActualizarTamanoMesa) {
      onActualizarTamanoMesa(editingMesa.id, newSize);
    }
  };

  const handleIncrementSize = () => {
    if (editingMesa && onActualizarTamanoMesa) {
      const newSize = Math.min((editingMesa.size || defaultSize) + 5, 150);
      onActualizarTamanoMesa(editingMesa.id, newSize);
    }
  };

  const handleDecrementSize = () => {
    if (editingMesa && onActualizarTamanoMesa) {
      const newSize = Math.max((editingMesa.size || defaultSize) - 5, 30);
      onActualizarTamanoMesa(editingMesa.id, newSize);
    }
  };

  // Handlers para objetos decorativos
  const handleCrearObjeto = () => {
    setObjetoEditando(null);
    setDialogoObjeto(true);
  };

  const handleEditarObjeto = (objeto: ObjetoDecorativo) => {
    setObjetoEditando(objeto);
    setDialogoObjeto(true);
  };

  const handleGuardarObjeto = async (objetoData: any) => {
    try {
      if (objetoEditando) {
        // Actualizar objeto existente
        const objetoActualizado = await objetosDecorativosApi.actualizar(objetoEditando.id, objetoData);
        setObjetosDecorativos(prev => prev.map(o => o.id === objetoActualizado.id ? objetoActualizado : o));
        mostrarNotificacion('Objeto actualizado exitosamente', 'success');
      } else {
        // Crear nuevo objeto
        const nuevoObjeto = await objetosDecorativosApi.crear(objetoData);
        setObjetosDecorativos(prev => [...prev, nuevoObjeto]);
        mostrarNotificacion('Objeto creado exitosamente', 'success');
      }
      setDialogoObjeto(false);
      setObjetoEditando(null);
    } catch (error) {
      console.error('Error guardando objeto:', error);
      mostrarNotificacion('Error al guardar el objeto', 'error');
    }
  };

  const handleEliminarObjeto = async (objetoId: string) => {
    try {
      await objetosDecorativosApi.eliminar(objetoId);
      setObjetosDecorativos(prev => prev.filter(o => o.id !== objetoId));
      mostrarNotificacion('Objeto eliminado exitosamente', 'success');
    } catch (error) {
      console.error('Error eliminando objeto:', error);
      mostrarNotificacion('Error al eliminar el objeto', 'error');
    }
  };

  const handleMoverObjeto = async (objetoId: string, posicionX: number, posicionY: number) => {
    // Usar la prop externa si está disponible (guardado en tiempo real en BD)
    if (onMoverObjeto) {
      await onMoverObjeto(objetoId, posicionX, posicionY);
    } else {
      // Fallback a la lógica interna
      try {
        const objetoActualizado = await objetosDecorativosApi.actualizarPosicion(objetoId, posicionX, posicionY);
        setObjetosDecorativos(prev => prev.map(o => o.id === objetoActualizado.id ? objetoActualizado : o));
      } catch (error) {
        console.error('Error moviendo objeto:', error);
        mostrarNotificacion('Error al mover el objeto', 'error');
      }
    }
  };

  return (
    <Box className={className}>
              {/* Controles de edición eliminados por solicitud del usuario */}

      {/* Canvas principal */}
      <Box
        ref={canvasRef}
        tabIndex={0}
        sx={{
          position: 'relative',
          width: '100%',
          height: '70vh',
          overflow: 'auto',
          bgcolor: '#f5f5f5',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          cursor: modoEdicion ? 'grab' : 'default',
          outline: 'none',
          '&:focus': {
            outline: 'none',
            borderColor: 'primary.main'
          }
        }}
        onDoubleClick={handleCanvasDoubleClick}
        onMouseDown={(e) => {
          // Enfocar el canvas cuando se hace clic
          if (e.target === e.currentTarget) {
            e.currentTarget.focus();
          }
        }}
      >
        {/* Ayuda visual para modo edición */}
        {modoEdicion && (
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.875rem'
          }}>
            <Typography variant="body2">
              <Move size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Arrastra mesas/objetos • Doble clic: crear mesa • Click: editar objeto
            </Typography>
          </Box>
        )}

        {/* Información de atajos */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 16, 
          left: 16, 
          zIndex: 10,
          bgcolor: 'rgba(255,255,255,0.9)',
          px: 2,
          py: 1,
          borderRadius: 1,
          fontSize: '0.75rem'
        }}>
          <Typography variant="caption" color="text.secondary">
            {/* Texto de ayuda eliminado */}
          </Typography>
        </Box>

        {/* Grilla de fondo */}
        {renderGrid()}

        {/* Contenedor con zoom */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1200,
            height: 800,
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'top left',
            zIndex: 1
          }}
        >
          {/* Objetos decorativos */}
          {objetosDecorativos.map((objeto) => {
            const styles = getObjetoDecorativoStyles(objeto.tipo);
            const isDraggingThisObjeto = dragging?.tipo === 'objeto' && dragging?.objeto?.id === objeto.id;
            
            return (
              <Box
                key={objeto.id}
                sx={{
                  position: 'absolute',
                  left: objeto.posicionX * zoomLevel,
                  top: objeto.posicionY * zoomLevel,
                  width: (objeto.ancho || 60) * zoomLevel,
                  height: (objeto.alto || 60) * zoomLevel,
                  bgcolor: objeto.color || styles.bg,
                  color: styles.color,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.min((objeto.ancho || 60) * zoomLevel * 0.08, 14),
                  cursor: modoEdicion ? 'grab' : 'default',
                  zIndex: isDraggingThisObjeto ? 1000 : 0,
                  transform: isDraggingThisObjeto ? 'scale(1.1)' : 'scale(1)',
                  transition: isDraggingThisObjeto ? 'none' : 'all 0.2s ease',
                  filter: isDraggingThisObjeto ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' : 'none',
                  '&:hover': {
                    opacity: 0.8,
                    transform: modoEdicion ? 'scale(1.05)' : 'none',
                    boxShadow: modoEdicion ? '0 4px 8px rgba(0,0,0,0.2)' : 'none'
                  }
                }}
                title={objeto.descripcion || objeto.nombre}
                onClick={(e) => {
                  if (justFinishedDragging) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (modoEdicion) {
                    e.stopPropagation();
                    handleEditarObjeto(objeto);
                  }
                }}
                onMouseDown={(e) => {
                  if (modoEdicion) {
                    handleMouseDownObjeto(e, objeto);
                  }
                }}
                onDoubleClick={(e) => {
                  if (modoEdicion) {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar objeto "${objeto.nombre}"?`)) {
                      handleEliminarObjeto(objeto.id);
                    }
                  }
                }}
              >
                {/* Indicador de arrastre */}
                {isDraggingThisObjeto && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255,193,7,0.9)',
                      color: 'black',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      zIndex: 1001,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      animation: 'pulse 1s infinite'
                    }}
                  >
                    Moviendo
                  </Box>
                )}
                
                {objeto.nombre}
                
                {/* Icono de ajuste FUERA del contenedor en modo edición */}
                {modoEdicion && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: -12,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      cursor: 'pointer',
                      border: '2px solid #1976d2',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      zIndex: 1002,
                      '&:hover': {
                        backgroundColor: '#1976d2',
                        color: 'white',
                        transform: 'scale(1.1)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditarObjeto(objeto);
                    }}
                    title="Editar objeto"
                  >
                    ⚙️
                  </Box>
                )}
              </Box>
            );
          })}

        {/* Mesas */}
        {mesasLocales.map((mesa) => {
          const colors = getEstadoColor(mesa.estado);
          const icon = getEstadoIcon(mesa.estado, mesa.size || defaultSize);
          const estadoText = getEstadoText(mesa.estado);
          const mesaSize = mesa.size || defaultSize;
          const isDraggingThisMesa = dragging?.tipo === 'mesa' && dragging?.mesa?.id === mesa.id;
          
          return (
            <Box
              key={mesa.id}
              sx={{
                position: 'absolute',
                left: mesa.posicionX * zoomLevel,
                top: mesa.posicionY * zoomLevel,
                width: mesaSize * zoomLevel,
                height: mesaSize * zoomLevel,
                zIndex: isDraggingThisMesa ? 1000 : 1,
                transform: isDraggingThisMesa ? 'scale(1.1)' : 'scale(1)',
                transition: isDraggingThisMesa ? 'none' : 'transform 0.2s ease',
                filter: isDraggingThisMesa ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' : 'none',
                cursor: modoEdicion ? 'grab' : 'pointer',
                '&:hover': {
                  transform: modoEdicion ? 'scale(1.05)' : 'scale(1)',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                }
              }}
              onClick={(e) => {
                if (justFinishedDragging) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                if (!modoEdicion) {
                  handleMesaClick(mesa);
                }
              }}
              onMouseDown={(e) => {
                if (modoEdicion) {
                  handleMouseDown(e, mesa);
                }
              }}
              onContextMenu={(e) => {
                if (!modoEdicion) {
                  handleContextMenu(e, mesa);
                }
              }}
              onDoubleClick={(e) => {
                if (!modoEdicion) {
                  handleMesaDoubleClick(mesa);
                }
              }}
            >
              {/* Contenedor de la mesa */}
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  borderRadius: mesa.forma === FormaMesa.REDONDA ? '50%' : '12px',
                  backgroundColor: colors.bg,
                  border: `3px solid ${colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: isDraggingThisMesa ? '0 8px 25px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.1)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: isDraggingThisMesa 
                      ? 'linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))'
                      : 'none',
                    borderRadius: 'inherit'
                  }
                }}
              >
                {/* Indicador de arrastre */}
                {isDraggingThisMesa && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -8,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(255,193,7,0.9)',
                      color: 'black',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      zIndex: 1001,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      animation: 'pulse 1s infinite'
                    }}
                  >
                    Moviendo
                  </Box>
                )}
                
                {/* Número de mesa */}
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 'bold',
                    color: colors.text,
                    fontSize: Math.min(mesaSize * zoomLevel * 0.45, 72), // Triple del tamaño anterior (0.15 -> 0.45, 24 -> 72)
                    textShadow: isDraggingThisMesa ? '0 1px 3px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {mesa.numero}
                </Typography>
                
                {/* Observaciones */}
                {mesa.observaciones && (
                  <Typography
                    variant="caption"
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      left: 2,
                      right: 2,
                      color: colors.text,
                      fontSize: Math.min(mesaSize * zoomLevel * 0.06, 8),
                      textAlign: 'center',
                      opacity: 0.7,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {mesa.observaciones}
                  </Typography>
                )}
              </Box>
              
              {/* Icono de ajuste FUERA del contenedor en modo edición */}
              {modoEdicion && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: -12,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    color: '#1976d2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    cursor: 'pointer',
                    border: '2px solid #1976d2',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    zIndex: 1002,
                    '&:hover': {
                      backgroundColor: '#1976d2',
                      color: 'white',
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMesaDoubleClick(mesa);
                  }}
                  title="Editar mesa"
                >
                  ⚙️
                </Box>
              )}
              </Box>
            );
          })}

          {/* Indicador de nueva mesa */}
          {!dragging && mesas.length === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <Plus size={48} style={{ marginBottom: 16 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                {modoEdicion ? 'Modo edición activado' : 'Doble clic para crear tu primera mesa'}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => onNuevaMesa(400, 200)}
                startIcon={<Plus size={20} />}
                sx={{
                  fontSize: '1.1rem',
                  padding: '12px 24px',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Crear Primera Mesa
              </Button>
            </Box>
          )}

          {/* Botón flotante para crear mesa cuando hay mesas existentes */}
          {!dragging && mesas.length > 0 && modoEdicion && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 24,
                right: 24,
                zIndex: 1000
              }}
            >
              <Button
                variant="contained"
                onClick={() => onNuevaMesa(200, 150)}
                startIcon={<Plus size={20} />}
                sx={{
                  minWidth: 'auto',
                  padding: '12px 16px',
                  borderRadius: '50px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
                    transform: 'translateY(-2px)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Nueva Mesa
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Menú contextual */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined
        }
        open={Boolean(contextMenu)}
        onClose={handleCloseContextMenu}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              maxWidth: 300,
              borderRadius: 2,
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
            }
          }
        }}
      >
        {contextMenu && (
          <>
            {/* Header del menú */}
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Mesa {contextMenu.mesa.numero}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Estado: {getEstadoText(contextMenu.mesa.estado)}
              </Typography>
            </Box>
            
            <Divider />
            
            {/* Opciones de cambio de estado */}
            <Box sx={{ py: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
                Cambiar estado
              </Typography>
              {getMenuOptions(contextMenu.mesa).map((option, index) => (
                <MenuItem
                  key={index}
                  onClick={() => {
                    option.action();
                    handleCloseContextMenu();
                  }}
                >
                  <ListItemIcon sx={{ color: option.color }}>
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText primary={option.text} />
                </MenuItem>
              ))}
            </Box>
            
            <Divider />
            
            {/* Opciones de edición */}
            <Box sx={{ py: 1 }}>
              <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
                Edición
              </Typography>
              <MenuItem onClick={() => {
                handleMesaDoubleClick(contextMenu.mesa);
                handleCloseContextMenu();
              }}>
                <ListItemIcon>
                  <Edit size={16} />
                </ListItemIcon>
                <ListItemText primary="Editar mesa" />
              </MenuItem>
              <MenuItem onClick={() => {
                handleEliminarMesa(contextMenu.mesa);
                handleCloseContextMenu();
              }}>
                <ListItemIcon sx={{ color: 'error.main' }}>
                  <Delete size={16} />
                </ListItemIcon>
                <ListItemText primary="Eliminar mesa" />
              </MenuItem>
            </Box>
            
            <Divider />
            
            {/* Atajos de teclado */}
            <Box sx={{ p: 2, pt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Enter: Abrir • F2: Editar • Del: Eliminar • Esc: Cerrar
              </Typography>
            </Box>
          </>
        )}
      </Menu>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog
        open={confirmDelete.open}
        onClose={handleCancelDelete}
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Delete color="error" />
            Confirmar eliminación
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que quieres eliminar la mesa {confirmDelete.mesa?.numero}?
            Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popover para editar tamaño */}
      <Popper
        open={Boolean(editAnchor)}
        anchorEl={editAnchor}
        placement="bottom-start"
        transition
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <ClickAwayListener onClickAway={handleCloseEditSize}>
              <Paper elevation={8} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Tamaño de mesa
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton size="small" onClick={handleDecrementSize}>
                    <Minus size={16} />
                  </IconButton>
                  <Box sx={{ width: 120 }}>
                    <Slider
                      value={editingMesa?.size || defaultSize}
                      onChange={(_, value) => handleSizeChange(value as number)}
                      min={30}
                      max={150}
                      step={5}
                      marks
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>
                  <IconButton size="small" onClick={handleIncrementSize}>
                    <Plus size={16} />
                  </IconButton>
                </Stack>
              </Paper>
            </ClickAwayListener>
          </Grow>
        )}
      </Popper>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Formulario de objeto decorativo */}
      {dialogoObjeto && (
        <FormularioObjetoDecorativo
          objeto={objetoEditando}
          sectorId={sector.id}
          onGuardar={handleGuardarObjeto}
          onCancelar={() => {
            setDialogoObjeto(false);
            setObjetoEditando(null);
          }}
        />
      )}
    </Box>
  );
};

export default MesaGridCanvas;