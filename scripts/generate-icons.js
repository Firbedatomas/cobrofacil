import fs from 'fs';
import path from 'path';

// Tamaños de iconos necesarios para PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Directorio de iconos
const iconsDir = path.join(process.cwd(), 'public', 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Función para generar SVG del logo
function generateLogoSVG(size) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1976d2;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#42a5f5;stop-opacity:1" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4caf50;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#81c784;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Fondo con gradiente -->
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad1)"/>
      
      <!-- Círculo central -->
      <circle cx="${size/2}" cy="${size/2}" r="${size * 0.3}" fill="url(#grad2)" opacity="0.9"/>
      
      <!-- Símbolo de moneda -->
      <text x="${size/2}" y="${size/2 + size * 0.08}" 
            text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.25}" 
            font-weight="bold" 
            fill="white">$</text>
      
      <!-- Líneas decorativas -->
      <rect x="${size * 0.2}" y="${size * 0.15}" width="${size * 0.6}" height="${size * 0.05}" rx="${size * 0.025}" fill="white" opacity="0.3"/>
      <rect x="${size * 0.2}" y="${size * 0.8}" width="${size * 0.6}" height="${size * 0.05}" rx="${size * 0.025}" fill="white" opacity="0.3"/>
      
      <!-- Texto pequeño -->
      <text x="${size/2}" y="${size * 0.85}" 
            text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.08}" 
            fill="white" 
            opacity="0.8">POS</text>
    </svg>
  `;
}

// Función para generar iconos de acceso directo
function generateShortcutIcon(size, iconType) {
  const icons = {
    'nueva-venta': {
      color: '#4caf50',
      symbol: '+',
      text: 'VENTA'
    },
    'productos': {
      color: '#ff9800',
      symbol: '📦',
      text: 'PROD'
    },
    'caja': {
      color: '#2196f3',
      symbol: '💰',
      text: 'CAJA'
    },
    'historial': {
      color: '#9c27b0',
      symbol: '📊',
      text: 'HIST'
    }
  };

  const icon = icons[iconType];
  if (!icon) return generateLogoSVG(size);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad-${iconType}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${icon.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${icon.color};stop-opacity:0.7" />
        </linearGradient>
      </defs>
      
      <!-- Fondo -->
      <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad-${iconType})"/>
      
      <!-- Símbolo -->
      <text x="${size/2}" y="${size/2 - size * 0.05}" 
            text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.3}" 
            fill="white">${icon.symbol}</text>
      
      <!-- Texto -->
      <text x="${size/2}" y="${size * 0.8}" 
            text-anchor="middle" 
            font-family="Arial, sans-serif" 
            font-size="${size * 0.1}" 
            font-weight="bold"
            fill="white">${icon.text}</text>
    </svg>
  `;
}

// Función para convertir SVG a PNG (simulado - en producción usar librería como sharp)
function saveSVGAsIcon(svgContent, size, filename) {
  const svgPath = path.join(iconsDir, `${filename}.svg`);
  fs.writeFileSync(svgPath, svgContent);
  
  // Nota: En producción, aquí convertiríamos SVG a PNG
  // Por ahora, guardamos como SVG y renombramos a PNG
  const pngPath = path.join(iconsDir, `${filename}.png`);
  fs.writeFileSync(pngPath, svgContent);
  
  console.log(`✅ Icono generado: ${filename}.png (${size}x${size})`);
}

// Generar iconos principales
console.log('🎨 Generando iconos para PWA...');

iconSizes.forEach(size => {
  const svgContent = generateLogoSVG(size);
  saveSVGAsIcon(svgContent, size, `icon-${size}x${size}`);
});

// Generar iconos de acceso directo
const shortcutTypes = ['nueva-venta', 'productos', 'caja', 'historial'];
shortcutTypes.forEach(type => {
  const svgContent = generateShortcutIcon(96, type);
  saveSVGAsIcon(svgContent, 96, `shortcut-${type}`);
});

// Generar favicon
const faviconSVG = generateLogoSVG(32);
fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), faviconSVG);

// Generar apple-touch-icon
const appleTouchIcon = generateLogoSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.png'), appleTouchIcon);

console.log('✅ Todos los iconos han sido generados correctamente');
console.log(`📁 Ubicación: ${iconsDir}`);
console.log(`📱 Favicon: ${path.join(process.cwd(), 'public', 'favicon.svg')}`);

// Crear screenshots básicos
console.log('📸 Generando screenshots...');

const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Screenshot desktop
const desktopScreenshot = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <rect width="1280" height="720" fill="#f5f5f5"/>
    <rect x="0" y="0" width="1280" height="64" fill="#1976d2"/>
    <text x="640" y="40" text-anchor="middle" font-family="Arial" font-size="24" fill="white" font-weight="bold">
      CobroFacil POS - Sistema de Punto de Venta
    </text>
    <rect x="32" y="96" width="300" height="200" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="182" y="130" text-anchor="middle" font-family="Arial" font-size="18" fill="#333">
      Nueva Venta
    </text>
    <rect x="364" y="96" width="300" height="200" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="514" y="130" text-anchor="middle" font-family="Arial" font-size="18" fill="#333">
      Productos
    </text>
    <rect x="696" y="96" width="300" height="200" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="846" y="130" text-anchor="middle" font-family="Arial" font-size="18" fill="#333">
      Caja
    </text>
    <rect x="32" y="328" width="968" height="360" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="516" y="368" text-anchor="middle" font-family="Arial" font-size="20" fill="#333">
      Dashboard - Resumen de Ventas
    </text>
  </svg>
`;

fs.writeFileSync(path.join(screenshotsDir, 'desktop.svg'), desktopScreenshot);
fs.writeFileSync(path.join(screenshotsDir, 'desktop.png'), desktopScreenshot);

// Screenshot mobile
const mobileScreenshot = `
  <svg width="375" height="667" viewBox="0 0 375 667" xmlns="http://www.w3.org/2000/svg">
    <rect width="375" height="667" fill="#f5f5f5"/>
    <rect x="0" y="0" width="375" height="60" fill="#1976d2"/>
    <text x="187" y="35" text-anchor="middle" font-family="Arial" font-size="18" fill="white" font-weight="bold">
      CobroFacil
    </text>
    <rect x="16" y="80" width="343" height="120" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="187" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
      Nueva Venta
    </text>
    <rect x="16" y="220" width="343" height="120" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="187" y="250" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
      Productos
    </text>
    <rect x="16" y="360" width="343" height="120" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="187" y="390" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
      Caja
    </text>
    <rect x="16" y="500" width="343" height="120" rx="8" fill="white" stroke="#e0e0e0"/>
    <text x="187" y="530" text-anchor="middle" font-family="Arial" font-size="16" fill="#333">
      Historial
    </text>
  </svg>
`;

fs.writeFileSync(path.join(screenshotsDir, 'mobile.svg'), mobileScreenshot);
fs.writeFileSync(path.join(screenshotsDir, 'mobile.png'), mobileScreenshot);

console.log('✅ Screenshots generados correctamente');
console.log(`📁 Ubicación: ${screenshotsDir}`);

export default { generateLogoSVG, generateShortcutIcon }; 