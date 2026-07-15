import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const WEB_ROOT = path.join(process.cwd(), 'public/NEW_DESIGNS/streetwear');
const MASTER_ROOT = path.join(process.cwd(), 'print-masters/streetwear');
const OUT_ROOT = path.join(process.cwd(), 'public/NEW_DESIGNS/streetwear-art');
const MANIFEST_PATH = path.join(process.cwd(), 'scripts/streetwear-pack-manifest.json');

const SHIRT_SAMPLE_FRACTION = 0.62;
const SHIRT_LUMA_MIN = 0.55;
const SHIRT_SAT_MAX = 0.22;
const SHIRT_MATCH_DELTA = 38;
const BG_LUMA_MAX = 0.08;
const EDGE_FEATHER = 12;

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  }
  return { l, s };
}

function colorDistance(a, b) {
  return Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
}

function estimateShirtColor(data, width, height) {
  const counts = new Map();
  const xMin = Math.floor(width * (0.5 - SHIRT_SAMPLE_FRACTION / 2));
  const xMax = Math.ceil(width * (0.5 + SHIRT_SAMPLE_FRACTION / 2));
  const yMin = Math.floor(height * (0.5 - SHIRT_SAMPLE_FRACTION / 2));
  const yMax = Math.ceil(height * (0.5 + SHIRT_SAMPLE_FRACTION / 2));

  for (let y = yMin; y < yMax; y += 2) {
    for (let x = xMin; x < xMax; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { l, s } = rgbToHsl(r, g, b);
      if (l < SHIRT_LUMA_MIN || s > SHIRT_SAT_MAX) continue;
      const key = `${Math.round(r / 4) * 4},${Math.round(g / 4) * 4},${Math.round(b / 4) * 4}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!best) {
    return { r: 252, g: 250, b: 250 };
  }

  const [r, g, b] = best[0].split(',').map(Number);
  return { r, g, b };
}

async function extractDesignArt(inputPath, outputPath) {
  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const pixels = Buffer.from(data);
  const shirt = estimateShirtColor(pixels, info.width, info.height);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const { l } = rgbToHsl(r, g, b);

    if (l <= BG_LUMA_MAX) {
      pixels[i + 3] = 0;
      continue;
    }

    const dist = colorDistance({ r, g, b }, shirt);
    if (dist <= SHIRT_MATCH_DELTA) {
      pixels[i + 3] = 0;
      continue;
    }

    if (dist <= SHIRT_MATCH_DELTA + EDGE_FEATHER) {
      const fade = (dist - SHIRT_MATCH_DELTA) / EDGE_FEATHER;
      pixels[i + 3] = Math.round(pixels[i + 3] * fade);
    }
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outputPath);

  return { shirt, width: info.width, height: info.height };
}

function resolveInputPath(relativeWebPath) {
  const webPath = path.join(
    process.cwd(),
    'public',
    relativeWebPath.replace(/^\//, '').replace(/\//g, path.sep),
  );
  if (fs.existsSync(webPath)) return webPath;

  const slug = path.basename(relativeWebPath, path.extname(relativeWebPath));
  const collection = relativeWebPath.split('/').slice(-2, -1)[0];
  const masterPath = path.join(MASTER_ROOT, collection, `${slug}.png`);
  if (fs.existsSync(masterPath)) return masterPath;

  return webPath;
}

function toOutputPath(relativeWebPath) {
  const normalized = relativeWebPath.replace(/^\//, '');
  return path.join(
    OUT_ROOT,
    normalized
      .replace(/^NEW_DESIGNS\/streetwear\//, '')
      .replace(/\.webp$/i, '.png'),
  );
}

function toPublicArtPath(relativeWebPath) {
  const normalized = relativeWebPath.replace(/^\//, '');
  return `/${normalized
    .replace(/^NEW_DESIGNS\/streetwear\//, 'NEW_DESIGNS/streetwear-art/')
    .replace(/\.webp$/i, '.png')}`;
}

async function processOne(relativeWebPath, { force }) {
  const inputPath = resolveInputPath(relativeWebPath);
  const outputPath = toOutputPath(relativeWebPath);
  const publicPath = toPublicArtPath(relativeWebPath);

  if (!fs.existsSync(inputPath)) {
    return { publicPath, status: 'missing-input', inputPath };
  }

  if (!force && fs.existsSync(outputPath)) {
    const inputStat = fs.statSync(inputPath);
    const outputStat = fs.statSync(outputPath);
    if (outputStat.mtimeMs >= inputStat.mtimeMs) {
      return { publicPath, status: 'skipped', outputPath };
    }
  }

  const meta = await extractDesignArt(inputPath, outputPath);
  const kb = Math.round(fs.statSync(outputPath).size / 1024);
  return {
    publicPath,
    status: 'processed',
    outputPath,
    kb,
    shirt: meta.shirt,
    size: `${meta.width}x${meta.height}`,
  };
}

async function main() {
  const force = process.argv.includes('--force');
  const slugArg = process.argv.find((arg) => arg.startsWith('--slug='));
  const slugFilter = slugArg ? slugArg.slice('--slug='.length) : null;

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('Missing manifest:', MANIFEST_PATH);
    console.error('Run npm run import:streetwear first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  const items = manifest.items ?? [];
  const targets = slugFilter
    ? items.filter((item) => item.overlayImage?.includes(slugFilter))
    : items;

  let processed = 0;
  let skipped = 0;
  let missing = 0;

  for (const item of targets) {
    if (!item.overlayImage) continue;
    const result = await processOne(item.overlayImage, { force });
    if (result.status === 'processed') {
      processed += 1;
      console.log(
        `OK ${path.basename(result.outputPath)} — ${result.size}, ${result.kb} KB, shirt rgb(${result.shirt.r},${result.shirt.g},${result.shirt.b})`,
      );
    } else if (result.status === 'skipped') {
      skipped += 1;
    } else {
      missing += 1;
      console.warn(`Missing input for ${item.id}: ${result.inputPath}`);
    }
  }

  console.log(
    `\nStreetwear art extraction: processed ${processed}, skipped ${skipped}, missing ${missing}.`,
  );
  console.log(`Output: ${OUT_ROOT}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
