import express from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../config/database.js';
import { verificarToken, verificarSupervisor } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reportes/ventas - Reporte de ventas por período
router.get('/ventas', verificarToken, verificarSupervisor, [
  query('fechaDesde')
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .isISO8601()
    .withMessage('Fecha hasta inválida'),
  query('agrupacion')
    .optional()
    .isIn(['dia', 'semana', 'mes'])
    .withMessage('Agrupación inválida')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        detalles: errores.array()
      });
    }

    const fechaDesde = new Date(req.query.fechaDesde);
    const fechaHasta = new Date(req.query.fechaHasta);
    const agrupacion = req.query.agrupacion || 'dia';

    // Validar rango de fechas
    if (fechaDesde > fechaHasta) {
      return res.status(400).json({
        error: 'La fecha desde no puede ser mayor que la fecha hasta'
      });
    }

    const where = {
      fechaVenta: {
        gte: fechaDesde,
        lte: fechaHasta
      },
      estado: 'COMPLETADA'
    };

    // Resumen general del período
    const resumenGeneral = await prisma.venta.aggregate({
      where,
      _sum: {
        total: true,
        subtotal: true,
        descuento: true
      },
      _count: {
        id: true
      },
      _avg: {
        total: true
      }
    });

    // Ventas por método de pago
    const ventasPorMetodo = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where,
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Ventas por usuario
    const ventasPorUsuario = await prisma.venta.groupBy({
      by: ['usuarioId'],
      where,
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Obtener información de usuarios para el reporte
    const usuariosIds = ventasPorUsuario.map(v => v.usuarioId);
    const usuarios = await prisma.usuario.findMany({
      where: {
        id: { in: usuariosIds }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true
      }
    });

    const ventasPorUsuarioConNombres = ventasPorUsuario.map(venta => {
      const usuario = usuarios.find(u => u.id === venta.usuarioId);
      return {
        ...venta,
        nombreUsuario: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Usuario no encontrado'
      };
    });

    res.status(200).json({
      periodo: {
        desde: fechaDesde,
        hasta: fechaHasta
      },
      resumenGeneral: {
        totalVentas: resumenGeneral._count.id || 0,
        totalIngresos: resumenGeneral._sum.total || 0,
        totalSubtotal: resumenGeneral._sum.subtotal || 0,
        totalDescuentos: resumenGeneral._sum.descuento || 0,
        promedioVenta: resumenGeneral._avg.total || 0
      },
      ventasPorMetodo,
      ventasPorUsuario: ventasPorUsuarioConNombres
    });

  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reportes/productos - Reporte de productos más vendidos
router.get('/productos', verificarToken, verificarSupervisor, [
  query('fechaDesde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta inválida'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe estar entre 1 y 100')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Parámetros de consulta inválidos',
        detalles: errores.array()
      });
    }

    const fechaDesde = req.query.fechaDesde ? new Date(req.query.fechaDesde) : null;
    const fechaHasta = req.query.fechaHasta ? new Date(req.query.fechaHasta) : null;
    const limite = parseInt(req.query.limite) || 20;

    // Construir filtros para las ventas
    const whereVenta = { estado: 'COMPLETADA' };
    if (fechaDesde || fechaHasta) {
      whereVenta.fechaVenta = {};
      if (fechaDesde) whereVenta.fechaVenta.gte = fechaDesde;
      if (fechaHasta) whereVenta.fechaVenta.lte = fechaHasta;
    }

    // Obtener productos más vendidos
    const productosMasVendidos = await prisma.detalleVenta.groupBy({
      by: ['productoId'],
      where: {
        venta: whereVenta
      },
      _sum: {
        cantidad: true,
        subtotal: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          cantidad: 'desc'
        }
      },
      take: limite
    });

    // Obtener información de los productos
    const productosIds = productosMasVendidos.map(p => p.productoId);
    const productos = await prisma.producto.findMany({
      where: {
        id: { in: productosIds }
      },
      include: {
        categoria: {
          select: {
            nombre: true
          }
        }
      }
    });

    const reporteProductos = productosMasVendidos.map(detalle => {
      const producto = productos.find(p => p.id === detalle.productoId);
      return {
        producto: {
          id: producto?.id,
          codigo: producto?.codigo,
          nombre: producto?.nombre,
          precio: producto?.precio,
          categoria: producto?.categoria?.nombre,
          stockActual: producto?.stock
        },
        cantidadVendida: detalle._sum.cantidad,
        ingresosTotales: detalle._sum.subtotal,
        numeroVentas: detalle._count.id
      };
    });

    res.status(200).json({
      periodo: fechaDesde && fechaHasta ? {
        desde: fechaDesde,
        hasta: fechaHasta
      } : null,
      productosMasVendidos: reporteProductos
    });

  } catch (error) {
    console.error('Error generando reporte de productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reportes/inventario - Reporte de inventario
router.get('/inventario', verificarToken, verificarSupervisor, async (req, res) => {
  try {
    // Productos con stock bajo
    const productosStockBajo = await prisma.producto.findMany({
      where: {
        activo: true,
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      },
      include: {
        categoria: {
          select: {
            nombre: true
          }
        }
      },
      orderBy: {
        stock: 'asc'
      }
    });

    // Productos sin stock
    const productosSinStock = await prisma.producto.count({
      where: {
        activo: true,
        stock: 0
      }
    });

    // Valor total del inventario
    const valorInventario = await prisma.producto.aggregate({
      where: { activo: true },
      _sum: {
        stock: true
      }
    });

    // Productos por categoría
    const productosPorCategoria = await prisma.categoria.findMany({
      where: { activa: true },
      include: {
        _count: {
          select: {
            productos: {
              where: { activo: true }
            }
          }
        },
        productos: {
          where: { activo: true },
          select: {
            stock: true,
            precio: true
          }
        }
      }
    });

    const estadisticasCategorias = productosPorCategoria.map(categoria => {
      const stockTotal = categoria.productos.reduce((sum, p) => sum + p.stock, 0);
      const valorTotal = categoria.productos.reduce((sum, p) => sum + (p.stock * Number(p.precio)), 0);
      
      return {
        categoria: categoria.nombre,
        totalProductos: categoria._count.productos,
        stockTotal,
        valorTotal
      };
    });

    res.status(200).json({
      resumenGeneral: {
        totalProductosActivos: await prisma.producto.count({ where: { activo: true } }),
        productosSinStock,
        productosStockBajo: productosStockBajo.length,
        stockTotalUnidades: valorInventario._sum.stock || 0
      },
      productosStockBajo: productosStockBajo.map(p => ({
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        categoria: p.categoria.nombre,
        stockActual: p.stock,
        stockMinimo: p.stockMinimo,
        precio: p.precio
      })),
      estadisticasPorCategoria: estadisticasCategorias
    });

  } catch (error) {
    console.error('Error generando reporte de inventario:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reportes/dashboard - Datos para dashboard principal
router.get('/dashboard', verificarToken, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);

    // Ventas del día
    const ventasHoy = await prisma.venta.aggregate({
      where: {
        fechaVenta: {
          gte: inicioHoy,
          lte: finHoy
        },
        estado: 'COMPLETADA'
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Ventas del mes
    const ventasMes = await prisma.venta.aggregate({
      where: {
        fechaVenta: {
          gte: inicioMes,
          lte: finMes
        },
        estado: 'COMPLETADA'
      },
      _sum: {
        total: true
      },
      _count: {
        id: true
      }
    });

    // Productos con stock bajo
    const productosStockBajo = await prisma.producto.count({
      where: {
        activo: true,
        stock: {
          lte: prisma.producto.fields.stockMinimo
        }
      }
    });

    // Últimas ventas
    const ultimasVentas = await prisma.venta.findMany({
      where: {
        estado: 'COMPLETADA'
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      },
      orderBy: {
        fechaVenta: 'desc'
      },
      take: 5
    });

    // Productos más vendidos hoy
    const productosMasVendidosHoy = await prisma.detalleVenta.groupBy({
      by: ['productoId'],
      where: {
        venta: {
          fechaVenta: {
            gte: inicioHoy,
            lte: finHoy
          },
          estado: 'COMPLETADA'
        }
      },
      _sum: {
        cantidad: true
      },
      orderBy: {
        _sum: {
          cantidad: 'desc'
        }
      },
      take: 5
    });

    // Obtener nombres de productos más vendidos
    if (productosMasVendidosHoy.length > 0) {
      const productosIds = productosMasVendidosHoy.map(p => p.productoId);
      const productos = await prisma.producto.findMany({
        where: {
          id: { in: productosIds }
        },
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      });

      productosMasVendidosHoy.forEach(item => {
        const producto = productos.find(p => p.id === item.productoId);
        item.nombreProducto = producto ? `${producto.codigo} - ${producto.nombre}` : 'Producto no encontrado';
      });
    }

    res.status(200).json({
      ventasHoy: {
        total: ventasHoy._sum.total || 0,
        cantidad: ventasHoy._count.id || 0
      },
      ventasMes: {
        total: ventasMes._sum.total || 0,
        cantidad: ventasMes._count.id || 0
      },
      alertas: {
        productosStockBajo
      },
      ultimasVentas: ultimasVentas.map(v => ({
        id: v.id,
        numeroVenta: v.numeroVenta,
        total: v.total,
        fechaVenta: v.fechaVenta,
        cajero: `${v.usuario.nombre} ${v.usuario.apellido}`
      })),
      productosMasVendidosHoy
    });

  } catch (error) {
    console.error('Error generando datos del dashboard:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/reportes/fiscal - Reporte fiscal completo
router.get('/fiscal', verificarToken, verificarSupervisor, [
  query('fechaDesde')
    .isISO8601()
    .withMessage('Fecha desde inválida'),
  query('fechaHasta')
    .isISO8601()
    .withMessage('Fecha hasta inválida')
], async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        detalles: errores.array()
      });
    }

    const fechaDesde = new Date(req.query.fechaDesde);
    const fechaHasta = new Date(req.query.fechaHasta);

    const where = {
      fechaVenta: { gte: fechaDesde, lte: fechaHasta },
      estado: 'COMPLETADA'
    };

    // Resumen fiscal
    const resumenFiscal = await prisma.venta.aggregate({
      where,
      _sum: { total: true, subtotal: true, descuento: true },
      _count: { id: true }
    });

    // IVA calculado (21% en Argentina)
    const IVA_RATE = 0.21;
    const montoNeto = (resumenFiscal._sum.subtotal || 0) / (1 + IVA_RATE);
    const ivaCalculado = (resumenFiscal._sum.subtotal || 0) - montoNeto;

    // Ventas por día para libro de ventas
    const ventasPorDia = await prisma.venta.groupBy({
      by: ['fechaVenta'],
      where,
      _sum: { total: true, subtotal: true },
      _count: { id: true },
      orderBy: { fechaVenta: 'asc' }
    });

    // Detalle por método de pago
    const ventasPorMetodo = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where,
      _sum: { total: true },
      _count: { id: true }
    });

    res.status(200).json({
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      resumenFiscal: {
        totalFacturado: resumenFiscal._sum.total || 0,
        montoNeto: Math.round(montoNeto * 100) / 100,
        ivaCalculado: Math.round(ivaCalculado * 100) / 100,
        totalDescuentos: resumenFiscal._sum.descuento || 0,
        cantidadFacturas: resumenFiscal._count.id || 0
      },
      libroVentas: ventasPorDia.map(dia => ({
        fecha: dia.fechaVenta,
        cantidadVentas: dia._count.id,
        totalBruto: dia._sum.total,
        totalNeto: Math.round((dia._sum.subtotal / (1 + IVA_RATE)) * 100) / 100,
        ivaVentas: Math.round((dia._sum.subtotal - (dia._sum.subtotal / (1 + IVA_RATE))) * 100) / 100
      })),
      ventasPorMetodo
    });

  } catch (error) {
    console.error('Error generando reporte fiscal:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/rentabilidad - Análisis de rentabilidad
router.get('/rentabilidad', verificarToken, verificarSupervisor, [
  query('fechaDesde').isISO8601().withMessage('Fecha desde inválida'),
  query('fechaHasta').isISO8601().withMessage('Fecha hasta inválida')
], async (req, res) => {
  try {
    const fechaDesde = new Date(req.query.fechaDesde);
    const fechaHasta = new Date(req.query.fechaHasta);

    // Obtener ventas del período con detalles
    const ventasDetalle = await prisma.detalleVenta.findMany({
      where: {
        venta: {
          fechaVenta: { gte: fechaDesde, lte: fechaHasta },
          estado: 'COMPLETADA'
        }
      },
      include: {
        producto: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            precio: true,
            costo: true,
            categoria: { select: { nombre: true } }
          }
        },
        venta: {
          select: {
            fechaVenta: true,
            metodoPago: true
          }
        }
      }
    });

    // Calcular rentabilidad por producto
    const rentabilidadProductos = ventasDetalle.reduce((acc, detalle) => {
      const productoId = detalle.producto.id;
      if (!acc[productoId]) {
        acc[productoId] = {
          producto: detalle.producto,
          cantidadVendida: 0,
          ingresosBrutos: 0,
          costoTotal: 0,
          gananciaTotal: 0,
          margenPromedio: 0
        };
      }

      const costo = Number(detalle.producto.costo || 0);
      const precio = Number(detalle.precioUnitario);
      const cantidad = detalle.cantidad;

      acc[productoId].cantidadVendida += cantidad;
      acc[productoId].ingresosBrutos += detalle.subtotal;
      acc[productoId].costoTotal += costo * cantidad;
      acc[productoId].gananciaTotal += (precio - costo) * cantidad;

      return acc;
    }, {});

    // Calcular margen promedio
    Object.values(rentabilidadProductos).forEach(item => {
      item.margenPromedio = item.ingresosBrutos > 0 
        ? ((item.gananciaTotal / item.ingresosBrutos) * 100) 
        : 0;
    });

    // Ordenar por rentabilidad
    const productosOrdenados = Object.values(rentabilidadProductos)
      .sort((a, b) => b.gananciaTotal - a.gananciaTotal);

    // Resumen general
    const resumenGeneral = {
      totalIngresos: productosOrdenados.reduce((sum, p) => sum + p.ingresosBrutos, 0),
      totalCostos: productosOrdenados.reduce((sum, p) => sum + p.costoTotal, 0),
      gananciaTotal: productosOrdenados.reduce((sum, p) => sum + p.gananciaTotal, 0),
      margenGeneral: 0
    };

    resumenGeneral.margenGeneral = resumenGeneral.totalIngresos > 0 
      ? ((resumenGeneral.gananciaTotal / resumenGeneral.totalIngresos) * 100) 
      : 0;

    // Análisis por categoría
    const rentabilidadCategorias = productosOrdenados.reduce((acc, producto) => {
      const categoria = producto.producto.categoria.nombre;
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          ingresos: 0,
          costos: 0,
          ganancia: 0,
          margen: 0,
          productos: 0
        };
      }

      acc[categoria].ingresos += producto.ingresosBrutos;
      acc[categoria].costos += producto.costoTotal;
      acc[categoria].ganancia += producto.gananciaTotal;
      acc[categoria].productos += 1;

      return acc;
    }, {});

    Object.values(rentabilidadCategorias).forEach(cat => {
      cat.margen = cat.ingresos > 0 ? ((cat.ganancia / cat.ingresos) * 100) : 0;
    });

    res.status(200).json({
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      resumenGeneral,
      productosMasRentables: productosOrdenados.slice(0, 20),
      productosMenosRentables: productosOrdenados.slice(-10).reverse(),
      rentabilidadPorCategoria: Object.values(rentabilidadCategorias)
        .sort((a, b) => b.ganancia - a.ganancia)
    });

  } catch (error) {
    console.error('Error generando análisis de rentabilidad:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/empleados - Reporte de desempeño de empleados
router.get('/empleados', verificarToken, verificarSupervisor, [
  query('fechaDesde').isISO8601().withMessage('Fecha desde inválida'),
  query('fechaHasta').isISO8601().withMessage('Fecha hasta inválida')
], async (req, res) => {
  try {
    const fechaDesde = new Date(req.query.fechaDesde);
    const fechaHasta = new Date(req.query.fechaHasta);

    // Obtener ventas por empleado
    const ventasPorEmpleado = await prisma.venta.groupBy({
      by: ['usuarioId'],
      where: {
        fechaVenta: { gte: fechaDesde, lte: fechaHasta },
        estado: 'COMPLETADA'
      },
      _sum: { total: true, subtotal: true },
      _count: { id: true },
      _avg: { total: true }
    });

    // Obtener información de los empleados
    const empleadosIds = ventasPorEmpleado.map(v => v.usuarioId);
    const empleados = await prisma.usuario.findMany({
      where: { id: { in: empleadosIds } },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        fechaCreacion: true
      }
    });

    // Combinar datos de ventas con información de empleados
    const reporteEmpleados = ventasPorEmpleado.map(ventas => {
      const empleado = empleados.find(e => e.id === ventas.usuarioId);
      return {
        empleado: {
          id: empleado?.id,
          nombre: `${empleado?.nombre} ${empleado?.apellido}`,
          email: empleado?.email,
          rol: empleado?.rol,
          antiguedad: empleado?.fechaCreacion ? 
            Math.floor((new Date() - new Date(empleado.fechaCreacion)) / (1000 * 60 * 60 * 24)) : 0
        },
        estadisticas: {
          totalVentas: ventas._count.id,
          montoTotal: ventas._sum.total || 0,
          promedioVenta: ventas._avg.total || 0,
          ventasPorDia: Math.round((ventas._count.id / Math.ceil((fechaHasta - fechaDesde) / (1000 * 60 * 60 * 24))) * 10) / 10
        }
      };
    });

    // Ordenar por monto total descendente
    reporteEmpleados.sort((a, b) => b.estadisticas.montoTotal - a.estadisticas.montoTotal);

    // Calcular ranking y percentiles
    reporteEmpleados.forEach((emp, index) => {
      emp.ranking = {
        posicion: index + 1,
        percentil: Math.round(((reporteEmpleados.length - index) / reporteEmpleados.length) * 100)
      };
    });

    // Estadísticas del equipo
    const estadisticasEquipo = {
      totalEmpleadosActivos: reporteEmpleados.length,
      ventasTotales: reporteEmpleados.reduce((sum, emp) => sum + emp.estadisticas.totalVentas, 0),
      montoTotal: reporteEmpleados.reduce((sum, emp) => sum + emp.estadisticas.montoTotal, 0),
      promedioVentasPorEmpleado: reporteEmpleados.length > 0 
        ? Math.round(reporteEmpleados.reduce((sum, emp) => sum + emp.estadisticas.totalVentas, 0) / reporteEmpleados.length)
        : 0,
      mejorVendedor: reporteEmpleados[0] || null,
      empleadoMasConstante: reporteEmpleados.sort((a, b) => b.estadisticas.ventasPorDia - a.estadisticas.ventasPorDia)[0] || null
    };

    res.status(200).json({
      periodo: { desde: fechaDesde, hasta: fechaHasta },
      estadisticasEquipo,
      reporteEmpleados
    });

  } catch (error) {
    console.error('Error generando reporte de empleados:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/cuadre-caja - Cuadre detallado de caja
router.get('/cuadre-caja', verificarToken, verificarSupervisor, [
  query('fecha').isISO8601().withMessage('Fecha inválida')
], async (req, res) => {
  try {
    const fecha = new Date(req.query.fecha);
    const inicioDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const finDay = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), 23, 59, 59);

    // Ventas del día por método de pago
    const ventasDelDia = await prisma.venta.groupBy({
      by: ['metodoPago'],
      where: {
        fechaVenta: { gte: inicioDay, lte: finDay },
        estado: 'COMPLETADA'
      },
      _sum: { total: true },
      _count: { id: true }
    });

    // Movimientos de caja (si existe tabla)
    const movimientosCaja = [];

    // Detalle de ventas por hora
    const ventasPorHora = await prisma.venta.findMany({
      where: {
        fechaVenta: { gte: inicioDay, lte: finDay },
        estado: 'COMPLETADA'
      },
      select: {
        id: true,
        numeroVenta: true,
        fechaVenta: true,
        total: true,
        metodoPago: true,
        usuario: {
          select: { nombre: true, apellido: true }
        }
      },
      orderBy: { fechaVenta: 'asc' }
    });

    // Agrupar por horas
    const ventasPorHoraAgrupadas = ventasPorHora.reduce((acc, venta) => {
      const hora = new Date(venta.fechaVenta).getHours();
      const horaKey = `${hora.toString().padStart(2, '0')}:00`;
      
      if (!acc[horaKey]) {
        acc[horaKey] = {
          hora: horaKey,
          cantidadVentas: 0,
          montoTotal: 0,
          efectivo: 0,
          tarjeta: 0,
          transferencia: 0
        };
      }

      acc[horaKey].cantidadVentas += 1;
      acc[horaKey].montoTotal += Number(venta.total);
      acc[horaKey][venta.metodoPago] += Number(venta.total);

      return acc;
    }, {});

    // Resumen del cuadre
    const resumenCuadre = {
      fecha: fecha.toISOString().split('T')[0],
      totalVentas: ventasDelDia.reduce((sum, v) => sum + (v._sum.total || 0), 0),
      cantidadTransacciones: ventasDelDia.reduce((sum, v) => sum + v._count.id, 0),
      ventasPorMetodo: ventasDelDia,
      diferencias: {
        efectivo: 0, // Se podría implementar con conteo físico
        tarjeta: 0,
        transferencia: 0
      },
      estadisticasHorarias: Object.values(ventasPorHoraAgrupadas).sort((a, b) => a.hora.localeCompare(b.hora))
    };

    // Calcular hora pico
    const horaPico = Object.values(ventasPorHoraAgrupadas)
      .sort((a, b) => b.montoTotal - a.montoTotal)[0];

    res.status(200).json({
      resumenCuadre,
      horaPico,
      detalleVentas: ventasPorHora.map(v => ({
        ...v,
        vendedor: `${v.usuario.nombre} ${v.usuario.apellido}`
      })),
      movimientosCaja
    });

  } catch (error) {
    console.error('Error generando cuadre de caja:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/reportes/export/excel - Exportar reporte a Excel
router.get('/export/excel', verificarToken, verificarSupervisor, [
  query('tipo').isIn(['ventas', 'productos', 'inventario', 'empleados']).withMessage('Tipo de reporte inválido'),
  query('fechaDesde').isISO8601().withMessage('Fecha desde inválida'),
  query('fechaHasta').isISO8601().withMessage('Fecha hasta inválida')
], async (req, res) => {
  try {
    const { tipo, fechaDesde, fechaHasta } = req.query;
    
    // Importación dinámica correcta para ExcelJS
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Configurar estilo del header
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
      alignment: { horizontal: 'center' }
    };

    let datos = [];
    let headers = [];

    switch (tipo) {
      case 'ventas':
        headers = ['Fecha', 'Número Venta', 'Cliente', 'Total', 'Método Pago', 'Vendedor'];
        const ventas = await prisma.venta.findMany({
          where: {
            fechaVenta: { gte: new Date(fechaDesde), lte: new Date(fechaHasta) },
            estado: 'COMPLETADA'
          },
          include: {
            usuario: { select: { nombre: true, apellido: true } }
          }
        });
        datos = ventas.map(v => [
          v.fechaVenta.toLocaleDateString(),
          v.numeroVenta,
          'Cliente General',
          Number(v.total),
          v.metodoPago,
          `${v.usuario.nombre} ${v.usuario.apellido}`
        ]);
        break;

      case 'productos':
        headers = ['Código', 'Nombre', 'Categoría', 'Precio', 'Stock', 'Stock Mínimo'];
        const productos = await prisma.producto.findMany({
          where: { activo: true },
          include: { categoria: { select: { nombre: true } } }
        });
        datos = productos.map(p => [
          p.codigo,
          p.nombre,
          p.categoria.nombre,
          Number(p.precio),
          p.stock,
          p.stockMinimo
        ]);
        break;

      case 'inventario':
        headers = ['Código', 'Nombre', 'Categoría', 'Precio', 'Stock Actual', 'Stock Mínimo', 'Estado'];
        const inventario = await prisma.producto.findMany({
          where: { activo: true },
          include: { categoria: { select: { nombre: true } } },
          orderBy: { stock: 'asc' }
        });
        datos = inventario.map(p => [
          p.codigo,
          p.nombre,
          p.categoria.nombre,
          Number(p.precio),
          p.stock,
          p.stockMinimo,
          p.stock <= p.stockMinimo ? 'STOCK BAJO' : 'OK'
        ]);
        break;

      case 'empleados':
        headers = ['Nombre', 'Email', 'Rol', 'Estado', 'Fecha Registro'];
        const empleados = await prisma.usuario.findMany({
          where: { activo: true }
        });
        datos = empleados.map(u => [
          `${u.nombre} ${u.apellido}`,
          u.email,
          u.rol,
          u.activo ? 'ACTIVO' : 'INACTIVO',
          u.fechaCreacion.toLocaleDateString()
        ]);
        break;

      default:
        return res.status(400).json({ error: 'Tipo de reporte no válido' });
    }

    // Agregar headers
    worksheet.addRow(headers);
    worksheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    // Agregar datos
    datos.forEach(fila => worksheet.addRow(fila));

    // Ajustar ancho de columnas
    worksheet.columns.forEach(column => {
      column.width = 15;
    });

    // Generar buffer
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${tipo}-${new Date().toISOString().split('T')[0]}.xlsx`);
    res.send(buffer);

  } catch (error) {
    console.error('Error exportando a Excel:', error);
    res.status(500).json({ error: 'Error generando archivo Excel' });
  }
});

export default router; 