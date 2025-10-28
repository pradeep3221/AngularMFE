/**
 * PWA Icon Generator Script
 * Generates placeholder PWA icons for development
 * 
 * Usage: node generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, 'projects', 'shell', 'public', 'assets', 'icons');

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Icon sizes needed
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">MFE</text>
</svg>`;

  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'dashboard', emoji: '📊' },
  { name: 'users', emoji: '👥' },
  { name: 'profile', emoji: '👤' }
];

shortcuts.forEach(({ name, emoji }) => {
  const size = 192;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad-${name})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>`;

  const filename = `${name}-icon-${size}x${size}.svg`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`✓ Generated ${filename}`);
});

console.log('\n✅ All PWA icons generated successfully!');
console.log(`📁 Location: ${outputDir}`);
console.log('\n⚠️  Note: These are SVG placeholders. For production, convert to PNG using:');
console.log('   - Online tools like CloudConvert or Convertio');
console.log('   - Or use sharp: npm install sharp && node convert-svg-to-png.js');
