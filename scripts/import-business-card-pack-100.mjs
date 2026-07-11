import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SOURCE_ROOT =
  'D:\\Graphic Design Files\\PRINT 8\\GOTOVI DIZAJNI\\100 businesscard';
const PUBLIC_OUT = path.join(
  process.cwd(),
  'public/NEW_DESIGNS/business-cards/pack-100',
);
const CATALOG_OUT = path.join(
  process.cwd(),
  'src/lib/data/business-card-pack-100.ts',
);
const EN_MESSAGES = path.join(process.cwd(), 'messages/en.json');
const MK_MESSAGES = path.join(process.cwd(), 'messages/mk.json');

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 82;
const TARGET_MAX_KB = 500;

const MK_STYLE = {
  Photography: 'Фотографија',
  Minimal: 'Минималистичка',
  'Real Estate': 'Недвижности',
  Law: 'Право',
  Spa: 'Спа и салон',
  Vintage: 'Винтаж',
  'B&W': 'Црно-бела',
  'Rent a car': 'Рент а кар',
  social: 'Социјални мрежи',
  'minimal-b': 'Минималистичка',
};

function slugify(num) {
  return `bcard-100-${String(num).padStart(3, '0')}`;
}

function parseFolderNumber(folderName) {
  const match = folderName.match(/Business Card\s+(\d+)/i);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function displayNameFromFolder(folderName) {
  const base = folderName.replace(/^Business Card\s+/i, '').trim();
  if (!base || /^\d+$/.test(base)) {
    const num = parseFolderNumber(folderName);
    return `Business Card ${num}`;
  }
  const num = parseFolderNumber(folderName);
  const suffix = base.replace(/^\d+\s*-\s*/, '').trim();
  return suffix ? `Business Card ${num} — ${suffix}` : `Business Card ${num}`;
}

function mkNameFromFolder(folderName) {
  const en = displayNameFromFolder(folderName);
  const num = parseFolderNumber(folderName);
  const suffixMatch = folderName.match(/Business Card\s+\d+\s*-\s*(.+)$/i);
  if (!suffixMatch) return `Визит картичка ${num}`;
  const suffix = suffixMatch[1].trim();
  const mkSuffix = MK_STYLE[suffix] ?? suffix;
  return `Визит картичка ${num} — ${mkSuffix}`;
}

function pickPreviewFile(files) {
  const images = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png'].includes(ext);
  });

  const usable = images.filter(
    (file) => !/banner|customization/i.test(path.basename(file)),
  );
  if (usable.length === 0) return null;

  const withoutAlt = usable.filter((file) => {
    const base = path.basename(file).toLowerCase();
    return !/-1\.(jpe?g|png)$/.test(base) && !/\d+-1\.(jpe?g|png)$/.test(base);
  });

  const pool = withoutAlt.length > 0 ? withoutAlt : usable;
  const front = pool.find((file) => /front/i.test(path.basename(file)));
  return front ?? pool[0];
}

function categorize(folderName, previewName) {
  const text = `${folderName} ${previewName}`.toLowerCase();
  const tags = new Set();

  if (/minimal|flat/.test(text)) {
    tags.add('minimal');
    tags.add('modern');
  }
  if (/photography|photo/.test(text)) tags.add('photography');
  if (/real estate/.test(text)) tags.add('real-estate');
  if (/corporate|clean corporate/.test(text)) tags.add('corporate');
  if (/\blaw\b/.test(text)) tags.add('law');
  if (/spa|salon/.test(text)) tags.add('spa');
  if (/vintage/.test(text)) tags.add('vintage');
  if (/black|b&w|b\&w/.test(text)) tags.add('black-white');
  if (/rent a car|auto business/.test(text)) tags.add('automotive');
  if (/social/.test(text)) tags.add('social');
  if (/blue business/.test(text)) tags.add('modern');
  if (/creative/.test(text)) tags.add('creative');

  if (tags.size === 0) tags.add('creative');

  return [...tags];
}

async function exportPreview(sourceFile, destFile) {
  let pipeline = sharp(sourceFile).rotate().resize(MAX_DIMENSION, MAX_DIMENSION, {
    fit: 'inside',
    withoutEnlargement: true,
  });

  let quality = JPEG_QUALITY;
  let buffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

  while (buffer.length > TARGET_MAX_KB * 1024 && quality > 55) {
    quality -= 5;
    buffer = await sharp(sourceFile)
      .rotate()
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  fs.writeFileSync(destFile, buffer);
  return buffer.length;
}

function patchJsonTemplates(filePath, entries) {
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  json.designs.templates = {
    ...json.designs.templates,
    ...entries,
  };
  fs.writeFileSync(filePath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
}

async function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    throw new Error(`Source folder not found: ${SOURCE_ROOT}`);
  }

  fs.mkdirSync(PUBLIC_OUT, { recursive: true });

  const folders = fs
    .readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => parseFolderNumber(a) - parseFolderNumber(b));

  if (folders.length !== 100) {
    console.warn(`Expected 100 folders, found ${folders.length}`);
  }

  const templates = [];
  const enNames = {};
  const mkNames = {};
  const stats = { categories: {} };

  for (const folder of folders) {
    const num = parseFolderNumber(folder);
    const id = slugify(num);
    const dirPath = path.join(SOURCE_ROOT, folder);
    const files = fs
      .readdirSync(dirPath)
      .map((name) => path.join(dirPath, name));
    const preview = pickPreviewFile(files);

    if (!preview) {
      console.warn(`Skipping ${folder}: no preview image`);
      continue;
    }

    const dest = path.join(PUBLIC_OUT, `${id}.jpg`);
    const bytes = await exportPreview(preview, dest);
    const tags = categorize(folder, path.basename(preview));

    for (const tag of tags) {
      stats.categories[tag] = (stats.categories[tag] ?? 0) + 1;
    }

    templates.push({
      id,
      num,
      folder,
      image: `/NEW_DESIGNS/business-cards/pack-100/${id}.jpg`,
      tags,
      previewSource: path.basename(preview),
      bytes,
    });

    enNames[id] = displayNameFromFolder(folder);
    mkNames[id] = mkNameFromFolder(folder);
  }

  const ts = `import type { DesignTemplate } from '@/lib/data/catalog';

/** Ready-made business card pack (100 templates) — preview JPGs from local PSD pack */
export const businessCardPack100Templates: DesignTemplate[] = [
${templates
  .map(
    (item) => `  {
    id: '${item.id}',
    category: 'business-cards',
    image: '${item.image}',
    tags: [${item.tags.map((tag) => `'${tag}'`).join(', ')}],
    kind: 'fixed',
    thumbAspect: 1.75,
  },`,
  )
  .join('\n')}
];
`;

  fs.writeFileSync(CATALOG_OUT, ts, 'utf8');
  patchJsonTemplates(EN_MESSAGES, enNames);
  patchJsonTemplates(MK_MESSAGES, mkNames);

  const manifest = {
    imported: templates.length,
    categories: stats.categories,
    items: templates.map((item) => ({
      id: item.id,
      folder: item.folder,
      tags: item.tags,
      preview: item.previewSource,
      kb: Math.round(item.bytes / 1024),
    })),
  };

  fs.writeFileSync(
    path.join(process.cwd(), 'scripts/business-card-pack-100-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  );

  console.log(`Imported ${templates.length} business card designs`);
  console.log('Categories:', stats.categories);
  console.log(`Images -> ${PUBLIC_OUT}`);
  console.log(`Catalog -> ${CATALOG_OUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
