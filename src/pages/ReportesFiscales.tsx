import { useState, useEffect } from 'react';
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
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  AccountBalance as BankIcon,
  GetApp as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Analytics as AnalyticsIcon,
  Business as BusinessIcon,
  Calculate as CalculateIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { formatearPrecio, formatearFecha } from '../utils/formatters';
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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ReporteFiscal {
  resumenFiscal: {
    totalFacturado: number;
    montoNeto: number;
    ivaCalculado: number;
    cantidadFacturas: number;
  };
  libroVentas: Array<{
    fecha: string;
    cantidadVentas: number;
    totalBruto: number;
    totalNeto: number;
    ivaVentas: number;
  }>;
  ventasPorMetodo: Array<{
    metodoPago: string;
    _sum: { total: number };
  }>;
}

interface ReporteRentabilidad {
  resumenGeneral: {
    totalIngresos: number;
    totalCostos: number;
    gananciaTotal: number;
    margenGeneral: number;
  };
  productosMasRentables: Array<{
    producto: {
      nombre: string;
      codigo: string;
    };
    gananciaTotal: number;
    margenPromedio: number;
  }>;
  rentabilidadPorCategoria: Array<{
    categoria: string;
    ganancia: number;
    margen: number;
    productos: number;
  }>;
}

interface ReporteEmpleados {
  estadisticasEquipo: {
    totalEmpleadosActivos: number;
    ventasTotales: number;
    montoTotal: number;
    promedioVentasPorEmpleado: number;
  };
  reporteEmpleados: Array<{
    empleado: {
      id: string;
      nombre: string;
      email: string;
      rol: string;
    };
    estadisticas: {
      totalVentas: number;
      montoTotal: number;
      promedioVenta: number;
      ventasPorDia: number;
    };
    ranking: {
      posicion: number;
      percentil: number;
    };
  }>;
}

interface CuadreCaja {
  resumenCuadre: {
    fecha: string;
    totalVentas: number;
    cantidadTransacciones: number;
    ventasPorMetodo: Array<{
      metodoPago: string;
      _sum: { total: number };
      _count: { id: number };
    }>;
    estadisticasHorarias: Array<{
      hora: string;
      cantidadVentas: number;
      montoTotal: number;
      efectivo: number;
      tarjeta: number;
      transferencia: number;
    }>;
  };
  horaPico?: {
    hora: string;
  };
}

