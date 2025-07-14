const { contextBridge, ipcRenderer } = require('electron');

console.log('🔧 Preload script cargado');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Información del sistema
  platform: process.platform,
  
  // Funciones básicas
  openExternal: (url) => {
    console.log('🔗 Abriendo URL externa:', url);
    // TODO: Implementar apertura de URLs externas
  },
  
  // Versión de la aplicación
  getVersion: () => {
    return '1.0.0';
  },
  
  // Log para debug
  log: (message) => {
    console.log('📝 Desde renderer:', message);
  }
});

console.log('✅ APIs expuestas al renderer'); 