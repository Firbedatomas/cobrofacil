// Formatear precio en formato argentino: $1.000.000,00
export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(precio).replace('ARS', '$');
};

// Formatear número sin símbolo de moneda: 1.000.000,00
export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numero);
};

// Formatear fecha
export const formatearFecha = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Formatear fecha corta
export const formatearFechaCorta = (fecha: string): string => {
  return new Date(fecha).toLocaleDateString('es-AR');
};

// Formatear porcentaje
export const formatearPorcentaje = (porcentaje: number): string => {
  return `${porcentaje.toFixed(1)}%`;
}; 