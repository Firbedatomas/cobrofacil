const fs = require('fs');
const path = require('path');

// Función para crear un SVG simple con las iniciales CF
function createSVGIcon(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2196F3;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1976D2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">CF</text>
</svg>`;
}

// Función para crear un favicon simple
function createFaviconSVG() {
  return `<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="4" fill="#2196F3"/>
  <text x="16" y="16" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">CF</text>
</svg>`;
}

// Tamaños de iconos necesarios para PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, 'public', 'icons');

// Crear directorio si no existe
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Generando iconos PWA...');

// Generar iconos SVG
iconSizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`✅ Creado: ${filename}`);
});

// Crear favicon
const faviconSVG = createFaviconSVG();
fs.writeFileSync(path.join(__dirname, 'public', 'favicon.svg'), faviconSVG);
console.log('✅ Creado: favicon.svg');

// Crear también algunos iconos PNG básicos usando Canvas (si está disponible)
// Para desarrollo, los SVG son suficientes
iconSizes.slice(0, 4).forEach(size => {
  const svgContent = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  
  // Crear un archivo placeholder PNG (1x1 pixel transparente)
  const pngPlaceholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(iconsDir, filename), pngPlaceholder);
  console.log(`✅ Creado: ${filename} (placeholder)`);
});

// Crear iconos específicos de atajos (shortcuts)
const shortcuts = ['caja', 'historial', 'nueva-venta', 'productos'];
shortcuts.forEach(shortcut => {
  const svgContent = createSVGIcon(192);
  const filename = `shortcut-${shortcut}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svgContent);
  console.log(`✅ Creado: ${filename}`);
  
  // También crear versión PNG placeholder
  const pngPlaceholder = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77kgAAAABJRU5ErkJggg==', 'base64');
  fs.writeFileSync(path.join(iconsDir, `shortcut-${shortcut}.png`), pngPlaceholder);
  console.log(`✅ Creado: shortcut-${shortcut}.png (placeholder)`);
});

console.log('');
console.log('🎉 ¡Iconos PWA generados exitosamente!');
console.log(`📁 Ubicación: ${iconsDir}`);
console.log('');
console.log('📋 Archivos creados:');
console.log('- Iconos principales (SVG y PNG)');
console.log('- Favicon SVG');
console.log('- Iconos de atajos');
console.log('');
console.log('💡 Los navegadores modernos pueden usar SVG como iconos PWA.');
console.log('💡 Los PNG son placeholders - puedes reemplazarlos con iconos reales más tarde.'); 