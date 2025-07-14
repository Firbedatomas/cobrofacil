import { validarIdentificadorMesa, generarSugerenciasIdentificadores, estadosMesa } from '../src/utils/validarIdentificadorMesa.js';

console.log('🧪 PRUEBAS DE VALIDACIÓN DE IDENTIFICADORES DE MESA');
console.log('='.repeat(60));

// Casos de prueba
const casosPrueba = [
  // Casos válidos
  { identificador: 'A01', esperado: true },
  { identificador: 'B12', esperado: true },
  { identificador: 'AA12', esperado: true },
  { identificador: 'M5', esperado: true },
  { identificador: 'T8', esperado: true },
  { identificador: 'AB9', esperado: true },
  { identificador: 'Z99', esperado: true },
  { identificador: 'a01', esperado: true }, // Debe normalizarse a A01
  { identificador: 'bb3', esperado: true }, // Debe normalizarse a BB3
  
  // Casos inválidos
  { identificador: 'A001', esperado: false }, // Muy largo
  { identificador: 'ABC12', esperado: false }, // Muy largo
  { identificador: 'A123', esperado: false }, // Muy largo
  { identificador: 'ABCD', esperado: false }, // Muy largo
  { identificador: '', esperado: false }, // Vacío
  { identificador: 'AB@', esperado: false }, // Caracteres especiales
  { identificador: 'A B', esperado: false }, // Espacios
  { identificador: 'AAA', esperado: false }, // Más de 2 letras
  { identificador: '123', esperado: false }, // Más de 2 números
  { identificador: 'A-1', esperado: false }, // Guión
  { identificador: '1A2B', esperado: false }, // Patrón inválido
];

console.log('\n🔍 PRUEBAS DE VALIDACIÓN:');
console.log('-'.repeat(60));

let pruebas = 0;
let exitosas = 0;

for (const caso of casosPrueba) {
  pruebas++;
  const resultado = validarIdentificadorMesa(caso.identificador);
  const exito = resultado.valido === caso.esperado;
  
  if (exito) {
    exitosas++;
    console.log(`✅ ${caso.identificador.padEnd(8)} → ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'}`);
    if (resultado.valido && resultado.identificadorNormalizado !== caso.identificador) {
      console.log(`   📝 Normalizado: ${resultado.identificadorNormalizado}`);
    }
  } else {
    console.log(`❌ ${caso.identificador.padEnd(8)} → ${resultado.valido ? 'VÁLIDO' : 'INVÁLIDO'} (esperado: ${caso.esperado ? 'VÁLIDO' : 'INVÁLIDO'})`);
    console.log(`   📝 Error: ${resultado.error}`);
  }
}

console.log('\n📊 RESULTADOS:');
console.log(`   Pruebas: ${pruebas}`);
console.log(`   Exitosas: ${exitosas}`);
console.log(`   Fallidas: ${pruebas - exitosas}`);
console.log(`   Porcentaje: ${Math.round((exitosas / pruebas) * 100)}%`);

// Prueba de generación de sugerencias
console.log('\n🔧 GENERACIÓN DE SUGERENCIAS:');
console.log('-'.repeat(60));

const existentes = ['A01', 'A02', 'B01', 'B02', 'C01'];
const sugerencias = generarSugerenciasIdentificadores(existentes, 10);

console.log(`Existentes: ${existentes.join(', ')}`);
console.log(`Sugerencias: ${sugerencias.join(', ')}`);

// Mostrar estados de mesa
console.log('\n🎨 ESTADOS DE MESA:');
console.log('-'.repeat(60));

Object.entries(estadosMesa).forEach(([estado, info]) => {
  console.log(`${info.icono} ${estado.padEnd(20)} ${info.color.padEnd(8)} ${info.descripcion}`);
});

console.log('\n🎉 ¡Pruebas completadas!');
console.log('='.repeat(60)); 