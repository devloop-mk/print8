import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outDir = path.join(process.cwd(), 'public', 't-shirts', 'kids');

function luminance(r, g, b) {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function isBackground(r, g, b) {
  const isNeutral =
    Math.abs(r - g) < 18 && Math.abs(g - b) < 18 && Math.abs(r - b) < 18;
  return isNeutral && luminance(r, g, b) >= 248;
}

async function bleachToWhite(srcPath, destPath) {
  const { data, info } = await sharp(srcPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) continue;
    const lum = luminance(r, g, b);
    if (lum > 90 && lum < 230) {
      sum += lum;
      count += 1;
    }
  }
  const mid = count > 0 ? sum / count : 170;
  const targetMid = 246;

  const out = Buffer.from(data);
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (isBackground(r, g, b)) {
      out[i] = 255;
      out[i + 1] = 255;
      out[i + 2] = 255;
      continue;
    }

    const lum = luminance(r, g, b);
    const rel = lum / mid;
    const whiteLum = Math.min(255, Math.max(150, targetMid * rel));
    out[i] = Math.round(Math.min(255, whiteLum));
    out[i + 1] = Math.round(Math.min(255, whiteLum));
    out[i + 2] = Math.round(Math.min(255, whiteLum * 0.995));
  }

  await sharp(out, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(destPath);

  console.log(`Wrote ${destPath}`);
}

fs.mkdirSync(outDir, { recursive: true });

for (const side of ['front', 'back']) {
  const src = path.join(outDir, `mint-${side}.jpg`);
  const dest = path.join(outDir, `bela-${side}.jpg`);
  if (!fs.existsSync(src)) {
    console.error(`Missing ${src}`);
    process.exitCode = 1;
    continue;
  }
  await bleachToWhite(src, dest);
}
