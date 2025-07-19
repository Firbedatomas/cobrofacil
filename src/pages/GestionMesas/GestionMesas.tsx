import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper, 
  Stack, 
  Fade,
  useTheme,
  alpha,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { Add, Edit, Save, Cancel, Visibility, Settings } from '@mui/icons-material';

// Componentes
import SectorTabs from './components/SectorTabs';
import OcupacionGeneral from './components/OcupacionGeneral';

// Servicios
import { toastService } from '../../services/toastService';
import MesaGridCanvas from './components/MesaGridCanvas';
import FormularioSector from './components/FormularioSector';
import FormularioMesa from './components/FormularioMesa';
import FormularioObjetoDecorativo from './components/FormularioObjetoDecorativo';
import VentaIntegralV2 from './components/VentaIntegralV2';
import SeleccionMozo from './components/SeleccionMozo';
import AdvertenciaAfip from '../../components/AdvertenciaAfip';
import BloqueoTurno from '../../components/ProtectedRoute'; // Renombrado a BloqueoTurno

// Servicios y tipos
import { sectoresApi, mesasApi } from '../../services/mesasApi';
import { EstadoMesa } from '../../types/mesas';
import type { Sector, Mesa } from '../../types/mesas';

// Interfaces para mozos
interface Mozo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

