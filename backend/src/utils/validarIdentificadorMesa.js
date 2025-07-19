/**
 * Validador de identificadores de mesa
 * Criterios: máximo 4 caracteres, hasta 2 letras + hasta 2 números
 * Ejemplos válidos: A01, B12, AA12, M5, 5BI, 12A, 1AB, 25B
 */

export function validarIdentificadorMesa(identificador) {
  // Verificar que sea string y no esté vacío
  if (!identificador || typeof identificador !== 'string') {
    return {
      valido: false,
      error: 'El identificador debe ser una cadena de texto no vacía'
    };
  }
  
  // Verificar longitud máxima de 4 caracteres
  if (identificador.length > 4) {
    return {
      valido: false,
      error: 'El identificador no puede tener más de 4 caracteres'
    };
  }
  
  // Verificar longitud mínima de 1 caracter
  if (identificador.length < 1) {
    return {
      valido: false,
      error: 'El identificador debe tener al menos 1 caracter'
    };
  }
  
  // Convertir a mayúsculas para validación
  const identificadorMayuscula = identificador.toUpperCase();
  
  // Verificar que solo contenga letras y números
  if (!/^[A-Z0-9]+$/.test(identificadorMayuscula)) {
    return {
      valido: false,
      error: 'El identificador solo puede contener letras (A-Z) y números (0-9)'
    };
  }
  
  // Contar letras y números
  const letras = identificadorMayuscula.match(/[A-Z]/g) || [];
  const numeros = identificadorMayuscula.match(/[0-9]/g) || [];
  
  // Verificar máximo 2 letras
  if (letras.length > 2) {
    return {
      valido: false,
      error: 'El identificador puede tener máximo 2 letras'
    };
  }
  
  // Verificar máximo 2 números
  if (numeros.length > 2) {
    return {
      valido: false,
      error: 'El identificador puede tener máximo 2 números'
    };
  }
  
  // Verificar que tenga al menos una letra o un número
  if (letras.length === 0 && numeros.length === 0) {
    return {
      valido: false,
      error: 'El identificador debe contener al menos una letra o un número'
    };
  }
  
  // ✅ VALIDACIÓN FLEXIBLE: Permite cualquier combinación de letras y números
  // Patrones válidos ampliados:
  const patronesValidos = [
    /^[A-Z]{1,2}[0-9]{1,2}$/, // Letras seguidas de números: A01, AB12
    /^[0-9]{1,2}[A-Z]{1,2}$/, // Números seguidos de letras: 5B, 12AB
    /^[A-Z]{1,2}$/, // Solo letras: A, AB
    /^[0-9]{1,2}$/, // Solo números: 1, 12
    /^[A-Z][0-9][A-Z]$/, // Letra-número-letra: A1B
    /^[0-9][A-Z][0-9]$/, // Número-letra-número: 1A2
    /^[A-Z][0-9][A-Z][0-9]$/, // Letra-número-letra-número: A1B2
    /^[0-9][A-Z][0-9][A-Z]$/, // Número-letra-número-letra: 1A2B
  ];
  
  const esPatronValido = patronesValidos.some(patron => patron.test(identificadorMayuscula));
  
  if (!esPatronValido) {
    return {
      valido: false,
      error: 'El identificador debe ser una combinación válida de letras y números (ej: A01, 5B, AB12, 12A)'
    };
  }
  
  return {
    valido: true,
    identificadorNormalizado: identificadorMayuscula,
    mensaje: 'Identificador válido'
  };
}

/**
 * Generar sugerencias de identificadores válidos
 */
export function generarSugerenciasIdentificadores(existentes = [], cantidad = 10) {
  const sugerencias = [];
  const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  
  // Generar patrones: letra + números
  for (let i = 0; i < letras.length && sugerencias.length < cantidad; i++) {
    for (let j = 1; j <= 99 && sugerencias.length < cantidad; j++) {
      const sugerencia = `${letras[i]}${j.toString().padStart(2, '0')}`;
      if (!existentes.includes(sugerencia)) {
        sugerencias.push(sugerencia);
      }
    }
  }
  
  // Generar patrones: dos letras + número
  for (let i = 0; i < letras.length && sugerencias.length < cantidad; i++) {
    for (let j = 0; j < letras.length && sugerencias.length < cantidad; j++) {
      for (let k = 1; k <= 9 && sugerencias.length < cantidad; k++) {
        const sugerencia = `${letras[i]}${letras[j]}${k}`;
        if (!existentes.includes(sugerencia)) {
          sugerencias.push(sugerencia);
        }
      }
    }
  }
  
  return sugerencias.slice(0, cantidad);
}

/**
 * Ejemplos de identificadores válidos para mostrar al usuario
 */
export const ejemplosValidosIdentificadores = [
  'A01', 'A02', 'A03', 'A04',
  'B01', 'B02', 'B03', 'B04', 
  'C01', 'C02', 'C03', 'C04',
  'M01', 'M02', 'M03', 'M04',
  'T01', 'T02', 'T03', 'T04',
  'AA1', 'AA2', 'BB1', 'BB2',
  'M5', 'T8', 'P9', 'S7'
];

/**
 * Estados válidos de mesa con sus colores correspondientes
 */
export const estadosMesa = {
  LIBRE: {
    color: '#4CAF50', // Verde
    descripcion: 'Mesa vacía, sin ítems ni facturación',
    icono: '🟢'
  },
  OCUPADA: {
    color: '#F44336', // Rojo
    descripcion: 'Mesa con ítems cargados o comanda impresa, sin facturación',
    icono: '🔴'
  },
  ESPERANDO_PEDIDO: {
    color: '#2196F3', // Azul
    descripcion: 'Mesa facturada (ticket fiscal o no fiscal emitido)',
    icono: '🔵'
  }
};

/**
 * Función para obtener el color según el estado de la mesa
 */
export function obtenerColorPorEstado(estado) {
  return estadosMesa[estado]?.color || '#9E9E9E';
}

/**
 * Función para obtener el icono según el estado de la mesa
 */
export function obtenerIconoPorEstado(estado) {
  return estadosMesa[estado]?.icono || '⚫';
} 