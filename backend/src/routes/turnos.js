import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verificarToken, verificarRol } from '../middleware/auth.js';
import { body, validationResult, param } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// 🔍 Obtener turno activo de una caja específica
router.get('/activo/:caja?', verificarToken, async (req, res) => {
  try {
    const caja = req.params.caja || 'PRINCIPAL';
    
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        caja,
        estado: 'ABIERTO'
      },
      include: {
        usuarioApertura: {
          select: { id: true, nombre: true, apellido: true, email: true }
        },
        movimientos: {
          orderBy: { fecha: 'desc' },
          include: {
            usuario: {
              select: { nombre: true, apellido: true }
            }
          }
        }
      }
    });

    if (!turnoActivo) {
      return res.status(404).json({
        success: false,
        message: 'No hay turno activo en esta caja',
        data: null
      });
    }

    // Calcular totales
    const totales = calcularTotalesTorno(turnoActivo.movimientos);

    res.json({
      success: true,
      data: {
        ...turnoActivo,
        totales
      }
    });
  } catch (error) {
    console.error('Error al obtener turno activo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🔓 Abrir nuevo turno
router.post('/abrir', [
  verificarToken,
  body('nombre').notEmpty().withMessage('El nombre del turno es requerido'),
  body('caja').optional().isString(),
  body('horaInicio').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido'),
  body('horaFin').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Formato de hora inválido'),
  body('fondoInicial').isFloat({ min: 0 }).withMessage('El fondo inicial debe ser mayor o igual a 0'),
  body('observacionesApertura').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { nombre, caja = 'PRINCIPAL', horaInicio, horaFin, fondoInicial, observacionesApertura } = req.body;
    const usuarioId = req.usuario.id;

    // 🚫 VALIDACIÓN 1: Verificar que no hay turno abierto en esta caja
    const turnoAbierto = await prisma.turno.findFirst({
      where: {
        caja,
        estado: 'ABIERTO'
      },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true, email: true }
        }
      }
    });

    if (turnoAbierto) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un turno abierto en la caja ${caja}`,
        data: {
          turnoAbierto: {
            id: turnoAbierto.id,
            nombre: turnoAbierto.nombre,
            usuario: turnoAbierto.usuarioApertura,
            fechaApertura: turnoAbierto.fechaApertura
          }
        }
      });
    }

    // 🚫 VALIDACIÓN 2: No permitir abrir el mismo turno dos veces el mismo día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const turnoMismoDia = await prisma.turno.findFirst({
      where: {
        caja,
        nombre,
        fechaApertura: {
          gte: hoy,
          lt: mañana
        }
      }
    });

    if (turnoMismoDia) {
      return res.status(409).json({
        success: false,
        message: `Ya se abrió un turno "${nombre}" hoy en la caja ${caja}`,
        data: { turnoExistente: turnoMismoDia }
      });
    }

    // 🔗 Obtener el último turno cerrado para encadenamiento
    const ultimoTurno = await prisma.turno.findFirst({
      where: {
        caja,
        estado: 'CERRADO'
      },
      orderBy: { fechaCierre: 'desc' }
    });

    // 💰 Heredar saldo del turno anterior como fondo inicial (si existe)
    let fondoCalculado = parseFloat(fondoInicial);
    if (ultimoTurno && ultimoTurno.fondoFinal !== null) {
      fondoCalculado = parseFloat(ultimoTurno.fondoFinal);
    }

    // Crear el nuevo turno
    const nuevoTurno = await prisma.turno.create({
      data: {
        nombre,
        caja,
        horaInicio,
        horaFin,
        fondoInicial: fondoCalculado,
        observacionesApertura,
        usuarioAperturaId: usuarioId,
        turnoAnteriorId: ultimoTurno?.id
      },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true, email: true }
        }
      }
    });

    // Registrar movimiento de fondo inicial
    await prisma.movimientoCaja.create({
      data: {
        turnoId: nuevoTurno.id,
        tipo: 'APORTE',
        concepto: 'Fondo inicial del turno',
        monto: fondoCalculado,
        metodoPago: 'EFECTIVO',
        usuarioId
      }
    });

    res.status(201).json({
      success: true,
      message: `Turno ${nombre} abierto correctamente`,
      data: nuevoTurno
    });

  } catch (error) {
    console.error('Error al abrir turno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🔍 Función para verificar mesas con factura emitida pero no cobradas
async function verificarMesasPendientesCobro() {
  try {
    const mesasPendientes = await prisma.mesa.findMany({
      where: {
        estado: 'ESPERANDO_PEDIDO', // Estado azul = factura emitida pero no cobrada
        activa: true
      },
      include: {
        sector: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    return mesasPendientes;
  } catch (error) {
    console.error('Error verificando mesas pendientes de cobro:', error);
    throw new Error('Error al verificar mesas pendientes');
  }
}

// 🔒 Cerrar turno actual
router.post('/cerrar/:turnoId', [
  verificarToken,
  param('turnoId').isString().notEmpty(),
  body('efectivoContado').isFloat({ min: 0 }).withMessage('El efectivo contado debe ser mayor o igual a 0'),
  body('observacionesCierre').optional().isString(),
  body('observacionesArqueo').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { turnoId } = req.params;
    const { efectivoContado, observacionesCierre, observacionesArqueo } = req.body;
    const usuarioId = req.usuario.id;

    // 🚫 VALIDACIÓN CRÍTICA: Verificar mesas con factura emitida sin cobrar
    const mesasPendientes = await verificarMesasPendientesCobro();
    
    if (mesasPendientes.length > 0) {
      const listaMesas = mesasPendientes.map(mesa => 
        `Mesa ${mesa.numero} (${mesa.sector.nombre})`
      ).join(', ');
      
      return res.status(409).json({
        success: false,
        message: `No se puede cerrar el turno. Existen ${mesasPendientes.length} mesa(s) con ticket/factura emitida pero aún no cobrada(s)`,
        data: {
          mesasPendientes: mesasPendientes.map(mesa => ({
            id: mesa.id,
            numero: mesa.numero,
            sector: mesa.sector.nombre,
            estado: mesa.estado
          })),
          detalle: `Mesas pendientes: ${listaMesas}`
        }
      });
    }

    // Verificar que el turno existe y está abierto
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true }
        },
        movimientos: true
      }
    });

    if (!turno) {
      return res.status(404).json({
        success: false,
        message: 'Turno no encontrado'
      });
    }

    if (turno.estado !== 'ABIERTO') {
      return res.status(400).json({
        success: false,
        message: 'El turno ya está cerrado'
      });
    }

    // 🚫 VALIDACIÓN: Solo el mismo usuario o supervisor/admin puede cerrar
    if (turno.usuarioAperturaId !== usuarioId && !['SUPERVISOR', 'ADMIN'].includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Solo el usuario que abrió el turno o un supervisor puede cerrarlo',
        data: {
          usuarioApertura: turno.usuarioApertura
        }
      });
    }

    // Calcular totales y efectivo del sistema
    const totales = calcularTotalesTorno(turno.movimientos);
    const efectivoSistema = parseFloat(turno.fondoInicial) + totales.efectivo;
    const diferencia = parseFloat(efectivoContado) - efectivoSistema;

    // Cerrar el turno
    const turnoCerrado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: 'CERRADO',
        fechaCierre: new Date(),
        usuarioCierreId: usuarioId,
        fondoFinal: parseFloat(efectivoContado),
        efectivoContado: parseFloat(efectivoContado),
        efectivoSistema,
        diferencia,
        observacionesCierre,
        observacionesArqueo
      },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true }
        },
        usuarioCierre: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    // Si hay diferencia, registrar un movimiento de ajuste
    if (Math.abs(diferencia) > 0.01) { // Tolerancia de 1 centavo
      await prisma.movimientoCaja.create({
        data: {
          turnoId,
          tipo: 'ARQUEO',
          concepto: `Diferencia de arqueo: ${diferencia > 0 ? 'Sobrante' : 'Faltante'} de $${Math.abs(diferencia).toFixed(2)}`,
          monto: diferencia,
          metodoPago: 'EFECTIVO',
          usuarioId,
          observaciones: observacionesArqueo
        }
      });
    }

    // 📊 CRITERIO 4: Verificar si es el 3er turno del día y generar reporte
    const esTercerTurno = await verificarYGenerarReporteTercerTurno(turno.caja, new Date());
    
    let reporteGenerado = null;
    if (esTercerTurno.esTercerTurno) {
      try {
        reporteGenerado = await generarReporteDiario(turno.caja, new Date());
        console.log('📧 Reporte diario generado y enviado:', reporteGenerado.archivo);
      } catch (error) {
        console.error('❌ Error generando reporte diario:', error);
        // No fallar el cierre por error en reporte
      }
    }

    console.log('✅ Turno cerrado correctamente - Sin mesas pendientes');
    res.json({
      success: true,
      message: 'Turno cerrado correctamente',
      data: {
        ...turnoCerrado,
        totales: {
          ...totales,
          efectivoSistema,
          efectivoContado: parseFloat(efectivoContado),
          diferencia
        },
        esTercerTurno: esTercerTurno.esTercerTurno,
        reporteGenerado: reporteGenerado ? {
          archivo: reporteGenerado.archivo,
          emailsEnviados: reporteGenerado.emailsEnviados
        } : null
      }
    });

  } catch (error) {
    console.error('Error al cerrar turno:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🚫 Forzar cierre de turno (solo ADMIN/SUPERVISOR)
router.post('/forzar-cierre/:turnoId', [
  verificarToken,
  verificarRol(['ADMIN', 'SUPERVISOR']),
  param('turnoId').isString().notEmpty(),
  body('motivo').notEmpty().withMessage('El motivo es requerido para forzar cierre'),
  body('efectivoContado').isFloat({ min: 0 }).withMessage('El efectivo contado debe ser mayor o igual a 0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { turnoId } = req.params;
    const { motivo, efectivoContado } = req.body;
    const usuarioId = req.usuario.id;

    // 🚫 VALIDACIÓN CRÍTICA: Verificar mesas con factura emitida sin cobrar (incluso para forzar cierre)
    const mesasPendientes = await verificarMesasPendientesCobro();
    
    if (mesasPendientes.length > 0) {
      const listaMesas = mesasPendientes.map(mesa => 
        `Mesa ${mesa.numero} (${mesa.sector.nombre})`
      ).join(', ');
      
      return res.status(409).json({
        success: false,
        message: `No se puede forzar el cierre del turno. Existen ${mesasPendientes.length} mesa(s) con ticket/factura emitida pero aún no cobrada(s)`,
        data: {
          mesasPendientes: mesasPendientes.map(mesa => ({
            id: mesa.id,
            numero: mesa.numero,
            sector: mesa.sector.nombre,
            estado: mesa.estado
          })),
          detalle: `Mesas pendientes: ${listaMesas}`,
          advertencia: 'Debe completar el cobro de estas mesas antes de forzar el cierre'
        }
      });
    }

    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true }
        },
        movimientos: true
      }
    });

    if (!turno || turno.estado !== 'ABIERTO') {
      return res.status(400).json({
        success: false,
        message: 'Turno no encontrado o ya cerrado'
      });
    }

    const totales = calcularTotalesTorno(turno.movimientos);
    const efectivoSistema = parseFloat(turno.fondoInicial) + totales.efectivo;
    const diferencia = parseFloat(efectivoContado) - efectivoSistema;

    const turnoCerrado = await prisma.turno.update({
      where: { id: turnoId },
      data: {
        estado: 'FORZADO_CIERRE',
        fechaCierre: new Date(),
        usuarioCierreId: usuarioId,
        fondoFinal: parseFloat(efectivoContado),
        efectivoContado: parseFloat(efectivoContado),
        efectivoSistema,
        diferencia,
        observacionesCierre: `CIERRE FORZADO: ${motivo}`,
        observacionesArqueo: `Cierre administrativo realizado por ${req.usuario.nombre} ${req.usuario.apellido}`
      }
    });

    // Registrar el incidente
    await prisma.movimientoCaja.create({
      data: {
        turnoId,
        tipo: 'ARQUEO',
        concepto: `CIERRE FORZADO - Motivo: ${motivo}`,
        monto: diferencia,
        metodoPago: 'EFECTIVO',
        usuarioId,
        observaciones: `Cierre administrativo con diferencia de $${diferencia.toFixed(2)}`
      }
    });

    res.json({
      success: true,
      message: 'Turno cerrado forzadamente',
      data: turnoCerrado
    });

  } catch (error) {
    console.error('Error al forzar cierre:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 📊 Historial de turnos
router.get('/historial/:caja?', verificarToken, async (req, res) => {
  try {
    const caja = req.params.caja || 'PRINCIPAL';
    const { page = 1, limit = 10, fechaDesde, fechaHasta, estado } = req.query;

    const whereCondition = {
      caja,
      ...(fechaDesde && fechaHasta && {
        fechaApertura: {
          gte: new Date(fechaDesde),
          lte: new Date(fechaHasta)
        }
      }),
      ...(estado && { estado })
    };

    const turnos = await prisma.turno.findMany({
      where: whereCondition,
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true }
        },
        usuarioCierre: {
          select: { nombre: true, apellido: true }
        },
        _count: {
          select: { movimientos: true }
        }
      },
      orderBy: { fechaApertura: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit)
    });

    const total = await prisma.turno.count({ where: whereCondition });

    res.json({
      success: true,
      data: {
        turnos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 📋 Registrar movimiento en turno activo
router.post('/movimiento', [
  verificarToken,
  body('tipo').isIn(['VENTA', 'APORTE', 'RETIRO', 'GASTO', 'PAGO_PROVEEDOR', 'AJUSTE', 'TRANSFERENCIA']),
  body('concepto').notEmpty().withMessage('El concepto es requerido'),
  body('monto').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('metodoPago').isIn(['EFECTIVO', 'TARJETA_DEBITO', 'TARJETA_CREDITO', 'TRANSFERENCIA', 'QR_MERCADOPAGO']),
  body('caja').optional().isString(),
  body('observaciones').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { tipo, concepto, monto, metodoPago, caja = 'PRINCIPAL', observaciones } = req.body;
    const usuarioId = req.usuario.id;

    // Verificar que hay un turno abierto
    const turnoActivo = await prisma.turno.findFirst({
      where: {
        caja,
        estado: 'ABIERTO'
      }
    });

    if (!turnoActivo) {
      return res.status(400).json({
        success: false,
        message: 'No hay turno abierto en esta caja'
      });
    }

    // Verificar autorización para tipos especiales
    const tiposQueRequierenAutorizacion = ['RETIRO', 'PAGO_PROVEEDOR', 'AJUSTE'];
    const requiereAutorizacion = tiposQueRequierenAutorizacion.includes(tipo) && monto > 10000; // Más de $10k

    if (requiereAutorizacion && !['SUPERVISOR', 'ADMIN'].includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: 'Este tipo de movimiento requiere autorización de supervisor'
      });
    }

    const movimiento = await prisma.movimientoCaja.create({
      data: {
        turnoId: turnoActivo.id,
        tipo,
        concepto,
        monto: parseFloat(monto),
        metodoPago,
        usuarioId,
        observaciones,
        requiereAutorizacion,
        autorizado: !requiereAutorizacion,
        autorizadoPor: requiereAutorizacion ? usuarioId : null
      },
      include: {
        usuario: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Movimiento registrado correctamente',
      data: movimiento
    });

  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// 🧮 Función auxiliar para calcular totales
function calcularTotalesTorno(movimientos) {
  const totales = {
    ventas: 0,
    aportes: 0,
    retiros: 0,
    gastos: 0,
    pagosProveedor: 0,
    ajustes: 0,
    transferencias: 0,
    efectivo: 0,
    tarjeta: 0,
    transferencia: 0
  };

  movimientos.forEach(mov => {
    const monto = parseFloat(mov.monto);
    
    // Totales por tipo
    switch (mov.tipo) {
      case 'VENTA':
        totales.ventas += monto;
        break;
      case 'APORTE':
        totales.aportes += monto;
        break;
      case 'RETIRO':
        totales.retiros += monto;
        break;
      case 'GASTO':
        totales.gastos += monto;
        break;
      case 'PAGO_PROVEEDOR':
        totales.pagosProveedor += monto;
        break;
      case 'AJUSTE':
      case 'ARQUEO':
        totales.ajustes += monto;
        break;
      case 'TRANSFERENCIA':
        totales.transferencias += monto;
        break;
    }

    // Totales por método de pago
    switch (mov.metodoPago) {
      case 'EFECTIVO':
        // Para efectivo, ingresos suman y egresos restan
        if (['VENTA', 'APORTE'].includes(mov.tipo)) {
          totales.efectivo += monto;
        } else {
          totales.efectivo -= monto;
        }
        break;
      case 'TARJETA_DEBITO':
      case 'TARJETA_CREDITO':
        totales.tarjeta += monto;
        break;
      case 'TRANSFERENCIA':
      case 'QR_MERCADOPAGO':
        totales.transferencia += monto;
        break;
    }
  });

  return totales;
}

// 🔍 Verificar si es el tercer turno del día
async function verificarYGenerarReporteTercerTurno(caja, fecha) {
  try {
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    // Contar turnos cerrados del día
    const turnosCerrados = await prisma.turno.count({
      where: {
        caja,
        estado: 'CERRADO',
        fechaCierre: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      }
    });

    console.log(`🔍 Turnos cerrados hoy en ${caja}: ${turnosCerrados}/3`);

    return {
      esTercerTurno: turnosCerrados === 3,
      turnosCerrados
    };
  } catch (error) {
    console.error('Error verificando tercer turno:', error);
    return { esTercerTurno: false, turnosCerrados: 0 };
  }
}

// 📊 Generar reporte diario consolidado (Criterio 4)
async function generarReporteDiario(caja, fecha) {
  try {
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    // Obtener todos los turnos del día
    const turnos = await prisma.turno.findMany({
      where: {
        caja,
        fechaApertura: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      },
      include: {
        usuarioApertura: {
          select: { nombre: true, apellido: true }
        },
        usuarioCierre: {
          select: { nombre: true, apellido: true }
        },
        movimientos: {
          include: {
            usuario: {
              select: { nombre: true, apellido: true }
            }
          }
        }
      },
      orderBy: { fechaApertura: 'asc' }
    });

    // Obtener ventas del día por turno
    const ventas = await prisma.venta.findMany({
      where: {
        fechaVenta: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      },
      include: {
        detalles: {
          include: {
            producto: true
          }
        }
      }
    });

    // Compilar reporte
    const reporte = {
      fecha: fecha.toISOString().split('T')[0],
      caja,
      generadoEn: new Date(),
      resumenGeneral: {
        totalTurnos: turnos.length,
        ventasTotales: ventas.reduce((sum, v) => sum + parseFloat(v.total), 0),
        cantidadVentas: ventas.length,
        efectivoTotal: 0,
        diferenciasArqueo: 0
      },
      turnos: [],
      productosMasVendidos: [],
      metodosDepago: {
        efectivo: 0,
        tarjeta: 0,
        transferencia: 0,
        qr: 0
      }
    };

    // Procesar cada turno
    turnos.forEach((turno, index) => {
      const totales = calcularTotalesTorno(turno.movimientos);
      
      reporte.turnos.push({
        numero: index + 1,
        nombre: turno.nombre,
        horaApertura: turno.fechaApertura,
        horaCierre: turno.fechaCierre,
        usuarioApertura: `${turno.usuarioApertura.nombre} ${turno.usuarioApertura.apellido}`,
        usuarioCierre: turno.usuarioCierre ? `${turno.usuarioCierre.nombre} ${turno.usuarioCierre.apellido}` : null,
        fondoInicial: parseFloat(turno.fondoInicial),
        fondoFinal: turno.fondoFinal ? parseFloat(turno.fondoFinal) : null,
        diferencia: turno.diferencia || 0,
        ventas: totales.ventas,
        efectivo: totales.efectivo,
        observaciones: turno.observacionesCierre || ''
      });

      reporte.resumenGeneral.efectivoTotal += totales.efectivo;
      reporte.resumenGeneral.diferenciasArqueo += (turno.diferencia || 0);
      
      // Acumular métodos de pago
      reporte.metodosDepago.efectivo += totales.efectivo;
      reporte.metodosDepago.tarjeta += totales.tarjeta;
      reporte.metodosDepago.transferencia += totales.transferencia;
    });

    // Analizar productos más vendidos
    const productosVendidos = {};
    ventas.forEach(venta => {
      venta.detalles.forEach(detalle => {
        const productoId = detalle.productoId;
        if (!productosVendidos[productoId]) {
          productosVendidos[productoId] = {
            nombre: detalle.producto.nombre,
            codigo: detalle.producto.codigo,
            cantidad: 0,
            ingresos: 0
          };
        }
        productosVendidos[productoId].cantidad += detalle.cantidad;
        productosVendidos[productoId].ingresos += parseFloat(detalle.subtotal);
      });
    });

    reporte.productosMasVendidos = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // Enviar reporte por email
    const emailsEnviados = await enviarReportePorEmail(reporte);

    return {
      reporte,
      archivo: `reporte_diario_${caja}_${reporte.fecha}.json`,
      emailsEnviados
    };
  } catch (error) {
    console.error('Error generando reporte diario:', error);
    throw error;
  }
}

// 📧 Configurar emails destinatarios para reportes diarios (Criterio 5)
router.get('/config/emails', verificarToken, async (req, res) => {
  try {
    // Obtener configuración de emails desde la base de datos
    const configuracion = await prisma.configuracionSistema.findFirst({
      where: { clave: 'emails_reporte_diario' }
    });

    const emails = configuracion ? JSON.parse(configuracion.valor) : [];
    
    res.json({
      success: true,
      data: { emails }
    });
  } catch (error) {
    console.error('Error obteniendo configuración de emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

router.post('/config/emails', [
  verificarToken,
  verificarRol(['ADMIN', 'SUPERVISOR']),
  body('emails').isArray().withMessage('Debe proporcionar un array de emails'),
  body('emails.*').isEmail().withMessage('Cada email debe tener un formato válido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { emails } = req.body;

    // Validar que no haya más de 5 emails
    if (emails.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Máximo 5 emails destinatarios permitidos'
      });
    }

    // Guardar o actualizar configuración
    await prisma.configuracionSistema.upsert({
      where: { clave: 'emails_reporte_diario' },
      update: {
        valor: JSON.stringify(emails),
        fechaActualizacion: new Date()
      },
      create: {
        clave: 'emails_reporte_diario',
        valor: JSON.stringify(emails),
        descripcion: 'Emails destinatarios para reportes diarios automáticos'
      }
    });

    res.json({
      success: true,
      message: 'Configuración de emails actualizada correctamente',
      data: { emails }
    });
  } catch (error) {
    console.error('Error configurando emails:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// 📧 Enviar reporte por email (actualizado con configuración)
async function enviarReportePorEmail(reporte) {
  try {
    // Obtener emails configurados
    const configuracion = await prisma.configuracionSistema.findFirst({
      where: { clave: 'emails_reporte_diario' }
    });

    let emailsDestino = [];
    if (configuracion) {
      emailsDestino = JSON.parse(configuracion.valor);
    }

    if (emailsDestino.length === 0) {
      console.log('⚠️ No hay emails configurados para envío de reportes');
      return [];
    }

    // TODO: Implementar servicio de email real
    // Por ahora simular envío
    console.log('📧 Enviando reporte a:', emailsDestino);
    console.log('📊 Reporte:', {
      fecha: reporte.fecha,
      caja: reporte.caja,
      ventasTotales: reporte.resumenGeneral.ventasTotales,
      efectivoTotal: reporte.resumenGeneral.efectivoTotal,
      turnos: reporte.turnos.length
    });

    // Simular éxito del envío
    return emailsDestino;
  } catch (error) {
    console.error('Error enviando reporte por email:', error);
    return [];
  }
}

// 🔍 Obtener mesas pendientes de cobro
router.get('/mesas-pendientes', verificarToken, async (req, res) => {
  try {
    const mesasPendientes = await verificarMesasPendientesCobro();
    
    res.json({
      success: true,
      data: {
        cantidad: mesasPendientes.length,
        mesas: mesasPendientes.map(mesa => ({
          id: mesa.id,
          numero: mesa.numero,
          sector: mesa.sector.nombre,
          estado: mesa.estado
        }))
      }
    });
  } catch (error) {
    console.error('Error obteniendo mesas pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mesas pendientes',
      error: error.message
    });
  }
});

export default router; 