const ReportesFiscales = () => {
  const [tabValue, setTabValue] = useState(0);
  const [fechaDesde, setFechaDesde] = useState(() => {
    const fecha = new Date();
    fecha.setDate(1); // Primer día del mes
    return fecha.toISOString().split('T')[0];
  });
  const [fechaHasta, setFechaHasta] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(false);
  const [reporteFiscal, setReporteFiscal] = useState<ReporteFiscal | null>(null);
  const [reporteRentabilidad, setReporteRentabilidad] = useState<ReporteRentabilidad | null>(null);
  const [reporteEmpleados, setReporteEmpleados] = useState<ReporteEmpleados | null>(null);
  const [cuadreCaja, setCuadreCaja] = useState<CuadreCaja | null>(null);
  const [exportDialog, setExportDialog] = useState(false);

  const cargarReporteFiscal = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reportes/fiscal?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
      setReporteFiscal(response.data);
    } catch (error) {
      console.error('Error cargando reporte fiscal:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteRentabilidad = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reportes/rentabilidad?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
      setReporteRentabilidad(response.data);
    } catch (error) {
      console.error('Error cargando análisis de rentabilidad:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteEmpleados = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reportes/empleados?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);
      setReporteEmpleados(response.data);
    } catch (error) {
      console.error('Error cargando reporte de empleados:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCuadreCaja = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reportes/cuadre-caja?fecha=${fechaHasta}`);
      setCuadreCaja(response.data);
    } catch (error) {
      console.error('Error cargando cuadre de caja:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async (tipo: string) => {
    try {
      const response = await api.get(`/reportes/export/excel?tipo=${tipo}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setExportDialog(false);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
    }
  };

  useEffect(() => {
    if (tabValue === 0) cargarReporteFiscal();
    else if (tabValue === 1) cargarReporteRentabilidad();
    else if (tabValue === 2) cargarReporteEmpleados();
    else if (tabValue === 3) cargarCuadreCaja();
  }, [tabValue, fechaDesde, fechaHasta]);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AnalyticsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Reportes Fiscales y Análisis
        </Typography>
        
        {/* Controles de fecha */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Desde"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Fecha Hasta"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                onClick={() => setExportDialog(true)}
                startIcon={<DownloadIcon />}
                sx={{ height: 40 }}
              >
                Exportar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<BusinessIcon />} label="Reporte Fiscal" />
          <Tab icon={<TrendingUpIcon />} label="Análisis Rentabilidad" />
          <Tab icon={<PeopleIcon />} label="Desempeño Empleados" />
          <Tab icon={<CalculateIcon />} label="Cuadre de Caja" />
        </Tabs>

        {loading && <LinearProgress />}

        {/* Tab 1: Reporte Fiscal */}
        <TabPanel value={tabValue} index={0}>
          {reporteFiscal && (
            <Grid container spacing={3}>
              {/* Resumen Fiscal */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReceiptIcon /> Resumen Fiscal
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteFiscal.resumenFiscal.totalFacturado)}
                          </Typography>
                          <Typography variant="body2" color="white">Total Facturado</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteFiscal.resumenFiscal.montoNeto)}
                          </Typography>
                          <Typography variant="body2" color="white">Monto Neto</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteFiscal.resumenFiscal.ivaCalculado)}
                          </Typography>
                          <Typography variant="body2" color="white">IVA (21%)</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {reporteFiscal.resumenFiscal.cantidadFacturas}
                          </Typography>
                          <Typography variant="body2" color="white">Cantidad Facturas</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Libro de Ventas */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📖 Libro de Ventas</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell align="right">Ventas</TableCell>
                            <TableCell align="right">Total Bruto</TableCell>
                            <TableCell align="right">Total Neto</TableCell>
                            <TableCell align="right">IVA</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reporteFiscal.libroVentas.map((dia, index) => (
                            <TableRow key={index}>
                              <TableCell>{formatearFecha(dia.fecha)}</TableCell>
                              <TableCell align="right">{dia.cantidadVentas}</TableCell>
                              <TableCell align="right">{formatearPrecio(dia.totalBruto)}</TableCell>
                              <TableCell align="right">{formatearPrecio(dia.totalNeto)}</TableCell>
                              <TableCell align="right">{formatearPrecio(dia.ivaVentas)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Métodos de Pago */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>💳 Métodos de Pago</Typography>
                    {reporteFiscal.ventasPorMetodo.map((metodo, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{metodo.metodoPago}</Typography>
                          <Typography fontWeight="bold">{formatearPrecio(metodo._sum.total)}</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(metodo._sum.total / reporteFiscal.resumenFiscal.totalFacturado) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 2: Análisis de Rentabilidad */}
        <TabPanel value={tabValue} index={1}>
          {reporteRentabilidad && (
            <Grid container spacing={3}>
              {/* Resumen General */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon /> Resumen de Rentabilidad
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteRentabilidad.resumenGeneral.totalIngresos)}
                          </Typography>
                          <Typography variant="body2" color="white">Ingresos Totales</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="error.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteRentabilidad.resumenGeneral.totalCostos)}
                          </Typography>
                          <Typography variant="body2" color="white">Costos Totales</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteRentabilidad.resumenGeneral.gananciaTotal)}
                          </Typography>
                          <Typography variant="body2" color="white">Ganancia Total</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {reporteRentabilidad.resumenGeneral.margenGeneral.toFixed(1)}%
                          </Typography>
                          <Typography variant="body2" color="white">Margen General</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Productos Más Rentables */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>🏆 Productos Más Rentables</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto</TableCell>
                            <TableCell align="right">Ganancia</TableCell>
                            <TableCell align="right">Margen</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reporteRentabilidad.productosMasRentables.slice(0, 10).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Typography variant="body2">{item.producto.nombre}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {item.producto.codigo}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography color="success.main" fontWeight="bold">
                                  {formatearPrecio(item.gananciaTotal)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip 
                                  label={`${item.margenPromedio.toFixed(1)}%`}
                                  color={item.margenPromedio > 50 ? 'success' : item.margenPromedio > 25 ? 'warning' : 'error'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Rentabilidad por Categoría */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📊 Rentabilidad por Categoría</Typography>
                    {reporteRentabilidad.rentabilidadPorCategoria.map((categoria, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{categoria.categoria}</Typography>
                          <Typography fontWeight="bold" color="success.main">
                            {formatearPrecio(categoria.ganancia)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption">Margen: {categoria.margen.toFixed(1)}%</Typography>
                          <Typography variant="caption">{categoria.productos} productos</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Math.min(categoria.margen, 100)}
                          color={categoria.margen > 50 ? 'success' : categoria.margen > 25 ? 'warning' : 'error'}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 3: Reporte de Empleados */}
        <TabPanel value={tabValue} index={2}>
          {reporteEmpleados && (
            <Grid container spacing={3}>
              {/* Estadísticas del Equipo */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon /> Estadísticas del Equipo
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {reporteEmpleados.estadisticasEquipo.totalEmpleadosActivos}
                          </Typography>
                          <Typography variant="body2" color="white">Empleados Activos</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {reporteEmpleados.estadisticasEquipo.ventasTotales}
                          </Typography>
                          <Typography variant="body2" color="white">Ventas Totales</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(reporteEmpleados.estadisticasEquipo.montoTotal)}
                          </Typography>
                          <Typography variant="body2" color="white">Monto Total</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Box textAlign="center" p={2} bgcolor="warning.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {reporteEmpleados.estadisticasEquipo.promedioVentasPorEmpleado}
                          </Typography>
                          <Typography variant="body2" color="white">Promedio por Empleado</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Ranking de Empleados */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>🏆 Ranking de Empleados</Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Posición</TableCell>
                            <TableCell>Empleado</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell align="right">Ventas</TableCell>
                            <TableCell align="right">Monto Total</TableCell>
                            <TableCell align="right">Promedio</TableCell>
                            <TableCell align="right">Ventas/Día</TableCell>
                            <TableCell align="center">Percentil</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reporteEmpleados.reporteEmpleados.map((empleado, index) => (
                            <TableRow key={empleado.empleado.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {empleado.ranking.posicion === 1 && <StarIcon color="warning" />}
                                  #{empleado.ranking.posicion}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{empleado.empleado.nombre}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {empleado.empleado.email}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={empleado.empleado.rol} 
                                  size="small"
                                  color={empleado.empleado.rol === 'ADMIN' ? 'error' : empleado.empleado.rol === 'SUPERVISOR' ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell align="right">{empleado.estadisticas.totalVentas}</TableCell>
                              <TableCell align="right">
                                <Typography fontWeight="bold" color="success.main">
                                  {formatearPrecio(empleado.estadisticas.montoTotal)}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">{formatearPrecio(empleado.estadisticas.promedioVenta)}</TableCell>
                              <TableCell align="right">{empleado.estadisticas.ventasPorDia}</TableCell>
                              <TableCell align="center">
                                <Chip 
                                  label={`${empleado.ranking.percentil}%`}
                                  color={empleado.ranking.percentil > 75 ? 'success' : empleado.ranking.percentil > 50 ? 'warning' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Tab 4: Cuadre de Caja */}
        <TabPanel value={tabValue} index={3}>
          {cuadreCaja && (
            <Grid container spacing={3}>
              {/* Resumen del Cuadre */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalculateIcon /> Cuadre de Caja - {formatearFecha(cuadreCaja.resumenCuadre.fecha)}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2} bgcolor="primary.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {formatearPrecio(cuadreCaja.resumenCuadre.totalVentas)}
                          </Typography>
                          <Typography variant="body2" color="white">Total Ventas</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2} bgcolor="success.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {cuadreCaja.resumenCuadre.cantidadTransacciones}
                          </Typography>
                          <Typography variant="body2" color="white">Transacciones</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center" p={2} bgcolor="info.light" borderRadius={2}>
                          <Typography variant="h4" color="white">
                            {cuadreCaja.horaPico?.hora || 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="white">Hora Pico</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Estadísticas por Hora */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>⏰ Ventas por Hora</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Hora</TableCell>
                            <TableCell align="right">Ventas</TableCell>
                            <TableCell align="right">Monto</TableCell>
                            <TableCell align="right">Efectivo</TableCell>
                            <TableCell align="right">Tarjeta</TableCell>
                            <TableCell align="right">Transferencia</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cuadreCaja.resumenCuadre.estadisticasHorarias.map((hora, index) => (
                            <TableRow key={index} sx={{ 
                              bgcolor: hora.hora === cuadreCaja.horaPico?.hora ? 'success.light' : 'inherit'
                            }}>
                              <TableCell>{hora.hora}</TableCell>
                              <TableCell align="right">{hora.cantidadVentas}</TableCell>
                              <TableCell align="right">{formatearPrecio(hora.montoTotal)}</TableCell>
                              <TableCell align="right">{formatearPrecio(hora.efectivo)}</TableCell>
                              <TableCell align="right">{formatearPrecio(hora.tarjeta)}</TableCell>
                              <TableCell align="right">{formatearPrecio(hora.transferencia)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Resumen por Método */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>💳 Resumen por Método</Typography>
                    {cuadreCaja.resumenCuadre.ventasPorMetodo.map((metodo, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography>{metodo.metodoPago}</Typography>
                          <Typography fontWeight="bold">{formatearPrecio(metodo._sum.total)}</Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {metodo._count.id} transacciones
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Dialog de Exportación */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Exportar Reportes</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>Selecciona el tipo de reporte a exportar:</Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={() => exportarExcel('ventas')}
              >
                Ventas
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={() => exportarExcel('productos')}
              >
                Productos
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={() => exportarExcel('empleados')}
              >
                Empleados
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ExcelIcon />}
                onClick={() => exportarExcel('inventario')}
              >
                Inventario
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportesFiscales; 