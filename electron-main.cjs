const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const os = require('os');

// Configuración de la aplicación
const isDev = process.env.NODE_ENV === 'development';

console.log('🚀 Iniciando CobroFacil Electron...');
console.log('🔧 Modo desarrollo:', isDev);

// Deshabilitar sandbox en Linux para evitar errores
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('--no-sandbox');
  app.commandLine.appendSwitch('--disable-setuid-sandbox');
  app.commandLine.appendSwitch('--disable-dev-shm-usage');
  app.commandLine.appendSwitch('--disable-gpu-sandbox');
  console.log('🐧 Configuración Linux aplicada');
}

// Variables globales
let mainWindow;
let splashWindow;

// Función para crear splash screen
function createSplashWindow() {
  console.log('✨ Creando splash screen...');
  
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  // HTML del splash screen
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          text-align: center;
        }
        .logo {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .loading {
          font-size: 14px;
          opacity: 0.8;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 0.4; }
          100% { opacity: 0.8; }
        }
      </style>
    </head>
    <body>
      <div class="logo">💰 CobroFacil</div>
      <div class="loading">Iniciando aplicación...</div>
    </body>
    </html>
  `;

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splashWindow.show();
  
  console.log('✅ Splash screen mostrado');
}

// Función para crear ventana principal
function createMainWindow() {
  console.log('🏠 Creando ventana principal...');
  
  // Ventana principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    icon: path.join(__dirname, 'public/icons/icon-512x512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: isDev ? false : true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  });

  // Configurar URL según el entorno
  if (isDev) {
    console.log('🔗 Cargando URL de desarrollo: http://localhost:3002');
    // Esperar un poco más para asegurar que el servidor esté listo
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3002');
      console.log('📡 URL cargada en ventana principal');
    }, 3000);
  } else {
    console.log('📁 Cargando archivo estático');
    mainWindow.loadFile('dist/index.html');
  }

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    console.log('🎉 Ventana lista para mostrar');
    
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
      console.log('❌ Splash screen cerrado');
    }
    
    mainWindow.show();
    mainWindow.focus();
    
    console.log('✅ Ventana principal mostrada y enfocada');
  });

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Error cargando la aplicación:', errorDescription);
    
    // Mostrar página de error
    const errorHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Error - CobroFacil</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: #f5f5f5;
          }
          .error { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
          }
          .retry { 
            background: #1976d2; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="error">
          <h1>🔌 Error de Conexión</h1>
          <p>No se pudo conectar con el servidor de CobroFacil.</p>
          <p><strong>Error:</strong> ${errorDescription}</p>
          <button class="retry" onclick="location.reload()">Reintentar</button>
        </div>
      </body>
      </html>
    `;
    
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHTML)}`);
  });

  // Evento cuando la ventana se cierra
  mainWindow.on('closed', () => {
    console.log('🔒 Ventana principal cerrada');
    mainWindow = null;
  });
}

// Crear menú de aplicación
function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Salir',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de CobroFacil',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de CobroFacil',
              message: 'CobroFacil POS',
              detail: 'Sistema de punto de venta profesional\nVersión 1.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Evento cuando la aplicación está lista
app.whenReady().then(() => {
  console.log('🚀 Aplicación Electron lista');
  
  createSplashWindow();
  createMainWindow();
  createMenu();
  
  console.log('🎯 Todas las ventanas y menús creados');
});

// Evento cuando todas las ventanas están cerradas
app.on('window-all-closed', () => {
  console.log('🔒 Todas las ventanas cerradas');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Evento cuando la aplicación se activa
app.on('activate', () => {
  console.log('🔄 Aplicación activada');
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada:', reason);
});

console.log('📋 Archivo electron-main.cjs cargado completamente'); 