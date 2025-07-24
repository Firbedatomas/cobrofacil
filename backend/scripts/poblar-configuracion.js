import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function poblarConfiguracion() {
  console.log('🚀 Poblando configuraciones del sistema...');

  try {
    // Configuraciones básicas del sistema
    const configuraciones = [
      {
        clave: 'EMPRESA_NOMBRE',
        valor: 'CobroFacil POS',
        descripcion: 'Nombre de la empresa'
      },
      {
        clave: 'EMPRESA_DIRECCION',
        valor: 'Av. Córdoba 1234, Córdoba, Argentina',
        descripcion: 'Dirección de la empresa'
      },
      {
        clave: 'EMPRESA_TELEFONO',
        valor: '+54 351 123-4567',
        descripcion: 'Teléfono de la empresa'
      },
      {
        clave: 'EMPRESA_EMAIL',
        valor: 'info@cobrofacil.io',
        descripcion: 'Email de la empresa'
      },
      {
        clave: 'EMPRESA_CUIT',
        valor: '30-12345678-9',
        descripcion: 'CUIT de la empresa'
      },
      {
        clave: 'MONEDA_DEFECTO',
        valor: 'ARS',
        descripcion: 'Moneda por defecto del sistema'
      },
      {
        clave: 'DECIMALES_PRECIO',
        valor: '2',
        descripcion: 'Cantidad de decimales para precios'
      },
      {
        clave: 'BACKUP_AUTOMATICO',
        valor: 'true',
        descripcion: 'Activar backup automático de la base de datos'
      },
      {
        clave: 'BACKUP_FRECUENCIA',
        valor: '24',
        descripcion: 'Frecuencia de backup en horas'
      },
      {
        clave: 'IMPRESION_AUTOMATICA',
        valor: 'true',
        descripcion: 'Impresión automática de tickets'
      },
      {
        clave: 'STOCK_MINIMO_ALERTA',
        valor: '5',
        descripcion: 'Stock mínimo para alertas de inventario'
      },
      {
        clave: 'SESION_DURACION',
        valor: '480',
        descripcion: 'Duración de sesión en minutos (8 horas)'
      },
      {
        clave: 'TEMA_SISTEMA',
        valor: 'light',
        descripcion: 'Tema del sistema (light/dark)'
      },
      {
        clave: 'IDIOMA_SISTEMA',
        valor: 'es',
        descripcion: 'Idioma del sistema'
      },
      {
        clave: 'ZONA_HORARIA',
        valor: 'America/Argentina/Cordoba',
        descripcion: 'Zona horaria del sistema'
      },
      {
        clave: 'FORMATO_FECHA',
        valor: 'DD/MM/YYYY',
        descripcion: 'Formato de fecha por defecto'
      },
      {
        clave: 'FORMATO_HORA',
        valor: 'HH:mm',
        descripcion: 'Formato de hora por defecto'
      },
      {
        clave: 'MAXIMO_PRODUCTOS_MESA',
        valor: '50',
        descripcion: 'Máximo número de productos por mesa'
      },
      {
        clave: 'PERMITIR_DESCUENTOS',
        valor: 'true',
        descripcion: 'Permitir descuentos en ventas'
      },
      {
        clave: 'PERMITIR_VENTA_SIN_STOCK',
        valor: 'false',
        descripcion: 'Permitir venta de productos sin stock'
      },
      {
        clave: 'MOSTRAR_CODIGOS_PRODUCTO',
        valor: 'true',
        descripcion: 'Mostrar códigos de productos en la interfaz'
      },
      {
        clave: 'MOSTRAR_STOCK_PRODUCTO',
        valor: 'true',
        descripcion: 'Mostrar stock de productos en la interfaz'
      },
      {
        clave: 'AUTOCOMPLETAR_CANTIDAD',
        valor: 'true',
        descripcion: 'Autocompletar cantidad al agregar productos'
      },
      {
        clave: 'CANTIDAD_POR_DEFECTO',
        valor: '1',
        descripcion: 'Cantidad por defecto al agregar productos'
      },
      {
        clave: 'ENVIAR_COMANDA_AUTOMATICA',
        valor: 'false',
        descripcion: 'Enviar comanda automáticamente al agregar productos'
      },
      {
        clave: 'TIEMPO_LIMITE_VENTA',
        valor: '30',
        descripcion: 'Tiempo límite para completar una venta (minutos)'
      },
      {
        clave: 'FORMATO_NUMEROS',
        valor: 'PUNTO',
        descripcion: 'Formato de números (PUNTO/COMA)'
      },
      {
        clave: 'MOSTRAR_CATEGORIAS',
        valor: 'true',
        descripcion: 'Mostrar categorías en la interfaz de productos'
      },
      {
        clave: 'APLICAR_DESCUENTOS_AUTOMATICOS',
        valor: 'false',
        descripcion: 'Aplicar descuentos automáticos en ventas'
      },
      {
        clave: 'REQUERIR_CLIENTE_VENTA',
        valor: 'false',
        descripcion: 'Requerir selección de cliente en ventas'
      },
      {
        clave: 'MOSTRAR_PRECIO_CON_IVA',
        valor: 'true',
        descripcion: 'Mostrar precios con IVA incluido'
      },
      {
        clave: 'PORCENTAJE_IVA',
        valor: '21',
        descripcion: 'Porcentaje de IVA por defecto'
      },
      {
        clave: 'PERMITIR_PAGO_PARCIAL',
        valor: 'true',
        descripcion: 'Permitir pagos parciales en ventas'
      },
      {
        clave: 'MOSTRAR_TOTALES_DETALLADOS',
        valor: 'true',
        descripcion: 'Mostrar totales detallados en ventas'
      },
      {
        clave: 'GUARDAR_VENTAS_PENDIENTES',
        valor: 'true',
        descripcion: 'Guardar ventas pendientes automáticamente'
      },
      {
        clave: 'MOSTRAR_HISTORIAL_MESA',
        valor: 'true',
        descripcion: 'Mostrar historial de ventas por mesa'
      },
      {
        clave: 'PERMITIR_TRANSFERIR_MESA',
        valor: 'true',
        descripcion: 'Permitir transferir productos entre mesas'
      },
      {
        clave: 'MOSTRAR_TIEMPO_OCUPACION',
        valor: 'true',
        descripcion: 'Mostrar tiempo de ocupación de mesas'
      },
      {
        clave: 'ALERTA_TIEMPO_MESA',
        valor: '120',
        descripcion: 'Tiempo de alerta para mesas ocupadas (minutos)'
      },
      {
        clave: 'PERMITIR_RESERVAS',
        valor: 'false',
        descripcion: 'Permitir sistema de reservas'
      },
      {
        clave: 'MOSTRAR_ESTADISTICAS_TIEMPO_REAL',
        valor: 'true',
        descripcion: 'Mostrar estadísticas en tiempo real'
      },
      {
        clave: 'BACKUP_RETENCION_DIAS',
        valor: '30',
        descripcion: 'Días de retención de backups'
      },
      {
        clave: 'LOG_LEVEL',
        valor: 'info',
        descripcion: 'Nivel de logging del sistema'
      },
      {
        clave: 'PERMITIR_IMPORTAR_PRODUCTOS',
        valor: 'true',
        descripcion: 'Permitir importar productos desde archivos'
      },
      {
        clave: 'PERMITIR_EXPORTAR_DATOS',
        valor: 'true',
        descripcion: 'Permitir exportar datos del sistema'
      },
      {
        clave: 'MOSTRAR_NOTIFICACIONES_SISTEMA',
        valor: 'true',
        descripcion: 'Mostrar notificaciones del sistema'
      },
      {
        clave: 'PERMITIR_CAMBIAR_PASSWORD',
        valor: 'true',
        descripcion: 'Permitir a usuarios cambiar su contraseña'
      },
      {
        clave: 'REQUERIR_PASSWORD_FUERTE',
        valor: 'true',
        descripcion: 'Requerir contraseñas fuertes'
      },
      {
        clave: 'MAXIMO_INTENTOS_LOGIN',
        valor: '3',
        descripcion: 'Máximo número de intentos de login'
      },
      {
        clave: 'BLOQUEAR_USUARIO_TEMPORAL',
        valor: '15',
        descripcion: 'Minutos de bloqueo temporal por intentos fallidos'
      },
      {
        clave: 'PERMITIR_LOGIN_MULTIPLE',
        valor: 'false',
        descripcion: 'Permitir múltiples sesiones del mismo usuario'
      },
      {
        clave: 'MOSTRAR_ULTIMO_LOGIN',
        valor: 'true',
        descripcion: 'Mostrar último login de usuarios'
      },
      {
        clave: 'PERMITIR_CREAR_USUARIOS',
        valor: 'true',
        descripcion: 'Permitir crear nuevos usuarios'
      },
      {
        clave: 'PERMITIR_ELIMINAR_USUARIOS',
        valor: 'true',
        descripcion: 'Permitir eliminar usuarios'
      },
      {
        clave: 'MOSTRAR_LOGS_ACCESO',
        valor: 'true',
        descripcion: 'Mostrar logs de acceso al sistema'
      },
      {
        clave: 'PERMITIR_CONFIGURACION_AVANZADA',
        valor: 'false',
        descripcion: 'Permitir configuración avanzada del sistema'
      }
    ];

    console.log(`📝 Creando ${configuraciones.length} configuraciones...`);

    // Crear o actualizar configuraciones
    for (const config of configuraciones) {
      await prisma.configuracionSistema.upsert({
        where: { clave: config.clave },
        update: {
          valor: config.valor,
          descripcion: config.descripcion
        },
        create: config
      });
    }

    console.log('✅ Configuraciones del sistema creadas correctamente');

    // Mostrar resumen
    const totalConfiguraciones = await prisma.configuracionSistema.count();
    console.log(`📊 Total de configuraciones en el sistema: ${totalConfiguraciones}`);

    // Mostrar algunas configuraciones importantes
    const configuracionesImportantes = await prisma.configuracionSistema.findMany({
      where: {
        clave: {
          in: ['EMPRESA_NOMBRE', 'MONEDA_DEFECTO', 'ZONA_HORARIA', 'BACKUP_AUTOMATICO']
        }
      }
    });

    console.log('\n🔧 Configuraciones importantes:');
    configuracionesImportantes.forEach(config => {
      console.log(`  • ${config.clave}: ${config.valor}`);
    });

  } catch (error) {
    console.error('❌ Error poblando configuraciones:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  poblarConfiguracion()
    .then(() => {
      console.log('🎉 Proceso completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en el proceso:', error);
      process.exit(1);
    });
}

export default poblarConfiguracion; 