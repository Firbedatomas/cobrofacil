// Script para limpiar errores del navegador CobroFácil
// Ejecutar en las DevTools del navegador (F12 > Console)

console.log('🧹 LIMPIANDO ERRORES DEL NAVEGADOR COBROFÁCIL');
console.log('=============================================');

// 1. Limpiar localStorage
console.log('🗑️ Limpiando localStorage...');
localStorage.removeItem('authToken');
localStorage.removeItem('usuario');
localStorage.removeItem('ventaActual');
localStorage.removeItem('productosCache');
localStorage.removeItem('clientesCache');
localStorage.removeItem('categoriasCache');
localStorage.removeItem('ventasActivasCache');
localStorage.removeItem('mesasCache');
localStorage.removeItem('sectoresCache');
console.log('✅ localStorage limpiado');

// 2. Limpiar sessionStorage
console.log('🗑️ Limpiando sessionStorage...');
sessionStorage.clear();
console.log('✅ sessionStorage limpiado');

// 3. Limpiar Service Worker cache si existe
if ('serviceWorker' in navigator) {
  console.log('🔧 Limpiando Service Worker cache...');
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
    console.log('✅ Service Worker cache limpiado');
  });
}

// 4. Limpiar cache de la aplicación
if ('caches' in window) {
  console.log('🗄️ Limpiando cache de la aplicación...');
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
    console.log('✅ Cache de aplicación limpiado');
  });
}

// 5. Detener cualquier proceso de autenticación pendiente
console.log('⏹️ Deteniendo procesos de autenticación...');
try {
  // Detener cualquier interval o timeout que pueda estar ejecutándose
  let id = window.setTimeout(function() {}, 0);
  while (id--) {
    window.clearTimeout(id);
  }
  
  id = window.setInterval(function() {}, 99999);
  while (id--) {
    window.clearInterval(id);
  }
  console.log('✅ Procesos detenidos');
} catch (e) {
  console.log('ℹ️ No hay procesos pendientes');
}

// 6. Información de estado
console.log('');
console.log('📋 ESTADO ACTUAL:');
console.log('==================');
console.log('🔑 Token de autenticación:', localStorage.getItem('authToken') ? 'PRESENTE' : 'LIMPIO');
console.log('👤 Usuario logueado:', localStorage.getItem('usuario') ? 'SÍ' : 'NO');
console.log('🛒 Venta actual:', localStorage.getItem('ventaActual') ? 'PRESENTE' : 'LIMPIO');

// 7. Verificar conectividad con el backend
console.log('');
console.log('🔌 VERIFICANDO CONECTIVIDAD:');
console.log('============================');

fetch('http://localhost:3000/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend funcionando:', data.message);
    console.log('⏰ Timestamp:', data.timestamp);
  })
  .catch(error => {
    console.log('❌ Backend no disponible:', error.message);
    console.log('💡 Asegúrate de que el backend esté ejecutándose en localhost:3000');
  });

// 8. Instrucciones finales
console.log('');
console.log('🎯 PRÓXIMOS PASOS:');
console.log('==================');
console.log('1. Si ves este mensaje, la limpieza fue exitosa');
console.log('2. Recarga la página con Ctrl+F5 (o Cmd+R en Mac)');
console.log('3. Debería aparecer la pantalla de login');
console.log('4. Si el problema persiste, cierra y abre el navegador');
console.log('');
console.log('🚀 ¡Todo listo! La aplicación debería funcionar correctamente ahora.');

// 9. Auto-reload después de 3 segundos
console.log('');
console.log('⏰ Recargando página automáticamente en 3 segundos...');
setTimeout(() => {
  console.log('🔄 Recargando página...');
  window.location.reload(true);
}, 3000); 