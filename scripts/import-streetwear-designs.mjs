import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const SOURCE_ROOT =
  'D:\\Graphic Design Files\\PRINT 8\\GOTOVI DIZAJNI\\STREETWEARGAME\\STREETWEAR';

const WEB_OUT = path.join(process.cwd(), 'public/NEW_DESIGNS/streetwear');
const MASTER_OUT = path.join(process.cwd(), 'print-masters/streetwear');
const CATALOG_OUT = path.join(process.cwd(), 'src/lib/data/streetwear-pack.ts');
const MANIFEST_OUT = path.join(
  process.cwd(),
  'scripts/streetwear-pack-manifest.json',
);

const TARGET_MAX_KB = 400;
const MIN_QUALITY = 58;
const MAX_QUALITY = 88;
const CONCURRENCY = 4;

const COLLECTIONS = [
  {
    folder: 'Basketball',
    slug: 'basketball',
    labelEn: 'Basketball',
    labelMk: 'Кошарка',
  },
  {
    folder: 'japanese Anime',
    slug: 'anime',
    labelEn: 'Japanese Anime',
    labelMk: 'Јапонско Anime',
  },
  {
    folder: 'Streetwear Typography',
    slug: 'typography',
    labelEn: 'Streetwear Typography',
    labelMk: 'Streetwear Typography',
  },
  {
    folder: 'Streetwear2',
    slug: 'streetwear',
    labelEn: 'Streetwear',
    labelMk: 'Streetwear',
  },
];

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function isR2Configured() {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME,
  );
}

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function cleanTitle(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function baseKey(filename) {
  return cleanTitle(filename).toLowerCase();
}

function pickBestPng(files) {
  const pngs = files.filter((file) => /\.png$/i.test(file));
  const grouped = new Map();

  for (const file of pngs) {
    const key = baseKey(path.basename(file));
    const current = grouped.get(key) ?? [];
    current.push(file);
    grouped.set(key, current);
  }

  const picked = [];
  for (const [key, variants] of grouped.entries()) {
    const sorted = [...variants].sort((a, b) => {
      const aAlt = /\(\d+\)/.test(path.basename(a)) ? 1 : 0;
      const bAlt = /\(\d+\)/.test(path.basename(b)) ? 1 : 0;
      if (aAlt !== bAlt) return aAlt - bAlt;
      return fs.statSync(b).size - fs.statSync(a).size;
    });
    picked.push({
      key,
      file: sorted[0],
      title: cleanTitle(path.basename(sorted[0])),
    });
  }

  return picked.sort((a, b) => a.title.localeCompare(b.title));
}

async function optimizeForWeb(inputPath, outputPath) {
  const targetBytes = TARGET_MAX_KB * 1024;
  const metadata = await sharp(inputPath).metadata();
  let maxDim = Math.max(metadata.width ?? 0, metadata.height ?? 0);
  let best = null;

  while (maxDim >= 900) {
    for (let quality = MAX_QUALITY; quality >= MIN_QUALITY; quality -= 4) {
      const buffer = await sharp(inputPath)
        .rotate()
        .resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 6, alphaQuality: quality })
        .toBuffer();

      if (!best || buffer.length < best.size) {
        best = { buffer, quality, maxDim, size: buffer.length };
      }

      if (buffer.length <= targetBytes) {
        best = { buffer, quality, maxDim, size: buffer.length };
        break;
      }
    }

    if (best.size <= targetBytes) break;
    maxDim = Math.floor(maxDim * 0.82);
  }

  if (!best) {
    throw new Error(`Failed to optimize ${inputPath}`);
  }

  fs.writeFileSync(outputPath, best.buffer);
  return best;
}

