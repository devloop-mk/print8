import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import {
  getProductMockup,
  isOverlayDesignTemplate,
  productDesignTemplates,
  products,
  type ProductDesignTemplate,
} from '../src/lib/data/catalog';
import { resolveDesignPreviewColor } from '../src/lib/products/design-applicable-colors';
import { resolveOverlayPlacement } from '../src/lib/products/design-overlay';
import { DEFAULT_TRENDING_PRODUCT_DESIGN_IDS } from '../src/lib/data/trending-designs';

const OUT_DIR = path.join(process.cwd(), 'public/home/trending-thumbs');
const SIZE = 640;

function resolveTrendingProduct(design: ProductDesignTemplate) {
  return (
    products.find(
      (item) =>
        design.productTypes.includes(item.type) &&
        (!design.productIds || design.productIds.includes(item.id)),
    ) ?? products.find((item) => item.id === 'tshirt-basic-white')
  );
}

function publicPath(assetPath: string) {
  const normalized = assetPath.replace(/^\//, '');
  return path.join(process.cwd(), 'public', normalized);
}

async function resolveOverlayPath(
  design: ProductDesignTemplate,
  shirtColor: string,
): Promise<string | null> {
  if (design.overlayImage) {
    if (design.overlayColorVariants) {
      const variant =
        design.overlayColorVariants[shirtColor] ??
        design.overlayColorVariants[shirtColor.toLowerCase()] ??
        design.overlayImage;
      return publicPath(variant);
    }
    return publicPath(design.overlayImage);
  }
  return null;
}

async function renderThumbnail(design: ProductDesignTemplate) {
  const product = resolveTrendingProduct(design);
  if (!product) {
    console.warn(`Skip ${design.id} — no product`);
    return;
  }

  const color = resolveDesignPreviewColor(design, product);
  const mockupSrc = getProductMockup(product, color, design.defaultSide ?? 'front');
  const mockupPath = publicPath(mockupSrc);

  if (!fs.existsSync(mockupPath)) {
    console.warn(`Skip ${design.id} — missing mockup ${mockupPath}`);
    return;
  }

  const outPath = path.join(OUT_DIR, `${design.id}.webp`);

  if (!isOverlayDesignTemplate(design)) {
    const imagePath = design.image ? publicPath(design.image) : mockupPath;
    await sharp(imagePath)
      .resize(SIZE, SIZE, { fit: 'contain', background: '#ffffff' })
      .webp({ quality: 82 })
      .toFile(outPath);
    console.log(`OK ${design.id} (image)`);
    return;
  }

  const overlayPath = await resolveOverlayPath(design, color);
  if (!overlayPath || !fs.existsSync(overlayPath)) {
    console.warn(`Skip ${design.id} — missing overlay ${overlayPath}`);
    return;
  }

  const placement = resolveOverlayPlacement(design, product);
  const mockupResized = await sharp(mockupPath)
    .resize(Math.round(SIZE * 0.92), Math.round(SIZE * 0.92), { fit: 'inside' })
    .toBuffer();
  const mockupMeta = await sharp(mockupResized).metadata();
  const mockupWidth = mockupMeta.width ?? SIZE;
  const mockupHeight = mockupMeta.height ?? SIZE;
  const mockupLeft = Math.round((SIZE - mockupWidth) / 2);
  const mockupTop = Math.round((SIZE - mockupHeight) / 2);

  // Position overlay relative to the mockup box (same % model as CSS previews).
  const overlayWidth = Math.max(
    1,
    Math.round((mockupWidth * placement.scale) / 100),
  );
  const overlayResized = await sharp(overlayPath)
    .resize(overlayWidth)
    .toBuffer();
  const overlayMeta = await sharp(overlayResized).metadata();
  const overlayLeft = Math.round(
    mockupLeft +
      (mockupWidth * placement.position.x) / 100 -
      (overlayMeta.width ?? 0) / 2,
  );
  const overlayTop = Math.round(
    mockupTop +
      (mockupHeight * placement.position.y) / 100 -
      (overlayMeta.height ?? 0) / 2,
  );

  await sharp({
    create: {
      width: SIZE,
      height: SIZE,
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite([
      { input: mockupResized, left: mockupLeft, top: mockupTop },
      { input: overlayResized, left: overlayLeft, top: overlayTop },
    ])
    .webp({ quality: 82 })
    .toFile(outPath);

  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(`OK ${design.id} — ${kb} KB`);
}

async function main() {
  const ids = process.argv.slice(2);
  const targetIds =
    ids.length > 0 ? ids : [...DEFAULT_TRENDING_PRODUCT_DESIGN_IDS];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const byId = new Map(productDesignTemplates.map((design) => [design.id, design]));

  for (const id of targetIds) {
    const design = byId.get(id);
    if (!design) {
      console.warn(`Skip ${id} — design not found`);
      continue;
    }
    await renderThumbnail(design);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
