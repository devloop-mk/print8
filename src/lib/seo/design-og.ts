import {
  getProductMockup,
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  type ProductDesignTemplate,
  type ProductSide,
  type ProductType,
} from '@/lib/data/catalog';
import type { CouplePackTemplate } from '@/lib/data/couple-pack';
import { partnerDesignToTemplate } from '@/lib/data/couple-pack';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import {
  resolveOverlayColorVariant,
  resolveOverlayPlacementForSide,
  type OverlayPlacement,
} from '@/lib/products/design-overlay';
import { getDesignSides, resolveSideOverlayConfig } from '@/lib/products/design-sides';
import { resolveDesignProduct } from '@/lib/products/garment-fit';
import { absoluteUrl } from '@/lib/seo/site';
import {
  isRemoteAssetUrl,
  toCatalogStoragePath,
} from '@/lib/storage/asset-url';

/**
 * One panel in the design OG compositor (`/api/og/design`).
 * - `image`: already-composited product photo (e.g. mug `kind: 'image'`).
 * - `mockup`: blank product mockup + optional raster overlay + placement %.
 */
export type DesignOgPanel =
  | { kind: 'image'; src: string }
  | {
      kind: 'mockup';
      mockup: string;
      overlay?: string;
      placement: OverlayPlacement;
    };

function isSvgPath(value: string) {
  return /\.svg(\?.*)?$/i.test(value);
}

/**
 * Prefer site-relative `public/` paths so `/api/og/design` reads from disk.
 * Only keep absolute URLs for true remotes that are not our catalog CDN.
 */
function toOgAssetRef(url: string): string {
  if (!url) return url;
  // Drop cache-busting queries so the OG route can read public/ files.
  const withoutQuery = url.split('?')[0] ?? url;
  if (/^https?:/i.test(withoutQuery)) {
    const local = toCatalogStoragePath(withoutQuery);
    if (local.startsWith('/') && !isRemoteAssetUrl(local)) {
      return local.split('?')[0] ?? local;
    }
    return withoutQuery;
  }
  return withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
}

function resolveRasterOverlayUrl(
  design: ProductDesignTemplate,
  side: ProductSide,
  shirtColor: string,
): string | null {
  const config = resolveSideOverlayConfig(design, side);
  if (!config) return null;

  if (config.overlayColorVariants) {
    const variant = resolveOverlayColorVariant(
      {
        overlayColorVariants: config.overlayColorVariants,
        overlayImage: config.overlayImage,
      },
      shirtColor,
    );
    if (variant && !isSvgPath(variant)) {
      return toOgAssetRef(variant);
    }
  }

  const overlayPath = config.overlayImage ?? design.overlayImage;
  if (!overlayPath || isSvgPath(overlayPath)) return null;

  return toOgAssetRef(overlayPath);
}

function buildMockupPanel(
  design: ProductDesignTemplate,
  side: ProductSide,
  preferredType?: ProductType,
): DesignOgPanel | null {
  const product = resolveDesignProduct(design, undefined, preferredType);
  const color = resolveDesignPreviewColor(design, product);
  const mockupPath = getProductMockup(product, color, side);
  if (!mockupPath || isSvgPath(mockupPath)) return null;

  const mockup = toOgAssetRef(mockupPath);
  const placement = resolveOverlayPlacementForSide(design, side, product);
  const overlay = resolveRasterOverlayUrl(design, side, color) ?? undefined;

  return {
    kind: 'mockup',
    mockup,
    overlay,
    placement,
  };
}

/**
 * Resolve OG panels for a product-design PDP so crawlers see garment + art,
 * matching the storefront mockup preview as closely as practical.
 */
export function resolveDesignOgPanels(
  design: ProductDesignTemplate,
  preferredType?: ProductType,
): DesignOgPanel[] {
  // Pre-composited product photos (mugs, etc.) — already product + design.
  if (isImageDesignTemplate(design) && design.image && !isSvgPath(design.image)) {
    return [
      {
        kind: 'image',
        src: toOgAssetRef(design.image),
      },
    ];
  }

  if (!isOverlayDesignTemplate(design) && !design.overlayImage) {
    // Text-only / unknown: still try a blank mockup so OG isn't bare art.
    const panel = buildMockupPanel(
      design,
      design.defaultSide ?? 'front',
      preferredType,
    );
    return panel ? [panel] : [];
  }

  const sides = getDesignSides(design);
  const panels: DesignOgPanel[] = [];

  for (const side of sides) {
    // Cap/apparel OG only needs front+back when dual-sided; skip left/right.
    if (side !== 'front' && side !== 'back') continue;
    const panel = buildMockupPanel(design, side, preferredType);
    if (panel) panels.push(panel);
  }

  // Dual-sided OG shows at most two panels (front + back).
  return panels.slice(0, 2);
}

export function resolveCouplePackOgPanels(
  pack: CouplePackTemplate,
  preferredType?: ProductType,
): DesignOgPanel[] {
  return pack.partnerDesigns
    .map((partner) => {
      const design = partnerDesignToTemplate(pack, partner);
      return buildMockupPanel(
        design,
        design.defaultSide ?? 'front',
        preferredType ?? pack.productTypes[0],
      );
    })
    .filter((panel): panel is DesignOgPanel => Boolean(panel))
    .slice(0, 2);
}

/**
 * Build `/api/og/design?...` URL for one or two panels (mockup+overlay or
 * pre-composited image). Always absolute + production-safe via `absoluteUrl`.
 */
export function buildDesignOgImageUrl(panels: DesignOgPanel[]) {
  const search = new URLSearchParams();

  panels.slice(0, 2).forEach((panel, index) => {
    if (panel.kind === 'image') {
      search.set(`i${index}`, panel.src);
      return;
    }

    search.set(`m${index}`, panel.mockup);
    if (panel.overlay) search.set(`o${index}`, panel.overlay);
    search.set(`x${index}`, String(panel.placement.position.x));
    search.set(`y${index}`, String(panel.placement.position.y));
    search.set(`s${index}`, String(panel.placement.scale));
  });

  return absoluteUrl(`/api/og/design?${search.toString()}`);
}
