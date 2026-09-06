/**
 * Import transparent mug overlays from the approved Desktop batch.
 *
 * Run:
 *   node scripts/process-transparent-mugs-batch.mjs
 *
 * Optional:
 *   TRANSPARENT_MUGS_SRC="C:\path\to\transparent"
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC =
  process.env.TRANSPARENT_MUGS_SRC ??
  path.join(
    process.env.USERPROFILE ?? '',
    'Desktop',
    '19.08.2026 PRINT 8 ODBRANI DIZAJNI',
    'casi',
    'transparent',
  );

const OUT_WEB = path.join(process.cwd(), 'public/NEW_DESIGNS/drinkware');
const OUT_PRINT = path.join(process.cwd(), 'print-masters/drinkware');
const MANIFEST = path.join(process.cwd(), 'scripts/transparent-mugs-manifest.json');
const PACK_OUT = path.join(process.cwd(), 'src/lib/data/transparent-mugs-pack.ts');

const SPOT_MAX = 1200;
const PRINT_MAX = 2400;

async function exportSpot(input, webPath, printPath) {
  const trimmed = await sharp(input).trim({ threshold: 8 }).png().toBuffer();

  await sharp(trimmed)
    .resize(SPOT_MAX, SPOT_MAX, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(webPath);

  await sharp(trimmed)
    .resize(PRINT_MAX, PRINT_MAX, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(printPath);
}

function templateEntry(item) {
  return `  {
    id: '${item.id}',
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['mug', 'cup', 'thermos'],
    nameKey: '${item.nameKey}',
    titleEn: ${JSON.stringify(item.titleEn)},
    titleMk: ${JSON.stringify(item.titleMk)},
    overlayImage: '/NEW_DESIGNS/drinkware/${item.out}',
    printMasterImage: 'masters/drinkware/${item.out}',
    overlayScale: 42,
    overlayPosition: { x: 50, y: 45 },
    recommendedColor: '#ffffff',
    defaultSide: 'front',
    collection: '${item.collection}',
  }`;
}

async function main() {
  const items = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  fs.mkdirSync(OUT_WEB, { recursive: true });
  fs.mkdirSync(OUT_PRINT, { recursive: true });

  const processed = [];

  for (const item of items) {
    const input = path.join(SRC, item.raw);
    if (!fs.existsSync(input)) {
      console.warn(`Skip missing: ${item.raw}`);
      continue;
    }

    const webPath = path.join(OUT_WEB, item.out);
    const printPath = path.join(OUT_PRINT, item.out);
    await exportSpot(input, webPath, printPath);

    const meta = await sharp(webPath).metadata();
    const kb = Math.round(fs.statSync(webPath).size / 1024);
    console.log(`✓ ${item.out} — ${meta.width}×${meta.height}, ${kb} KB`);
    processed.push(item);
  }

  const packSource = `import type { ProductDesignTemplate } from '@/lib/data/catalog';

/** Transparent spot overlays — cozy mugs, kids names, MK gifts (Aug 2026 batch). */
export const transparentMugsPackTemplates: ProductDesignTemplate[] = [
${processed.map(templateEntry).join(',\n')},
];
`;

  fs.writeFileSync(PACK_OUT, packSource, 'utf8');
  console.log(`\nWrote ${processed.length} templates → ${path.relative(process.cwd(), PACK_OUT)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
