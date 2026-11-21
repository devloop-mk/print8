import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import type { LogoPlacement, LogoVariant } from '@/lib/catalog/logo-editor';
import { logoFileAbs } from '@/lib/catalog/logo-editor';

export async function compositeCatalogLogo(
  origAbs: string,
  destAbs: string,
  placement: LogoPlacement,
): Promise<void> {
  const meta = await sharp(origAbs).rotate().metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (!width || !height) {
    throw new Error('Could not read mockup size');
  }

  const logoWidth = Math.max(8, Math.round(width * placement.widthFrac));
  const logoBuf = await rasterizeLogo(placement.logo, logoWidth);
  const rotated = await sharp(logoBuf)
    .rotate(placement.angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const rotMeta = await sharp(rotated).metadata();
  const rw = rotMeta.width ?? logoWidth;
  const rh = rotMeta.height ?? Math.round(logoWidth / 3);
  const left = Math.round(placement.cx * width - rw / 2);
  const top = Math.round(placement.cy * height - rh / 2);

  const clipped = await clipOverlay(rotated, rw, rh, left, top, width, height);
  let pipeline = sharp(origAbs).rotate();
  if (clipped) {
    pipeline = pipeline.composite([
      { input: clipped.buffer, left: clipped.left, top: clipped.top },
    ]);
  }

  const ext = path.extname(destAbs).toLowerCase();
  const tmp = path.join(
    os.tmpdir(),
    `p8-logo-${Date.now()}-${Math.random().toString(16).slice(2)}${ext || '.jpg'}`,
  );
  if (ext === '.png') {
    await pipeline.png({ compressionLevel: 8 }).toFile(tmp);
  } else {
    await pipeline
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 93, chromaSubsampling: '4:4:4' })
      .toFile(tmp);
  }
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.copyFileSync(tmp, destAbs);
  fs.unlinkSync(tmp);
}

async function rasterizeLogo(variant: LogoVariant, width: number): Promise<Buffer> {
  const src = logoFileAbs(variant);
  const img = sharp(src, { density: 240 })
    .resize({ width, withoutEnlargement: false })
    .ensureAlpha();
  if (variant === 'white') {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
      }
    }
    return sharp(data, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toBuffer();
  }
  return img.png().toBuffer();
}

async function clipOverlay(
  buffer: Buffer,
  overlayW: number,
  overlayH: number,
  left: number,
  top: number,
  canvasW: number,
  canvasH: number,
): Promise<{ buffer: Buffer; left: number; top: number } | null> {
  const x0 = Math.max(0, left);
  const y0 = Math.max(0, top);
  const x1 = Math.min(canvasW, left + overlayW);
  const y1 = Math.min(canvasH, top + overlayH);
  const w = Math.floor(x1 - x0);
  const h = Math.floor(y1 - y0);
  if (w < 1 || h < 1) return null;
  if (x0 === left && y0 === top && w === overlayW && h === overlayH) {
    return { buffer, left: x0, top: y0 };
  }
  const cropped = await sharp(buffer)
    .extract({
      left: Math.max(0, Math.round(x0 - left)),
      top: Math.max(0, Math.round(y0 - top)),
      width: w,
      height: h,
    })
    .png()
    .toBuffer();
  return { buffer: cropped, left: x0, top: y0 };
}
