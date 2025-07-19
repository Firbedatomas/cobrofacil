// Handlers críticos para VentaIntegralV2
import { toastService } from '../../../services/toastService';
import { printerService } from '../../../services/printerService';
import { puntosService } from '../../../services/puntosService';
import api from '../../../services/api';

export const useVentaHandlers = () => {
  
  // Handler para especificaciones
  const handleEspecificaciones = async (itemId: string, especificaciones: string) => {
    try {
      await api.patch(`/ventas/items/${itemId}/especificaciones`, {
        especificaciones: especificaciones.slice(0, 200) // Máximo 200 caracteres
      });
      toastService.success('Especificaciones guardadas');
      return true;
    } catch (error) {
      toastService.error('Error al guardar especificaciones');
      return false;
    }
  };

  // Handler para fusión de cuentas
  const handleFusion = async (mesaId: string) => {
    try {
      const response = await api.post(`/ventas/mesa/${mesaId}/fusion`);
      toastService.success('Cuentas fusionadas correctamente');
      return response.data;
    } catch (error) {
      toastService.error('Error al fusionar cuentas');
      return null;
    }
  };

  // Handler para descuentos
  const handleDescuento = async (ventaId: string, tipo: 'porcentaje' | 'fijo', valor: number) => {
    try {
      const response = await api.post(`/ventas/${ventaId}/descuento`, {
        tipo,
        valor
      });
      toastService.success('Descuento aplicado');
      return response.data;
    } catch (error) {
      toastService.error('Error al aplicar descuento');
      return null;
    }
  };

  // Handler para división de cuenta
  const handleDivisionCuenta = async (ventaId: string, divisiones: any[]) => {
    try {
      const response = await api.post(`/ventas/${ventaId}/dividir`, {
        divisiones
      });
      toastService.success('Cuenta dividida correctamente');
      return response.data;
    } catch (error) {
      toastService.error('Error al dividir cuenta');
      return null;
    }
  };

  // Handler para pago parcial
  const handlePagoParcial = async (ventaId: string, monto: number, medioPago: string) => {
    try {
      const response = await api.post(`/ventas/${ventaId}/pago-parcial`, {
        monto,
        medioPago
      });
      toastService.success('Pago parcial registrado');
      return response.data;
    } catch (error) {
      toastService.error('Error al registrar pago parcial');
      return null;
    }
  };

  // Handler para transferir
  const handleTransferir = async (mesaOrigenId: string, mesaDestinoId: string, items?: string[], transferirTodos: boolean = true) => {
    try {
      // ✅ 1. Transferir productos (como antes)
      const response = await api.post(`/mesas/${mesaOrigenId}/transferir`, {
        mesaDestinoId,
        itemsIds: items,
        transferirTodos
      });

      // ✅ 2. Si es transferencia completa, transferir también el mozo
      if (transferirTodos) {
        try {
          const { default: asignacionesMozoService } = await import('../../../services/asignacionesMozoService');
          
          // Obtener mozo asignado a mesa origen
          const mozoAsignado = await asignacionesMozoService.obtenerMozoAsignado(mesaOrigenId);
          
          if (mozoAsignado) {
            console.log('🔄 Transfiriendo mozo:', mozoAsignado.nombre, 'de mesa origen a destino');
            
            // Asignar mozo a mesa destino
            await asignacionesMozoService.asignarMozo(
              mesaDestinoId, 
              mozoAsignado.id, 
              `Transferido desde mesa origen - Transferencia completa`
            );
            
            // Liberar mozo de mesa origen
            await asignacionesMozoService.liberarMozo(
              mesaOrigenId, 
              `Mesa transferida completamente - Transferencia completa`
            );
            
            console.log('✅ Mozo transferido exitosamente');
          }
        } catch (mozoError) {
          console.error('⚠️ Error transfiriendo mozo (productos OK):', mozoError);
          toastService.warning('Productos transferidos, pero hubo un problema con el mozo');
        }
      }

      // ✅ 3. Mensaje de éxito diferenciado
      if (transferirTodos) {
        toastService.success('Transferencia completa realizada: productos y mozo transferidos');
      } else {
        toastService.success('Transferencia parcial realizada: productos seleccionados transferidos');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error en transferir:', error);
      toastService.error('Error al transferir');
      return null;
    }
  };

  // Handler para facturación AFIP
  const handleFacturacion = async (ventaId: string, tipoComprobante: string, datosCliente?: any, formasPago?: Array<{metodo: string, monto: number}>) => {
    try {
      console.log('🎫 Enviando facturación:', { ventaId, tipoComprobante, formasPago });
      
      const response = await api.post(`/ventas/${ventaId}/facturar`, {
        tipoComprobante,
        formasPago: formasPago || [],
        datosCliente
      });
      
      if (response.data.success) {
        console.log('✅ Facturación exitosa:', response.data.data);
        
        // Mostrar mensaje de éxito
        toastService.success(`${tipoComprobante} emitido correctamente - N° ${response.data.data.numeroComprobante}`);
        
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error en la facturación');
      }
      
    } catch (error: any) {
      console.error('❌ Error en facturación:', error);
      
      if (error.response?.data?.error) {
        toastService.error(`Error: ${error.response.data.error}`);
      } else {
        toastService.error('Error al procesar la facturación');
      }
      
      return null;
    }
  };

  // Handler para puntos
  const handlePuntos = async (clienteId: string, puntosACanjear: number) => {
    try {
      const resultado = await puntosService.aplicarDescuentoPuntos(
        clienteId,
        puntosACanjear,
        'DESCUENTO_FIJO'
      );
      
      if (resultado.success) {
        toastService.success(`Descuento aplicado: $${resultado.descuento}`);
      } else {
        toastService.error('Error al aplicar puntos');
      }
      
      return resultado;
    } catch (error) {
      toastService.error('Error al procesar puntos');
      return null;
    }
  };

  return {
    handleEspecificaciones,
    handleFusion,
    handleDescuento,
    handleDivisionCuenta,
    handlePagoParcial,
    handleTransferir,
    handleFacturacion,
    handlePuntos
  };
}; 