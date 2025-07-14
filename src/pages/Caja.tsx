import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Avatar,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
  InputAdornment,
  CircularProgress,
  Badge,
  Stack,
  ListItemSecondaryAction
} from '@mui/material';

// Icons
import PosIcon from '@mui/icons-material/PointOfSale';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import LockIcon from '@mui/icons-material/Lock';
import HistoryIcon from '@mui/icons-material/History';
import CalculateIcon from '@mui/icons-material/Calculate';
import PrintIcon from '@mui/icons-material/Print';
import SaleIcon from '@mui/icons-material/ShoppingCart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ExpenseIcon from '@mui/icons-material/ShoppingBag';
import BankIcon from '@mui/icons-material/AccountBalance';
import AdjustIcon from '@mui/icons-material/Tune';
import TransferIcon from '@mui/icons-material/CompareArrows';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import ForceCloseIcon from '@mui/icons-material/AdminPanelSettings';
import RefreshIcon from '@mui/icons-material/Refresh';
import Receipt from '@mui/icons-material/Receipt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';

// Services
import turnosService, { 
  type Turno, 
  type MovimientoCaja, 
  type AbrirTurnoDto, 
  type CerrarTurnoDto,
  type RegistrarMovimientoDto,
  type ForzarCierreDto
} from '../services/turnosService';
import api from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`caja-tabpanel-${index}`}
      aria-labelledby={`caja-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface ConfiguracionTurno {
  numero: number;
  nombre: string;
  habilitado: boolean;
}

const Caja = () => {
  const [tabValue, setTabValue] = useState(0);
  
  // Estados de diálogos
  const [openApertura, setOpenApertura] = useState(false);
  const [openCierre, setOpenCierre] = useState(false);
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [openArqueo, setOpenArqueo] = useState(false);
  const [openForzarCierre, setOpenForzarCierre] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  
  // Estados principales
  const [turnoActual, setTurnoActual] = useState<Turno | null>(null);
  const [loading, setLoading] = useState(true); // Iniciar con loading true
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [proximoNumeroTurno, setProximoNumeroTurno] = useState<number>(1);
  const [reporteGenerado, setReporteGenerado] = useState<any>(null);
  const [mostrarDialogoReporte, setMostrarDialogoReporte] = useState(false);
  const [mostrarConfigEmails, setMostrarConfigEmails] = useState(false);
  const [emailsConfigurados, setEmailsConfigurados] = useState<string[]>([]);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [errorEmail, setErrorEmail] = useState('');
  const [mesasPendientes, setMesasPendientes] = useState<any[]>([]);
  const [mostrarAdvertenciaMesas, setMostrarAdvertenciaMesas] = useState(false);
  const [errorConexion, setErrorConexion] = useState(false);

  // Estados de formularios - inicializados vacíos
  const [formApertura, setFormApertura] = useState<AbrirTurnoDto>({
    nombre: '',
    horaInicio: '',
    horaFin: '',
    fondoInicial: 0,
    observacionesApertura: ''
  });
  
  const [formMovimiento, setFormMovimiento] = useState<RegistrarMovimientoDto>({
    tipo: 'APORTE',
    concepto: '',
    monto: 0,
    metodoPago: 'EFECTIVO',
    observaciones: ''
  });
  
  const [formArqueo, setFormArqueo] = useState<CerrarTurnoDto>({
    efectivoContado: 0,
    observacionesCierre: '',
    observacionesArqueo: ''
  });

  const [formForzarCierre, setFormForzarCierre] = useState<ForzarCierreDto>({
    motivo: '',
    efectivoContado: 0
  });

  // 📧 Cargar configuración de emails
  const cargarConfiguracionEmails = async () => {
    try {
      const response = await api.get('/turnos/config/emails');
      if (response.data.success) {
        setEmailsConfigurados(response.data.data.emails);
      }
    } catch (error) {
      console.error('Error cargando configuración de emails:', error);
    }
  };

  // 📧 Guardar configuración de emails (Criterio 5)
  const guardarConfiguracionEmails = async (emails: string[]) => {
    try {
      setLoadingAction('guardando-emails');
      const response = await api.post('/turnos/config/emails', { emails });
      
      if (response.data.success) {
        setEmailsConfigurados(emails);
        mostrarMensaje('Configuración de emails actualizada correctamente', 'success');
      } else {
        mostrarMensaje(response.data.message || 'Error al guardar configuración', 'error');
      }
    } catch (error: any) {
      console.error('Error guardando emails:', error);
      mostrarMensaje(error.response?.data?.message || 'Error al guardar configuración', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 📧 Agregar nuevo email
  const agregarEmail = () => {
    setErrorEmail('');
    
    if (!nuevoEmail.trim()) {
      setErrorEmail('Email requerido');
      return;
    }
    
    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nuevoEmail)) {
      setErrorEmail('Formato de email inválido');
      return;
    }
    
    // Verificar que no esté duplicado
    if (emailsConfigurados.includes(nuevoEmail)) {
      setErrorEmail('Este email ya está configurado');
      return;
    }
    
    // Verificar límite máximo
    if (emailsConfigurados.length >= 5) {
      setErrorEmail('Máximo 5 emails permitidos');
      return;
    }
    
    const nuevosEmails = [...emailsConfigurados, nuevoEmail];
    guardarConfiguracionEmails(nuevosEmails);
    setNuevoEmail('');
  };

  // 📧 Eliminar email
  const eliminarEmail = (emailAEliminar: string) => {
    const nuevosEmails = emailsConfigurados.filter(email => email !== emailAEliminar);
    guardarConfiguracionEmails(nuevosEmails);
  };

  // 🔢 Obtener próximo número de turno secuencial (Criterio 1)
  const obtenerProximoNumeroTurno = async () => {
    try {
      const proximoNumero = await turnosService.obtenerProximoNumeroTurno();
      setProximoNumeroTurno(proximoNumero);
      
      // Auto-asignar el nombre del turno
      setFormApertura(prev => ({
        ...prev,
        nombre: `Turno ${proximoNumero}`,
        horaInicio: '', // Se registra automáticamente al abrir
        horaFin: ''     // Se registra automáticamente al cerrar
      }));
    } catch (error) {
      console.error('Error obteniendo próximo número de turno:', error);
      setProximoNumeroTurno(1);
    }
  };

  // 🔄 Funciones de carga de datos
  const cargarTurnoActivo = async () => {
    try {
      // No mostrar loading si ya hay datos para evitar parpadeo
      const turno = await turnosService.obtenerTurnoActivo();
      setTurnoActual(turno);
      
      // Solo verificar mesas pendientes si hay turno activo
      if (turno && turno.estado === 'ABIERTO') {
        await verificarMesasPendientes();
      }
      
      return turno;
    } catch (error) {
      console.error('Error cargando turno activo:', error);
      mostrarMensaje('Error al cargar el turno activo', 'error');
      return null;
    }
  };

  // 🔓 Manejar apertura de turno (Criterio 1: Botón único sin horarios predefinidos)
  const handleAbrirTurno = async () => {
    try {
      setLoadingAction('abriendo');
      
      // Validación previa - Criterio 2: Máximo 3 turnos por día
      const validacion = await turnosService.validarAperturaTurno();
      if (!validacion.puedeAbrir) {
        if (validacion.turnosDia && validacion.turnosDia >= 3) {
          mostrarMensaje(
            `Máximo de 3 turnos alcanzado (${validacion.turnosDia}/3). Espere al próximo día.`,
            'warning'
          );
        } else {
          mostrarMensaje(validacion.mensaje || 'No se puede abrir el turno', 'warning');
        }
        return;
      }

      // Criterio 2: Registrar automáticamente fecha y hora de apertura
      const ahora = new Date();
      const datosApertura: AbrirTurnoDto = {
        ...formApertura,
        nombre: `Turno ${proximoNumeroTurno}`,
        horaInicio: ahora.toTimeString().slice(0, 5), // HH:MM automático
        horaFin: '23:59' // Horario abierto hasta cierre manual
      };

      const nuevoTurno = await turnosService.abrirTurno(datosApertura);
      setTurnoActual(nuevoTurno);
      setOpenApertura(false);
      
      // Resetear formulario y actualizar próximo número
      setFormApertura({
        nombre: '',
        horaInicio: '',
        horaFin: '',
        fondoInicial: 0,
        observacionesApertura: ''
      });
      
      // Obtener siguiente número de turno
      obtenerProximoNumeroTurno();
      
      mostrarMensaje(`${nuevoTurno.nombre} abierto correctamente`, 'success');
      
    } catch (error: any) {
      console.error('Error abriendo turno:', error);
      
      if (error.response?.status === 409) {
        const mensaje = error.response.data.message || 'Ya existe un turno abierto';
        mostrarMensaje(mensaje, 'warning');
        
        if (error.response.data.data?.turnoAbierto) {
          const turnoAbierto = error.response.data.data.turnoAbierto;
          mostrarMensaje(
            `Turno "${turnoAbierto.nombre}" abierto por ${turnoAbierto.usuario?.nombre} ${turnoAbierto.usuario?.apellido}`,
            'info'
          );
        }
      } else {
        mostrarMensaje('Error al abrir el turno', 'error');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 🔒 Manejar cierre de turno (Criterio 3: Arqueo obligatorio)
  const handleCerrarTurno = async () => {
    if (!turnoActual) return;

    try {
      setLoadingAction('cerrando');
      
      const resultado = await turnosService.cerrarTurno(turnoActual.id, formArqueo);
      
      // Mostrar mensaje de éxito
      mostrarMensaje('Turno cerrado correctamente', 'success');
      
      // Verificar si se generó reporte del 3er turno (Criterio 4)
      if (resultado.esTercerTurno && resultado.reporteGenerado) {
        setReporteGenerado(resultado.reporteGenerado);
        setMostrarDialogoReporte(true);
        mostrarMensaje(
          `¡Tercer turno cerrado! Reporte diario generado automáticamente.`,
          'success'
        );
      }
      
      // Limpiar estados
      setTurnoActual(null);
      setOpenArqueo(false);
      setFormArqueo({
        efectivoContado: 0,
        observacionesCierre: '',
        observacionesArqueo: ''
      });
      
      // Actualizar próximo número de turno
      obtenerProximoNumeroTurno();
      
    } catch (error: any) {
      console.error('Error cerrando turno:', error);
      
      // Manejo específico para mesas pendientes de cobro
      if (error.response?.status === 409) {
        const data = error.response.data.data;
        const mensaje = error.response.data.message;
        
        if (data?.mesasPendientes && data.mesasPendientes.length > 0) {
          // Mostrar mensaje detallado con lista de mesas pendientes
          const listaMesas = data.mesasPendientes.map((mesa: any) => 
            `Mesa ${mesa.numero} (${mesa.sector})`
          ).join(', ');
          
          mostrarMensaje(
            `${mensaje}\n\nMesas pendientes: ${listaMesas}\n\nDebe completar el cobro de estas mesas antes de cerrar el turno.`,
            'error'
          );
          
          // Opcionalmente, redirigir a gestión de mesas
          setTimeout(() => {
            mostrarMensaje(
              'Redirija a "Gestión de Mesas" para completar los cobros pendientes',
              'info'
            );
          }, 3000);
        } else {
          mostrarMensaje(mensaje || 'No se puede cerrar el turno', 'error');
        }
      } else {
        mostrarMensaje(error.response?.data?.message || 'Error al cerrar el turno', 'error');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 🚫 Manejar cierre forzado
  const handleForzarCierre = async () => {
    if (!turnoActual) return;
    
    try {
      setLoadingAction('forzando-cierre');
      
      const turnoCerrado = await turnosService.forzarCierre(turnoActual.id, formForzarCierre);
      setTurnoActual(turnoCerrado);
      setOpenForzarCierre(false);
      setFormForzarCierre({
        motivo: '',
        efectivoContado: 0
      });
      
      mostrarMensaje('Turno cerrado forzadamente', 'warning');
      
    } catch (error: any) {
      console.error('Error forzando cierre:', error);
      
      // Manejo específico para mesas pendientes de cobro
      if (error.response?.status === 409) {
        const data = error.response.data.data;
        const mensaje = error.response.data.message;
        
        if (data?.mesasPendientes && data.mesasPendientes.length > 0) {
          // Mostrar mensaje detallado con lista de mesas pendientes
          const listaMesas = data.mesasPendientes.map((mesa: any) => 
            `Mesa ${mesa.numero} (${mesa.sector})`
          ).join(', ');
          
          mostrarMensaje(
            `${mensaje}\n\nMesas pendientes: ${listaMesas}\n\n${data.advertencia || 'Debe completar el cobro de estas mesas antes de forzar el cierre'}`,
            'error'
          );
          
          // Mensaje adicional para cierre forzado
          setTimeout(() => {
            mostrarMensaje(
              'Nota: Incluso el cierre forzado requiere que todas las mesas estén cobradas',
              'warning'
            );
          }, 3000);
        } else {
          mostrarMensaje(mensaje || 'No se puede forzar el cierre', 'error');
        }
      } else if (error.response?.status === 403) {
        mostrarMensaje('No tienes permisos para forzar el cierre', 'error');
      } else {
        mostrarMensaje('Error al forzar el cierre del turno', 'error');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 📋 Manejar registro de movimiento
  const handleRegistrarMovimiento = async () => {
    try {
      setLoadingAction('registrando-movimiento');
      
      const movimiento = await turnosService.registrarMovimiento(formMovimiento);
      
      // Recargar turno para obtener datos actualizados
      await cargarTurnoActivo();
      
      setOpenMovimiento(false);
      setFormMovimiento({
        tipo: 'APORTE',
        concepto: '',
        monto: 0,
        metodoPago: 'EFECTIVO',
        observaciones: ''
      });
      
      const tiposNombres = {
        VENTA: 'Venta',
        APORTE: 'Aporte',
        RETIRO: 'Retiro',
        GASTO: 'Gasto',
        PAGO_PROVEEDOR: 'Pago a Proveedor',
        AJUSTE: 'Ajuste',
        TRANSFERENCIA: 'Transferencia',
        ARQUEO: 'Arqueo'
      };
      
      mostrarMensaje(`${tiposNombres[formMovimiento.tipo]} registrado correctamente`, 'success');
      
    } catch (error: any) {
      console.error('Error registrando movimiento:', error);
      
      if (error.response?.status === 403) {
        mostrarMensaje('Este movimiento requiere autorización de supervisor', 'error');
      } else if (error.response?.status === 400) {
        mostrarMensaje('No hay turno abierto en esta caja', 'error');
      } else {
        mostrarMensaje('Error al registrar el movimiento', 'error');
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // 🔄 Refrescar datos
  const handleRefrescar = async () => {
    try {
      setLoadingAction('refrescando');
      
      const turno = await cargarTurnoActivo();
      
      // Solo actualizar próximo número si no hay turno activo
      if (!turno) {
        const proximoNum = await turnosService.obtenerProximoNumeroTurno();
        setProximoNumeroTurno(proximoNum);
        setFormApertura(prev => ({
          ...prev,
          nombre: `Turno ${proximoNum}`
        }));
      }
      
      mostrarMensaje('Datos actualizados', 'success');
    } catch (error) {
      console.error('Error refrescando datos:', error);
      mostrarMensaje('Error al actualizar los datos', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 💬 Mostrar mensaje
  const mostrarMensaje = (mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(mensaje);
    setSnackbarSeverity(tipo);
    setSnackbarOpen(true);
  };

  // 🎨 Obtener icono por tipo de movimiento
  const getIconoTipo = (tipo: MovimientoCaja['tipo']) => {
    switch (tipo) {
      case 'VENTA': return <SaleIcon sx={{ color: 'success.main' }} />;
      case 'APORTE': return <TrendingUpIcon sx={{ color: 'info.main' }} />;
      case 'RETIRO': return <TrendingDownIcon sx={{ color: 'warning.main' }} />;
      case 'GASTO': return <ExpenseIcon sx={{ color: 'error.main' }} />;
      case 'PAGO_PROVEEDOR': return <BankIcon sx={{ color: 'secondary.main' }} />;
      case 'AJUSTE': return <AdjustIcon sx={{ color: 'grey.500' }} />;
      case 'TRANSFERENCIA': return <TransferIcon sx={{ color: 'primary.main' }} />;
      case 'ARQUEO': return <CalculateIcon sx={{ color: 'warning.main' }} />;
      default: return <MoneyIcon />;
    }
  };

  // 📊 Calcular totales
  const movimientosTurnoActual = turnoActual?.movimientos || [];
  const totales = turnoActual?.totales || turnosService.calcularTotales(movimientosTurnoActual);
  const efectivoSistema = (turnoActual?.fondoInicial || 0) + (totales.efectivo || 0);

  // Calcular QR/MercadoPago de los movimientos
  const totalQR = movimientosTurnoActual
    .filter(m => m.metodoPago === 'QR_MERCADOPAGO')
    .reduce((sum, m) => sum + m.monto, 0);

  // 📄 Formatear precio
  const formatearPrecio = (precio: number) => turnosService.formatearMoneda(precio);

  // 🔍 Verificar mesas pendientes de cobro
  const verificarMesasPendientes = async () => {
    try {
      const resultado = await turnosService.obtenerMesasPendientesCobro();
      
      // Convertir al formato esperado por el componente
      const mesasFormateadas = resultado.mesas.map(mesa => ({
        id: mesa.id,
        numero: mesa.numero,
        sector: { nombre: mesa.sector },
        estado: mesa.estado,
        activa: true
      }));
      
      setMesasPendientes(mesasFormateadas);
      return mesasFormateadas;
    } catch (error) {
      console.error('Error verificando mesas pendientes:', error);
      setMesasPendientes([]);
      return [];
    }
  };

  // 🚨 Manejar intento de cierre con mesas pendientes
  const handleIntentoCierre = async () => {
    if (!turnoActual) return;

    try {
      setLoadingAction('verificando-mesas');
      const mesasPendientes = await verificarMesasPendientes();
      
      if (mesasPendientes.length > 0) {
        const listaMesas = mesasPendientes.map((mesa: any) => 
          `Mesa ${mesa.numero} (${mesa.sector?.nombre || 'Sin sector'})`
        ).join(', ');
        
        setMostrarAdvertenciaMesas(true);
        mostrarMensaje(
          `No se puede cerrar el turno. Hay ${mesasPendientes.length} mesa(s) con factura emitida sin cobrar: ${listaMesas}`,
          'error'
        );
        
        // Mostrar mensaje adicional con sugerencia
        setTimeout(() => {
          mostrarMensaje(
            'Vaya a "Gestión de Mesas" para completar los cobros pendientes',
            'info'
          );
        }, 2000);
      } else {
        // Si no hay mesas pendientes, proceder con el cierre normal
        setOpenArqueo(true);
      }
    } catch (error) {
      console.error('Error verificando mesas:', error);
      mostrarMensaje('Error verificando estado de mesas', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Cargar configuración al inicializar
  useEffect(() => {
    const inicializarComponente = async () => {
      try {
        setLoading(true);
        setErrorConexion(false);
        
        // Cargar datos en paralelo para evitar parpadeo
        const [turno, proximoNum] = await Promise.all([
          turnosService.obtenerTurnoActivo().catch(() => null),
          turnosService.obtenerProximoNumeroTurno().catch(() => 1)
        ]);

        // Establecer estados de una vez
        setTurnoActual(turno);
        setProximoNumeroTurno(proximoNum);
        
        // Auto-asignar el nombre del turno solo si no hay turno activo
        if (!turno) {
          setFormApertura(prev => ({
            ...prev,
            nombre: `Turno ${proximoNum}`,
            horaInicio: '',
            horaFin: ''
          }));
        }

        // Cargar configuración de emails
        await cargarConfiguracionEmails();
        
        // Solo verificar mesas pendientes si hay turno activo
        if (turno && turno.estado === 'ABIERTO') {
          await verificarMesasPendientes();
        }

      } catch (error) {
        console.error('Error inicializando componente:', error);
        setErrorConexion(true);
        mostrarMensaje('Error de conexión. Verificando...', 'error');
        
        // Reintentar después de 3 segundos
        setTimeout(() => {
          inicializarComponente();
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    inicializarComponente();
  }, []); // Solo ejecutar una vez al montar el componente

  // Verificar mesas pendientes periódicamente solo si hay turno activo
  useEffect(() => {
    if (!turnoActual || turnoActual.estado !== 'ABIERTO') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await verificarMesasPendientes();
      } catch (error) {
        console.error('Error verificando mesas pendientes:', error);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [turnoActual?.estado]); // Solo dependiente del estado del turno

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Loading inicial - solo mostrar si realmente está cargando */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '200px',
          mb: 2 
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {errorConexion ? 'Reintentando conexión...' : 'Cargando datos del sistema...'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Indicador de error de conexión */}
      {errorConexion && !loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Error de conexión con el servidor
          </Typography>
          <Typography variant="body2">
            Verificando conexión automáticamente cada 3 segundos...
          </Typography>
        </Alert>
      )}

      {/* Mostrar contenido solo cuando no esté cargando */}
      {!loading && (
        <>
          {/* Header */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PosIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                    💰 Sistema de Caja Avanzado
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Control total de movimientos y turnos • Gestión profesional con validaciones estrictas
                  </Typography>
                </Box>
              </Box>
          
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refrescar datos">
                  <IconButton 
                    onClick={handleRefrescar} 
                    disabled={loading || !!loadingAction}
                    color={loadingAction === 'refrescando' ? 'primary' : 'default'}
                  >
                    {loadingAction === 'refrescando' ? 
                      <CircularProgress size={24} /> : 
                      <RefreshIcon />
                    }
                  </IconButton>
                </Tooltip>
                
                {/* Botón de configuración de emails (Criterio 5) */}
                <Button
                  variant="outlined"
                  startIcon={<SettingsIcon />}
                  onClick={() => setMostrarConfigEmails(true)}
                  size="small"
                  sx={{ mr: 1 }}
                >
                  Configurar Emails
                </Button>
                
                {!turnoActual || turnoActual.estado === 'CERRADO' ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={loadingAction === 'abriendo' ? <CircularProgress size={20} /> : <LockOpenIcon />}
                    onClick={() => setOpenApertura(true)}
                    disabled={!!loadingAction}
                    size="large"
                  >
                    Abrir Turno
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<ForceCloseIcon />}
                      onClick={() => setOpenForzarCierre(true)}
                      disabled={!!loadingAction}
                    >
                      Forzar Cierre
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      startIcon={loadingAction === 'cerrando' ? <CircularProgress size={20} /> : <LockIcon />}
                      onClick={handleIntentoCierre}
                      disabled={!!loadingAction}
                      size="large"
                    >
                      Cerrar Turno
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Estado del turno */}
            {turnoActual && (
              <>
                <Alert
                  severity={turnoActual.estado === 'ABIERTO' ? 'success' : turnoActual.estado === 'FORZADO_CIERRE' ? 'warning' : 'info'}
                  icon={
                    turnoActual.estado === 'ABIERTO' ? <LockOpenIcon /> : 
                    turnoActual.estado === 'FORZADO_CIERRE' ? <WarningIcon /> : <LockIcon />
                  }
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Turno {turnoActual.nombre} - {
                        turnoActual.estado === 'ABIERTO' ? 'ABIERTO' : 
                        turnoActual.estado === 'FORZADO_CIERRE' ? 'CERRADO FORZADAMENTE' : 'CERRADO'
                      }
                    </Typography>
                    <Typography variant="body2">
                      Inicio: {turnosService.formatearFechaHora(turnoActual.fechaApertura)} •
                      Horario: {turnoActual.horaInicio} - {turnoActual.horaFin} •
                      Usuario: {turnoActual.usuarioApertura.nombre} {turnoActual.usuarioApertura.apellido}
                      {turnoActual.estado !== 'ABIERTO' && turnoActual.fechaCierre && (
                        <> • Duración: {turnosService.calcularDuracionTurno(turnoActual.fechaApertura, turnoActual.fechaCierre)}</>
                      )}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Fondo inicial: {formatearPrecio(turnoActual.fondoInicial)}
                      {turnoActual.diferencia !== undefined && (
                        <> • Diferencia: <span style={{ 
                          color: turnoActual.diferencia === 0 ? 'green' : turnoActual.diferencia > 0 ? 'orange' : 'red',
                          fontWeight: 'bold'
                        }}>
                          {formatearPrecio(turnoActual.diferencia)}
                        </span></>
                      )}
                    </Typography>
                    
                    {/* Criterio 6: Alerta de arqueo obligatorio */}
                    {turnoActual.estado === 'ABIERTO' && (
                      <Alert severity="warning" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Arqueo obligatorio:</strong> Al cerrar este turno, debe realizar el arqueo de caja para trasladar el saldo al siguiente turno.
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Alert>

                {/* Alerta de mesas pendientes de cobro */}
                {mesasPendientes.length > 0 && turnoActual.estado === 'ABIERTO' && (
                  <Alert 
                    severity="error" 
                    sx={{ mb: 2 }}
                    action={
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={() => window.location.href = '/gestion-mesas'}
                        sx={{ color: 'inherit', borderColor: 'inherit' }}
                      >
                        Ir a Cobrar
                      </Button>
                    }
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      ⚠️ Mesas pendientes de cobro ({mesasPendientes.length})
                    </Typography>
                    <Typography variant="body2">
                      Las siguientes mesas tienen factura/ticket emitido pero aún no han sido cobradas:
                      <br />
                      <strong>
                        {mesasPendientes.map(mesa => `Mesa ${mesa.numero} (${mesa.sector?.nombre || 'Sin sector'})`).join(', ')}
                      </strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Importante:</strong> No podrá cerrar el turno hasta que todas las mesas estén cobradas.
                    </Typography>
                  </Alert>
                )}
              </>
            )}

            {!turnoActual && !loading && (
              <Alert severity="info" icon={<InfoIcon />}>
                <Typography variant="subtitle1">
                  No hay turno activo. Haz clic en "Abrir Turno" para comenzar.
                </Typography>
              </Alert>
            )}
          </Paper>

          {/* Acciones rápidas para turno abierto */}
          {turnoActual && turnoActual.estado === 'ABIERTO' && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => setOpenMovimiento(true)}
                disabled={!!loadingAction}
                size="large"
              >
                Registrar Movimiento
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<Receipt />}
                onClick={() => window.location.href = '/gestion-mesas'}
                disabled={!!loadingAction}
                size="large"
              >
                Ir a Cobrar Mesas
              </Button>
            </Box>
          )}

          {/* Tabs */}
          <Paper sx={{ borderRadius: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} aria-label="caja tabs">
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PosIcon />
                      Resumen del Turno
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HistoryIcon />
                      <Badge badgeContent={movimientosTurnoActual.length} color="primary">
                        Movimientos
                      </Badge>
                    </Box>
                  }
                />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              {/* Resumen del turno */}
              {turnoActual ? (
                <Stack spacing={3}>
                  {/* Tarjetas de totales */}
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Card sx={{ flex: 1 }}>
                      <CardContent>
                        <Typography variant="h6" color="success.main" gutterBottom>
                          💰 Ingresos
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Ventas
                            </Typography>
                            <Typography variant="h6">
                              {formatearPrecio(totales.ventas || 0)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Aportes
                            </Typography>
                            <Typography variant="h6">
                              {formatearPrecio(totales.aportes || 0)}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>

                    <Card sx={{ flex: 1 }}>
                      <CardContent>
                        <Typography variant="h6" color="error.main" gutterBottom>
                          💸 Egresos
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Retiros
                            </Typography>
                            <Typography variant="h6">
                              {formatearPrecio(totales.retiros || 0)}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Gastos
                            </Typography>
                            <Typography variant="h6">
                              {formatearPrecio(totales.gastos || 0)}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>

                  {/* Efectivo en Caja - Criterio 4 */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        💰 Efectivo en Caja Física
                      </Typography>
                      <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'success.light', borderRadius: 2, color: 'white' }}>
                        <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                          {formatearPrecio(efectivoSistema)}
                        </Typography>
                        <Typography variant="h6" sx={{ mt: 1 }}>
                          Efectivo Disponible
                        </Typography>
                      </Box>
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Incluye:</strong> Fondo inicial + Ingresos de efectivo - Retiros y gastos
                        </Typography>
                      </Alert>
                    </CardContent>
                  </Card>

                  {/* Otros métodos de pago - Solo registro */}
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        📊 Otros Métodos de Pago (Solo Registro)
                      </Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2, color: 'text.primary' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {formatearPrecio(totales.tarjeta || 0)}
                          </Typography>
                          <Typography variant="subtitle1">
                            Tarjetas
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (No afecta caja)
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2, color: 'text.primary' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {formatearPrecio(totales.transferencia || 0)}
                          </Typography>
                          <Typography variant="subtitle1">
                            Transferencias
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (No afecta caja)
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1, textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2, color: 'text.primary' }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                            {formatearPrecio(totalQR)}
                          </Typography>
                          <Typography variant="subtitle1">
                            QR/Digital
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            (No afecta caja)
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    Abre un turno para ver el resumen
                  </Typography>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              {/* Lista de movimientos */}
              {movimientosTurnoActual.length > 0 ? (
                <List>
                  {movimientosTurnoActual
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((movimiento, index) => (
                    <React.Fragment key={movimiento.id}>
                      <ListItem sx={{ py: 2 }}>
                        <ListItemIcon>
                          {getIconoTipo(movimiento.tipo)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                {movimiento.concepto}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={movimiento.tipo.replace('_', ' ')}
                                  size="small"
                                  color={
                                    ['VENTA', 'APORTE'].includes(movimiento.tipo) ? 'success' :
                                    ['RETIRO', 'GASTO'].includes(movimiento.tipo) ? 'error' : 'default'
                                  }
                                />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: ['VENTA', 'APORTE'].includes(movimiento.tipo) ? 'success.main' : 'error.main',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  {['RETIRO', 'GASTO', 'PAGO_PROVEEDOR'].includes(movimiento.tipo) ? '-' : '+'}
                                  {formatearPrecio(movimiento.monto)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {turnosService.formatearFechaHora(movimiento.fecha)} • 
                                {movimiento.metodoPago.replace('_', ' ')} • 
                                {movimiento.usuario.nombre} {movimiento.usuario.apellido}
                              </Typography>
                              {movimiento.observaciones && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                                  "{movimiento.observaciones}"
                                </Typography>
                              )}
                              {movimiento.requiereAutorizacion && (
                                <Chip
                                  label="Requiere Autorización"
                                  size="small"
                                  color="warning"
                                  sx={{ mt: 0.5 }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < movimientosTurnoActual.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No hay movimientos en este turno
                  </Typography>
                </Box>
              )}
            </TabPanel>
          </Paper>

          {/* Diálogo de Apertura de Turno */}
          <Dialog open={openApertura} onClose={() => setOpenApertura(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LockOpenIcon />
                Apertura de Turno
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {/* Información del turno automático (Criterio 1) */}
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Turno {proximoNumeroTurno}</strong> se abrirá automáticamente.
                    <br />
                    Fecha y hora de apertura se registran automáticamente al confirmar.
                  </Typography>
                </Alert>
                
                <TextField
                  fullWidth
                  label="Fondo Inicial"
                  type="number"
                  value={formApertura.fondoInicial}
                  onChange={(e) => setFormApertura({ ...formApertura, fondoInicial: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  helperText="Criterio 4: Si el saldo es $0, aparecerá una advertencia"
                />
                <TextField
                  fullWidth
                  label="Observaciones de Apertura (Opcional)"
                  multiline
                  rows={3}
                  value={formApertura.observacionesApertura}
                  onChange={(e) => setFormApertura({ ...formApertura, observacionesApertura: e.target.value })}
                  placeholder="Notas adicionales sobre la apertura del turno..."
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenApertura(false)} disabled={!!loadingAction}>
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                onClick={handleAbrirTurno}
                disabled={!!loadingAction}
                startIcon={loadingAction === 'abriendo' ? <CircularProgress size={20} /> : <LockOpenIcon />}
              >
                Abrir Turno {proximoNumeroTurno}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo de Cierre/Arqueo */}
          <Dialog open={openArqueo} onClose={() => setOpenArqueo(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon />
                Arqueo y Cierre de Turno
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Efectivo que debería haber según el sistema:
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {formatearPrecio(efectivoSistema)}
                  </Typography>
                </Alert>
                <TextField
                  fullWidth
                  label="Efectivo Contado"
                  type="number"
                  value={formArqueo.efectivoContado}
                  onChange={(e) => setFormArqueo({ ...formArqueo, efectivoContado: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  helperText="Ingresa el dinero efectivo que hay físicamente en la caja"
                />
                {formArqueo.efectivoContado > 0 && (
                  <Alert 
                    severity={
                      Math.abs(formArqueo.efectivoContado - efectivoSistema) < 0.01 ? 'success' :
                      formArqueo.efectivoContado > efectivoSistema ? 'warning' : 'error'
                    }
                  >
                    <Typography variant="subtitle2">
                      Diferencia: {formatearPrecio(formArqueo.efectivoContado - efectivoSistema)}
                    </Typography>
                    <Typography variant="body2">
                      {Math.abs(formArqueo.efectivoContado - efectivoSistema) < 0.01 
                        ? '¡Perfecto! El arqueo está balanceado.'
                        : formArqueo.efectivoContado > efectivoSistema
                        ? 'Hay más dinero del esperado (sobrante)'
                        : 'Hay menos dinero del esperado (faltante)'}
                    </Typography>
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Observaciones del Cierre"
                  multiline
                  rows={3}
                  value={formArqueo.observacionesCierre}
                  onChange={(e) => setFormArqueo({ ...formArqueo, observacionesCierre: e.target.value })}
                />
                <TextField
                  fullWidth
                  label="Observaciones del Arqueo"
                  multiline
                  rows={2}
                  value={formArqueo.observacionesArqueo}
                  onChange={(e) => setFormArqueo({ ...formArqueo, observacionesArqueo: e.target.value })}
                  placeholder="Explica cualquier diferencia encontrada..."
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenArqueo(false)} disabled={!!loadingAction}>
                Cancelar
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={handleCerrarTurno}
                disabled={formArqueo.efectivoContado < 0 || !!loadingAction}
                startIcon={loadingAction === 'cerrando' ? <CircularProgress size={20} /> : <LockIcon />}
              >
                Cerrar Turno
              </Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo de Registro de Movimiento */}
          <Dialog open={openMovimiento} onClose={() => setOpenMovimiento(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                Registrar Movimiento
              </Box>
            </DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Movimiento</InputLabel>
                    <Select
                      value={formMovimiento.tipo}
                      label="Tipo de Movimiento"
                      onChange={(e) => setFormMovimiento({ ...formMovimiento, tipo: e.target.value as any })}
                    >
                      <MenuItem value="APORTE">Aporte</MenuItem>
                      <MenuItem value="RETIRO">Retiro</MenuItem>
                      <MenuItem value="GASTO">Gasto</MenuItem>
                      <MenuItem value="PAGO_PROVEEDOR">Pago a Proveedor</MenuItem>
                      <MenuItem value="AJUSTE">Ajuste</MenuItem>
                      <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={formMovimiento.metodoPago}
                      label="Método de Pago"
                      onChange={(e) => setFormMovimiento({ ...formMovimiento, metodoPago: e.target.value as any })}
                    >
                      <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                      <MenuItem value="TARJETA_DEBITO">Tarjeta de Débito</MenuItem>
                      <MenuItem value="TARJETA_CREDITO">Tarjeta de Crédito</MenuItem>
                      <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                      <MenuItem value="QR_MERCADOPAGO">QR MercadoPago</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
                <TextField
                  fullWidth
                  label="Concepto"
                  value={formMovimiento.concepto}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, concepto: e.target.value })}
                  placeholder="Describe el motivo del movimiento..."
                />
                <TextField
                  fullWidth
                  label="Monto"
                  type="number"
                  value={formMovimiento.monto}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, monto: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                />
                <TextField
                  fullWidth
                  label="Observaciones"
                  multiline
                  rows={2}
                  value={formMovimiento.observaciones}
                  onChange={(e) => setFormMovimiento({ ...formMovimiento, observaciones: e.target.value })}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenMovimiento(false)} disabled={!!loadingAction}>
                Cancelar
              </Button>
              <Button 
                variant="contained"
                onClick={handleRegistrarMovimiento}
                disabled={!formMovimiento.concepto || formMovimiento.monto <= 0 || !!loadingAction}
                startIcon={loadingAction === 'registrando-movimiento' ? <CircularProgress size={20} /> : <TrendingUpIcon />}
              >
                Registrar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo de Cierre Forzado */}
          <Dialog open={openForzarCierre} onClose={() => setOpenForzarCierre(false)} maxWidth="sm" fullWidth>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ForceCloseIcon />
                Forzar Cierre de Turno
              </Box>
            </DialogTitle>
            <DialogContent>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  ⚠️ Cierre Administrativo
                </Typography>
                <Typography variant="body2">
                  Esta acción forzará el cierre del turno sin importar quién lo abrió. 
                  Se registrará como una acción administrativa en la auditoría.
                </Typography>
              </Alert>
              
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Motivo del Cierre Forzado"
                  value={formForzarCierre.motivo}
                  onChange={(e) => setFormForzarCierre({ ...formForzarCierre, motivo: e.target.value })}
                  placeholder="Explica por qué es necesario forzar el cierre..."
                  multiline
                  rows={3}
                />
                <TextField
                  fullWidth
                  label="Efectivo Contado"
                  type="number"
                  value={formForzarCierre.efectivoContado}
                  onChange={(e) => setFormForzarCierre({ ...formForzarCierre, efectivoContado: parseFloat(e.target.value) || 0 })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  helperText={`Efectivo esperado: ${formatearPrecio(efectivoSistema)}`}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenForzarCierre(false)} disabled={!!loadingAction}>
                Cancelar
              </Button>
              <Button 
                variant="contained"
                color="warning"
                onClick={handleForzarCierre}
                disabled={!formForzarCierre.motivo || formForzarCierre.efectivoContado < 0 || !!loadingAction}
                startIcon={loadingAction === 'forzando-cierre' ? <CircularProgress size={20} /> : <ForceCloseIcon />}
              >
                Forzar Cierre
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de Reporte Diario Generado (Criterio 4) */}
          <Dialog 
            open={mostrarDialogoReporte} 
            onClose={() => setMostrarDialogoReporte(false)} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Reporte Diario Generado - Tercer Turno Cerrado
              </Box>
            </DialogTitle>
            <DialogContent>
              {reporteGenerado && (
                <Box sx={{ py: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body1">
                      ¡Felicitaciones! Se cerró el tercer y último turno del día.
                      El reporte consolidado se generó automáticamente.
                    </Typography>
                  </Alert>
                  
                  <Typography variant="h6" gutterBottom>
                    📊 Información del Reporte:
                  </Typography>
                  
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Archivo:</strong> {reporteGenerado.archivo}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Emails enviados a:</strong> {reporteGenerado.emailsEnviados?.join(', ') || 'Ninguno configurado'}
                    </Typography>
                  </Stack>

                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Criterio 4:</strong> Este reporte incluye ventas totales por turno, 
                      detalle por producto, ingresos por método de pago, saldo de caja efectivo, 
                      arqueos y horarios de cada turno.
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    El contador de turnos se ha reiniciado automáticamente. 
                    Mañana podrá abrir el Turno 1 nuevamente.
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setMostrarDialogoReporte(false)} 
                variant="contained"
              >
                Entendido
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de Configuración de Emails (Criterio 5) */}
          <Dialog 
            open={mostrarConfigEmails} 
            onClose={() => setMostrarConfigEmails(false)} 
            maxWidth="md" 
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon />
                Configuración de Emails para Reportes Diarios
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ py: 2 }}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Criterio 5:</strong> Configure hasta 5 direcciones de email que recibirán 
                    automáticamente el reporte consolidado al cerrar el tercer turno del día.
                  </Typography>
                </Alert>

                {/* Lista de emails configurados */}
                <Typography variant="h6" gutterBottom>
                  Emails Configurados ({emailsConfigurados.length}/5):
                </Typography>
                
                {emailsConfigurados.length === 0 ? (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    No hay emails configurados. Los reportes no se enviarán automáticamente.
                  </Alert>
                ) : (
                  <List sx={{ mb: 2 }}>
                    {emailsConfigurados.map((email, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <EmailIcon />
                        </ListItemIcon>
                        <ListItemText primary={email} />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            onClick={() => eliminarEmail(email)}
                            disabled={!!loadingAction}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}

                {/* Agregar nuevo email */}
                <Typography variant="h6" gutterBottom>
                  Agregar Nuevo Email:
                </Typography>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <TextField
                    fullWidth
                    label="Dirección de Email"
                    type="email"
                    value={nuevoEmail}
                    onChange={(e) => {
                      setNuevoEmail(e.target.value);
                      setErrorEmail('');
                    }}
                    error={!!errorEmail}
                    helperText={errorEmail}
                    placeholder="ejemplo@empresa.com"
                    disabled={!!loadingAction || emailsConfigurados.length >= 5}
                  />
                  <Button
                    variant="contained"
                    onClick={agregarEmail}
                    disabled={!!loadingAction || emailsConfigurados.length >= 5}
                    startIcon={loadingAction === 'guardando-emails' ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    Agregar
                  </Button>
                </Stack>

                {emailsConfigurados.length >= 5 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Máximo de 5 emails alcanzado. Elimine uno para agregar otro.
                  </Alert>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMostrarConfigEmails(false)}>
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar para mensajes */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={() => setSnackbarOpen(false)}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity={snackbarSeverity}
              sx={{ width: '100%' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default Caja; 