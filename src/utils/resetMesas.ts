import { ventasActivasService } from '../services/ventasActivasService';
import { toastService } from '../services/toastService';

export const resetearSistemaMesas = () => {
  try {
    // Limpiar todas las ventas activas del localStorage
    ventasActivasService.resetearSistemaCompleto();
    
    // Recargar la página para refrescar todos los estados
    window.location.reload();
    
    return true;
  } catch (error) {
    console.error('Error al resetear sistema de mesas:', error);
    return false;
  }
};

export const limpiarVentasActivas = () => {
  try {
    ventasActivasService.limpiarTodasVentasActivas();
    return true;
  } catch (error) {
    console.error('Error al limpiar ventas activas:', error);
    return false;
  }
};

export const obtenerEstadisticasVentas = () => {
  return ventasActivasService.obtenerEstadisticas();
};

/**
 * Verificar y mostrar estadísticas del estado actual
 */
export const verificarEstadoMesas = (): void => {
  try {
    const estadisticas = ventasActivasService.obtenerEstadisticas();
    const ventasActivas = ventasActivasService.obtenerTodasVentasActivas();
    
    console.log('📊 Estadísticas de mesas:');
    console.log('- Total ventas activas:', estadisticas.totalVentas);
    console.log('- Total items:', estadisticas.totalItems);
    console.log('- Mesas ocupadas:', estadisticas.mesasOcupadas);
    console.log('- Monto total:', estadisticas.totalMonto);
    
    if (ventasActivas.length > 0) {
      console.log('📋 Ventas activas detalladas:');
      ventasActivas.forEach((venta, index) => {
        console.log(`  ${index + 1}. Mesa ${venta.mesaId}: ${venta.items.length} productos - $${venta.total}`);
      });
    }
    
    // Verificar localStorage
    const keys = Object.keys(localStorage);
    const ventasKeys = keys.filter(key => 
      key.includes('ventas') || 
      key.includes('mesa') || 
      key.includes('cordobashot')
    );
    
    if (ventasKeys.length > 0) {
      console.log('💾 Claves en localStorage relacionadas:');
      ventasKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`  - ${key}: ${value ? JSON.stringify(JSON.parse(value)).substring(0, 100) + '...' : 'null'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error al verificar estado de mesas:', error);
  }
};

/**
 * Función para usar en la consola del navegador
 */
declare global {
  interface Window {
    resetMesas: () => void;
    verificarMesas: () => void;
  }
}

// Exponer funciones globalmente para debugging
if (typeof window !== 'undefined') {
  window.resetMesas = resetearSistemaMesas;
  window.verificarMesas = verificarEstadoMesas;
} 