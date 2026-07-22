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
import { resolveMockupDisplayScale } from '@/lib/products/product-mockup-layout';
import { getDesignSides, resolveSideOverlayConfig } from '@/lib/products/design-sides';
import { resolveDesignProduct } from '@/lib/products/garment-fit';
import { absoluteUrl } from '@/lib/seo/site';
import { resolveAssetUrl } from '@/lib/storage/asset-url';

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
      /** Same zoom as PDP `getMockupImageDisplayStyle(..., 'customizer')`. */
      displayScale?: number;
    };

function isSvgPath(value: string) {
  return /\.svg(\?.*)?$/i.test(value);
}

/**
 * OG compositor runs in a serverless function where `public/**` is excluded
 * from the file trace — `readFile(public/...)` usually fails in production.
 * Always emit an absolute, HTTP-fetchable URL:
 * - CDN via `resolveAssetUrl` when configured (R2 catalog assets)
 * - otherwise the site origin (Vercel still serves `public/` as static files)
 */
export function toOgAssetRef(url: string): string {
  if (!url) return url;
  // Drop cache-busting queries (`?v=3`) — not needed for OG fetches.
  const withoutQuery = url.split('?')[0] ?? url;
  if (/^https?:/i.test(withoutQuery)) {
    return withoutQuery;
  }
  const normalized = withoutQuery.startsWith('/')
    ? withoutQuery
    : `/${withoutQuery}`;
  const resolved = resolveAssetUrl(normalized);
  if (/^https?:/i.test(resolved)) {
    return resolved.split('?')[0] ?? resolved;
  }
  return absoluteUrl(normalized);
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
  // Match DesignTemplatePreview's customizer zoom so landscape mockups crop
  // the same way as the PDP (shirt + overlay scale together from center).
  const displayScale = resolveMockupDisplayScale(
    product,
    mockupPath,
    'customizer',
  );

  return {
    kind: 'mockup',
    mockup,
    overlay,
    placement,
    displayScale,
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

/**
 * Couple OG panels. Pass merged partner templates (admin placement) when
 * available so OG matches the PDP; otherwise falls back to static pack data.
 */
export function resolveCouplePackOgPanels(
  pack: CouplePackTemplate,
  preferredType?: ProductType,
  partnerTemplates?: [
    ProductDesignTemplate | null | undefined,
    ProductDesignTemplate | null | undefined,
  ],
): DesignOgPanel[] {
  return pack.partnerDesigns
    .map((partner, index) => {
      const design =
        partnerTemplates?.[index] ?? partnerDesignToTemplate(pack, partner);
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
 * Panel asset paths are normalized to absolute CDN/site URLs so the route can
 * fetch them (serverless has no reliable `public/` disk access).
 */
export function buildDesignOgImageUrl(panels: DesignOgPanel[]) {
  const search = new URLSearchParams();

  panels.slice(0, 2).forEach((panel, index) => {
    if (panel.kind === 'image') {
      search.set(`i${index}`, toOgAssetRef(panel.src));
      return;
    }

    search.set(`m${index}`, toOgAssetRef(panel.mockup));
    if (panel.overlay) search.set(`o${index}`, toOgAssetRef(panel.overlay));
    search.set(`x${index}`, String(panel.placement.position.x));
    search.set(`y${index}`, String(panel.placement.position.y));
    search.set(`s${index}`, String(panel.placement.scale));
    if (
      panel.displayScale != null &&
      Number.isFinite(panel.displayScale) &&
      panel.displayScale > 0 &&
      panel.displayScale !== 1
    ) {
      search.set(`z${index}`, String(panel.displayScale));
    }
  });

  return absoluteUrl(`/api/og/design?${search.toString()}`);
}