async function uploadToR2(key, body, contentType, cacheControl) {
  if (!isR2Configured()) return false;
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
  return true;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function tsString(value) {
  return JSON.stringify(value);
}

async function processDesign({ collection, design, index, dryRun, skipR2 }) {
  const id = `tee-sw-${collection.slug}-${String(index).padStart(3, '0')}`;
  const slug = slugify(design.title) || `design-${index}`;
  const webRelative = `NEW_DESIGNS/streetwear/${collection.slug}/${slug}.webp`;
  const webPath = path.join(process.cwd(), 'public', webRelative);
  const masterRelative = `streetwear/${collection.slug}/${slug}.png`;
  const masterPath = path.join(MASTER_OUT, collection.slug, `${slug}.png`);

  if (!dryRun && fs.existsSync(webPath) && fs.existsSync(masterPath)) {
    const sourceStat = fs.statSync(design.file);
    return {
      id,
      collection: collection.slug,
      collectionLabelEn: collection.labelEn,
      collectionLabelMk: collection.labelMk,
      title: design.title,
      overlayImage: `/${webRelative.replace(/\\/g, '/')}`,
      printMasterImage: `masters/${masterRelative}`,
      sourceFile: design.file,
      sourceKb: Math.round(sourceStat.size / 1024),
      skipped: true,
    };
  }

  ensureDir(path.dirname(webPath));
  ensureDir(path.dirname(masterPath));

  const sourceStat = fs.statSync(design.file);
  console.log(
    `[${index}] ${collection.slug} — ${design.title} (${Math.round(sourceStat.size / 1024)} KB)`,
  );

  if (!dryRun) {
    fs.copyFileSync(design.file, masterPath);
    const optimized = await optimizeForWeb(design.file, webPath);
    console.log(
      `    web: ${Math.round(optimized.size / 1024)} KB (q${optimized.quality}, ${optimized.maxDim}px)`,
    );

    if (!skipR2 && isR2Configured()) {
      const masterBody = fs.readFileSync(masterPath);
      const webBody = fs.readFileSync(webPath);
      await uploadToR2(
        `masters/${masterRelative}`,
        masterBody,
        'image/png',
        'private, max-age=31536000',
      );
      await uploadToR2(
        `catalog/${webRelative.replace(/\\/g, '/')}`,
        webBody,
        'image/webp',
        'public, max-age=31536000, immutable',
      );
    }
  }

  return {
    id,
    collection: collection.slug,
    collectionLabelEn: collection.labelEn,
    collectionLabelMk: collection.labelMk,
    title: design.title,
    overlayImage: `/${webRelative.replace(/\\/g, '/')}`,
    printMasterImage: `masters/${masterRelative}`,
    sourceFile: design.file,
    sourceKb: Math.round(sourceStat.size / 1024),
    skipped: false,
  };
}

async function runPool(tasks, concurrency) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const current = cursor;
      cursor += 1;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function main() {
  loadEnv();
  const dryRun = process.argv.includes('--dry-run');
  const skipR2 = process.argv.includes('--skip-r2');

  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error('Source folder not found:', SOURCE_ROOT);
    process.exit(1);
  }

  ensureDir(WEB_OUT);
  ensureDir(MASTER_OUT);

  const items = [];
  let index = 0;
  const tasks = [];

  for (const collection of COLLECTIONS) {
    const sourceDir = path.join(SOURCE_ROOT, collection.folder);
    if (!fs.existsSync(sourceDir)) {
      console.warn('Missing collection folder:', collection.folder);
      continue;
    }

    const files = fs
      .readdirSync(sourceDir)
      .map((name) => path.join(sourceDir, name));
    const designs = pickBestPng(files);

    for (const design of designs) {
      index += 1;
      const currentIndex = index;
      tasks.push(() =>
        processDesign({
          collection,
          design,
          index: currentIndex,
          dryRun,
          skipR2,
        }),
      );
    }
  }

  const results = await runPool(tasks, CONCURRENCY);
  items.push(...results);

  const catalogTs = `import type { ProductDesignTemplate } from '@/lib/data/catalog';

/** Auto-generated from STREETWEAR import — do not edit by hand */
export const streetwearPackTemplates: ProductDesignTemplate[] = [
${items
  .map((item) => {
    return `  {
    id: ${tsString(item.id)},
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['t-shirt', 'hoodie'],
    nameKey: ${tsString(item.id)},
    titleEn: ${tsString(item.title)},
    titleMk: ${tsString(item.title)},
    collection: ${tsString(item.collection)},
    overlayImage: ${tsString(item.overlayImage)},
    printMasterImage: ${tsString(item.printMasterImage)},
    overlayScale: 52,
    overlayPosition: { x: 50, y: 49 },
    overlayByProductType: {
      hoodie: { position: { x: 50, y: 59 }, scale: 41 },
    },
    recommendedColor: '#000000',
    defaultSide: 'front',
  },`;
  })
  .join('\n')}
];
`;

  const manifest = {
    imported: items.length,
    targetMaxKb: TARGET_MAX_KB,
    collections: COLLECTIONS.map((collection) => ({
      slug: collection.slug,
      count: items.filter((item) => item.collection === collection.slug).length,
    })),
    items,
  };

  if (!dryRun) {
    fs.writeFileSync(CATALOG_OUT, catalogTs);
    fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
  }

  console.log(`\nPrepared ${items.length} streetwear overlay designs.`);
  console.log(
    `Skipped existing: ${items.filter((item) => item.skipped).length}, processed: ${items.filter((item) => !item.skipped).length}`,
  );
  if (dryRun) {
    console.log('Dry run only — no files written.');
  } else {
    console.log('Wrote:', CATALOG_OUT);
    console.log('Wrote:', MANIFEST_OUT);
    if (isR2Configured() && !skipR2) {
      console.log('Uploaded masters + web assets to R2.');
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
