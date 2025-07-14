import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Drawer,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  ButtonGroup,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  ListItemIcon,
  Checkbox,
  InputAdornment,
  Avatar,
  Autocomplete
} from '@mui/material';
import {
  Search,
  Add,
  Remove,
  Delete,
  KeyboardArrowUp,
  KeyboardArrowDown,
  MoreHoriz,
  Close,
  ShoppingCart,
  RestaurantMenu,
  Receipt,
  CreditCard,
  AccessTime,
  Kitchen,
  Person,
  PersonAdd,
  Group,
  Badge,
  Settings,
  Edit,
  Save,
  Cancel,
  TableRestaurant,
  LocalDining,
  Check,
  Warning,
  Info,
  Error,
  Visibility,
  VisibilityOff,
  Calculate,
  Discount,
  Payment,
  QrCode,
  AccountBalance,
  MonetizationOn,
  Phone,
  Email,
  Description,
  Note,
  StarBorder,
  Star,
  Fastfood,
  Inventory,
  LocalOffer,
  Share,
  Assignment,
  AttachMoney,
  ExpandMore,
  ExpandLess,
  Grid3x3,
  Timer,
  Close as X,
  CenterFocusStrong as Focus,
  MergeType as Merge,
  Send,
  CheckCircle,
  CardGiftcard as Gift,
  Block as Ban,
  SwapHoriz as ArrowRightLeft,
  OpenWith as Move,
  MonetizationOn as Banknote,
  Smartphone
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../../store';
import { toastService } from '../../../services/toastService';
import { ventasActivasService } from '../../../services/ventasActivasService';
import { productosService } from '../../../services/productosService';
import api from '../../../services/api';
import { EstadoMesa, type Mesa, type Producto as ProductoCompleto } from '../../../types/mesas';
import { useVentaHandlers } from './VentaIntegralHandlers';

// Interfaces adicionales
interface Mozo {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  activo: boolean;
}

interface VentaActivaPersistente {
  id: string;
  mesaId: string;
  items: Array<{
    id: string;
    productoId: string;
    productoNombre: string;
    productoCodigo: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    observaciones?: string;
    fechaAgregado: Date;
  }>;
  total: number;
  estado: 'activa' | 'pausada' | 'completada';
  fechaApertura: Date;
  fechaUltimaModificacion: Date;
  camarero: string;
  observaciones?: string;
  clienteId?: string;
  clienteNombre?: string;
  descuentoAplicado?: number;
}

interface SeleccionMozoProps {
  open: boolean;
  onClose: () => void;
  onSeleccionar: (mozo: Mozo) => void;
  onCrearNuevo: () => void;
  mozosDisponibles: Mozo[];
  usuarioActual: any;
}

// Componente para selección de mozos
const SeleccionMozo: React.FC<SeleccionMozoProps> = ({
  open,
  onClose,
  onSeleccionar,
  onCrearNuevo,
  mozosDisponibles,
  usuarioActual
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const mozosFiltrados = mozosDisponibles.filter(mozo => 
    `${mozo.nombre} ${mozo.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Group color="primary" />
          Seleccionar Mozo
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar mozo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <List>
          {/* Opción por defecto - Usuario actual */}
          <ListItemButton
            onClick={() => onSeleccionar({
              id: usuarioActual.id,
              nombre: usuarioActual.nombre,
              apellido: usuarioActual.apellido,
              email: usuarioActual.email,
              activo: true
            })}
            sx={{ 
              border: '1px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              mb: 1,
              bgcolor: 'primary.50'
            }}
          >
            <ListItemIcon>
              <Badge color="primary">
                <Person />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={`${usuarioActual.nombre} ${usuarioActual.apellido}`}
              secondary="Usuario actual (por defecto)"
            />
            <Chip label="Predeterminado" color="primary" size="small" />
          </ListItemButton>

          {mozosFiltrados.length > 0 ? (
            mozosFiltrados.map((mozo) => (
              <ListItemButton
                key={mozo.id}
                onClick={() => onSeleccionar(mozo)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {mozo.nombre.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={`${mozo.nombre} ${mozo.apellido}`}
                  secondary={mozo.email}
                />
                <Chip 
                  label={mozo.activo ? 'Activo' : 'Inactivo'} 
                  color={mozo.activo ? 'success' : 'default'} 
                  size="small" 
                />
              </ListItemButton>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No se encontraron mozos
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button
          startIcon={<PersonAdd />}
          onClick={onCrearNuevo}
          color="primary"
          variant="outlined"
        >
          Crear Nuevo Mozo
        </Button>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente para crear/editar mozos
interface FormularioMozoProps {
  open: boolean;
  onClose: () => void;
  onGuardar: (mozo: Partial<Mozo>) => void;
  mozo?: Mozo | null;
}

const FormularioMozo: React.FC<FormularioMozoProps> = ({
  open,
  onClose,
  onGuardar,
  mozo
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    activo: true
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mozo) {
      setFormData({
        nombre: mozo.nombre,
        apellido: mozo.apellido,
        email: mozo.email,
        password: '',
        activo: mozo.activo
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        activo: true
      });
    }
  }, [mozo, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await onGuardar(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando mozo:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonAdd color="primary" />
            {mozo ? 'Editar Mozo' : 'Crear Nuevo Mozo'}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={mozo ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!mozo}
                margin="normal"
                helperText={mozo ? 'Dejar vacío para mantener la contraseña actual' : ''}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.activo}
                    onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                  />
                }
                label="Activo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            {mozo ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

interface ItemVenta {
  id: string;
  producto: ProductoCompleto;
  cantidad: number;
  precio: number;
  subtotal: number;
  esInvitacion: boolean;
  noDisponible: boolean;
  especificaciones?: string;
}

interface VentaActiva {
  id: string;
  mesaId: string;
  items: ItemVenta[];
  total: number;
  estado: 'activa' | 'enviada' | 'cuenta_pedida';
  fechaApertura: Date;
  camarero?: string;
}

interface VentaIntegralV2Props {
  mesa: Mesa | null;
  isOpen: boolean;
  onClose: () => void;
  onCambiarEstado: (mesa: Mesa, estado: EstadoMesa) => void;
  onVentaCompleta: (venta: VentaActiva) => void;
}

const VentaIntegralV2: React.FC<VentaIntegralV2Props> = ({
  mesa,
  isOpen,
  onClose,
  onCambiarEstado,
  onVentaCompleta
}) => {
  // Estados principales
  const [ventaActiva, setVentaActiva] = useState<VentaActiva | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handlers críticos
  const handlers = useVentaHandlers();
  
  // Estados adicionales para funcionalidades
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);
  
  // Estados de búsqueda
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<ProductoCompleto[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  
  // Estados de interfaz
  const [itemSeleccionado, setItemSeleccionado] = useState<string | null>(null);
  const [anchorMenuItems, setAnchorMenuItems] = useState<HTMLElement | null>(null);
  const [tabToolbar, setTabToolbar] = useState(0);
  const [dialogoAbierto, setDialogoAbierto] = useState<string | null>(null);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState<string>('');
  
  // Estados para transferencia de mesa
  const [sectoresDisponibles, setSectoresDisponibles] = useState<any[]>([]);
  const [mesasDisponibles, setMesasDisponibles] = useState<any[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  const [mesaDestinoSeleccionada, setMesaDestinoSeleccionada] = useState<string>('');
  const [mostrarModalTransferencia, setMostrarModalTransferencia] = useState(false);
  
  // Estados para control de facturación y formas de pago (según criterios obligatorios)
  const [facturaEmitida, setFacturaEmitida] = useState<{
    tipo: 'fiscal' | 'no_fiscal' | null;
    numero?: string;
    pagos: Array<{
      metodo: 'efectivo' | 'tarjeta' | 'qr' | 'transferencia';
      monto: number;
    }>;
    anulada: boolean;
    fechaEmision?: Date;
  }>({
    tipo: null,
    pagos: [],
    anulada: false
  });
  const [modalFormasPago, setModalFormasPago] = useState(false);
  const [mostrarModalFormasPago, setMostrarModalFormasPago] = useState(false);
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState<string>('');
  
  // Estados de notificaciones
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  // Funciones helper - mover antes de las funciones que las usan
  const mostrarNotificacion = (mensaje: string, severidad: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message: mensaje, severity: severidad });
  };

  const cerrarNotificacion = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // ==========================================
  // 🎯 FUNCIÓN OPTIMIZADA: SELECCIÓN DE MOZO
  // ==========================================
  // Criterios obligatorios:
  // 1. Verificar existencia de venta activa
  // 2. Crear venta si no existe
  // 3. Respuesta inmediata sin esperas perceptibles
  // 4. Abrir modal de ventas con datos actualizados
  // ==========================================

  /**
   * Función optimizada para seleccionar mozo y garantizar venta activa
   * @param mozoId - ID del mozo seleccionado
   * @param mesaId - ID de la mesa activa
   */
  const onMozoSeleccionado = async (mozoId: string, mesaId: string) => {
    try {
      // Validaciones previas
      if (!mozoId || !mesaId) {
        console.error('❌ Error: mozoId o mesaId inválidos', { mozoId, mesaId });
        mostrarNotificacion('Error: Datos de mozo o mesa inválidos', 'error');
        return;
      }

      console.log('🚀 Iniciando selección optimizada de mozo:', { mozoId, mesaId });

      // Criterio 1: Verificar existencia de venta activa
      let ventaActiva = await ventasActivasService.obtenerVentaActiva(mesaId);
      
      if (!ventaActiva) {
        console.log('📝 No hay venta activa - Creando nueva venta');
        
        // Criterio 2: Crear venta activa si no existe
        ventaActiva = await ventasActivasService.crearVentaActiva(mesaId, mozoId);
        
        console.log('✅ Venta activa creada:', ventaActiva.id);
      } else {
        console.log('✅ Venta activa existente encontrada:', ventaActiva.id);
      }

      // Criterio 3: Confirmar existencia de la venta
      if (!ventaActiva) {
        console.error('❌ No se pudo crear o encontrar la venta activa');
        mostrarNotificacion('Error: No se pudo crear la venta activa', 'error');
        return;
      }

      // Actualizar estado local con la venta activa (conversión de tipos)
      const ventaLocal = adaptarVentaPersistentaALocal(ventaActiva);
      setVentaActiva(ventaLocal);

      // Criterio 4: Cerrar modal de mozo y abrir modal de ventas
      console.log('🎯 Venta activa asegurada - Modal de ventas listo');
      
      mostrarNotificacion('Mozo asignado - Venta activa lista', 'success');
      
    } catch (error) {
      console.error('❌ Error en selección optimizada de mozo:', error);
      mostrarNotificacion('Error al asociar venta activa con mozo', 'error');
    }
  };

  /**
   * Garantiza que existe una venta activa para la mesa
   * @param mesaId - ID de la mesa
   * @param mozoId - ID del mozo (opcional, usa usuario actual por defecto)
   * @returns Promise<VentaActiva | null>
   */
  const garantizarVentaActiva = async (mesaId: string, mozoId?: string): Promise<VentaActiva | null> => {
    try {
      // Intentar obtener venta existente
      let ventaActiva = await ventasActivasService.obtenerVentaActiva(mesaId);
      
      if (!ventaActiva) {
        // Si no existe, crear nueva venta
        const camarero = mozoId || 'Usuario Actual';
        ventaActiva = await ventasActivasService.crearVentaActiva(mesaId, camarero);
        
        console.log('✅ Venta activa garantizada (nueva):', ventaActiva.id);
      } else {
        console.log('✅ Venta activa garantizada (existente):', ventaActiva.id);
      }
      
      return ventaActiva;
      
    } catch (error) {
      console.error('❌ Error garantizando venta activa:', error);
      return null;
    }
  };

  const focusearBuscador = () => {
    const input = document.querySelector('#buscador-productos') as HTMLInputElement;
    input?.focus();
  };

  // Función helper para obtener el nombre de la categoría
  const obtenerNombreCategoria = (categoria: string | { id: string; nombre: string }): string => {
    if (typeof categoria === 'string') {
      return categoria || 'Sin categoría';
    }
    return categoria?.nombre || 'Sin categoría';
  };

  // Función helper para normalizar texto (quitar acentos y convertir a minúsculas)
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Función helper para verificar si una búsqueda coincide con el texto
  const coincideBusqueda = (texto: string, busqueda: string): boolean => {
    const textoNorm = normalizarTexto(texto);
    const busquedaNorm = normalizarTexto(busqueda);
    return textoNorm.includes(busquedaNorm);
  };

  // Función helper para resaltar texto en búsquedas
  const resaltarTexto = (texto: string, busqueda: string) => {
    if (!busqueda || busqueda.length === 0) return texto;
    
    const textoNorm = normalizarTexto(texto);
    const busquedaNorm = normalizarTexto(busqueda);
    const indice = textoNorm.indexOf(busquedaNorm);
    
    if (indice === -1) return texto;
    
    const inicio = texto.substring(0, indice);
    const coincidencia = texto.substring(indice, indice + busqueda.length);
    const final = texto.substring(indice + busqueda.length);
    
    return (
      <>
        {inicio}
        <Box component="span" sx={{ bgcolor: 'yellow', fontWeight: 'bold', px: 0.5 }}>
          {coincidencia}
        </Box>
        {final}
      </>
    );
  };

  // Función para adaptar venta persistente a formato local
  const adaptarVentaPersistentaALocal = (ventaPersistente: VentaActivaPersistente): VentaActiva => {
    return {
      id: ventaPersistente.id,
      mesaId: ventaPersistente.mesaId,
      items: ventaPersistente.items.map(item => ({
        id: item.id,
        producto: {
          id: item.productoId,
          nombre: item.productoNombre,
          codigo: item.productoCodigo,
          precio: item.precioUnitario,
          // Campos adicionales por compatibilidad - se obtendrán del servicio si se necesitan
          descripcion: '',
          costo: 0,
          stock: 0,
          stockMinimo: 0,
          activo: true,
          fechaCreacion: new Date().toISOString(),
          fechaActualizacion: new Date().toISOString(),
          categoria: ''
        } as ProductoCompleto,
        cantidad: item.cantidad,
        precio: item.precioUnitario,
        subtotal: item.subtotal,
        esInvitacion: false,
        noDisponible: false,
        especificaciones: item.observaciones
      })),
      total: ventaPersistente.total,
      estado: 'activa' as const,
      fechaApertura: ventaPersistente.fechaApertura,
      camarero: ventaPersistente.camarero
    };
  };



  // Inicializar venta automáticamente con limpieza obligatoria
  useEffect(() => {
    // CRITERIO 5: SISTEMA ANTI-CONTAMINACIÓN - Limpiar INMEDIATAMENTE al cambiar mesa
    console.log('🧹 LIMPIEZA OBLIGATORIA - Cambiando mesa:', mesa?.numero);
    
    // 1. Limpiar estado local inmediatamente
    setVentaActiva(null);
    setTerminoBusqueda('');
    setResultadosBusqueda([]);
    setIndiceSeleccionado(0);
    setError(null);
    setLoading(false);
    
    // 2. Limpiar estados de interfaz
    setItemSeleccionado(null);
    setAnchorMenuItems(null);
    setDialogoAbierto(null);
    setTiempoTranscurrido('');
    
    // 3. Limpiar estados de transferencia
    setSectoresDisponibles([]);
    setMesasDisponibles([]);
    setSectorSeleccionado('');
    setMesaDestinoSeleccionada('');
    setMostrarModalTransferencia(false);
    
    // 4. Limpiar estados de facturación
    setModalFormasPago(false);
    setMostrarModalFormasPago(false);
    setTipoComprobanteSeleccionado('');
    setFacturaEmitida({
      tipo: null,
      pagos: [],
      anulada: false
    });
    
    // 5. CRITERIO 1: Limpiar cliente y descuentos (datos residuales)
    setClienteSeleccionado(null);
    setDescuentoAplicado(0);
    
    // 6. Solo DESPUÉS de limpiar, inicializar si hay mesa válida
    if (mesa && isOpen) {
      console.log('✅ INICIALIZANDO VENTA LIMPIA para mesa:', mesa.numero);
      // Delay mínimo para asegurar que la limpieza se complete
      setTimeout(() => {
        inicializarVenta();
        // CRITERIO 5: Validar automáticamente que no hay conflictos
        setTimeout(async () => {
          await validarMesaSinConflictos();
        }, 100);
      }, 50);
    } else {
      console.log('🚫 No hay mesa válida o panel cerrado');
    }
  }, [mesa, isOpen]);

  // Función para inicializar venta de mesa con sincronización backend
  const inicializarVenta = async () => {
    if (!mesa) return;
    
    console.log('🚀 Inicializando venta para mesa:', mesa.numero);
    
    try {
      // Intentar obtener venta existente desde backend
      const ventaExistente = await ventasActivasService.obtenerVentaActiva(mesa.id);
      
      if (ventaExistente) {
        console.log('📋 Venta existente encontrada:', ventaExistente.id, 'Items:', ventaExistente.items.length);
        
        // Convertir al formato local
        const ventaLocal = adaptarVentaPersistentaALocal(ventaExistente);
        setVentaActiva(ventaLocal);
      } else {
        console.log('📝 No hay venta existente para mesa:', mesa.numero);
        // No crear venta vacía - esperar a que se agregue el primer producto
        setVentaActiva(null);
      }
    } catch (error) {
      console.error('❌ Error inicializando venta:', error);
      mostrarNotificacion('Error al inicializar venta', 'error');
    }
  };

  // Función para validar mesa sin conflictos - AUTO-CORRECCIÓN INTELIGENTE
  const validarMesaSinConflictos = async (): Promise<boolean> => {
    if (!mesa) return false;
    
    console.log('🔍 VALIDANDO MESA SIN CONFLICTOS:', mesa.numero);
    
    try {
      // Verificar si hay venta activa
      const ventaActiva = await ventasActivasService.obtenerVentaActiva(mesa.id);
      
      // ==========================================
      // 🎯 AUTO-CORRECCIÓN INTELIGENTE DE CONFLICTOS
      // ==========================================
      // En lugar de solo mostrar errores, intentamos resolver automáticamente
      // los problemas de sincronización entre frontend y backend
      // ==========================================
      
      let conflictoResuelto = false;
      
      if (mesa.estado === EstadoMesa.LIBRE) {
        // Mesa libre no debería tener venta activa
        if (ventaActiva && ventaActiva.items.length > 0) {
          console.log('🔧 AUTO-CORRECCIÓN: Mesa LIBRE tiene venta activa, cambiando a OCUPADA');
          onCambiarEstado(mesa, EstadoMesa.OCUPADA);
          mostrarNotificacion(`Mesa ${mesa.numero} tenía productos pendientes - Estado corregido a OCUPADA`, 'info');
          conflictoResuelto = true;
        }
      } else if (mesa.estado === EstadoMesa.OCUPADA) {
        // Mesa ocupada debería tener venta activa
        if (!ventaActiva || ventaActiva.items.length === 0) {
          console.log('🔧 AUTO-CORRECCIÓN: Mesa OCUPADA sin venta activa, cambiando a LIBRE');
          onCambiarEstado(mesa, EstadoMesa.LIBRE);
          mostrarNotificacion(`Mesa ${mesa.numero} no tenía productos - Estado corregido a LIBRE`, 'info');
          conflictoResuelto = true;
        }
      } else if (mesa.estado === EstadoMesa.ESPERANDO_PEDIDO) {
        // Mesa azul debería tener venta activa (facturada)
        if (!ventaActiva || ventaActiva.items.length === 0) {
          console.log('🔧 AUTO-CORRECCIÓN: Mesa ESPERANDO_PEDIDO sin venta activa, cambiando a LIBRE');
          onCambiarEstado(mesa, EstadoMesa.LIBRE);
          mostrarNotificacion(`Mesa ${mesa.numero} no tenía productos facturados - Estado corregido a LIBRE`, 'info');
          conflictoResuelto = true;
        }
      }
      
      // ==========================================
      // 🎯 VALIDACIÓN FINAL DESPUÉS DE AUTO-CORRECCIÓN
      // ==========================================
      // Solo mostrar errores si no pudimos resolver el conflicto
      // ==========================================
      if (!conflictoResuelto) {
        console.log('✅ Mesa validada sin conflictos');
        return true;
      } else {
        console.log('✅ Mesa corregida automáticamente');
        return true;
      }
      
    } catch (error: any) {
      console.error('❌ Error validando mesa:', error);
      
      // Solo mostrar error si es un problema de conectividad o BD
      if (error.response?.status === 500 || error.code === 'NETWORK_ERROR') {
        mostrarNotificacion('Error de conectividad al validar mesa', 'error');
      }
      
      return false;
    }
  };

  const agregarProducto = async (producto: ProductoCompleto) => {
    if (!mesa) {
      mostrarNotificacion('Error: No hay mesa seleccionada', 'error');
      return;
    }

    try {
      // Verificar si es el primer producto (no hay venta activa)
      const esElPrimerProducto = !(await ventasActivasService.tieneVentaActiva(mesa.id));

      // Usar el servicio persistente para agregar el producto (ahora async)
      const ventaActualizada = await ventasActivasService.agregarProducto(
        mesa.id,
        {
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          precio: producto.precio
        },
        1 // cantidad por defecto
      );

      // Actualizar estado local
      const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
      setVentaActiva(ventaLocal);

      // ==========================================
      // 🎯 SINCRONIZACIÓN INTELIGENTE DE ESTADOS
      // ==========================================
      // Asegurar que el estado de la mesa coincida con la venta activa
      // ==========================================
      if (esElPrimerProducto || mesa.estado === EstadoMesa.LIBRE) {
        console.log('🍽️ Primer producto agregado - Marcando mesa como ocupada:', mesa.numero);
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
        toastService.success(`Mesa ${mesa.numero} ocupada - Venta iniciada`);
      } else if (mesa.estado === EstadoMesa.ESPERANDO_PEDIDO) {
        // Si estaba en azul (facturada) y agregamos más productos, volver a rojo
        console.log('🔄 Producto agregado a mesa facturada - Cambiando a OCUPADA');
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
        toastService.info(`Mesa ${mesa.numero} actualizada - Nuevos productos agregados`);
      }

      // Limpiar búsqueda
      setTerminoBusqueda('');
      setResultadosBusqueda([]);
      setIndiceSeleccionado(0);
      
      // Volver a enfocar el buscador
      setTimeout(() => {
        focusearBuscador();
      }, 100);
      
      // Notificación del producto agregado
      const itemExistente = ventaActualizada.items.find(item => item.productoId === producto.id);
      if (itemExistente && itemExistente.cantidad > 1) {
        toastService.success(`${producto.nombre} - Cantidad: ${itemExistente.cantidad}`);
      } else {
        toastService.success(`${producto.nombre} agregado a la venta`);
      }
    } catch (error: any) {
      console.error('❌ Error agregando producto:', error);
      
      if (error.response?.status === 401) {
        mostrarNotificacion('Sesión expirada, inicie sesión nuevamente', 'error');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        mostrarNotificacion('Producto no encontrado', 'error');
      } else if (error.response?.status === 400) {
        mostrarNotificacion(error.response.data.message || 'Error al agregar el producto', 'error');
      } else {
        mostrarNotificacion('Error al agregar el producto', 'error');
      }
    }
  };

  const eliminarProducto = async (itemId: string) => {
    if (!mesa) return;

    try {
      const ventaActualizada = await ventasActivasService.eliminarProducto(mesa.id, itemId);
      
      if (ventaActualizada) {
        const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
        setVentaActiva(ventaLocal);
        toastService.success('Producto eliminado');
      } else {
        // Si no hay más productos, limpiar la venta
        setVentaActiva(null);
        onCambiarEstado(mesa, EstadoMesa.LIBRE);
        toastService.success('Venta vacía - Mesa liberada');
      }
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
      mostrarNotificacion('Error al eliminar producto', 'error');
    }
  };

  const modificarCantidad = async (itemId: string, nuevaCantidad: number) => {
    if (!mesa) return;

    try {
      const ventaActualizada = await ventasActivasService.modificarCantidad(mesa.id, itemId, nuevaCantidad);
      
      if (ventaActualizada) {
        const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
        setVentaActiva(ventaLocal);
        toastService.success('Cantidad actualizada');
      } else {
        // Si no hay más productos, limpiar la venta
        setVentaActiva(null);
        onCambiarEstado(mesa, EstadoMesa.LIBRE);
        toastService.success('Venta vacía - Mesa liberada');
      }
    } catch (error) {
      console.error('❌ Error modificando cantidad:', error);
      mostrarNotificacion('Error al modificar cantidad', 'error');
    }
  };

  const finalizarVenta = async () => {
    if (!ventaActiva || !mesa) return;

    try {
      // Completar la venta en el servicio (esto la elimina de activas)
      await ventasActivasService.completarVenta(mesa.id);
      
      // Completar la venta en el componente padre
      onVentaCompleta(ventaActiva);
      
      // Cambiar estado de la mesa
      onCambiarEstado(mesa, EstadoMesa.LIBRE);
      
      // Limpiar el estado local
      setVentaActiva(null);
      setFacturaEmitida({
        tipo: null,
        pagos: [],
        anulada: false
      });
      
      toastService.success('Venta finalizada correctamente');
      onClose();
    } catch (error) {
      console.error('❌ Error finalizando venta:', error);
      mostrarNotificacion('Error al finalizar venta', 'error');
    }
  };

  const reiniciarMesaCompleta = async () => {
    if (!mesa) return;

    try {
      console.log('🔄 REINICIANDO MESA COMPLETAMENTE:', mesa.numero);
      
      // Criterio 1: Eliminar todos los artículos consumidos
      await ventasActivasService.completarVenta(mesa.id);
      
      // Criterio 1: Quitar cliente asociado (si había)
      setClienteSeleccionado(null);
      
      // Criterio 1: Limpiar notas o comentarios vinculados
      setVentaActiva(null);
      
      // Criterio 1: Limpiar facturas y estados de pago
      setFacturaEmitida({
        tipo: null,
        pagos: [],
        anulada: false
      });
      
      // Limpiar TODOS los estados de la interfaz
      setTerminoBusqueda('');
      setResultadosBusqueda([]);
      setIndiceSeleccionado(0);
      setItemSeleccionado(null);
      setAnchorMenuItems(null);
      setDialogoAbierto(null);
      setTiempoTranscurrido('');
      setDescuentoAplicado(0);
      setModalFormasPago(false);
      setMostrarModalFormasPago(false);
      setTipoComprobanteSeleccionado('');
      
      // Criterio 3: Cambiar estado a "Libre" inmediatamente
      onCambiarEstado(mesa, EstadoMesa.LIBRE);
      
      // Criterio 5: Mostrar confirmación visual rápida
      toastService.success('🎉 Mesa liberada con éxito - Lista para nuevos clientes');
      
      // Criterio 2: Cerrar panel sin confirmación adicional
      setTimeout(() => {
        onClose();
      }, 1500);
      
      console.log('✅ MESA REINICIADA COMPLETAMENTE:', mesa.numero, 'Estado: LIBRE');
      
    } catch (error) {
      console.error('❌ Error reiniciando mesa:', error);
      toastService.error('Error al reiniciar la mesa');
    }
  };

  // Registrar toast service
  useEffect(() => {
    const handler = ({ message, type }: { message: string; type?: 'success' | 'error' | 'info' | 'warning' }) => {
      setSnackbar({
        open: true,
        message,
        severity: type || 'info'
      });
    };
    
    toastService.setHandler(handler);
    
    // Cleanup - dejamos un handler vacío
    return () => {
      toastService.setHandler(() => {});
    };
  }, []);

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navegar en resultados de búsqueda
      if (resultadosBusqueda.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setIndiceSeleccionado(prev => 
            prev < resultadosBusqueda.length - 1 ? prev + 1 : 0
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setIndiceSeleccionado(prev => 
            prev > 0 ? prev - 1 : resultadosBusqueda.length - 1
          );
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (resultadosBusqueda[indiceSeleccionado]) {
            agregarProducto(resultadosBusqueda[indiceSeleccionado]);
          }
        }
      }
      
      // Otros atajos
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (itemSeleccionado) {
          setDialogoAbierto('especificaciones');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [itemSeleccionado, resultadosBusqueda, indiceSeleccionado]);

  // Búsqueda en tiempo real - desde 2 caracteres para evitar errores
  useEffect(() => {
    if (terminoBusqueda.length >= 2) {
      buscarProductos();
    } else {
      setResultadosBusqueda([]);
      setBuscandoProductos(false); // Asegurar que no quede loading activo
    }
  }, [terminoBusqueda]);

  // Contador de tiempo dinámico
  useEffect(() => {
    if (!ventaActiva || !ventaActiva.fechaApertura) {
      setTiempoTranscurrido('');
      return;
    }

    const actualizarTiempo = () => {
      const ahora = new Date();
      const inicio = new Date(ventaActiva.fechaApertura);
      const diferencia = ahora.getTime() - inicio.getTime();
      
      const minutos = Math.floor(diferencia / (1000 * 60));
      const horas = Math.floor(minutos / 60);
      const minutosRestantes = minutos % 60;
      
      if (horas > 0) {
        setTiempoTranscurrido(`${horas}h ${minutosRestantes}min`);
      } else {
        setTiempoTranscurrido(`${minutos} min`);
      }
    };

    // Actualizar inmediatamente
    actualizarTiempo();
    
    // Actualizar cada minuto
    const intervalo = setInterval(actualizarTiempo, 60000);
    
    return () => clearInterval(intervalo);
  }, [ventaActiva]);

  const buscarProductos = async () => {
    if (!terminoBusqueda || terminoBusqueda.length < 2) return;
    
    setBuscandoProductos(true);
    try {
      const productos = await productosService.buscarEnTiempoReal(terminoBusqueda, 20);
      
      // Filtrar productos con búsqueda mejorada
      const productosFiltrados = productos.filter(producto => 
        coincideBusqueda(producto.nombre, terminoBusqueda) ||
        coincideBusqueda(producto.codigo, terminoBusqueda) ||
        coincideBusqueda(producto.descripcion || '', terminoBusqueda)
      );
      
      setResultadosBusqueda(productosFiltrados);
      setIndiceSeleccionado(0); // Resetear selección
      
      if (productosFiltrados.length === 0) {
        mostrarNotificacion(`No se encontraron productos para "${terminoBusqueda}"`, 'info');
      }
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      
      // Verificar si es un error de autenticación
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any;
        if (axiosError.response?.status === 401) {
          mostrarNotificacion('Sesión expirada. Por favor, inicie sesión nuevamente.', 'error');
          // Redirigir al login después de un breve delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          mostrarNotificacion('Error al buscar productos. Verifique su conexión.', 'error');
        }
      } else {
        mostrarNotificacion('Error al buscar productos. Verifique su conexión.', 'error');
      }
    } finally {
      setBuscandoProductos(false);
    }
  };

  const moverItem = (itemId: string, direccion: 'up' | 'down') => {
    if (!ventaActiva) return;

    const items = [...ventaActiva.items];
    const index = items.findIndex(item => item.id === itemId);
    
    if (direccion === 'up' && index > 0) {
      [items[index], items[index - 1]] = [items[index - 1], items[index]];
    } else if (direccion === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    }

    setVentaActiva({
      ...ventaActiva,
      items
    });
  };

  const marcarComoInvitacion = (itemId: string) => {
    if (!ventaActiva) return;

    const nuevosItems = ventaActiva.items.map(item => {
      if (item.id === itemId) {
        return { ...item, esInvitacion: !item.esInvitacion, subtotal: item.esInvitacion ? item.precio * item.cantidad : 0 };
      }
      return item;
    });

    const nuevoTotal = nuevosItems.reduce((sum, item) => sum + item.subtotal, 0);

    setVentaActiva({
      ...ventaActiva,
      items: nuevosItems,
      total: nuevoTotal
    });

    toastService.success('Ítem marcado como invitación');
  };

  const marcarComoNoDisponible = (itemId: string) => {
    if (!ventaActiva) return;

    const nuevosItems = ventaActiva.items.map(item => {
      if (item.id === itemId) {
        return { ...item, noDisponible: !item.noDisponible };
      }
      return item;
    });

    setVentaActiva({
      ...ventaActiva,
      items: nuevosItems
    });

    toastService.warning('Ítem marcado como no disponible');
  };

  const enviarComanda = () => {
    if (!ventaActiva || !mesa) return;

    setVentaActiva({
      ...ventaActiva,
      estado: 'enviada'
    });

    // Criterio @estadomesas.mdc: Estado azul SOLO al emitir factura/ticket
    // Enviar comanda NO cambia el estado - mantiene ROJO (ocupada)
    // onCambiarEstado(mesa, EstadoMesa.ESPERANDO_PEDIDO); // REMOVIDO
    toastService.success('Comanda enviada a cocina');
  };

  const pedirCuenta = () => {
    if (!ventaActiva || !mesa) return;

    setVentaActiva({
      ...ventaActiva,
      estado: 'cuenta_pedida'
    });

    // Criterio @estadomesas.mdc: Estado azul SOLO al emitir factura/ticket
    // Pedir cuenta NO cambia el estado - mantiene ROJO (ocupada)
    // onCambiarEstado(mesa, EstadoMesa.CUENTA_PEDIDA); // REMOVIDO
    toastService.success('Cuenta solicitada');
  };

  // Nueva función para manejar el cierre del panel
  const handleCerrarPanel = () => {
    if (!mesa) {
      onClose();
      return;
    }

    // Criterios @estadomesas.mdc: 
    // - Verde: Sin ítems ni facturación
    // - Rojo: Con ítems pero sin facturación
    // - Azul: SOLO cuando se emite factura/ticket

    if (ventaActiva && ventaActiva.items.length > 0) {
      // Si hay items pero NO hay factura emitida, debe quedar en ROJO (ocupada)
      if (!facturaEmitida.tipo || facturaEmitida.anulada) {
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
        mostrarNotificacion('Mesa ocupada - Items guardados', 'info');
      }
      // Si ya hay factura emitida, mantener estado azul (no cambiar)
    } else {
      // Si no hay items, dejar mesa libre (verde)
      onCambiarEstado(mesa, EstadoMesa.LIBRE);
      mostrarNotificacion('Mesa libre - Sin items', 'info');
    }

    // Cerrar el panel
    onClose();
  };

  // Handlers críticos conectados a modales
  const handleEspecificacionesModal = async (especificaciones: string) => {
    if (itemSeleccionado) {
      const resultado = await handlers.handleEspecificaciones(itemSeleccionado, especificaciones);
      if (resultado) {
        // Actualizar el item en la venta
        if (ventaActiva) {
          const nuevosItems = ventaActiva.items.map(item => 
            item.id === itemSeleccionado 
              ? { ...item, especificaciones }
              : item
          );
          setVentaActiva({ ...ventaActiva, items: nuevosItems });
        }
      }
    }
  };

  const handleFusionModal = async () => {
    if (mesa) {
      const resultado = await handlers.handleFusion(mesa.id);
      if (resultado) {
        // Recargar venta después de fusión
        const ventaActualizada = await ventasActivasService.obtenerVentaActiva(mesa.id);
        if (ventaActualizada) {
          const ventaLocal = adaptarVentaPersistentaALocal(ventaActualizada);
          setVentaActiva(ventaLocal);
        }
      }
    }
  };

  const handleDescuentoModal = async (tipo: 'porcentaje' | 'fijo', valor: number) => {
    if (ventaActiva && valor > 0) {
      let nuevoTotal = ventaActiva.total;
      let descuentoAplicado = 0;
      
      if (tipo === 'porcentaje') {
        descuentoAplicado = (ventaActiva.total * valor) / 100;
        nuevoTotal = ventaActiva.total - descuentoAplicado;
      } else {
        descuentoAplicado = valor;
        nuevoTotal = Math.max(0, ventaActiva.total - valor);
      }
      
      setVentaActiva({ ...ventaActiva, total: nuevoTotal });
      setDescuentoAplicado(descuentoAplicado);
      
      const tipoTexto = tipo === 'porcentaje' ? `${valor}%` : `$${valor}`;
      toastService.success(`Descuento aplicado: ${tipoTexto} (-$${descuentoAplicado.toFixed(2)})`);
    }
  };

  const handleDivisionModal = async (divisiones: any[]) => {
    if (ventaActiva) {
      const resultado = await handlers.handleDivisionCuenta(ventaActiva.id, divisiones);
      if (resultado) {
        toastService.success('Cuenta dividida correctamente');
        onClose();
      }
    }
  };

  const handlePagoParcialModal = async (monto: number, medioPago: string) => {
    if (ventaActiva && monto > 0) {
      const nuevoTotal = Math.max(0, ventaActiva.total - monto);
      setVentaActiva({ ...ventaActiva, total: nuevoTotal });
      
      toastService.success(`Pago parcial registrado: $${monto} (${medioPago})`);
      
      if (nuevoTotal === 0) {
        toastService.success('Cuenta totalmente pagada');
        finalizarVenta();
      } else {
        toastService.info(`Saldo pendiente: $${nuevoTotal.toFixed(2)}`);
      }
    }
  };

    // Cargar sectores y mesas para transferencia
  const cargarSectoresYMesas = async () => {
    try {
      // Cargar sectores
      const responseSectores = await api.get('/sectores');
      setSectoresDisponibles(responseSectores.data.sectores || []);
      
      // Cargar todas las mesas
      const responseMesas = await api.get('/mesas');
      const todasLasMesas = responseMesas.data.mesas || [];
      
      // Filtrar mesas disponibles (libres y diferentes a la actual)
      const mesasLibres = todasLasMesas.filter((m: any) => 
        m.id !== mesa?.id && m.estado === 'LIBRE'
      );
      setMesasDisponibles(mesasLibres);
      
    } catch (error) {
      console.error('Error cargando sectores y mesas:', error);
      toastService.error('Error al cargar sectores y mesas');
    }
  };

  // Filtrar mesas por sector seleccionado
  const mesasPorSector = mesasDisponibles.filter(m => 
    !sectorSeleccionado || m.sectorId === sectorSeleccionado
  );

  const handleTransferirModal = async (mesaDestinoId: string, itemsSeleccionados?: string[]) => {
    try {
      if (!mesa || !ventaActiva) {
        mostrarNotificacion('No hay venta activa para transferir', 'error');
        return;
      }

      // Llamar al endpoint de transferencia
      const response = await api.post(`/mesas/${mesa.id}/transferir`, {
        mesaDestinoId,
        itemsIds: itemsSeleccionados,
        transferirTodos: !itemsSeleccionados || itemsSeleccionados.length === 0
      });

      mostrarNotificacion('Transferencia realizada exitosamente', 'success');
      
      // Actualizar estado de la mesa actual
      if (response.data.mesaOrigenVacia) {
        onCambiarEstado(mesa, EstadoMesa.LIBRE);
        setVentaActiva(null);
        onClose();
      } else {
        // Recargar la venta activa si quedan ítems
        await inicializarVenta();
      }
      
    } catch (error) {
      console.error('Error al transferir:', error);
      mostrarNotificacion('Error al transferir mesa', 'error');
    }
  };

  const abrirModalTransferencia = async () => {
    try {
      await cargarSectoresYMesas();
      setMostrarModalTransferencia(true);
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      mostrarNotificacion('Error al cargar sectores disponibles', 'error');
    }
  };

  const handlePuntosModal = async (puntosACanjear: number, tipoDescuento: string) => {
    if (clienteSeleccionado) {
      const resultado = await handlers.handlePuntos(clienteSeleccionado.id, puntosACanjear);
      if (resultado && ventaActiva) {
        setVentaActiva({ 
          ...ventaActiva, 
          total: ventaActiva.total - resultado.descuento 
        });
      }
    }
  };

  // Función para validar y controlar estados de mesa según criterios obligatorios
  const validarEstadoMesa = () => {
    if (!mesa || !ventaActiva) return;

    // Criterio 1: Estados únicos
    // Verde: Sin ítems ni facturación
    // Rojo: Con ítems cargados pero sin facturación  
    // Azul: Facturada (ticket fiscal o no fiscal emitido)

    if (ventaActiva.items.length === 0 && !facturaEmitida.tipo) {
      // Estado Verde: Mesa vacía
      if (mesa.estado !== EstadoMesa.LIBRE) {
        onCambiarEstado(mesa, EstadoMesa.LIBRE);
      }
    } else if (ventaActiva.items.length > 0 && !facturaEmitida.tipo) {
      // Estado Rojo: Mesa con ítems pero sin facturación
      if (mesa.estado !== EstadoMesa.OCUPADA) {
        onCambiarEstado(mesa, EstadoMesa.OCUPADA);
      }
    } else if (facturaEmitida.tipo && !facturaEmitida.anulada) {
      // Estado Azul: Mesa facturada
      if (mesa.estado !== EstadoMesa.ESPERANDO_PEDIDO) {
        onCambiarEstado(mesa, EstadoMesa.ESPERANDO_PEDIDO);
      }
    }
  };

  // Ejecutar validación cada vez que cambien los estados relevantes
  useEffect(() => {
    validarEstadoMesa();
  }, [ventaActiva?.items.length, facturaEmitida.tipo, facturaEmitida.anulada]);

  const handleFacturacionModal = async (tipoComprobante: string) => {
    if (!ventaActiva || !mesa) {
      toastService.error('No hay venta activa o mesa seleccionada');
      return;
    }

    // Criterio 3: Registro obligatorio de forma de cobro
    // No se puede emitir ticket sin seleccionar forma de pago
    setTipoComprobanteSeleccionado(tipoComprobante);
    setModalFormasPago(true);
  };

  // Función para procesar facturación con forma de pago validada
  const procesarFacturacionConPago = async (formasPago: Array<{metodo: string, monto: number}>) => {
    if (!ventaActiva || !mesa || !tipoComprobanteSeleccionado) return;

    // Validar que las formas de pago cubran el total
    const totalPagos = formasPago.reduce((sum, pago) => sum + pago.monto, 0);
    if (Math.abs(totalPagos - ventaActiva.total) > 0.01) {
      toastService.error('El total de los pagos debe coincidir con el total de la venta');
      return;
    }

    try {
      console.log('💰 Procesando facturación con formas de pago:', { 
        ventaId: ventaActiva.id, 
        tipoComprobante: tipoComprobanteSeleccionado, 
        formasPago,
        total: ventaActiva.total 
      });

      // Procesar facturación en el backend CON formas de pago
      const resultado = await handlers.handleFacturacion(
        ventaActiva.id, 
        tipoComprobanteSeleccionado, 
        clienteSeleccionado,
        formasPago  // 🔥 PASAR LAS FORMAS DE PAGO
      );

      if (resultado) {
        // Registrar factura emitida
        const nuevaFactura = {
          tipo: tipoComprobanteSeleccionado.includes('TICKET') ? 'no_fiscal' as const : 'fiscal' as const,
          numero: resultado.numeroComprobante || `${Date.now()}`,
          pagos: formasPago.map(p => ({
            metodo: p.metodo as 'efectivo' | 'tarjeta' | 'qr' | 'transferencia',
            monto: p.monto
          })),
          anulada: false,
          fechaEmision: new Date()
        };
        
        setFacturaEmitida(nuevaFactura);

        // Criterio 2: Estado azul se activa solo al emitir ticket fiscal o no fiscal
        onCambiarEstado(mesa, EstadoMesa.ESPERANDO_PEDIDO);
        
        // Cerrar modal de formas de pago
        setModalFormasPago(false);
        
        toastService.success(`${tipoComprobanteSeleccionado} generado correctamente`);
        
        // Criterio 2: Reinicio automático inmediato después de confirmar pago
        setTimeout(() => {
          reiniciarMesaCompleta();
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Error procesando facturación:', error);
      toastService.error('Error al procesar la facturación');
    }
  };

  // Función para manejar el cobro optimizado
  const handleFacturacionConPago = async (tipoComprobante: string, formasPago: Array<{metodo: string, monto: number}>) => {
    setTipoComprobanteSeleccionado(tipoComprobante);
    setDialogoAbierto(null);
    await procesarFacturacionConPago(formasPago);
  };

  // Función para anular factura (Criterio 4)
  const anularFactura = async () => {
    if (!facturaEmitida.tipo || !mesa || !ventaActiva) return;

    try {
      // Anular en el backend
      // await api.post(`/facturas/${facturaEmitida.numero}/anular`);
      
      // Marcar factura como anulada
      setFacturaEmitida(prev => ({ ...prev, anulada: true }));
      
      // Criterio 4: Volver estado de mesa a rojo (ocupada)
      onCambiarEstado(mesa, EstadoMesa.OCUPADA);
      
      toastService.success('Factura anulada - Mesa vuelve a estado ocupado');
      
      // Permitir nueva facturación
      setModalFormasPago(false);
      
    } catch (error) {
      toastService.error('Error al anular factura');
    }
  };

  // Función para obtener datos de cliente seleccionado
  const obtenerDatosCliente = () => {
    if (!clienteSeleccionado) return null;
    
    return {
      id: clienteSeleccionado.id,
      nombre: clienteSeleccionado.nombre,
      email: clienteSeleccionado.email
    };
  };

  // Función de test para validar reinicio completo (Criterio 5)
  const testReinicioCompleto = () => {
    if (!mesa) return;
    
    console.log('🧪 TEST DE REINICIO COMPLETO - Mesa:', mesa.numero);
    console.log('Estado antes del test:', {
      ventaActiva: !!ventaActiva,
      itemsCount: ventaActiva?.items.length || 0,
      clienteSeleccionado: !!clienteSeleccionado,
      facturaEmitida: facturaEmitida.tipo,
      estadoMesa: mesa.estado,
      terminoBusqueda,
      tiempoTranscurrido
    });
    
    // Simular cobro completado
    reiniciarMesaCompleta();
    
    // Verificar después del reinicio (en el próximo ciclo)
    setTimeout(() => {
      console.log('✅ TEST COMPLETADO - Estado después del reinicio:', {
        ventaActiva: !!ventaActiva,
        clienteSeleccionado: !!clienteSeleccionado,
        facturaEmitida: facturaEmitida.tipo,
        estadoMesa: mesa.estado,
        panelCerrado: !isOpen
      });
    }, 100);
  };

  // Renderizado de componentes
  const renderHeader = () => (
    <Box sx={{ 
      p: 2, 
      bgcolor: 'primary.main', 
      color: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      borderBottom: '2px solid rgba(255,255,255,0.1)'
    }}>
      <Grid container alignItems="center" spacing={2}>
        <Grid item xs>
          <Typography variant="h6" sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            fontWeight: 'bold',
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            <Grid3x3 size={20} />
            Mesa {mesa?.numero}
          </Typography>
          <Typography variant="body2" sx={{ 
            opacity: 0.95,
            fontWeight: 500,
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
          }}>
            {ventaActiva?.camarero || 'Sin asignar'}
          </Typography>
        </Grid>
        <Grid item>
          <Chip 
            label={tiempoTranscurrido || 'Nueva'}
            color="secondary"
            variant="filled"
            icon={<Timer size={16} />}
            sx={{
              fontWeight: 'bold',
              bgcolor: 'rgba(255,255,255,0.9)',
              color: 'primary.main',
              '& .MuiChip-icon': {
                color: 'primary.main'
              }
            }}
          />
        </Grid>
        <Grid item>
          <IconButton 
            onClick={handleCerrarPanel} 
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <X size={20} />
          </IconButton>
        </Grid>
      </Grid>
    </Box>
  );

  const renderBuscador = () => (
    <Box sx={{ p: 2 }}>
      <TextField
        id="buscador-productos"
        fullWidth
        placeholder="Busca productos..."
        value={terminoBusqueda}
        onChange={(e) => setTerminoBusqueda(e.target.value)}
        autoComplete="off"
        InputProps={{
          startAdornment: <Search size={20} style={{ marginRight: 8, color: '#666' }} />,
          endAdornment: buscandoProductos && <CircularProgress size={20} />
        }}
        variant="outlined"
        size="medium"
        sx={{ mb: terminoBusqueda.length === 1 ? 1 : 2 }}
        helperText={terminoBusqueda.length === 1 ? "Escribe al menos 2 caracteres para buscar" : ""}
      />

      {resultadosBusqueda.length > 0 && (
        <Paper elevation={2} sx={{ maxHeight: 300, overflowY: 'auto' }}>
          <List dense>
            {resultadosBusqueda.map((producto, index) => (
              <ListItem key={producto.id} disablePadding>
                <ListItemButton 
                  selected={index === indiceSeleccionado}
                  onClick={() => {
                    agregarProducto(producto);
                  }}
                  sx={{
                    backgroundColor: index === indiceSeleccionado ? 'primary.50' : 'transparent',
                    '&:hover': {
                      backgroundColor: index === indiceSeleccionado ? 'primary.100' : 'grey.50'
                    }
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: 'grey.100', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          minWidth: 60,
                          textAlign: 'center'
                        }}>
                          {resaltarTexto(producto.codigo, terminoBusqueda)}
                        </Typography>
                        <Typography variant="body1" sx={{ flex: 1 }}>
                          {resaltarTexto(producto.nombre, terminoBusqueda)}
                        </Typography>
                        <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                          ${producto.precio}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Box component="div" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Chip label={obtenerNombreCategoria(producto.categoria)} size="small" variant="outlined" />
                        <Box component="span" sx={{ fontSize: '0.75rem', color: 'success.main' }}>
                          Disponible
                        </Box>
                      </Box>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );

  const renderItems = () => {
    return (
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {!ventaActiva || ventaActiva.items.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'text.secondary'
          }}>
            <ShoppingCart size={64} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              No hay productos en la venta
            </Typography>
            <Typography variant="body2">
              Busca productos para comenzar
            </Typography>
            <Typography variant="caption" sx={{ mt: 1, color: 'text.disabled' }}>
              Usa ↑↓ para navegar y Enter para seleccionar
            </Typography>
          </Box>
        ) : (
          <List>
            {ventaActiva.items.map((item, index) => (
            <Paper key={item.id} elevation={1} sx={{ mb: 2 }}>
              <ListItem sx={{ 
                bgcolor: item.esInvitacion ? 'success.50' : item.noDisponible ? 'grey.100' : 'white',
                opacity: item.noDisponible ? 0.7 : 1
              }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {item.producto.nombre}
                      </Typography>
                      {item.esInvitacion && (
                        <Chip label="Invitación" size="small" color="success" />
                      )}
                      {item.noDisponible && (
                        <Chip label="No disponible" size="small" color="error" />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton 
                          size="small" 
                          onClick={() => modificarCantidad(item.id, item.cantidad - 1)}
                          disabled={item.cantidad <= 1}
                        >
                          <Remove size={16} />
                        </IconButton>
                        <Typography variant="body2" sx={{ minWidth: 30, textAlign: 'center' }}>
                          {item.cantidad}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={() => modificarCantidad(item.id, item.cantidad + 1)}
                        >
                          <Add size={16} />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        × ${item.precio}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 'auto' }}>
                        ${item.subtotal}
                      </Typography>
                    </Box>
                  }
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 2 }}>
                  <Tooltip title={index === 0 ? '' : 'Subir'}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => moverItem(item.id, 'up')}
                        disabled={index === 0}
                      >
                        <KeyboardArrowUp size={16} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={index === ventaActiva.items.length - 1 ? '' : 'Bajar'}>
                    <span>
                      <IconButton 
                        size="small" 
                        onClick={() => moverItem(item.id, 'down')}
                        disabled={index === ventaActiva.items.length - 1}
                      >
                        <KeyboardArrowDown size={16} />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Más opciones">
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        setItemSeleccionado(item.id);
                        setAnchorMenuItems(e.currentTarget);
                      }}
                    >
                      <MoreHoriz size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
    );
  };

  const renderTotal = () => (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
      <Grid container alignItems="center" justifyContent="space-between">
        <Grid item>
          <Typography variant="h6">TOTAL:</Typography>
        </Grid>
        <Grid item>
          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
            ${ventaActiva?.total || 0}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  const renderToolbar = () => (
    <Box sx={{ bgcolor: 'background.default', borderTop: 1, borderColor: 'divider' }}>
      <Tabs 
        value={tabToolbar} 
        onChange={(_, v) => setTabToolbar(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Pedido" />
        <Tab label="Facturación" />
        <Tab label="Comercial" />
        <Tab label="Otras" />
      </Tabs>
      
      <Box sx={{ p: 2 }}>
        {tabToolbar === 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Enfocar búsqueda de productos (Incluir producto)">
              <Button variant="outlined" startIcon={<Focus />} onClick={focusearBuscador}>
                Incluir
              </Button>
            </Tooltip>
            <Tooltip title="Fusionar cuentas de la mesa">
              <Button variant="outlined" startIcon={<Merge />} onClick={() => setDialogoAbierto('fusion')}>
                Fusión
              </Button>
            </Tooltip>
            <Tooltip title="Enviar comanda a cocina">
              <Button variant="outlined" startIcon={<Send />} onClick={enviarComanda}>
                Marchar
              </Button>
            </Tooltip>
            {process.env.NODE_ENV === 'development' && (
              <Tooltip title="Test de reinicio completo de mesa">
                <Button variant="outlined" color="warning" startIcon={<CheckCircle />} onClick={testReinicioCompleto}>
                  Test Reset
                </Button>
              </Tooltip>
            )}
          </Stack>
        )}
        
        {tabToolbar === 1 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Cobrar mesa - Proceso optimizado">
              <Button 
                variant="contained" 
                color="success"
                size="large"
                startIcon={<Receipt />} 
                onClick={() => setDialogoAbierto('cobro-optimizado')}
              >
                Cobrar
              </Button>
            </Tooltip>
            <Tooltip title="Sistema de puntos de fidelización">
              <Button variant="outlined" startIcon={<Star />} onClick={() => mostrarNotificacion('Función temporalmente deshabilitada', 'info')}>
                Puntos
              </Button>
            </Tooltip>
          </Stack>
        )}
        
        {tabToolbar === 2 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Aplicar descuento (% o fijo)">
              <Button variant="outlined" startIcon={<Percent />} onClick={() => setDialogoAbierto('descuento')}>
                Descuento
              </Button>
            </Tooltip>
            <Tooltip title="Dividir cuenta entre personas">
              <Button variant="outlined" startIcon={<Scissors />} onClick={() => setDialogoAbierto('dividir')}>
                Dividir
              </Button>
            </Tooltip>
          </Stack>
        )}
        
        {tabToolbar === 3 && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Tooltip title="Transferir mesa o ítems">
              <Button variant="outlined" startIcon={<ArrowRightLeft />} onClick={abrirModalTransferencia}>
                Transferir
              </Button>
            </Tooltip>
            <Tooltip title="Registrar pago parcial">
              <Button variant="outlined" startIcon={<HandCoins />} onClick={() => setDialogoAbierto('pago-parcial')}>
                Pago Parcial
              </Button>
            </Tooltip>
          </Stack>
        )}
        

      </Box>
    </Box>
  );

  const renderMenuItems = () => (
    <Menu
      anchorEl={anchorMenuItems}
      open={Boolean(anchorMenuItems)}
      onClose={() => setAnchorMenuItems(null)}
    >
      <MenuItem onClick={() => eliminarProducto(itemSeleccionado!)}>
        <Delete size={16} style={{ marginRight: 8 }} />
        Borrar ítem
      </MenuItem>
      <MenuItem onClick={() => marcarComoInvitacion(itemSeleccionado!)}>
        <Gift size={16} style={{ marginRight: 8 }} />
        Invitar (sin cargo)
      </MenuItem>
      <MenuItem onClick={() => marcarComoNoDisponible(itemSeleccionado!)}>
        <Ban size={16} style={{ marginRight: 8 }} />
        No disponible
      </MenuItem>
      <MenuItem onClick={() => mostrarNotificacion('Función temporalmente deshabilitada', 'info')}>
        <Edit size={16} style={{ marginRight: 8 }} />
        Agregar detalle
      </MenuItem>
    </Menu>
  );

  if (!mesa) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={isOpen}
        onClose={handleCerrarPanel}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 480, md: 550 },
            maxWidth: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {renderHeader()}
            {renderBuscador()}
            {renderItems()}
            {ventaActiva && renderTotal()}
            {renderToolbar()}
          </>
        )}
      </Drawer>

      {renderMenuItems()}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={cerrarNotificacion}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={cerrarNotificacion}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Modales de funcionalidades - temporalmente comentados hasta crear los componentes */}

      {/* Modal de confirmación para fusión */}
      <Dialog open={dialogoAbierto === 'fusion'} onClose={() => setDialogoAbierto(null)}>
        <DialogTitle>Confirmar Fusión</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea fusionar todas las cuentas de esta mesa?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(null)}>Cancelar</Button>
          <Button onClick={() => {
            handleFusionModal();
            setDialogoAbierto(null);
          }} variant="contained" color="warning">
            Fusionar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de descuento */}
      <Dialog open={dialogoAbierto === 'descuento'} onClose={() => setDialogoAbierto(null)}>
        <DialogTitle>Aplicar Descuento</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Aplicar descuento a la cuenta total: ${ventaActiva?.total || 0}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                const descuento = prompt('Ingrese el porcentaje de descuento (ej: 10 para 10%):');
                if (descuento) {
                  handleDescuentoModal('porcentaje', parseFloat(descuento));
                  setDialogoAbierto(null);
                }
              }}
            >
              % Porcentaje
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                const descuento = prompt('Ingrese el monto fijo de descuento:');
                if (descuento) {
                  handleDescuentoModal('fijo', parseFloat(descuento));
                  setDialogoAbierto(null);
                }
              }}
            >
              $ Monto Fijo
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de dividir cuenta */}
      <Dialog open={dialogoAbierto === 'dividir'} onClose={() => setDialogoAbierto(null)}>
        <DialogTitle>Dividir Cuenta</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Total a dividir: ${ventaActiva?.total || 0}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                const personas = prompt('¿Entre cuántas personas dividir la cuenta?');
                if (personas) {
                  const montoPorPersona = (ventaActiva?.total || 0) / parseInt(personas);
                  toastService.success(`Cuenta dividida entre ${personas} personas: $${montoPorPersona.toFixed(2)} c/u`);
                  setDialogoAbierto(null);
                }
              }}
            >
              División Equitativa
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                toastService.info('Seleccione los productos para cada persona desde el menú de items');
                setDialogoAbierto(null);
              }}
            >
              División por Items
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de transferir mesa mejorado */}
      <Dialog 
        open={dialogoAbierto === 'transferir'} 
        onClose={() => {
          setDialogoAbierto(null);
          setSectorSeleccionado('');
          setMesaDestinoSeleccionada('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ArrowRightLeft size={24} />
            Transferir Mesa {mesa?.numero}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom sx={{ mb: 3 }}>
            Seleccione la mesa de destino para transferir todos los productos:
          </Typography>
          
          {/* Selector de Sector */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Filtrar por Sector (opcional):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Todos los sectores"
                variant={sectorSeleccionado === '' ? 'filled' : 'outlined'}
                onClick={() => setSectorSeleccionado('')}
                color={sectorSeleccionado === '' ? 'primary' : 'default'}
              />
              {sectoresDisponibles.map(sector => (
                <Chip
                  key={sector.id}
                  label={sector.nombre}
                  variant={sectorSeleccionado === sector.id ? 'filled' : 'outlined'}
                  onClick={() => setSectorSeleccionado(sector.id)}
                  color={sectorSeleccionado === sector.id ? 'primary' : 'default'}
                />
              ))}
            </Box>
          </Box>

          {/* Lista de Mesas Disponibles */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Mesas Disponibles ({mesasPorSector.length}):
            </Typography>
            {mesasPorSector.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography color="text.secondary">
                  No hay mesas libres disponibles en este sector
                </Typography>
              </Paper>
            ) : (
              <Paper sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {mesasPorSector.map(mesaDisponible => {
                    const sectorMesa = sectoresDisponibles.find(s => s.id === mesaDisponible.sectorId);
                    return (
                      <ListItem 
                        key={mesaDisponible.id}
                        disablePadding
                      >
                        <ListItemButton
                          selected={mesaDestinoSeleccionada === mesaDisponible.id}
                          onClick={() => setMesaDestinoSeleccionada(mesaDisponible.id)}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" component="span">
                                  Mesa {mesaDisponible.numero}
                                </Typography>
                                <Chip 
                                  label={sectorMesa?.nombre || 'Sin sector'} 
                                  size="small" 
                                  variant="outlined"
                                />
                                <Chip 
                                  label="LIBRE" 
                                  size="small" 
                                  color="success"
                                />
                              </Box>
                            }
                            secondary={`Capacidad: ${mesaDisponible.capacidad || 'No especificada'} personas`}
                          />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Paper>
            )}
          </Box>

          {/* Información de la transferencia */}
          {mesaDestinoSeleccionada && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Se transferirán todos los productos ({ventaActiva?.items.length || 0} items) 
                de la Mesa {mesa?.numero} a la Mesa {mesasPorSector.find(m => m.id === mesaDestinoSeleccionada)?.numero}.
                La Mesa {mesa?.numero} quedará libre.
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDialogoAbierto(null);
              setSectorSeleccionado('');
              setMesaDestinoSeleccionada('');
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              if (mesaDestinoSeleccionada) {
                handleTransferirModal(mesaDestinoSeleccionada);
              }
            }}
            variant="contained"
            disabled={!mesaDestinoSeleccionada}
            startIcon={<ArrowRightLeft />}
          >
            Transferir Mesa
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de pago parcial */}
      <Dialog open={dialogoAbierto === 'pago-parcial'} onClose={() => setDialogoAbierto(null)}>
        <DialogTitle>Pago Parcial</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Total de la cuenta: ${ventaActiva?.total || 0}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: 'column' }}>
            <Button 
              variant="outlined" 
              onClick={() => {
                const monto = prompt('Ingrese el monto del pago parcial:');
                if (monto) {
                  handlePagoParcialModal(parseFloat(monto), 'efectivo');
                  setDialogoAbierto(null);
                }
              }}
            >
              Pago en Efectivo
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                const monto = prompt('Ingrese el monto del pago parcial:');
                if (monto) {
                  handlePagoParcialModal(parseFloat(monto), 'tarjeta');
                  setDialogoAbierto(null);
                }
              }}
            >
              Pago con Tarjeta
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogoAbierto(null)}>Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Formas de Pago OBLIGATORIO (Criterio 3) */}
      <ModalCobroOptimizado
        open={modalFormasPago}
        total={ventaActiva?.total || 0}
        onConfirmar={(tipoComprobante, pagos) => {
          procesarFacturacionConPago(pagos);
          setTipoComprobanteSeleccionado(tipoComprobante);
        }}
        onCancelar={() => {
          setModalFormasPago(false);
          setTipoComprobanteSeleccionado('');
        }}
      />

      {/* Modal de transferencia de mesa */}
      <ModalTransferenciaMesa
        open={mostrarModalTransferencia}
        onClose={() => setMostrarModalTransferencia(false)}
        mesaOrigen={mesa}
        sectores={sectoresDisponibles}
        onTransferir={handleTransferirModal}
        itemsVenta={ventaActiva?.items || []}
      />

      {/* Modal de Cobro Optimizado (Criterios 1-3) */}
      <ModalCobroOptimizado
        open={dialogoAbierto === 'cobro-optimizado'}
        total={ventaActiva?.total || 0}
        onConfirmar={handleFacturacionConPago}
        onCancelar={() => setDialogoAbierto(null)}
      />
    </>
  );
};

// Modal de transferencia de mesa
interface ModalTransferenciaMesaProps {
  open: boolean;
  onClose: () => void;
  mesaOrigen: Mesa;
  sectores: any[]; // Assuming Sector type is not defined, using 'any' for now
  onTransferir: (mesaDestinoId: string, itemsSeleccionados?: string[]) => Promise<void>;
  itemsVenta: ItemVenta[];
}

const ModalTransferenciaMesa: React.FC<ModalTransferenciaMesaProps> = ({
  open,
  onClose,
  mesaOrigen,
  sectores,
  onTransferir,
  itemsVenta
}) => {
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  const [mesaDestino, setMesaDestino] = useState<Mesa | null>(null);
  const [mesasDisponibles, setMesasDisponibles] = useState<Mesa[]>([]);
  const [itemsSeleccionados, setItemsSeleccionados] = useState<string[]>([]);
  const [transferirTodos, setTransferirTodos] = useState(true);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [procesandoTransferencia, setProcesandoTransferencia] = useState(false);

  // Cargar mesas cuando se selecciona un sector
  useEffect(() => {
    const cargarMesasDisponibles = async () => {
      if (!sectorSeleccionado) {
        setMesasDisponibles([]);
        return;
      }

      setCargandoMesas(true);
      try {
                 const todasLasMesas = await api.get('/mesas').then(res => res.data || []);
         // Solo mostrar mesas libres (sin ítems) u ocupadas (para fusionar)
         const mesasParaTransferencia = todasLasMesas.filter((mesa: any) => 
           mesa.id !== mesaOrigen.id && 
           mesa.activa &&
           (mesa.estado === 'LIBRE' || mesa.estado === 'OCUPADA')
         );
        setMesasDisponibles(mesasParaTransferencia);
      } catch (error) {
        console.error('Error al cargar mesas:', error);
        toastService.error('Error al cargar mesas disponibles');
      } finally {
        setCargandoMesas(false);
      }
    };

    cargarMesasDisponibles();
  }, [sectorSeleccionado, mesaOrigen.id]);

  // Resetear formulario al abrir/cerrar modal
  useEffect(() => {
    if (!open) {
      setSectorSeleccionado('');
      setMesaDestino(null);
      setMesasDisponibles([]);
      setItemsSeleccionados([]);
      setTransferirTodos(true);
    }
  }, [open]);

  const handleSeleccionarItem = (itemId: string) => {
    setItemsSeleccionados(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const handleSeleccionarTodos = () => {
    if (itemsSeleccionados.length === itemsVenta.length) {
      setItemsSeleccionados([]);
    } else {
      setItemsSeleccionados(itemsVenta.map(item => item.id));
    }
  };

  const handleConfirmarTransferencia = async () => {
    if (!mesaDestino) {
      toastService.error('Debe seleccionar una mesa destino');
      return;
    }

    if (!transferirTodos && itemsSeleccionados.length === 0) {
      toastService.error('Debe seleccionar al menos un ítem para transferir');
      return;
    }

    setProcesandoTransferencia(true);
    try {
      const itemsATransferir = transferirTodos ? undefined : itemsSeleccionados;
      await onTransferir(mesaDestino.id, itemsATransferir);
      onClose();
    } catch (error) {
      console.error('Error en transferencia:', error);
    } finally {
      setProcesandoTransferencia(false);
    }
  };

  const totalSeleccionado = transferirTodos 
    ? itemsVenta.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
    : itemsVenta
        .filter(item => itemsSeleccionados.includes(item.id))
        .reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={2}>
          <Move size={24} />
          <Box>
            <Typography variant="h6">
              Transferir Mesa {mesaOrigen.numero}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Selecciona la mesa destino para transferir los ítems
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Selección de sector */}
          <FormControl fullWidth>
            <InputLabel>Sector destino</InputLabel>
            <Select
              value={sectorSeleccionado}
              onChange={(e) => setSectorSeleccionado(e.target.value)}
              label="Sector destino"
            >
              {sectores.map((sector) => (
                <MenuItem key={sector.id} value={sector.id}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: sector.color || '#4CAF50'
                      }}
                    />
                    {sector.nombre}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Selección de mesa */}
          {sectorSeleccionado && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Mesa destino
              </Typography>
              {cargandoMesas ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : mesasDisponibles.length === 0 ? (
                <Alert severity="info">
                  No hay mesas disponibles en este sector
                </Alert>
              ) : (
                <Grid container spacing={1}>
                  {mesasDisponibles.map((mesa) => (
                    <Grid item xs={6} sm={4} md={3} key={mesa.id}>
                      <Paper
                        elevation={mesaDestino?.id === mesa.id ? 3 : 1}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: mesaDestino?.id === mesa.id ? '2px solid' : '1px solid',
                          borderColor: mesaDestino?.id === mesa.id ? 'primary.main' : 'divider',
                          bgcolor: mesaDestino?.id === mesa.id ? 'primary.50' : 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                        onClick={() => setMesaDestino(mesa)}
                      >
                        <Box textAlign="center">
                          <Typography variant="h6" color="primary">
                            {mesa.numero}
                          </Typography>
                          <Chip
                            size="small"
                            label={mesa.estado === 'LIBRE' ? 'Libre' : 'Ocupada'}
                            color={mesa.estado === 'LIBRE' ? 'success' : 'warning'}
                          />
                          <Typography variant="caption" display="block" color="text.secondary">
                            Cap: {mesa.capacidad}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Selección de ítems */}
          {mesaDestino && (
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2">
                  Ítems a transferir
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={transferirTodos}
                      onChange={(e) => setTransferirTodos(e.target.checked)}
                    />
                  }
                  label="Transferir todos"
                />
              </Box>

              {!transferirTodos && (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Button
                      size="small"
                      onClick={handleSeleccionarTodos}
                      startIcon={itemsSeleccionados.length === itemsVenta.length ? <Remove size={16} /> : <Add size={16} />}
                    >
                      {itemsSeleccionados.length === itemsVenta.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {itemsSeleccionados.length} de {itemsVenta.length} seleccionados
                    </Typography>
                  </Box>

                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                    <List dense>
                      {itemsVenta.map((item) => (
                                               <ListItem
                         key={item.id}
                         onClick={() => handleSeleccionarItem(item.id)}
                         sx={{ cursor: 'pointer' }}
                       >
                         <ListItemIcon>
                           <Checkbox
                             checked={itemsSeleccionados.includes(item.id)}
                             tabIndex={-1}
                             disableRipple
                           />
                         </ListItemIcon>
                         <ListItemText
                           primary={item.producto.nombre}
                           secondary={`Cantidad: ${item.cantidad} - $${(item.precio * item.cantidad).toFixed(2)}`}
                         />
                       </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Resumen de transferencia */}
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resumen de transferencia
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    Ítems a transferir:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {transferirTodos ? itemsVenta.length : itemsSeleccionados.length}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    Total a transferir:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ${totalSeleccionado.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    Destino:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    Mesa {mesaDestino.numero} ({mesaDestino.estado === 'LIBRE' ? 'Nueva cuenta' : 'Fusionar con cuenta existente'})
                  </Typography>
                </Box>
              </Paper>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={procesandoTransferencia}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirmarTransferencia}
          disabled={!mesaDestino || procesandoTransferencia || (!transferirTodos && itemsSeleccionados.length === 0)}
          startIcon={procesandoTransferencia ? <CircularProgress size={16} /> : <Move size={16} />}
        >
          {procesandoTransferencia ? 'Transfiriendo...' : 'Confirmar Transferencia'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Componente Modal de Cobro Optimizado (Criterios 1-3)
interface ModalCobroOptimizadoProps {
  open: boolean;
  total: number;
  onConfirmar: (tipoComprobante: string, pagos: Array<{metodo: string, monto: number}>) => void;
  onCancelar: () => void;
}

const ModalCobroOptimizado: React.FC<ModalCobroOptimizadoProps> = ({
  open,
  total,
  onConfirmar,
  onCancelar
}) => {
  const [tipoComprobanteSeleccionado, setTipoComprobanteSeleccionado] = useState('');
  const [pagos, setPagos] = useState<Array<{metodo: string, monto: number}>>([]);
  const [pagoUnico, setPagoUnico] = useState(true);
  const [metodoPagoUnico, setMetodoPagoUnico] = useState('');
  const [mostrarDistribucion, setMostrarDistribucion] = useState(false);
  const [metodoTemporal, setMetodoTemporal] = useState('');
  const [montoTemporal, setMontoTemporal] = useState('');

  const tiposComprobante = [
    { id: 'TICKET', nombre: 'Ticket', descripcion: 'Comprobante no fiscal', icono: <Receipt size={24} /> },
    { id: 'FACTURA_A', nombre: 'Factura A', descripcion: 'Responsable inscripto', icono: <Description fontSize="medium" /> },
    { id: 'FACTURA_B', nombre: 'Factura B', descripcion: 'Consumidor final', icono: <Description fontSize="medium" /> }
  ];

  const formasPago = [
    { id: 'efectivo', nombre: 'Efectivo', icono: <Banknote size={20} /> },
    { id: 'tarjeta', nombre: 'Tarjeta', icono: <CreditCard size={20} /> },
    { id: 'qr', nombre: 'QR', icono: <QrCode size={20} /> },
    { id: 'transferencia', nombre: 'Transferencia', icono: <Smartphone size={20} /> }
  ];

  const totalPagos = pagos.reduce((sum, pago) => sum + pago.monto, 0);
  const saldoPendiente = total - totalPagos;

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (open) {
      setTipoComprobanteSeleccionado('');
      setPagos([]);
      setPagoUnico(true);
      setMetodoPagoUnico('');
      setMostrarDistribucion(false);
      setMetodoTemporal('');
      setMontoTemporal('');
    }
  }, [open]);

  // Manejar selección de comprobante
  const handleSeleccionarComprobante = (tipoComprobante: string) => {
    setTipoComprobanteSeleccionado(tipoComprobante);
    // Mostrar selector de forma de pago
    setMostrarDistribucion(true);
  };

  // Manejar pago único (Criterio 2)
  const handlePagoUnico = (metodo: string) => {
    if (!tipoComprobanteSeleccionado) return;
    
    const pagoCompleto = [{
      metodo,
      monto: total
    }];

    // Emitir automáticamente sin pasos adicionales
    onConfirmar(tipoComprobanteSeleccionado, pagoCompleto);
  };

  // Activar modo pago parcial (Criterio 3)
  const activarPagoParcial = () => {
    setPagoUnico(false);
    setMostrarDistribucion(true);
  };

  // Agregar pago parcial
  const agregarPagoParcial = () => {
    if (!metodoTemporal || !montoTemporal || parseFloat(montoTemporal) <= 0) return;

    const monto = parseFloat(montoTemporal);
    if (monto > saldoPendiente) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return;
    }

    setPagos([...pagos, { metodo: metodoTemporal, monto }]);
    setMetodoTemporal('');
    setMontoTemporal('');
  };

  // Eliminar pago parcial
  const eliminarPago = (index: number) => {
    setPagos(pagos.filter((_, i) => i !== index));
  };

  // Confirmar pago parcial
  const confirmarPagoParcial = () => {
    if (Math.abs(saldoPendiente) > 0.01) {
      alert('Debe completar el total de la venta');
      return;
    }
    onConfirmar(tipoComprobanteSeleccionado, pagos);
  };

  return (
    <Dialog open={open} onClose={onCancelar} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Receipt />
          Cobrar Mesa - Total: ${total.toFixed(2)}
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Paso 1: Selección de Comprobante */}
        {!tipoComprobanteSeleccionado && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              1. Seleccione el tipo de comprobante:
            </Typography>
            <Grid container spacing={2}>
              {tiposComprobante.map(tipo => (
                <Grid item xs={12} md={4} key={tipo.id}>
                  <Card 
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      height: '100%'
                    }}
                    onClick={() => handleSeleccionarComprobante(tipo.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: 'primary.main', mb: 2 }}>
                        {tipo.icono}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {tipo.nombre}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {tipo.descripcion}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Paso 2: Forma de Pago */}
        {tipoComprobanteSeleccionado && mostrarDistribucion && (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              2. Seleccione la forma de pago:
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Comprobante: {tiposComprobante.find(t => t.id === tipoComprobanteSeleccionado)?.nombre} • 
              Total: ${total.toFixed(2)}
            </Alert>

            {pagoUnico ? (
              // Modo pago único
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Pago único (se emitirá automáticamente):
                </Typography>
                <Grid container spacing={2}>
                  {formasPago.map(forma => (
                    <Grid item xs={6} md={3} key={forma.id}>
                      <Button
                        variant="outlined"
                        fullWidth
                        size="large"
                        startIcon={forma.icono}
                        onClick={() => handlePagoUnico(forma.id)}
                        sx={{ py: 2 }}
                      >
                        {forma.nombre}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
                
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={activarPagoParcial}
                    startIcon={<Calculator />}
                  >
                    Pago con múltiples métodos
                  </Button>
                </Box>
              </Box>
            ) : (
              // Modo pago parcial
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Pago parcial - Distribución de montos:
                </Typography>
                
                {/* Pagos agregados */}
                {pagos.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Pagos agregados:
                    </Typography>
                    <Stack spacing={1}>
                      {pagos.map((pago, index) => (
                        <Box key={index} sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1
                        }}>
                          <Chip label={pago.metodo} size="small" />
                          <Typography>${pago.monto.toFixed(2)}</Typography>
                          <IconButton 
                            size="small" 
                            onClick={() => eliminarPago(index)}
                            sx={{ ml: 'auto' }}
                          >
                            <X size={16} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Agregar nuevo pago */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Método</InputLabel>
                    <Select
                      value={metodoTemporal}
                      label="Método"
                      onChange={(e) => setMetodoTemporal(e.target.value)}
                    >
                      {formasPago.map(forma => (
                        <MenuItem key={forma.id} value={forma.id}>
                          {forma.nombre}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Monto"
                    type="number"
                    value={montoTemporal}
                    onChange={(e) => setMontoTemporal(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    sx={{ flex: 1 }}
                  />
                  
                  <Button
                    variant="outlined"
                    onClick={agregarPagoParcial}
                    disabled={!metodoTemporal || !montoTemporal}
                  >
                    Agregar
                  </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography>
                    Total pagos: ${totalPagos.toFixed(2)}
                  </Typography>
                  <Typography 
                    color={saldoPendiente === 0 ? 'success.main' : 'warning.main'}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Saldo pendiente: ${saldoPendiente.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={() => setPagoUnico(true)}
                    startIcon={<ArrowUp />}
                  >
                    Volver a pago único
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onCancelar}>
          Cancelar
        </Button>
        
        {!pagoUnico && pagos.length > 0 && (
          <Button 
            variant="contained" 
            onClick={confirmarPagoParcial}
            disabled={Math.abs(saldoPendiente) > 0.01}
          >
            Confirmar Pago ({pagos.length} métodos)
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VentaIntegralV2; 