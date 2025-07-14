// Service Worker para CobroFacil PWA
const CACHE_NAME = 'cobrofacil-v1.0.0';
const STATIC_CACHE_NAME = 'cobrofacil-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'cobrofacil-dynamic-v1.0.0';

// Recursos críticos para funcionamiento offline
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CSS y JS se cachearán automáticamente por Vite
];

// Rutas API críticas para funcionamiento offline
const CRITICAL_API_ROUTES = [
  '/api/auth/verify',
  '/api/productos',
  '/api/categorias',
  '/api/network/ping',
  '/api/network/info'
];

// Rutas que requieren conectividad (no cachear)
const ONLINE_ONLY_ROUTES = [
  '/api/afip',
  '/api/cuit',
  '/api/network/test'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalándose...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cacheando recursos estáticos');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activándose...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Eliminando cache antigua:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activado correctamente');
        return self.clients.claim();
      })
  );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar peticiones no HTTP
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Estrategia según el tipo de recurso
  if (request.url.includes('/api/')) {
    // Peticiones API
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    // Documentos HTML
    event.respondWith(handleDocumentRequest(request));
  } else if (request.destination === 'image') {
    // Imágenes
    event.respondWith(handleImageRequest(request));
  } else {
    // Otros recursos estáticos
    event.respondWith(handleStaticRequest(request));
  }
});

// Manejar peticiones API
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Rutas que requieren conexión online
  if (ONLINE_ONLY_ROUTES.some(route => pathname.includes(route))) {
    return handleOnlineOnlyRequest(request);
  }
  
  // Estrategia Network First para APIs críticas
  if (CRITICAL_API_ROUTES.some(route => pathname.includes(route))) {
    return handleNetworkFirstRequest(request);
  }
  
  // Estrategia Cache First para datos menos críticos
  return handleCacheFirstRequest(request);
}

// Manejar peticiones que requieren conexión online
async function handleOnlineOnlyRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.warn('⚠️ Ruta requiere conexión online:', request.url);
    return new Response(
      JSON.stringify({
        error: 'Funcionalidad no disponible offline',
        message: 'Esta función requiere conexión a internet',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Estrategia Network First (intentar red, luego cache)
async function handleNetworkFirstRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear respuesta exitosa
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.warn('⚠️ Red no disponible, usando cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Respuesta offline para rutas críticas
    return createOfflineResponse(request);
  }
}

// Estrategia Cache First (cache primero, luego red)
async function handleCacheFirstRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Actualizar cache en background
    updateCacheInBackground(request);
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

// Manejar peticiones de documentos HTML
async function handleDocumentRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Cargando página offline');
    
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      createOfflineHTML(),
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Manejar peticiones de imágenes
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Imagen placeholder offline
    return new Response(
      createOfflineImageSVG(),
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Manejar recursos estáticos
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Recurso no disponible offline:', request.url);
    return new Response('', { status: 404 });
  }
}

// Actualizar cache en background
async function updateCacheInBackground(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Fallo silencioso en background
  }
}

// Crear respuesta offline personalizada
function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Sin conexión',
        message: 'Funcionalidad limitada en modo offline',
        offline: true,
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return new Response('Sin conexión', { status: 503 });
}

// HTML para página offline
function createOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CobroFacil - Sin Conexión</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-align: center;
        }
        .container {
          max-width: 400px;
          padding: 2rem;
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        .title {
          font-size: 2rem;
          margin-bottom: 1rem;
          font-weight: 300;
        }
        .message {
          font-size: 1.1rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid white;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .button:hover {
          background: white;
          color: #667eea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔌</div>
        <h1 class="title">Sin Conexión</h1>
        <p class="message">
          CobroFacil funciona en modo offline limitado. 
          Algunas funcionalidades requieren conexión a internet.
        </p>
        <button class="button" onclick="window.location.reload()">
          Reintentar Conexión
        </button>
      </div>
    </body>
    </html>
  `;
}

// SVG para imagen offline
function createOfflineImageSVG() {
  return `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#f0f0f0"/>
      <text x="100" y="100" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="16" fill="#999">
        Imagen no disponible
      </text>
    </svg>
  `;
}

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    getCacheStatus().then((status) => {
      event.ports[0].postMessage(status);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Obtener estado del cache
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {
    caches: cacheNames.length,
    static: 0,
    dynamic: 0,
    total: 0
  };
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (cacheName.includes('static')) {
      status.static += keys.length;
    } else if (cacheName.includes('dynamic')) {
      status.dynamic += keys.length;
    }
    
    status.total += keys.length;
  }
  
  return status;
}

// Limpiar todos los caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Notificar cambios de conectividad
self.addEventListener('online', () => {
  console.log('🌐 Conexión restaurada');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTIVITY_CHANGE',
        online: true
      });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('🔌 Conexión perdida - Modo offline');
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTIVITY_CHANGE',
        online: false
      });
    });
  });
});

console.log('✅ Service Worker CobroFacil cargado correctamente'); 