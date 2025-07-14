import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Card, 
    CardContent, 
    Typography, 
    Button, 
    Grid, 
    TextField, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Chip, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Alert,
    CircularProgress,
    Switch,
    FormControlLabel
} from '@mui/material';
import { 
    TrendingUp, 
    Calculate, 
    Schedule, 
    History, 
    Visibility, 
    PlayArrow,
    Settings
} from '@mui/icons-material';
import { api } from '../../services/api';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface InflationRates {
    monthly: number;
    quarterly: number;
    annual: number;
    accumulated: number;
    source: string;
    updated: Date;
    period: string;
}

interface Product {
    id: number;
    nombre: string;
    codigo: string;
    precio: number;
    categoria: string;
}

interface SimulationResult {
    adjustmentRate: number;
    products: {
        id: number;
        nombre: string;
        codigo: string;
        oldPrice: number;
        newPrice: number;
        increment: number;
        percentageIncrease: number;
    }[];
    summary: {
        totalProducts: number;
        totalOldValue: number;
        totalNewValue: number;
        totalIncrement: number;
    };
}

const InflationAdjustment: React.FC = () => {
    const [rates, setRates] = useState<InflationRates | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [adjustmentType, setAdjustmentType] = useState<'monthly' | 'quarterly' | 'annual' | 'custom'>('monthly');
    const [customRate, setCustomRate] = useState<number>(0);
    const [simulation, setSimulation] = useState<SimulationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSimulation, setShowSimulation] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);

    // Estados para programación automática  
    const [autoSchedule, setAutoSchedule] = useState({
        frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly',
        minThreshold: 5,
        excludeCategories: [] as number[]
    });

    useEffect(() => {
        loadInflationRates();
        loadProducts();
    }, []);

    const loadInflationRates = async () => {
        try {
            setLoading(true);
            const response = await api.get('/inflation/rates');
            setRates(response.data.data);
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al cargar tasas de inflación' });
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await api.get('/productos');
            setProducts(response.data.productos);
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al cargar productos' });
        }
    };

    const simulateAdjustment = async () => {
        if (selectedProducts.length === 0) {
            setAlert({ type: 'error', message: 'Selecciona al menos un producto' });
            return;
        }

        try {
            setLoading(true);
            const adjustmentRate = adjustmentType === 'custom' ? customRate : rates?.[adjustmentType] || 0;
            
            const response = await api.post('/inflation/simulate', {
                productIds: selectedProducts,
                adjustmentRate
            });

            setSimulation(response.data.data);
            setShowSimulation(true);
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al simular ajuste' });
        } finally {
            setLoading(false);
        }
    };

    const applyAdjustment = async () => {
        if (!simulation) return;

        try {
            setLoading(true);
            const response = await api.post('/inflation/adjust', {
                productIds: selectedProducts,
                adjustmentType,
                customRate: adjustmentType === 'custom' ? customRate : undefined
            });

            setAlert({ 
                type: 'success', 
                message: response.data.data.message 
            });
            
            setShowSimulation(false);
            setSimulation(null);
            setSelectedProducts([]);
            loadProducts(); // Recargar productos con precios actualizados
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al aplicar ajuste' });
        } finally {
            setLoading(false);
        }
    };

    const applyAutoAdjustment = async () => {
        try {
            setLoading(true);
            const response = await api.post('/inflation/adjust/all', {
                excludeCategories: autoSchedule.excludeCategories
            });

            setAlert({ 
                type: 'success', 
                message: response.data.data.message 
            });
            
            loadProducts();
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al aplicar ajuste automático' });
        } finally {
            setLoading(false);
        }
    };

    const scheduleAutoAdjustment = async () => {
        try {
            setLoading(true);
            const response = await api.post('/inflation/schedule', autoSchedule);

            setAlert({ 
                type: 'success', 
                message: response.data.message 
            });
            
            setShowScheduler(false);
        } catch (error) {
            setAlert({ type: 'error', message: 'Error al programar ajuste automático' });
        } finally {
            setLoading(false);
        }
    };

    const toggleProductSelection = (productId: number) => {
        setSelectedProducts(prev => 
            prev.includes(productId) 
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const selectAllProducts = () => {
        setSelectedProducts(products.map(p => p.id));
    };

    const clearSelection = () => {
        setSelectedProducts([]);
    };

    const getRateForType = () => {
        if (adjustmentType === 'custom') return customRate;
        return rates?.[adjustmentType] || 0;
    };

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                <TrendingUp sx={{ mr: 2, verticalAlign: 'middle' }} />
                Ajuste por Inflación
            </Typography>

            {alert && (
                <Alert 
                    severity={alert.type} 
                    onClose={() => setAlert(null)}
                    sx={{ mb: 3 }}
                >
                    {alert.message}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Panel de Tasas de Inflación */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Tasas de Inflación Actuales
                            </Typography>
                            
                            {loading && !rates ? (
                                <CircularProgress size={24} />
                            ) : rates ? (
                                <>
                                    <Box mb={2}>
                                        <Typography variant="body2" color="textSecondary">
                                            Fuente: {rates.source} - {rates.period}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Actualizado: {new Date(rates.updated).toLocaleString()}
                                        </Typography>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="body2">Mensual</Typography>
                                                    <Typography variant="h6" color="primary">
                                                        {formatPercentage(rates.monthly)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="body2">Trimestral</Typography>
                                                    <Typography variant="h6" color="secondary">
                                                        {formatPercentage(rates.quarterly)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="body2">Anual</Typography>
                                                    <Typography variant="h6" color="error">
                                                        {formatPercentage(rates.annual)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Card variant="outlined">
                                                <CardContent>
                                                    <Typography variant="body2">Acumulada</Typography>
                                                    <Typography variant="h6" color="warning.main">
                                                        {formatPercentage(rates.accumulated)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    </Grid>
                                </>
                            ) : (
                                <Typography color="error">
                                    Error al cargar tasas de inflación
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Panel de Control */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Control de Ajustes
                            </Typography>
                            
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <FormControl fullWidth>
                                        <InputLabel>Tipo de Ajuste</InputLabel>
                                        <Select
                                            value={adjustmentType}
                                            onChange={(e) => setAdjustmentType(e.target.value as any)}
                                        >
                                            <MenuItem value="monthly">Mensual ({formatPercentage(rates?.monthly || 0)})</MenuItem>
                                            <MenuItem value="quarterly">Trimestral ({formatPercentage(rates?.quarterly || 0)})</MenuItem>
                                            <MenuItem value="annual">Anual ({formatPercentage(rates?.annual || 0)})</MenuItem>
                                            <MenuItem value="custom">Personalizado</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                
                                {adjustmentType === 'custom' && (
                                    <Grid item xs={12} sm={6} md={3}>
                                        <TextField
                                            fullWidth
                                            label="Tasa Personalizada (%)"
                                            type="number"
                                            value={customRate}
                                            onChange={(e) => setCustomRate(parseFloat(e.target.value) || 0)}
                                            inputProps={{ step: 0.1, min: 0, max: 1000 }}
                                        />
                                    </Grid>
                                )}
                                
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="textSecondary">
                                        Productos seleccionados: {selectedProducts.length}
                                    </Typography>
                                    <Typography variant="h6" color="primary">
                                        Tasa a aplicar: {formatPercentage(getRateForType())}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Box mb={2}>
                                <Button 
                                    variant="outlined" 
                                    onClick={selectAllProducts}
                                    sx={{ mr: 1 }}
                                >
                                    Seleccionar Todos
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    onClick={clearSelection}
                                    sx={{ mr: 1 }}
                                >
                                    Desseleccionar
                                </Button>
                                <Button 
                                    variant="contained" 
                                    startIcon={<Visibility />}
                                    onClick={simulateAdjustment}
                                    disabled={selectedProducts.length === 0 || loading}
                                    sx={{ mr: 1 }}
                                >
                                    Simular Ajuste
                                </Button>
                                <Button 
                                    variant="contained" 
                                    color="secondary"
                                    startIcon={<PlayArrow />}
                                    onClick={applyAutoAdjustment}
                                    disabled={loading}
                                    sx={{ mr: 1 }}
                                >
                                    Ajuste Automático
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<Schedule />}
                                    onClick={() => setShowScheduler(true)}
                                >
                                    Programar
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Lista de Productos */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Productos ({products.length})
                            </Typography>
                            
                            <TableContainer component={Paper} variant="outlined">
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell padding="checkbox">Sel.</TableCell>
                                            <TableCell>Código</TableCell>
                                            <TableCell>Nombre</TableCell>
                                            <TableCell>Categoría</TableCell>
                                            <TableCell align="right">Precio Actual</TableCell>
                                            <TableCell align="right">Precio Ajustado</TableCell>
                                            <TableCell align="right">Incremento</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {products.map((product) => {
                                            const isSelected = selectedProducts.includes(product.id);
                                            const adjustmentRate = getRateForType();
                                            const newPrice = product.precio * (1 + adjustmentRate / 100);
                                            const increment = newPrice - product.precio;
                                            
                                            return (
                                                <TableRow 
                                                    key={product.id}
                                                    hover
                                                    selected={isSelected}
                                                    onClick={() => toggleProductSelection(product.id)}
                                                    sx={{ cursor: 'pointer' }}
                                                >
                                                    <TableCell padding="checkbox">
                                                        <Switch
                                                            checked={isSelected}
                                                            onChange={() => toggleProductSelection(product.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>{product.codigo}</TableCell>
                                                    <TableCell>{product.nombre}</TableCell>
                                                    <TableCell>
                                                        <Chip 
                                                            label={product.categoria} 
                                                            size="small" 
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {formatCurrency(product.precio)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography color={isSelected ? 'primary' : 'textSecondary'}>
                                                            {formatCurrency(newPrice)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography color={isSelected ? 'success.main' : 'textSecondary'}>
                                                            +{formatCurrency(increment)}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialog de Simulación */}
            <Dialog 
                open={showSimulation} 
                onClose={() => setShowSimulation(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Calculate sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Simulación de Ajuste por Inflación
                </DialogTitle>
                <DialogContent>
                    {simulation && (
                        <>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Tasa de ajuste: <strong>{formatPercentage(simulation.adjustmentRate)}</strong>
                            </Alert>
                            
                            <Grid container spacing={2} mb={3}>
                                <Grid item xs={3}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="body2">Productos</Typography>
                                            <Typography variant="h6">
                                                {simulation.summary.totalProducts}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={3}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="body2">Valor Actual</Typography>
                                            <Typography variant="h6">
                                                {formatCurrency(simulation.summary.totalOldValue)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={3}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="body2">Valor Ajustado</Typography>
                                            <Typography variant="h6" color="primary">
                                                {formatCurrency(simulation.summary.totalNewValue)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={3}>
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="body2">Incremento Total</Typography>
                                            <Typography variant="h6" color="success.main">
                                                +{formatCurrency(simulation.summary.totalIncrement)}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="right">Precio Actual</TableCell>
                                            <TableCell align="right">Precio Nuevo</TableCell>
                                            <TableCell align="right">Incremento</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {simulation.products.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {product.codigo} - {product.nombre}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(product.oldPrice)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography color="primary">
                                                        {formatCurrency(product.newPrice)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">
                                                    <Typography color="success.main">
                                                        +{formatCurrency(product.increment)}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowSimulation(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={applyAdjustment}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Aplicar Ajuste'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Programación */}
            <Dialog 
                open={showScheduler} 
                onClose={() => setShowScheduler(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Programar Ajuste Automático
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Frecuencia</InputLabel>
                                <Select
                                    value={autoSchedule.frequency}
                                    onChange={(e) => setAutoSchedule(prev => ({
                                        ...prev,
                                        frequency: e.target.value as any
                                    }))}
                                >
                                    <MenuItem value="weekly">Semanal</MenuItem>
                                    <MenuItem value="monthly">Mensual</MenuItem>
                                    <MenuItem value="quarterly">Trimestral</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Umbral Mínimo (%)"
                                type="number"
                                value={autoSchedule.minThreshold}
                                onChange={(e) => setAutoSchedule(prev => ({
                                    ...prev,
                                    minThreshold: parseFloat(e.target.value) || 0
                                }))}
                                helperText="Solo aplicar ajuste si la inflación supera este porcentaje"
                                inputProps={{ step: 0.1, min: 0, max: 100 }}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowScheduler(false)}>
                        Cancelar
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={scheduleAutoAdjustment}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={20} /> : 'Programar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default InflationAdjustment;