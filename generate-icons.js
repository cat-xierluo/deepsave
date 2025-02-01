const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, 'icons', 'icon128.svg');
const outputDir = path.join(__dirname, 'icons');

// 确保输出目录存在
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成不同尺寸的PNG
const sizes = [16, 48, 128];
sizes.forEach(size => {
  sharp(inputSvg)
    .resize(size, size)
    .png()
    .toFile(path.join(outputDir, `icon${size}.png`))
    .then(() => console.log(`生成成功: icon${size}.png`))
    .catch(err => console.error(`生成失败 (${size}px):`, err));
});

const manifestPath = path.join(__dirname, 'manifest.json');
const manifest = require(manifestPath);

// 更新图标路径
manifest.icons = {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
};

manifest.action.default_icon = {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
};

fs.writeFileSync(
  manifestPath,
  JSON.stringify(manifest, null, 2)
);
console.log('manifest.json 已自动更新！'); 
