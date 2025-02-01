const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 创建 SVG 图标
function generateSVG() {
  const svgContent = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="64" fill="#4B5EE4"/>
  <text x="64" y="67" 
        font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial" 
        font-size="70" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
        letter-spacing="-1">DS</text>
</svg>`;

  const iconDir = path.join(__dirname, 'icons');
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir);
  }

  const svgPath = path.join(iconDir, 'icon128.svg');
  fs.writeFileSync(svgPath, svgContent);
  return svgPath;
}

// 生成 PNG
async function generatePNGs() {
  const sizes = [16, 48, 128];
  const svgPath = generateSVG();

  for (const size of sizes) {
    await sharp(svgPath, { density: 300 })
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
        kernel: 'lanczos3'
      })
      .png({ quality: 100 })
      .toFile(path.join(__dirname, 'icons', `icon${size}.png`));
  }

  // 更新 manifest.json
  const manifest = require('./manifest.json');
  manifest.icons = {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  };
  manifest.action.default_icon = manifest.icons;
  
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
}

generatePNGs().catch(console.error); 
