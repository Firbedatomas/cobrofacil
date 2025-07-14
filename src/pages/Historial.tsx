import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Avatar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ShoppingCartIcon,
  Assessment as AssessmentIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  Money as CashIcon,
  FilterList as FilterIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import type { RootState } from '../store';
import { formatearPrecio } from '../utils/formatters';

interface Venta {
  id: string;
  fecha: string;
  cliente?: {
    nombre: string;
    email: string;
    telefono?: string;
  };
  items: Array<{
    producto: {
      id: string;
      nombre: string;
      precio: number;
      categoria: string;
    };
    cantidad: number;
  }>;
  total: number;
  formaPago: 'efectivo' | 'tarjeta' | 'transferencia';
  tipoComprobante?: string;
  numeroComprobante?: string;
  cae?: string;
  descuentoAplicado?: number;
  observaciones?: string;
  vendedor: string;
  sucursal: string;
}

const Historial = () => {
  // Usar datos reales del store en lugar de hardcodeados
  const historialVentas = useSelector((state: RootState) => state.ventas.historial);
  const [cargando, setCargando] = useState(false);
  
  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');
  const [metodoPagoFiltro, setMetodoPagoFiltro] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState<Venta | null>(null);
  const [openDetalle, setOpenDetalle] = useState(false);

  // Convertir ventas del store al formato esperado
  const ventas: Venta[] = historialVentas.map(venta => ({
    id: venta.id,
    fecha: venta.fecha,
    cliente: venta.cliente ? {
      nombre: venta.cliente.nombre,
      email: venta.cliente.email || '',
      telefono: venta.cliente.telefono
    } : undefined,
    items: venta.items.map(item => ({
      producto: {
        id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio,
        categoria: item.producto.categoria || 'Sin categoría'
      },
      cantidad: item.cantidad
    })),
    total: venta.total,
    formaPago: venta.formaPago as 'efectivo' | 'tarjeta' | 'transferencia',
    tipoComprobante: (venta as any).tipoComprobante || '',
    numeroComprobante: (venta as any).numeroComprobante || '',
    cae: (venta as any).cae,
    descuentoAplicado: (venta as any).descuentoAplicado || 0,
    observaciones: (venta as any).observaciones,
    vendedor: (venta as any).vendedor || 'Sistema',
    sucursal: (venta as any).sucursal || 'Principal'
  }));

  // Filtrar ventas
  const ventasFiltradas = ventas.filter(venta => {
    const matchBusqueda = venta.id.toLowerCase().includes(busqueda.toLowerCase()) ||
                         venta.cliente?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                         venta.items.some(item => item.producto.nombre.toLowerCase().includes(busqueda.toLowerCase()));
    
    const matchMetodoPago = metodoPagoFiltro === '' || venta.formaPago === metodoPagoFiltro;
    
    const matchFecha = !filtroFechaInicio || new Date(venta.fecha) >= new Date(filtroFechaInicio);
    
    return matchBusqueda && matchMetodoPago && matchFecha;
  });

  // Estadísticas simples
  const totalVentas = ventasFiltradas.length;
  const montoTotal = ventasFiltradas.reduce((sum, venta) => sum + venta.total, 0);
  const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0;

  const getIconoMetodoPago = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return <CashIcon />;
      case 'tarjeta': return <CardIcon />;
      case 'transferencia': return <BankIcon />;
      default: return <MoneyIcon />;
    }
  };

  const getColorMetodoPago = (metodo: string) => {
    switch (metodo) {
      case 'efectivo': return 'success';
      case 'tarjeta': return 'info';
      case 'transferencia': return 'secondary';
      default: return 'default';
    }
  };

  const exportarCSV = () => {
    if (ventasFiltradas.length === 0) {
      alert('No hay ventas para exportar');
      return;
    }
    
    const headers = ['ID', 'Fecha', 'Cliente', 'Items', 'Total', 'Método Pago', 'Vendedor', 'Sucursal'];
    const data = ventasFiltradas.map(venta => [
      venta.id,
      new Date(venta.fecha).toLocaleDateString(),
      venta.cliente?.nombre || 'Consumidor Final',
      venta.items.length,
      venta.total,
      venta.formaPago,
      venta.vendedor,
      venta.sucursal
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-ventas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const verDetalle = (venta: Venta) => {
    setVentaSeleccionada(venta);
    setOpenDetalle(true);
  };

  const imprimirVenta = (venta: Venta) => {
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Venta ${venta.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .cliente { margin-bottom: 15px; }
              .items { margin-bottom: 15px; }
              .total { font-weight: bold; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>CobroFacil POS</h2>
              <h3>Comprobante de Venta ${venta.id}</h3>
            </div>
            <div class="cliente">
              <strong>Cliente:</strong> ${venta.cliente?.nombre || 'Consumidor Final'}<br>
              <strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString()}<br>
              <strong>Vendedor:</strong> ${venta.vendedor}<br>
              <strong>Sucursal:</strong> ${venta.sucursal}
            </div>
            <div class="items">
              <h4>Items:</h4>
              ${venta.items.map(item => `
                <div>${item.cantidad}x ${item.producto.nombre} - ${formatearPrecio(item.producto.precio * item.cantidad)}</div>
              `).join('')}
            </div>
            <div class="total">
              <strong>Total: ${formatearPrecio(venta.total)}</strong><br>
              <strong>Forma de Pago: ${venta.formaPago.toUpperCase()}</strong>
            </div>
          </body>
        </html>
      `);
      ventana.document.close();
      ventana.print();
    }
  };

  // Estado de carga
  if (cargando) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={50} />
          <Typography variant="h6" color="text.secondary">
            Cargando historial de ventas...
          </Typography>
        </Stack>
      </Box>
    );
  }

  // Estado vacío - sin ventas
  if (ventas.length === 0) {
    return (
      <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            📊 Historial de Ventas
          </Typography>
        </Box>

        {/* Estado vacío */}
        <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'grey.50' }}>
          <HistoryIcon sx={{ fontSize: 120, color: 'text.disabled', mb: 3 }} />
          
          <Typography variant="h4" gutterBottom sx={{ color: 'text.secondary' }}>
            ¡Tu historial de ventas aparecerá aquí!
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
            Una vez que realices tu primera venta, podrás ver un resumen completo de todas las transacciones, 
            estadísticas de ventas, métodos de pago y mucho más.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCartIcon />}
              onClick={() => window.location.href = '/nueva-venta'}
              sx={{ py: 1.5, px: 4 }}
            >
              Realizar Primera Venta
            </Button>
            
            <Button
              variant="outlined"
              size="large"
              startIcon={<AssessmentIcon />}
              sx={{ py: 1.5, px: 4 }}
            >
              Ver Reportes
            </Button>
          </Stack>

          <Box sx={{ mt: 4, p: 3, bgcolor: 'info.light', borderRadius: 2, color: 'info.dark' }}>
            <Typography variant="subtitle2" gutterBottom>
              📈 ¿Qué podrás ver en tu historial?
            </Typography>
            <Typography variant="body2">
              • Detalles de cada venta • Métodos de pago utilizados • Estadísticas por período • Exportación a CSV • Reimpresión de comprobantes
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header Simple */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
            📊 Historial de Ventas
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportarCSV}
            sx={{ borderRadius: 2 }}
            disabled={ventasFiltradas.length === 0}
          >
            Exportar CSV
          </Button>
        </Box>
        
        {/* Filtros en una fila */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <Box sx={{ flex: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar por cliente, producto o número de venta..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={metodoPagoFiltro}
                onChange={(e) => setMetodoPagoFiltro(e.target.value)}
                label="Método de Pago"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="tarjeta">Tarjeta</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Desde"
              value={filtroFechaInicio}
              onChange={(e) => setFiltroFechaInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Box>
        </Stack>
      </Paper>

      {/* Estadísticas simples */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {totalVentas}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Ventas
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {formatearPrecio(montoTotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monto Total
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                {formatearPrecio(promedioVenta)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ticket Promedio
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Lista de ventas simple */}
      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Ventas ({ventasFiltradas.length})
          </Typography>
        </Box>
        
        {ventasFiltradas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron ventas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {busqueda || metodoPagoFiltro || filtroFechaInicio 
                ? 'Intenta ajustar los filtros de búsqueda' 
                : 'Aún no se han registrado ventas'
              }
            </Typography>
            {(busqueda || metodoPagoFiltro || filtroFechaInicio) && (
              <Button 
                variant="outlined" 
                onClick={() => {
                  setBusqueda('');
                  setMetodoPagoFiltro('');
                  setFiltroFechaInicio('');
                }}
                sx={{ mt: 2 }}
              >
                Limpiar filtros
              </Button>
            )}
          </Box>
        ) : (
          <Box>
            {ventasFiltradas.map((venta) => (
              <Card key={venta.id} sx={{ m: 2, borderRadius: 2, boxShadow: 1 }}>
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 150 }}>
                      <Avatar sx={{ bgcolor: `${getColorMetodoPago(venta.formaPago)}.main` }}>
                        {getIconoMetodoPago(venta.formaPago)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {venta.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(venta.fecha).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="body2" color="text.secondary">
                        Cliente
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {venta.cliente?.nombre || 'Consumidor Final'}
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 100 }}>
                      <Typography variant="body2" color="text.secondary">
                        Items
                      </Typography>
                      <Typography variant="body1">
                        {venta.items.length} productos
                      </Typography>
                    </Box>

                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="body2" color="text.secondary">
                        Método
                      </Typography>
                      <Chip 
                        label={venta.formaPago.toUpperCase()}
                        color={getColorMetodoPago(venta.formaPago) as any}
                        size="small"
                      />
                    </Box>

                    <Box sx={{ minWidth: 120 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {formatearPrecio(venta.total)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Ver detalle">
                        <IconButton 
                          size="small" 
                          onClick={() => verDetalle(venta)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Imprimir">
                        <IconButton 
                          size="small"
                          onClick={() => imprimirVenta(venta)}
                        >
                          <PrintIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>

      {/* Dialog detalle de venta */}
      <Dialog open={openDetalle} onClose={() => setOpenDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Detalle de Venta {ventaSeleccionada?.id}
        </DialogTitle>
        <DialogContent>
          {ventaSeleccionada && (
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>Información General</Typography>
                <Typography>Fecha: {new Date(ventaSeleccionada.fecha).toLocaleString()}</Typography>
                <Typography>Vendedor: {ventaSeleccionada.vendedor}</Typography>
                <Typography>Sucursal: {ventaSeleccionada.sucursal}</Typography>
                <Typography>Forma de Pago: {ventaSeleccionada.formaPago}</Typography>
                {ventaSeleccionada.cliente && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2 }}>Cliente</Typography>
                    <Typography>Nombre: {ventaSeleccionada.cliente.nombre}</Typography>
                    <Typography>Email: {ventaSeleccionada.cliente.email}</Typography>
                    {ventaSeleccionada.cliente.telefono && (
                      <Typography>Teléfono: {ventaSeleccionada.cliente.telefono}</Typography>
                    )}
                  </>
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>Items</Typography>
                {ventaSeleccionada.items.map((item, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography>{item.producto.nombre}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.cantidad} x {formatearPrecio(item.producto.precio)} = {formatearPrecio(item.cantidad * item.producto.precio)}
                    </Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6">
                  Total: {formatearPrecio(ventaSeleccionada.total)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetalle(false)}>Cerrar</Button>
          {ventaSeleccionada && (
            <Button onClick={() => imprimirVenta(ventaSeleccionada)} variant="contained">
              Imprimir
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Historial; 