const GestionMesas: React.FC = () => {
  const theme = useTheme();
  const canvasRef = useRef<HTMLDivElement>(null);
  const cargandoRef = useRef(false);
  
  // Estados principales
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [sectorActivo, setSectorActivo] = useState<string>('');
  const [cargando, setCargando] = useState(true);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  // Estados de diálogos
  const [dialogoSector, setDialogoSector] = useState(false);
  const [dialogoMesa, setDialogoMesa] = useState(false);
  const [dialogoObjeto, setDialogoObjeto] = useState(false);
  const [sectorEditando, setSectorEditando] = useState<Sector | null>(null);
  const [mesaEditando, setMesaEditando] = useState<Mesa | null>(null);
  
  // Estados para gestión de ventas y mozos
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [panelVentaMesa, setPanelVentaMesa] = useState(false);
  const [mostrarSeleccionMozo, setMostrarSeleccionMozo] = useState(false);
  const [mozoSeleccionado, setMozoSeleccionado] = useState<Mozo | null>(null);
  const [usuarioActual, setUsuarioActual] = useState<any>(null);
  
  // Estados para notificaciones
  const [notificacion, setNotificacion] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // ✅ Integrar toastService con el sistema de notificaciones existente
  useEffect(() => {
    toastService.setHandler(({ message, type = 'success' }: any) => {
      setNotificacion({
        open: true,
        message,
        severity: type
      });
    });
  }, []);
  
  // ==========================================
  // 🎯 SISTEMA DE CAMBIOS PENDIENTES
  // ==========================================
  const [cambiosPendientes, setCambiosPendientes] = useState<{
    mesas: { id: string; posicionX: number; posicionY: number }[];
    objetos: { id: string; posicionX: number; posicionY: number }[];
  }>({
    mesas: [],
    objetos: []
  });

  // Función para obtener todas las mesas disponibles para transferir
  const obtenerMesasDisponibles = () => {
    const todasLasMesas: Mesa[] = [];
    sectores.forEach(sector => {
      if (sector.mesas) {
        sector.mesas.forEach(mesa => {
          // Excluir la mesa actual (origen) para transferir
          if (mesa.id !== mesaSeleccionada?.id) {
            todasLasMesas.push({
              ...mesa,
              sector: {
                id: sector.id,
                nombre: sector.nombre,
                color: sector.color
              }
            });
          }
        });
      }
    });
    return todasLasMesas;
  };

  // ==========================================
  // 🎯 VALIDACIÓN AUTOMÁTICA DE ESTADOS SEGÚN @estadomesas.mdc
  // ==========================================
  const validarYCorregirEstadosMesas = async () => {
    try {
      console.log('🔍 Iniciando validación de estados de mesas...');
      let mesasCorregidas = 0;
      const { default: ventasActivasService } = await import('../../services/ventasActivasService');
      
      for (const sector of sectores) {
        if (!sector.mesas) continue;
        
        for (const mesa of sector.mesas) {
          try {
            // Verificar si la mesa tiene ítems activos
            const ventaActiva = await ventasActivasService.obtenerVentaActiva(mesa.id);
            const tieneItems = ventaActiva && ventaActiva.items && ventaActiva.items.length > 0;
            
            // Determinar el estado correcto según @estadomesas.mdc
            let estadoCorrector: EstadoMesa;
            
            if (tieneItems) {
              // ✅ CRITERIO 2: Estado Rojo - Cualquier ítem cargado
              estadoCorrector = EstadoMesa.OCUPADA;
            } else {
              // ✅ CRITERIO 2: Estado Verde - No hay ítems cargados
              estadoCorrector = EstadoMesa.LIBRE;
            }
            
            // Solo corregir si el estado no coincide
            if (mesa.estado !== estadoCorrector) {
              console.log(`🔧 Corrigiendo Mesa ${mesa.numero}: ${mesa.estado} → ${estadoCorrector}${tieneItems ? ' (tiene ítems)' : ' (sin ítems)'}`);
              
              // Actualizar en BD usando la función específica para cambiar estado
              await mesasApi.cambiarEstado(mesa.id, estadoCorrector);
              
              // Actualizar estado local
              handleCambiarEstadoMesa(mesa, estadoCorrector);
              
              mesasCorregidas++;
            } else {
              console.log(`✅ Mesa ${mesa.numero}: Estado correcto (${mesa.estado})`);
            }
            
          } catch (error) {
            console.error(`❌ Error validando mesa ${mesa.numero}:`, error);
          }
        }
      }
      
      if (mesasCorregidas > 0) {
        mostrarNotificacion(`Estados corregidos: ${mesasCorregidas} mesa${mesasCorregidas > 1 ? 's' : ''}`, 'success');
        console.log(`✅ Validación completada: ${mesasCorregidas} mesas corregidas`);
      } else {
        console.log('✅ Validación completada: Todos los estados son correctos');
      }
      
    } catch (error) {
      console.error('❌ Error en validación de estados:', error);
      mostrarNotificacion('Error validando estados de mesas', 'error');
    }
  };
  
  // Estados de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  });

  // Configurar atajos de teclado globales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Solo procesar si no hay inputs activos
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          if (sectorActivo) {
            handleCrearMesa(sectorActivo);
          }
          break;
        case 'e':
          e.preventDefault();
          if (sectorActivo) {
            setModoEdicion(!modoEdicion);
            mostrarNotificacion(`Modo edición ${!modoEdicion ? 'activado' : 'desactivado'}`, 'info');
          }
          break;
        case 's':
          e.preventDefault();
          if (sectorActivo) {
            const sectorSeleccionado = sectores.find(s => s.id === sectorActivo);
            if (sectorSeleccionado?.mesas && sectorSeleccionado.mesas.length > 0) {
              const primeramesa = sectorSeleccionado.mesas[0];
              handleGestionarMesa(primeramesa);
            }
          }
          break;
        case 'escape':
          e.preventDefault();
          if (modoEdicion) {
            setModoEdicion(false);
            mostrarNotificacion('Modo edición desactivado', 'info');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sectorActivo, modoEdicion, sectores]);

  // Función para asegurar el focus en el canvas
  const ensureCanvasFocus = () => {
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.focus();
      }
    }, 100);
  };

  // Cargar sectores al iniciar - CON PROTECCIÓN CONTRA DUPLICADOS
  useEffect(() => {
    // Solo cargar si no estamos ya cargando y no hay sectores
    if (!cargandoRef.current && sectores.length === 0) {
      cargarSectores();
      cargarUsuarioActual();
    }
  }, []);

  const mostrarNotificacion = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotificacion({ open: true, message, severity });
  };

  const cargarUsuarioActual = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUsuarioActual(userData.usuario);
        }
      }
    } catch (error) {
      console.error('Error cargando usuario actual:', error);
    }
  };

  const cargarSectores = async () => {
    // Evitar llamadas duplicadas simultáneas
    if (cargandoRef.current) {
      console.log('🔄 Carga de sectores ya en progreso, ignorando llamada duplicada');
      return;
    }
    
    try {
      cargandoRef.current = true;
      setCargando(true);
      console.log('🚀 Iniciando carga de sectores...');
      
      const sectoresData = await sectoresApi.obtenerTodos();
      setSectores(sectoresData);
      
      // Seleccionar primer sector si existe y no hay uno activo
      if (sectoresData.length > 0 && !sectorActivo) {
        setSectorActivo(sectoresData[0].id);
      }
      
      console.log(`✅ Sectores cargados exitosamente: ${sectoresData.length} sectores`);
      
      // ✅ VALIDACIÓN AUTOMÁTICA: Verificar y corregir estados según @estadomesas.mdc
      // Ejecutar validación después de que los sectores estén en el estado
      setTimeout(() => validarYCorregirEstadosMesas(), 1000);
    } catch (error: any) {
      console.error('❌ Error cargando sectores:', error);
      
      // Mostrar mensaje específico según el tipo de error
      if (error.message?.includes('Rate limit exceeded')) {
        mostrarNotificacion('Servidor sobrecargado. Reintentando en un momento...', 'warning');
        // Reintentar automáticamente después de un delay
        setTimeout(() => {
          if (!cargandoRef.current) {
            cargarSectores();
          }
        }, 3000);
      } else if (error.message?.includes('Network Error')) {
        mostrarNotificacion('Error de conexión. Verifica tu conexión a internet', 'error');
      } else {
        mostrarNotificacion('Error al cargar los sectores. Recarga la página si persiste', 'error');
      }
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  };

  const handleSectorChange = (sectorId: string) => {
    setSectorActivo(sectorId);
    ensureCanvasFocus();
  };

  const handleCrearSector = async (nuevoSector: any) => {
    try {
      const sector = await sectoresApi.crear(nuevoSector);
      setSectores([...sectores, sector]);
      setSectorActivo(sector.id);
      setDialogoSector(false);
      setSectorEditando(null);
      mostrarNotificacion('Sector creado exitosamente', 'success');
      ensureCanvasFocus();
    } catch (error) {
      console.error('Error creando sector:', error);
      mostrarNotificacion('Error al crear el sector', 'error');
    }
  };

  const handleEditarSector = (sector: Sector) => {
    setSectorEditando(sector);
    setDialogoSector(true);
  };

  const handleActualizarSector = async (sectorActualizado: any) => {
    try {
      const sector = await sectoresApi.actualizar(sectorEditando!.id, sectorActualizado);
      setSectores(sectores.map(s => s.id === sector.id ? sector : s));
      setDialogoSector(false);
      setSectorEditando(null);
      mostrarNotificacion('Sector actualizado exitosamente', 'success');
      ensureCanvasFocus();
    } catch (error) {
      console.error('Error actualizando sector:', error);
      mostrarNotificacion('Error al actualizar el sector', 'error');
    }
  };

  const handleEliminarSector = async (sectorId: string) => {
    try {
      await sectoresApi.eliminar(sectorId);
      setSectores(sectores.filter(s => s.id !== sectorId));
      
      // Si se elimina el sector activo, seleccionar otro
      if (sectorActivo === sectorId) {
        const sectoresRestantes = sectores.filter(s => s.id !== sectorId);
        setSectorActivo(sectoresRestantes.length > 0 ? sectoresRestantes[0].id : '');
      }
      
      mostrarNotificacion('Sector eliminado exitosamente', 'success');
      ensureCanvasFocus();
    } catch (error) {
      console.error('Error eliminando sector:', error);
      mostrarNotificacion('Error al eliminar el sector', 'error');
    }
  };

  const handleEditarPlano = async (sectorId: string) => {
    setSectorActivo(sectorId);
    
    if (modoEdicion) {
      // ==========================================
      // 🎯 GUARDAR CAMBIOS PENDIENTES
      // ==========================================
      // Si ya estaba en modo edición, guardar cambios pendientes
      if (cambiosPendientes.mesas.length > 0 || cambiosPendientes.objetos.length > 0) {
        try {
          console.log('🚀 Guardando cambios pendientes antes de salir del modo edición:', cambiosPendientes);
          
          // Verificar token antes de las peticiones
          const token = localStorage.getItem('authToken');
          if (!token) {
            mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
            window.location.href = '/login';
            return;
          }
          
          // ==========================================
          // 🎯 GUARDADO COMPLETO (BD + ESTADO)
          // ==========================================
          // Guardar en BD y actualizar estado en una sola operación
          // ==========================================
          
          // Guardar cambios de mesas (BD + estado)
          for (const cambioMesa of cambiosPendientes.mesas) {
            await handleMoverMesa(cambioMesa.id, cambioMesa.posicionX, cambioMesa.posicionY, false);
          }
          
          // Guardar cambios de objetos (BD + estado)
          for (const cambioObjeto of cambiosPendientes.objetos) {
            await handleMoverObjeto(cambioObjeto.id, cambioObjeto.posicionX, cambioObjeto.posicionY, false);
          }
          
          // Limpiar cambios pendientes
          setCambiosPendientes({ mesas: [], objetos: [] });
          
          const totalCambios = cambiosPendientes.mesas.length + cambiosPendientes.objetos.length;
          mostrarNotificacion(`✅ ${totalCambios} cambios guardados exitosamente`, 'success');
          
          console.log('✅ Cambios pendientes guardados exitosamente');
          
          // ==========================================
          // 🎯 NO RECARGAR DATOS INMEDIATAMENTE
          // ==========================================
          // Evitamos recargar los sectores para que las mesas 
          // mantengan su posición visual después del guardado
          // Los datos ya están actualizados en BD
          // ==========================================
          // await cargarSectores(); // ❌ Comentado para evitar reset visual
        } catch (error: any) {
          console.error('❌ Error guardando cambios pendientes:', error);
          
          // Manejar error 401 específicamente
          if (error.response?.status === 401 || error.message?.includes('401')) {
            mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
            localStorage.removeItem('authToken');
            window.location.href = '/login';
            return;
          }
          
          mostrarNotificacion('❌ Error al guardar cambios pendientes', 'error');
          return; // No salir del modo edición si hay error
        }
      }
      
      // Salir del modo edición
      setModoEdicion(false);
      mostrarNotificacion('Modo edición desactivado - Cambios guardados', 'success');
    } else {
      // Entrar en modo edición
      setModoEdicion(true);
      mostrarNotificacion('Modo edición activado', 'info');
    }
    
    ensureCanvasFocus();
  };

  const handleCrearMesa = (sectorId: string) => {
    setMesaEditando(null);
    setDialogoMesa(true);
  };

  const handleCrearObjeto = (sectorId: string) => {
    console.log('🎨 Creando objeto decorativo para sector:', sectorId);
    
    // Activar modo edición si no está activo
    if (!modoEdicion) {
      setModoEdicion(true);
      mostrarNotificacion('Modo edición activado para crear objeto', 'info');
    }
    
    // Abrir formulario de objeto directamente
    setDialogoObjeto(true);
    setSectorActivo(sectorId);
  };

  const handleGestionarMesa = async (mesa: Mesa) => {
    setMesaSeleccionada(mesa);
    
    try {
      // ✅ NUEVO SISTEMA: Verificar si ya hay un mozo asignado a esta mesa
      const { default: asignacionesMozoService } = await import('../../services/asignacionesMozoService');
      const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesa.id);
      
      if (mozoAsignado) {
        // ✅ YA HAY MOZO ASIGNADO - Abrir directamente el modal de ventas
        console.log('🎯 Mesa ya tiene mozo asignado:', `${mozoAsignado.nombre} ${mozoAsignado.apellido}`);
        console.log('🚀 Abriendo modal de ventas directamente...');
        
        setPanelVentaMesa(true);
        
        mostrarNotificacion(
          `Mesa ${mesa.numero} - Mozo: ${mozoAsignado.nombre} ${mozoAsignado.apellido}`,
          'info'
        );
        
      } else {
        // ✅ NO HAY MOZO ASIGNADO - Mostrar modal de selección
        console.log('🎯 Mesa sin mozo asignado, mostrando selección...');
        setMostrarSeleccionMozo(true);
      }
      
    } catch (error) {
      console.error('❌ Error verificando mozo asignado:', error);
      // En caso de error, mostrar modal de selección como fallback
      setMostrarSeleccionMozo(true);
    }
  };

  // ==========================================
  // 🎯 FUNCIÓN PARA VALIDAR UNA MESA INDIVIDUAL
  // ==========================================
  const validarEstadoMesaIndividual = async (mesaId: string) => {
    try {
      const { default: ventasActivasService } = await import('../../services/ventasActivasService');
      
      // Encontrar la mesa en los sectores
      let mesaEncontrada: Mesa | null = null;
      for (const sector of sectores) {
        if (sector.mesas) {
          const mesa = sector.mesas.find(m => m.id === mesaId);
          if (mesa) {
            mesaEncontrada = mesa;
            break;
          }
        }
      }
      
      if (!mesaEncontrada) return;
      
      // Verificar si la mesa tiene ítems activos
      const ventaActiva = await ventasActivasService.obtenerVentaActiva(mesaId);
      const tieneItems = ventaActiva && ventaActiva.items && ventaActiva.items.length > 0;
      
      // Determinar el estado correcto según @estadomesas.mdc
      const estadoCorrector = tieneItems ? EstadoMesa.OCUPADA : EstadoMesa.LIBRE;
      
      // Solo corregir si el estado no coincide
      if (mesaEncontrada.estado !== estadoCorrector) {
        console.log(`🔧 Validación individual - Mesa ${mesaEncontrada.numero}: ${mesaEncontrada.estado} → ${estadoCorrector}`);
        
        // Actualizar en BD
        await mesasApi.cambiarEstado(mesaId, estadoCorrector);
        
        // Actualizar estado local
        handleCambiarEstadoMesa(mesaEncontrada, estadoCorrector);
        
        // ✅ CRÍTICO: Si la mesa queda LIBRE (sin productos), liberar automáticamente el mozo
        if (estadoCorrector === EstadoMesa.LIBRE && !tieneItems) {
          try {
            const { default: asignacionesMozoService } = await import('../../services/asignacionesMozoService');
            
            // Verificar si hay mozo asignado
            const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesaId);
            
            if (mozoAsignado) {
              console.log(`🧹 Mesa ${mesaEncontrada.numero} vacía → Liberando mozo: ${mozoAsignado.nombre}`);
              
              // Liberar mozo automáticamente
              await asignacionesMozoService.liberarMozo(
                mesaId, 
                'Mesa vacía - Liberación automática'
              );
              
              console.log('✅ Mozo liberado automáticamente de mesa vacía');
            }
          } catch (mozoError) {
            console.error('⚠️ Error liberando mozo de mesa vacía:', mozoError);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error validando mesa individual ${mesaId}:`, error);
    }
  };

  // ✅ Función auxiliar para liberar mozo automáticamente cuando mesa quede vacía
  const liberarMozoSiMesaVacia = async (mesaId: string, motivoLiberacion: string = 'Mesa vacía - Liberación automática') => {
    try {
      const { default: asignacionesMozoService } = await import('../../services/asignacionesMozoService');
      const { default: ventasActivasService } = await import('../../services/ventasActivasService');
      
      // Verificar si la mesa tiene productos
      const ventaActiva = await ventasActivasService.obtenerVentaActiva(mesaId);
      const tieneItems = ventaActiva && ventaActiva.items && ventaActiva.items.length > 0;
      
      // Solo liberar si NO tiene productos
      if (!tieneItems) {
        const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesaId);
        
        if (mozoAsignado) {
          console.log(`🧹 Liberando mozo automáticamente: ${mozoAsignado.nombre} de mesa vacía`);
          
          await asignacionesMozoService.liberarMozo(mesaId, motivoLiberacion);
          
          console.log('✅ Mozo liberado automáticamente - Mesa completamente limpia');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('⚠️ Error liberando mozo automáticamente:', error);
      return false;
    }
  };

  // ✅ Función para validar múltiples mesas (para transferencias)
  const validarMesasGlobal = async (mesaIds: string[]) => {
    try {
      console.log('🔍 Validando estados de múltiples mesas:', mesaIds);
      
      // Validar cada mesa individualmente
      const promesasValidacion = mesaIds.map(mesaId => 
        validarEstadoMesaIndividual(mesaId).catch(error => {
          console.error(`Error validando mesa ${mesaId}:`, error);
        })
      );
      
      await Promise.allSettled(promesasValidacion);
      
      // Sincronizar vista después de validar
      setTimeout(() => {
        cargarSectores();
      }, 300);
      
    } catch (error) {
      console.error('❌ Error validando mesas globalmente:', error);
    }
  };

  // ✅ NUEVO SISTEMA: Manejo de asignaciones mozo-mesa con persistencia inmediata
  const handleSeleccionarMozo = async (mozo: Mozo): Promise<void> => {
    try {
      console.log('🚀 Iniciando asignación de mozo con nuevo sistema:', { 
        mozoId: mozo.id, 
        mesaId: mesaSeleccionada?.id 
      });

      // Validaciones previas críticas
      if (!mesaSeleccionada) {
        throw new Error('No hay mesa seleccionada');
      }

      if (!mozo || !mozo.id) {
        throw new Error('Datos de mozo inválidos');
      }

      // Importar el nuevo servicio de asignaciones
      const { default: asignacionesMozoService } = await import('../../services/asignacionesMozoService');

      // CRITERIO 1: Persistencia inmediata del mozo vinculado a la mesa
      const asignacion = await asignacionesMozoService.asignarMozo(
        mesaSeleccionada.id,
        mozo.id,
        'Asignación desde selección de mozo'
      );

      console.log('✅ Mozo asignado exitosamente:', asignacion);

      // ✅ FLUJO EXITOSO: Actualizar estados de manera consistente
      setMozoSeleccionado(mozo);
      
      // CRITERIO 6: Abrir panel de ventas automáticamente
      console.log('🚀 Abriendo panel de ventas...', { mesaSeleccionada: mesaSeleccionada?.numero });
      setPanelVentaMesa(true);
      console.log('✅ setPanelVentaMesa(true) ejecutado');
      
      // Mostrar notificación de éxito
      mostrarNotificacion(
        `Mozo asignado: ${mozo.nombre} ${mozo.apellido} - Mesa lista para trabajar`,
        'success'
      );

      console.log('🎯 Flujo completo exitoso - Panel de ventas abierto y mantenido automáticamente');
      
    } catch (error) {
      console.error('❌ Error en asignación de mozo:', error);
      
      // Mostrar error específico al usuario
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      mostrarNotificacion(`Error: ${errorMessage}`, 'error');
      
      // ✅ IMPORTANTE: Re-lanzar el error para que handleSeleccionar no cierre el modal
      throw error;
    }
  };

  // ✅ MEJORADO: Limpieza inteligente al cerrar modal de selección
  const handleCerrarSeleccionMozo = () => {
    console.log('🚪 Cerrando modal de selección de mozo');
    
    // Cerrar solo el modal de selección
    setMostrarSeleccionMozo(false);
    
    // ✅ CRÍTICO: NO limpiar mesaSeleccionada si el panel de ventas está abierto
    // Esto permite mantener el flujo: seleccionar mozo → abrir panel de ventas
    if (!panelVentaMesa) {
      setMesaSeleccionada(null);
      setMozoSeleccionado(null);
      console.log('✅ Estados limpiados (panel de ventas no activo)');
    } else {
      console.log('✅ Estados mantenidos (panel de ventas activo)');
    }
  };

  // ✅ NUEVA FUNCIÓN: Limpiar mozo de mesa (cuando se completa una venta)
  const limpiarMozoMesa = async (mesaId: string) => {
    try {
      const { ventasActivasService } = await import('../../services/ventasActivasService');
      
      // Completar la venta activa (esto limpia el mozo)
      await ventasActivasService.completarVenta(mesaId);
      
      console.log('✅ Mozo eliminado de mesa:', mesaId);
      
    } catch (error) {
      console.error('❌ Error limpiando mozo de mesa:', error);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cambiar mozo de mesa (forzar selección nuevo mozo)
  const cambiarMozoMesa = async (mesa: Mesa) => {
    try {
      console.log('🔄 Cambiando mozo de mesa:', mesa.numero);
      
      // Limpiar mozo actual
      await limpiarMozoMesa(mesa.id);
      
      // Mostrar modal de selección nuevamente
      setMesaSeleccionada(mesa);
      setMostrarSeleccionMozo(true);
      
      mostrarNotificacion(
        `Seleccione nuevo mozo para mesa ${mesa.numero}`,
        'info'
      );
      
    } catch (error) {
      console.error('❌ Error cambiando mozo de mesa:', error);
      mostrarNotificacion('Error al cambiar mozo de mesa', 'error');
    }
  };

  const handleEditarMesa = (mesa: Mesa) => {
    setMesaEditando(mesa);
    setDialogoMesa(true);
  };

  const handleCambiarEstadoMesa = (mesa: Mesa, nuevoEstado: EstadoMesa) => {
    // Actualizar estado local inmediatamente
    setSectores(sectoresActuales => {
      const nuevos = sectoresActuales.map(sector => ({
        ...sector,
        mesas: sector.mesas?.map(m => 
          m.id === mesa.id ? { ...m, estado: nuevoEstado } : m
        ) || []
      }));
      return nuevos;
    });

    // Actualizar mesa seleccionada si es la misma
    if (mesaSeleccionada && mesaSeleccionada.id === mesa.id) {
      setMesaSeleccionada({ ...mesaSeleccionada, estado: nuevoEstado });
    }
    
    // Simular persistencia en el backend (evitar múltiples llamadas)
    setTimeout(() => {
      console.log('💾 Estado de mesa guardado en backend (simulado):', mesa.numero, nuevoEstado);
    }, 100);
  };

  // Handler para mover mesa - TIEMPO REAL BD SIN LOCALSTORAGE  
  const handleMoverMesa = async (mesaId: string, nuevaPosicionX: number, nuevaPosicionY: number, soloGuardarEnBD = false) => {
    try {
      // ==========================================
      // 🎯 ACTUALIZACIÓN CONDICIONAL DEL ESTADO
      // ==========================================
      // Solo actualizar estado si no es una operación de guardado por lotes
      // Esto evita conflictos con el sistema de cambios pendientes
      // ==========================================
      if (!soloGuardarEnBD) {
        // Actualizar posición en el estado local inmediatamente (UI responsiva)
        setSectores(sectoresActuales => {
          const nuevos = sectoresActuales.map(sector => ({
            ...sector,
            mesas: sector.mesas?.map(m => 
              m.id === mesaId 
                ? { ...m, posicionX: nuevaPosicionX, posicionY: nuevaPosicionY }
                : m
            ) || []
          }));
          return nuevos;
        });
      }

      // Verificar token antes de la petición
      const token = localStorage.getItem('authToken');
      if (!token) {
        mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
        window.location.href = '/login';
        return;
      }

      // Guardar inmediatamente en base de datos (BD como única fuente de verdad)
      await mesasApi.actualizar(mesaId, {
        posicionX: nuevaPosicionX,
        posicionY: nuevaPosicionY
      });

      console.log('✅ Mesa guardada en BD:', mesaId, { x: nuevaPosicionX, y: nuevaPosicionY }, soloGuardarEnBD ? '(solo BD)' : '(BD + estado)');
    } catch (error: any) {
      console.error('❌ Error guardando mesa en BD:', error);
      
      // Manejar error 401 específicamente
      if (error.response?.status === 401) {
        mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        return;
      }
      
      // Revertir cambio si hay error y recargar desde BD
      mostrarNotificacion('Error guardando posición, revirtiendo cambios', 'error');
      await cargarSectores();
    }
  };

  // Handler para mover objeto decorativo - TIEMPO REAL BD SIN LOCALSTORAGE
  const handleMoverObjeto = async (objetoId: string, nuevaPosicionX: number, nuevaPosicionY: number, soloGuardarEnBD = false) => {
    try {
      // ==========================================
      // 🎯 ACTUALIZACIÓN CONDICIONAL DEL ESTADO
      // ==========================================
      // Solo actualizar estado si no es una operación de guardado por lotes
      // Esto evita conflictos con el sistema de cambios pendientes
      // ==========================================
      if (!soloGuardarEnBD) {
        // Actualizar posición en el estado local inmediatamente (UI responsiva)
        setSectores(sectoresActuales => {
          const nuevos = sectoresActuales.map(sector => ({
            ...sector,
            objetosDecorativos: sector.objetosDecorativos?.map(obj => 
              obj.id === objetoId 
                ? { ...obj, posicionX: nuevaPosicionX, posicionY: nuevaPosicionY }
                : obj
            ) || []
          }));
          return nuevos;
        });
      }

      // Verificar token antes de la petición
      const token = localStorage.getItem('authToken');
      if (!token) {
        mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
        window.location.href = '/login';
        return;
      }

      // Guardar inmediatamente en base de datos (BD como única fuente de verdad)
      const response = await fetch(`/api/objetos-decorativos/${objetoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          posicionX: nuevaPosicionX,
          posicionY: nuevaPosicionY
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          mostrarNotificacion('Sesión expirada, redirigiendo al login...', 'error');
          localStorage.removeItem('authToken');
          window.location.href = '/login';
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Objeto guardado en BD:', objetoId, { x: nuevaPosicionX, y: nuevaPosicionY }, soloGuardarEnBD ? '(solo BD)' : '(BD + estado)');
    } catch (error: any) {
      console.error('❌ Error guardando objeto en BD:', error);
      
      // Revertir cambio si hay error y recargar desde BD
      mostrarNotificacion('Error guardando posición del objeto, revirtiendo cambios', 'error');
      await cargarSectores();
    }
  };

  // Handler para cerrar panel de venta
  const handleCerrarPanelVenta = () => {
    setPanelVentaMesa(false);
    setMesaSeleccionada(null);
    
    // ✅ NUEVO: También cerrar el modal de selección de mozo si está abierto
    // ya que ahora el panel de ventas se muestra dentro del mismo modal
    setMostrarSeleccionMozo(false);
    setMozoSeleccionado(null);
    
    // Restaurar focus al canvas después de cerrar panel
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.focus();
      }
    }, 100);
  };

  const sectorSeleccionado = sectores.find(s => s.id === sectorActivo);

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Cargando sectores...</Typography>
      </Box>
    );
  }

  return (
    <BloqueoTurno requiereTurno={true}>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AdvertenciaAfip />
        
        <Container maxWidth="xl" sx={{ py: 2, flex: 1, overflow: 'hidden' }}>
        <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.primary.main, 0.05)
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h4" component="h1" sx={{ 
                fontWeight: 'bold',
                color: theme.palette.primary.main
              }}>
                Gestión de Mesas
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setDialogoSector(true)}
                  size="small"
                >
                  Nuevo Sector
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Settings />}
                  onClick={validarYCorregirEstadosMesas}
                  size="small"
                  color="warning"
                  title="Validar y corregir estados de mesas según ítems cargados"
                >
                  Validar Estados
                </Button>
                
                {sectorActivo && (
                  <Button
                    variant={modoEdicion ? 'contained' : 'outlined'}
                    startIcon={modoEdicion ? <Save /> : <Edit />}
                    onClick={() => handleEditarPlano(sectorActivo)}
                    size="small"
                    color={modoEdicion ? 'primary' : 'inherit'}
                    sx={{
                      position: 'relative',
                      // Indicador de cambios pendientes
                      '&::after': (cambiosPendientes.mesas.length > 0 || cambiosPendientes.objetos.length > 0) && modoEdicion ? {
                        content: '""',
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'warning.main',
                        animation: 'pulse 2s infinite'
                      } : {}
                    }}
                  >
                    {modoEdicion ? 
                      `Guardar Cambios${
                        (cambiosPendientes.mesas.length > 0 || cambiosPendientes.objetos.length > 0) ? 
                          ` (${cambiosPendientes.mesas.length + cambiosPendientes.objetos.length})` : 
                          ''
                      }` : 
                      'Editar Plano'
                    }
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>

          {/* Sectores arriba */}
          <Box sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.default, 0.5)
          }}>
            <SectorTabs
              sectores={sectores}
              sectorActivo={sectorActivo}
              onSectorChange={handleSectorChange}
              onEditarSector={handleEditarSector}
              onEliminarSector={handleEliminarSector}
              onEditarPlano={handleEditarPlano}
              onCrearMesa={handleCrearMesa}
              onCrearObjeto={handleCrearObjeto}
              modoEdicion={modoEdicion}
            />
          </Box>

          {/* Contenido principal */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Sidebar con ocupación */}
            <Box sx={{ 
              width: 280, 
              borderRight: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.background.default, 0.3)
            }}>
              {/* Ocupación general */}
              <Box sx={{ p: 2 }}>
                {sectorSeleccionado && (
                  <OcupacionGeneral 
                    mesas={sectorSeleccionado.mesas || []}
                    sectorNombre={sectorSeleccionado.nombre}
                    sectorColor={sectorSeleccionado.color}
                    sectorIcono={sectorSeleccionado.icono}
                  />
                )}
              </Box>
            </Box>

            {/* Canvas principal */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {sectorSeleccionado ? (
                <>
                  <Box
                    ref={canvasRef}
                    tabIndex={0}
                    sx={{
                      flex: 1,
                      outline: 'none',
                      '&:focus': {
                        outline: 'none'
                      }
                    }}
                  >
                    <MesaGridCanvas
                      sector={sectorSeleccionado}
                      mesas={sectorSeleccionado.mesas || []}
                      modoEdicion={modoEdicion}
                      onMesaClick={handleGestionarMesa}
                      onMesaDoubleClick={handleEditarMesa}
                      onMesaContextMenu={(mesa, e) => handleGestionarMesa(mesa)}
                      onNuevaMesa={(posicionX: number, posicionY: number) => {
                        handleCrearMesa(sectorActivo!);
                      }}
                      onCambiarEstadoMesa={(mesaId: string, nuevoEstado: EstadoMesa) => {
                        const mesa = sectorSeleccionado.mesas?.find(m => m.id === mesaId);
                        if (mesa) {
                          handleCambiarEstadoMesa(mesa, nuevoEstado);
                        }
                      }}
                      onEliminarMesa={(id) => console.log('Eliminar mesa:', id)}
                      onActualizarTamanoMesa={(id, tamano) => console.log('Actualizar tamaño:', id, tamano)}
                      onMoverMesa={handleMoverMesa}
                      onMoverObjeto={handleMoverObjeto}
                      onCambiosPendientes={setCambiosPendientes}
                    />
                  </Box>
                </>
              ) : (
                /* Estado vacío */
                <Box sx={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  p: 4
                }}>
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    ¡Bienvenido a la gestión de mesas!
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                    Comienza creando tu primer sector para organizar las mesas de tu restaurante.
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setDialogoSector(true)}
                    startIcon={<Add />}
                  >
                    Crear Primer Sector
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Paper>
      </Container>

      {/* Diálogos */}
      {dialogoSector && (
        <FormularioSector
          sector={sectorEditando}
          onGuardar={sectorEditando ? handleActualizarSector : handleCrearSector}
          onCancelar={() => {
            setDialogoSector(false);
            setSectorEditando(null);
          }}
        />
      )}

      {dialogoMesa && (
        <FormularioMesa
          mesa={mesaEditando}
          sectorId={sectorActivo!}
          onGuardar={async (mesa: any) => {
            try {
              // ✅ DEBUGGING: Log detallado de los datos recibidos
              console.log('🚀 GestionMesas - Recibiendo datos para guardar mesa:', {
                mesa,
                mesaEditando: !!mesaEditando,
                sectorActivo,
                tipoSectorActivo: typeof sectorActivo,
                sectorActivoVacio: !sectorActivo
              });

              // ✅ CORREGIDO: Validación previa antes de enviar a la API
              if (!mesa.sectorId) {
                console.error('❌ Error crítico: sectorId no está presente en los datos:', mesa);
                mostrarNotificacion('Error: Sector no válido. Cierre el modal y vuelva a intentarlo.', 'error');
                return;
              }

              if (!mesa.numero || !mesa.numero.trim()) {
                console.error('❌ Error crítico: número de mesa no está presente:', mesa);
                mostrarNotificacion('Error: Número de mesa es requerido.', 'error');
                return;
              }

              if (mesaEditando) {
                // Actualizar mesa existente
                console.log('🔄 Actualizando mesa existente:', mesaEditando.id);
                const mesaActualizada = await mesasApi.actualizar(mesaEditando.id, mesa);
                setSectores(sectores.map(s => ({
                  ...s,
                  mesas: s.mesas?.map(m => m.id === mesaActualizada.id ? mesaActualizada : m) || []
                })));
                mostrarNotificacion('Mesa actualizada exitosamente', 'success');
              } else {
                // Crear nueva mesa
                console.log('📝 Creando nueva mesa con datos:', mesa);
                
                // ✅ CORREGIDO: Validación adicional para nueva mesa
                if (!sectorActivo) {
                  console.error('❌ Error crítico: sectorActivo no está presente');
                  mostrarNotificacion('Error: No hay sector activo seleccionado', 'error');
                  return;
                }

                const nuevaMesa = await mesasApi.crear(mesa);
                console.log('✅ Mesa creada exitosamente:', nuevaMesa);
                
                setSectores(sectores.map(s => 
                  s.id === sectorActivo 
                    ? { ...s, mesas: [...(s.mesas || []), nuevaMesa] }
                    : s
                ));
                mostrarNotificacion('Mesa creada exitosamente', 'success');
              }
              setDialogoMesa(false);
              setMesaEditando(null);
              
              // Restaurar focus al canvas
              setTimeout(() => {
                if (canvasRef.current) {
                  canvasRef.current.focus();
                }
              }, 100);
            } catch (error: any) {
              // ✅ DEBUGGING: Log detallado del error
              console.error('❌ Error guardando mesa:', error);
              console.error('❌ Datos que causaron el error:', {
                mesa,
                mesaEditando: !!mesaEditando,
                sectorActivo,
                errorResponse: error.response?.data,
                errorStatus: error.response?.status,
                errorMessage: error.message
              });
              
              // ✅ CORREGIDO: Manejo específico de errores
              if (error.response?.status === 400) {
                const errorMessage = error.response.data?.error || 'Error de validación';
                console.error('❌ Error de validación del servidor:', errorMessage);
                mostrarNotificacion(`Error de validación: ${errorMessage}`, 'error');
              } else if (error.response?.status === 401) {
                console.error('❌ Error de autenticación');
                mostrarNotificacion('Sesión expirada. Inicie sesión nuevamente.', 'error');
                localStorage.removeItem('authToken');
                window.location.href = '/login';
              } else if (error.response?.status === 409) {
                console.error('❌ Error de conflicto (mesa duplicada)');
                mostrarNotificacion('Ya existe una mesa con ese número en el sector', 'error');
              } else if (error.code === 'NETWORK_ERROR' || !error.response) {
                console.error('❌ Error de red');
                mostrarNotificacion('Error de conexión. Verifique su conexión a internet.', 'error');
              } else {
                console.error('❌ Error desconocido');
                mostrarNotificacion('Error al guardar la mesa. Intente nuevamente.', 'error');
              }
            }
          }}
          onCancelar={() => {
            setDialogoMesa(false);
            setMesaEditando(null);
            
            // Restaurar focus al canvas
            setTimeout(() => {
              if (canvasRef.current) {
                canvasRef.current.focus();
              }
            }, 100);
          }}
        />
      )}

      {/* Diálogo de objeto decorativo */}
      {dialogoObjeto && (
        <FormularioObjetoDecorativo
          sectorId={sectorActivo!}
          onGuardar={async (objetoData: any) => {
            try {
              // Crear nuevo objeto decorativo
              const response = await fetch('/api/objetos-decorativos', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify(objetoData)
              });

              if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
              }

              const nuevoObjeto = await response.json();
              
              // Actualizar sectores con el nuevo objeto
              setSectores(sectores.map(s => 
                s.id === sectorActivo 
                  ? { ...s, objetosDecorativos: [...(s.objetosDecorativos || []), nuevoObjeto] }
                  : s
              ));
              
              mostrarNotificacion('Objeto decorativo creado exitosamente', 'success');
              setDialogoObjeto(false);
              
              // Restaurar focus al canvas
              setTimeout(() => {
                if (canvasRef.current) {
                  canvasRef.current.focus();
                }
              }, 100);
            } catch (error) {
              console.error('Error creando objeto decorativo:', error);
              mostrarNotificacion('Error al crear el objeto decorativo', 'error');
            }
          }}
          onCancelar={() => {
            setDialogoObjeto(false);
            
            // Restaurar focus al canvas
            setTimeout(() => {
              if (canvasRef.current) {
                canvasRef.current.focus();
              }
            }, 100);
          }}
        />
      )}

      {/* Panel de gestión de mesa */}
      {panelVentaMesa && mesaSeleccionada && !mostrarSeleccionMozo && (
        <VentaIntegralV2
          mesa={mesaSeleccionada}
          isOpen={panelVentaMesa}
          onClose={handleCerrarPanelVenta}
          onCambiarEstado={(mesa: Mesa, nuevoEstado: EstadoMesa) => {
            handleCambiarEstadoMesa(mesa, nuevoEstado);
          }}
          onVentaCompleta={(venta: any) => {
            console.log('Venta completada:', venta);
            handleCerrarPanelVenta();
            // ✅ Liberar mozo inmediatamente al completar venta
            setTimeout(() => liberarMozoSiMesaVacia(mesaSeleccionada.id, 'Venta completada y cobrada'), 300);
            // ✅ Validar estado después de completar venta
            setTimeout(() => validarEstadoMesaIndividual(mesaSeleccionada.id), 500);
          }}
          mesasDisponibles={obtenerMesasDisponibles()}
          onValidarEstado={() => validarEstadoMesaIndividual(mesaSeleccionada.id)}
          onValidarMesasGlobal={validarMesasGlobal}
        />
      )}

      {/* Selección de mozo o Panel de ventas */}
      {mostrarSeleccionMozo && mesaSeleccionada && (
        <>
          {/* Si ya se seleccionó mozo y se abrió el panel de ventas, mostrar el panel de ventas */}
          {panelVentaMesa ? (
            <VentaIntegralV2
              mesa={mesaSeleccionada}
              isOpen={true}
              onClose={handleCerrarPanelVenta}
              onCambiarEstado={(mesa: Mesa, nuevoEstado: EstadoMesa) => {
                handleCambiarEstadoMesa(mesa, nuevoEstado);
              }}
              onVentaCompleta={(venta: any) => {
                console.log('Venta completada:', venta);
                handleCerrarPanelVenta();
                // ✅ Liberar mozo inmediatamente al completar venta
                setTimeout(() => liberarMozoSiMesaVacia(mesaSeleccionada.id, 'Venta completada y cobrada'), 300);
                // ✅ Validar estado después de completar venta
                setTimeout(() => validarEstadoMesaIndividual(mesaSeleccionada.id), 500);
              }}
              mesasDisponibles={obtenerMesasDisponibles()}
              onValidarEstado={() => validarEstadoMesaIndividual(mesaSeleccionada.id)}
              onValidarMesasGlobal={validarMesasGlobal}
            />
          ) : (
            /* Si no se ha seleccionado mozo, mostrar el selector de mozo */
            <SeleccionMozo
              open={true}
              onClose={handleCerrarSeleccionMozo}
              onSeleccionar={handleSeleccionarMozo}
              usuarioActual={usuarioActual}
            />
          )}
        </>
      )}

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={notificacion.open}
        autoHideDuration={3000}
        onClose={() => setNotificacion({ ...notificacion, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={notificacion.severity} variant="filled">
          {notificacion.message}
        </Alert>
      </Snackbar>
    </Box>
    </BloqueoTurno>
  );
};

export default GestionMesas; 