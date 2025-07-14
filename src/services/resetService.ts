// ===============================================
// SERVICIO DE RESET COMPLETO
// Limpia localStorage y resetea la aplicación
// ===============================================

import { toastService } from './toastService';
import { ventasActivasService } from './ventasActivasService';

export class ResetService {
  private static instance: ResetService;

  private constructor() {}

  static getInstance(): ResetService {
    if (!ResetService.instance) {
      ResetService.instance = new ResetService();
    }
    return ResetService.instance;
  }

  /**
   * Limpia completamente localStorage - SOLO DATOS DE VENTAS ACTIVAS
   */
  limpiarVentasActivas(): void {
    try {
      console.log('🧹 Limpiando ventas activas del localStorage...');
      
      // Limpiar específicamente las ventas activas
      localStorage.removeItem('cordobashot_ventas_activas');
      
      // Limpiar el cache interno del servicio
      ventasActivasService.limpiarTodas();
      
      console.log('✅ Ventas activas limpiadas correctamente');
      toastService.success('Ventas activas limpiadas correctamente');
    } catch (error) {
      console.error('❌ Error limpiando ventas activas:', error);
      toastService.error('Error al limpiar ventas activas');
    }
  }

  /**
   * Limpia COMPLETAMENTE localStorage - USAR CON PRECAUCIÓN
   */
  limpiarTodoLocalStorage(): void {
    try {
      console.log('🧹 LIMPIANDO TODO EL LOCALSTORAGE...');
      console.log('⚠️  ESTO ELIMINARÁ TODOS LOS DATOS LOCALES');
      
      // Obtener todas las claves relacionadas con la aplicación
      const clavesRelacionadas = [
        'cordobashot_ventas_activas',
        'cordobashot_productos',
        'cordobashot_clientes',
        'cordobashot_ventas',
        'cordobashot_caja',
        'cordobashot_settings'
      ];
      
      // Eliminar solo las claves relacionadas con la aplicación
      clavesRelacionadas.forEach(clave => {
        localStorage.removeItem(clave);
        console.log(`   🗑️  ${clave} eliminado`);
      });
      
      // Limpiar el cache interno del servicio
      ventasActivasService.limpiarTodas();
      
      console.log('✅ localStorage limpiado completamente');
      toastService.success('Datos locales limpiados correctamente');
    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
      toastService.error('Error al limpiar datos locales');
    }
  }

  /**
   * Reset completo de la aplicación
   */
  resetCompleto(): void {
    try {
      console.log('🔄 INICIANDO RESET COMPLETO...');
      
      // 1. Limpiar localStorage
      this.limpiarTodoLocalStorage();
      
      // 2. Mostrar instrucciones al usuario
      console.log('');
      console.log('🎯 RESET COMPLETO REALIZADO');
      console.log('📋 PRÓXIMOS PASOS:');
      console.log('1. Ejecuta el script de reset en el backend');
      console.log('2. Reinicia la aplicación (F5)');
      console.log('3. Crea tus sectores y mesas desde cero');
      console.log('');
      
      toastService.success('Reset completo realizado. Reinicia la aplicación (F5) para continuar.');
      
    } catch (error) {
      console.error('❌ Error durante el reset completo:', error);
      toastService.error('Error durante el reset completo');
    }
  }

  /**
   * Diagnóstico de datos residuales
   */
  diagnosticarDatosResiduales(): {
    ventasActivas: number;
    datosLocalStorage: string[];
    recomendaciones: string[];
  } {
    console.log('🔍 DIAGNÓSTICO DE DATOS RESIDUALES...');
    
    const ventasActivas = ventasActivasService.obtenerTodasVentasActivas().length;
    const datosLocalStorage: string[] = [];
    const recomendaciones: string[] = [];
    
    // Verificar localStorage
    const clavesRelacionadas = [
      'cordobashot_ventas_activas',
      'cordobashot_productos',
      'cordobashot_clientes',
      'cordobashot_ventas',
      'cordobashot_caja',
      'cordobashot_settings'
    ];
    
    clavesRelacionadas.forEach(clave => {
      const valor = localStorage.getItem(clave);
      if (valor) {
        datosLocalStorage.push(clave);
      }
    });
    
    // Generar recomendaciones
    if (ventasActivas > 0) {
      recomendaciones.push(`Se encontraron ${ventasActivas} ventas activas en memoria`);
      recomendaciones.push('Usa limpiarVentasActivas() para eliminarlas');
    }
    
    if (datosLocalStorage.length > 0) {
      recomendaciones.push(`Se encontraron ${datosLocalStorage.length} entradas en localStorage`);
      recomendaciones.push('Usa limpiarTodoLocalStorage() para eliminarlas');
    }
    
    if (ventasActivas === 0 && datosLocalStorage.length === 0) {
      recomendaciones.push('✅ No se encontraron datos residuales locales');
      recomendaciones.push('El problema puede estar en la base de datos');
    }
    
    console.log('📊 DIAGNÓSTICO COMPLETADO:');
    console.log(`   - Ventas activas: ${ventasActivas}`);
    console.log(`   - Datos en localStorage: ${datosLocalStorage.length}`);
    console.log(`   - Recomendaciones: ${recomendaciones.length}`);
    
    return {
      ventasActivas,
      datosLocalStorage,
      recomendaciones
    };
  }
}

// Instancia singleton
export const resetService = ResetService.getInstance();

// Funciones de acceso rápido para la consola del navegador
declare global {
  interface Window {
    resetApp: () => void;
    limpiarVentas: () => void;
    diagnosticarApp: () => void;
  }
}

// Exponer funciones globalmente para debugging
window.resetApp = () => resetService.resetCompleto();
window.limpiarVentas = () => resetService.limpiarVentasActivas();
window.diagnosticarApp = () => resetService.diagnosticarDatosResiduales(); 