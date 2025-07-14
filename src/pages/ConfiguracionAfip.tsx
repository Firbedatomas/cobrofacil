import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Divider,
  Alert,
  Switch,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Link,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Upload as UploadIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ConfiguracionAfip {
  id?: string;
  habilitado: boolean;
  cuitEmpresa: string;
  razonSocial: string;
  puntoVenta: number;
  ambiente: 'TESTING' | 'PRODUCCION';
  certificado?: string;
  clavePrivada?: string;
  ultimaConexion?: string;
  tokenAfip?: string;
  signAfip?: string;
}

const ConfiguracionAfip = () => {
  const navigate = useNavigate();
  const certificadoInputRef = useRef<HTMLInputElement>(null);
  const clavePrivadaInputRef = useRef<HTMLInputElement>(null);
  
  const [configuracion, setConfiguracion] = useState<ConfiguracionAfip>({
    habilitado: false,
    cuitEmpresa: '',
    razonSocial: '',
    puntoVenta: 1,
    ambiente: 'TESTING'
  });
  const [pasoActivo, setPasoActivo] = useState(0);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [subiendoCertificado, setSubiendoCertificado] = useState(false);
  const [estadoAfip, setEstadoAfip] = useState<any>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogCertificado, setDialogCertificado] = useState(false);
  const [tipoCertificadoActual, setTipoCertificadoActual] = useState<'certificado' | 'clavePrivada'>('certificado');

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    setLoading(true);
    try {
      const response = await api.get('/afip/estado');
      setEstadoAfip(response.data);
    } catch (error) {
      console.error('Error cargando configuración AFIP:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCuitChange = (cuit: string) => {
    // Permitir borrado completo
    if (cuit === '') {
      setConfiguracion(prev => ({ 
        ...prev, 
        cuitEmpresa: ''
      }));
      return;
    }

    // Limpiar CUIT (solo números)
    const cuitLimpio = cuit.replace(/\D/g, '');
    
    // Formatear CUIT con guiones solo si tiene contenido
    let cuitFormateado = cuitLimpio;
    if (cuitLimpio.length >= 2) {
      cuitFormateado = cuitLimpio.slice(0, 2) + '-' + cuitLimpio.slice(2);
    }
    if (cuitLimpio.length >= 10) {
      cuitFormateado = cuitLimpio.slice(0, 2) + '-' + cuitLimpio.slice(2, 10) + '-' + cuitLimpio.slice(10, 11);
    }

    setConfiguracion(prev => ({ 
      ...prev, 
      cuitEmpresa: cuitFormateado
    }));
  };

  const handleGuardarConfiguracion = async () => {
    setGuardando(true);
    try {
      await api.post('/afip/configuracion', configuracion);
      setSnackbarMessage('✅ Configuración AFIP guardada correctamente');
      setSnackbarOpen(true);
      await cargarConfiguracion();
      if (configuracion.habilitado && pasoActivo < 2) {
        setPasoActivo(pasoActivo + 1);
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setSnackbarMessage('❌ Error al guardar la configuración');
      setSnackbarOpen(true);
    } finally {
      setGuardando(false);
    }
  };

  const handleSubirCertificado = (tipo: 'certificado' | 'clavePrivada') => {
    setTipoCertificadoActual(tipo);
    setDialogCertificado(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar extensión
    const extension = file.name.toLowerCase();
    const isCertificateFile = extension.endsWith('.crt') || extension.endsWith('.cer');
    const isKeyFile = extension.endsWith('.key') || extension.endsWith('.pem');
    
    if (tipoCertificadoActual === 'certificado' && !isCertificateFile) {
      setSnackbarMessage('❌ Seleccione un archivo de certificado (.crt o .cer)');
      setSnackbarOpen(true);
      return;
    }
    if (tipoCertificadoActual === 'clavePrivada' && !isKeyFile) {
      setSnackbarMessage('❌ Seleccione un archivo de clave privada (.key o .pem)');
      setSnackbarOpen(true);
      return;
    }

    setSubiendoCertificado(true);
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('tipoCertificado', tipoCertificadoActual);

    try {
      const response = await api.post('/afip/subir-certificado', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSnackbarMessage(`✅ ${response.data.message}`);
      setSnackbarOpen(true);
      setDialogCertificado(false);
      await cargarConfiguracion();
      
      // Reset file input
      if (certificadoInputRef.current) certificadoInputRef.current.value = '';
      if (clavePrivadaInputRef.current) clavePrivadaInputRef.current.value = '';

    } catch (error: any) {
      console.error('Error subiendo certificado:', error);
      setSnackbarMessage(`❌ ${error.response?.data?.message || 'Error al subir archivo'}`);
      setSnackbarOpen(true);
    } finally {
      setSubiendoCertificado(false);
    }
  };

  const handleEliminarCertificado = async (tipo: 'certificado' | 'clavePrivada') => {
    try {
      await api.delete(`/afip/eliminar-certificado/${tipo}`);
      setSnackbarMessage(`✅ ${tipo === 'certificado' ? 'Certificado' : 'Clave privada'} eliminado correctamente`);
      setSnackbarOpen(true);
      await cargarConfiguracion();
    } catch (error: any) {
      console.error('Error eliminando certificado:', error);
      setSnackbarMessage(`❌ ${error.response?.data?.message || 'Error al eliminar certificado'}`);
      setSnackbarOpen(true);
    }
  };

  const pasos = [
    { 
      label: 'Datos de la Empresa', 
      description: 'Configure CUIT, razón social y punto de venta',
      icon: <BusinessIcon />
    },
    { 
      label: 'Certificados Digitales', 
      description: 'Suba su clave privada (.key) y certificado ARCA (.crt)',
      icon: <SecurityIcon />
    },
    { 
      label: 'Verificación Final', 
      description: 'Verifique la configuración y pruebe la conexión',
      icon: <CheckCircleIcon />
    },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando configuración AFIP...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          🏛️ Configuración ARCA
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<LaunchIcon />}
            href="https://auth.afip.gob.ar/contribuyente_/login.xhtml"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ingresar a ARCA
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            Volver
          </Button>
        </Box>
      </Box>

      {/* Estado actual */}
      {estadoAfip && (
        <Alert 
          severity={estadoAfip.configurado ? 'success' : 'warning'} 
          sx={{ mb: 3 }}
          icon={estadoAfip.configurado ? <CheckCircleIcon /> : <WarningIcon />}
        >
          <Typography variant="h6">
            Estado actual: {estadoAfip.configurado ? 'AFIP Configurado' : 'AFIP Sin Configurar'}
          </Typography>
          {estadoAfip.advertencias.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {estadoAfip.advertencias.map((advertencia: string, index: number) => (
                <Chip 
                  key={index}
                  label={advertencia} 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* Layout principal */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Panel de navegación */}
        <Box sx={{ flex: '0 0 300px' }}>
          <Paper sx={{ p: 3 }}>
            <Stepper activeStep={pasoActivo} orientation="vertical">
              {pasos.map((paso, index) => (
                <Step key={paso.label}>
                  <StepLabel 
                    onClick={() => setPasoActivo(index)}
                    sx={{ cursor: 'pointer' }}
                    icon={paso.icon}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {paso.label}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {paso.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
            
            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={configuracion.habilitado}
                    onChange={(e) => setConfiguracion(prev => ({ 
                      ...prev, 
                      habilitado: e.target.checked 
                    }))}
                  />
                }
                label="Habilitar AFIP"
              />
            </Box>
          </Paper>
        </Box>

        {/* Panel principal */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3 }}>
            {pasoActivo === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Datos de la Empresa
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      label="CUIT de la Empresa"
                      value={configuracion.cuitEmpresa}
                      onChange={(e) => handleCuitChange(e.target.value)}
                      placeholder="20-12345678-9"
                      helperText="CUIT registrado en ARCA"
                      inputProps={{ 
                        maxLength: 13,
                        style: { fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '1px' }
                      }}
                      sx={{
                        flex: 1,
                        '& .MuiInputBase-root': {
                          minHeight: '56px'
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: '1rem'
                        }
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Razón Social"
                      value={configuracion.razonSocial}
                      onChange={(e) => setConfiguracion(prev => ({ 
                        ...prev, 
                        razonSocial: e.target.value 
                      }))}
                      helperText="Nombre legal de la empresa"
                      sx={{ flex: 1.5 }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Punto de Venta (Sistema)"
                      value={configuracion.puntoVenta}
                      onChange={(e) => setConfiguracion(prev => ({ 
                        ...prev, 
                        puntoVenta: parseInt(e.target.value) || 1
                      }))}
                      helperText="Número interno de su sistema POS"
                    />
                    <FormControl fullWidth>
                      <InputLabel>Ambiente</InputLabel>
                      <Select
                        value={configuracion.ambiente}
                        onChange={(e) => setConfiguracion(prev => ({ 
                          ...prev, 
                          ambiente: e.target.value as 'TESTING' | 'PRODUCCION'
                        }))}
                        label="Ambiente"
                      >
                        <MenuItem value="TESTING">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="TEST" color="warning" size="small" />
                            Testing
                          </Box>
                        </MenuItem>
                        <MenuItem value="PRODUCCION">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label="PROD" color="error" size="small" />
                            Producción
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    💡 <strong>Instrucciones:</strong> Complete los datos de su empresa exactamente como aparecen en ARCA.
                    El punto de venta es un número interno de su sistema, no de ARCA.
                  </Typography>
                </Alert>

                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    🧪 <strong>Para Pruebas</strong>
                  </Typography>
                  <Typography variant="body2">
                    Si está probando el sistema, use: <strong>CUIT:</strong> 30-12345678-1, <strong>Empresa:</strong> EMPRESA DE PRUEBA SA
                  </Typography>
                </Alert>
              </Box>
            )}

            {pasoActivo === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Certificados Digitales
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📋 <strong>Proceso Real ARCA</strong>
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    Para facturar electrónicamente, necesita obtener certificados desde ARCA:
                  </Typography>
                  <Box component="ol" sx={{ mt: 1, pl: 2 }}>
                    <li>Genere su clave privada (.key) en su computadora</li>
                    <li>Cree un CSR (.req) con su clave privada</li>
                    <li>Ingrese a ARCA → <strong>"Administración de Certificados Digitales"</strong></li>
                    <li>Solicite certificado subiendo su CSR (.req)</li>
                    <li>Descargue el certificado (.crt) emitido por ARCA</li>
                    <li>Suba aquí su clave privada (.key) y certificado (.crt)</li>
                  </Box>
                </Alert>

                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Card sx={{ textAlign: 'center', p: 3, flex: 1, border: '2px solid', borderColor: estadoAfip?.certificados?.clavePrivada ? 'success.main' : 'grey.300' }}>
                    {estadoAfip?.certificados?.clavePrivada ? (
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    ) : (
                      <SecurityIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    )}
                    <Typography variant="h6" gutterBottom>
                      1️⃣ Su Clave Privada
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Archivo .key o .pem<br/>
                      <small><strong>Generado por usted</strong> al crear el CSR</small>
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button 
                        variant={estadoAfip?.certificados?.clavePrivada ? "outlined" : "contained"}
                        onClick={() => handleSubirCertificado('clavePrivada')}
                        disabled={false}
                        startIcon={estadoAfip?.certificados?.clavePrivada ? <DescriptionIcon /> : <CloudUploadIcon />}
                        color={estadoAfip?.certificados?.clavePrivada ? "success" : "primary"}
                      >
                        {estadoAfip?.certificados?.clavePrivada ? 'Cambiar' : 'Subir'} Clave
                      </Button>
                      {estadoAfip?.certificados?.clavePrivada && (
                        <Button 
                          variant="outlined" 
                          color="error"
                          size="small"
                          onClick={() => handleEliminarCertificado('clavePrivada')}
                          startIcon={<DeleteIcon />}
                        >
                          Eliminar
                        </Button>
                      )}
                    </Box>
                  </Card>
                  
                  <Card sx={{ textAlign: 'center', p: 3, flex: 1, border: '2px solid', borderColor: estadoAfip?.certificados?.certificado ? 'success.main' : 'grey.300' }}>
                    {estadoAfip?.certificados?.certificado ? (
                      <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                    ) : (
                      <UploadIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
                    )}
                    <Typography variant="h6" gutterBottom>
                      2️⃣ Certificado ARCA
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Archivo .crt o .cer<br/>
                      <small><strong>Descargado</strong> desde ARCA</small>
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button 
                        variant={estadoAfip?.certificados?.certificado ? "outlined" : "contained"}
                        onClick={() => handleSubirCertificado('certificado')}
                        disabled={false}
                        startIcon={estadoAfip?.certificados?.certificado ? <DescriptionIcon /> : <CloudUploadIcon />}
                        color={estadoAfip?.certificados?.certificado ? "success" : "primary"}
                      >
                        {estadoAfip?.certificados?.certificado ? 'Cambiar' : 'Subir'} Certificado
                      </Button>
                      {estadoAfip?.certificados?.certificado && (
                        <Button 
                          variant="outlined" 
                          color="error"
                          size="small"
                          onClick={() => handleEliminarCertificado('certificado')}
                          startIcon={<DeleteIcon />}
                        >
                          Eliminar
                        </Button>
                      )}
                    </Box>
                  </Card>
                </Box>

                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ⚠️ <strong>¡Importante!</strong>
                  </Typography>
                  <Typography variant="body2">
                    <strong>Necesita AMBOS archivos para funcionar:</strong><br/>
                    • Su clave privada (.key) que generó al crear el CSR<br/>
                    • El certificado (.crt) que descargó de ARCA<br/>
                    <strong>Sin ambos, no podrá facturar electrónicamente.</strong>
                  </Typography>
                </Alert>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<LaunchIcon />}
                    href="https://auth.afip.gob.ar/contribuyente_/login.xhtml"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ mr: 2 }}
                  >
                    Ir a ARCA
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<LaunchIcon />}
                    href="https://www.argentina.gob.ar/arca"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Más Información
                  </Button>
                </Box>

                <Alert severity="success" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    💡 <strong>Consejo:</strong> Si es su primera vez, use el ambiente <strong>Testing</strong> para practicar 
                    antes de pasar a <strong>Producción</strong>.
                  </Typography>
                </Alert>
              </Box>
            )}

            {pasoActivo === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Verificación Final
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    ✅ <strong>Resumen de Configuración</strong>
                  </Typography>
                  <Typography variant="body2">
                    Verifique que todos los datos estén correctos antes de finalizar la configuración AFIP.
                  </Typography>
                </Alert>

                <Card sx={{ p: 3, bgcolor: 'background.default', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📋 Estado de la Configuración
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {configuracion.cuitEmpresa ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>CUIT de la Empresa</strong>}
                        secondary={configuracion.cuitEmpresa || 'Pendiente - Complete el CUIT'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {configuracion.razonSocial ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>Razón Social</strong>}
                        secondary={configuracion.razonSocial || 'Pendiente - Complete la Razón Social'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>Punto de Venta</strong>}
                        secondary={`Número ${configuracion.puntoVenta} (interno del sistema POS)`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color={configuracion.ambiente === 'TESTING' ? 'warning' : 'success'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>Ambiente</strong>}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={configuracion.ambiente} 
                              color={configuracion.ambiente === 'TESTING' ? 'warning' : 'error'} 
                              size="small" 
                            />
                            {configuracion.ambiente === 'TESTING' ? '(Ideal para pruebas)' : '(Solo para producción)'}
                          </Box>
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {estadoAfip?.certificados?.clavePrivada ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>Clave Privada (.key)</strong>}
                        secondary={estadoAfip?.certificados?.clavePrivada ? 'Configurada' : 'Pendiente - Suba la clave privada'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {estadoAfip?.certificados?.certificado ? <CheckCircleIcon color="success" /> : <WarningIcon color="warning" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={<strong>Certificado Digital (.crt)</strong>}
                        secondary={estadoAfip?.certificados?.certificado ? 'Configurado (descargado de ARCA)' : 'Pendiente - Suba el certificado de ARCA'}
                      />
                    </ListItem>
                  </List>
                </Card>

                {(configuracion.cuitEmpresa && configuracion.razonSocial && estadoAfip?.certificados?.certificado && estadoAfip?.certificados?.clavePrivada) ? (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      🎉 <strong>¡Configuración Completa!</strong>
                    </Typography>
                    <Typography variant="body2">
                      Su sistema está listo para facturación electrónica con ARCA. 
                      Puede proceder a habilitar el sistema y comenzar a emitir comprobantes.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ⚠️ <strong>Configuración Incompleta</strong>
                    </Typography>
                    <Typography variant="body2">
                      Complete todos los campos requeridos para habilitar la facturación electrónica.
                      Los elementos pendientes están marcados con ⚠️ arriba.
                    </Typography>
                  </Alert>
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setSnackbarMessage('🔄 Probando conexión con ARCA...');
                    setSnackbarOpen(true);
                  }}
                  disabled={!configuracion.habilitado || !(configuracion.cuitEmpresa && configuracion.razonSocial)}
                >
                  Probar Conexión con ARCA
                </Button>
              </Box>
            )}

            {/* Botones de acción */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                disabled={pasoActivo === 0}
                onClick={() => setPasoActivo(pasoActivo - 1)}
              >
                Anterior
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleGuardarConfiguracion}
                  disabled={guardando || !configuracion.habilitado}
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </Button>
                {pasoActivo < pasos.length - 1 && (
                  <Button
                    variant="outlined"
                    onClick={() => setPasoActivo(pasoActivo + 1)}
                  >
                    Siguiente
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Dialog para subir certificados */}
      <Dialog open={dialogCertificado} onClose={() => setDialogCertificado(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          📁 Subir {tipoCertificadoActual === 'certificado' ? 'Certificado ARCA' : 'Clave Privada'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Archivos aceptados:</strong> 
              {tipoCertificadoActual === 'certificado' 
                ? ' .crt, .cer (certificados de ARCA)' 
                : ' .key, .pem (claves privadas)'
              }
            </Typography>
          </Alert>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Seleccione su archivo:
            </Typography>
            
            <input
              type="file"
              accept={tipoCertificadoActual === 'certificado' ? '.crt,.cer' : '.key,.pem'}
              onChange={handleFileUpload}
              ref={tipoCertificadoActual === 'certificado' ? certificadoInputRef : clavePrivadaInputRef}
              style={{ display: 'none' }}
            />
            
            <Button
              variant="contained"
              component="label"
              fullWidth
              size="large"
              startIcon={<CloudUploadIcon />}
              onClick={() => {
                if (tipoCertificadoActual === 'certificado') {
                  certificadoInputRef.current?.click();
                } else {
                  clavePrivadaInputRef.current?.click();
                }
              }}
              disabled={subiendoCertificado}
            >
              {subiendoCertificado ? 'Subiendo archivo...' : 'Seleccionar Archivo'}
            </Button>
            
            {subiendoCertificado && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  Procesando archivo...
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCertificado(false)} disabled={subiendoCertificado}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default ConfiguracionAfip; 