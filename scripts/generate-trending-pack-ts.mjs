/**
 * Generate src/lib/data/trending-collections-pack.ts from manifest.
 * Run: node scripts/generate-trending-pack-ts.mjs
 */
import fs from 'fs';
import path from 'path';

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'scripts/trending-collections-manifest.json'),
    'utf8',
  ),
);

const header = `import type { ProductDesignTemplate } from '@/lib/data/catalog';

const OVERLAY_BASE = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
  overlayByProductType: {
    hoodie: { scale: 33, position: { x: 50, y: 59 } },
  },
  recommendedColor: '#1C1A1D',
  applicableFits: ['unisex', 'women'] as const,
  defaultSide: 'front' as const,
  kind: 'overlay' as const,
  category: 'image-designs' as const,
  productTypes: ['t-shirt', 'hoodie'] as const,
};

`;

const chunks = manifest.collections.map((col) => {
  const items = col.items
    .map(
      (item) =>
        `    { id: '${item.id}', file: '${item.out}.png', titleEn: '${item.titleEn.replace(/'/g, "\\'")}', titleMk: '${item.titleMk.replace(/'/g, "\\'")}' },`,
    )
    .join('\n');

  return `const ${col.packId}Items = [\n${items}\n];

export const ${col.packId}PackTemplates: ProductDesignTemplate[] = ${col.packId}Items.map((item) => ({
  id: \`${col.prefix}-\${item.id}\`,
  nameKey: \`${col.prefix}-\${item.id}\`,
  titleEn: item.titleEn,
  titleMk: item.titleMk,
  overlayImage: \`/NEW_DESIGNS/${col.slug}/\${item.file}\`,
  printMasterImage: \`masters/${col.slug}/\${item.file}\`,
  collection: '${col.slug}',
  ...OVERLAY_BASE,
  productTypes: [...OVERLAY_BASE.productTypes],
  applicableFits: [...OVERLAY_BASE.applicableFits],
}));
`;
});

const exports = manifest.collections
  .map((col) => `  ...${col.packId}PackTemplates,`)
  .join('\n');

const footer = `\nexport const trendingCollectionsPackTemplates: ProductDesignTemplate[] = [\n${exports}\n];\n`;

const out = header + chunks.join('\n\n') + footer;
const outPath = path.join(process.cwd(), 'src/lib/data/trending-collections-pack.ts');
fs.writeFileSync(outPath, out);
console.log(`Wrote ${outPath}`);
