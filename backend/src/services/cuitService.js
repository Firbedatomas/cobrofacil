class CuitService {
  constructor() {
    // Servicio simplificado - solo validación
    console.log('🔧 Servicio CUIT iniciado - solo validación de formato');
  }

  // Formatear CUIT (agregar guiones)
  formatearCuit(cuit) {
    const cuitSinFormato = cuit.replace(/\D/g, '');
    if (cuitSinFormato.length === 11) {
      return `${cuitSinFormato.slice(0, 2)}-${cuitSinFormato.slice(2, 10)}-${cuitSinFormato.slice(10)}`;
    }
    return cuit;
  }

  // Limpiar CUIT (quitar guiones y espacios)
  limpiarCuit(cuit) {
    return cuit.replace(/\D/g, '');
  }

  // Validar formato de CUIT
  validarCuit(cuit) {
    const cuitLimpio = this.limpiarCuit(cuit);
    
    // Debe tener 11 dígitos
    if (cuitLimpio.length !== 11) {
      return { valido: false, error: 'El CUIT debe tener 11 dígitos' };
    }

    // Validación del dígito verificador
    const digitos = cuitLimpio.split('').map(Number);
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let suma = 0;
    for (let i = 0; i < 10; i++) {
      suma += digitos[i] * multiplicadores[i];
    }

    const resto = suma % 11;
    const digitoVerificador = resto < 2 ? resto : 11 - resto;

    if (digitoVerificador !== digitos[10]) {
      return { valido: false, error: 'Dígito verificador inválido' };
    }

    return { valido: true, cuitFormateado: this.formatearCuit(cuitLimpio) };
  }

  // Método principal - solo validación (sin consultas automáticas)
  async consultarCuit(cuit) {
    try {
      // Solo validar formato
      const validacion = this.validarCuit(cuit);
      if (!validacion.valido) {
        return {
          success: false,
          message: validacion.error
        };
      }

      // Retornar información básica para carga manual
      return {
        success: true,
        datos: {
          cuit: validacion.cuitFormateado,
          valido: true,
          message: 'CUIT válido - Complete manualmente los datos de la empresa',
          fuente: 'VALIDACION'
        }
      };

    } catch (error) {
      console.error('Error validando CUIT:', error);
      return {
        success: false,
        message: 'Error interno al validar CUIT'
      };
    }
  }
}

export const cuitService = new CuitService(); 