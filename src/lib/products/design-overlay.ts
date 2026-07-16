import type {
  Product,
  ProductDesignSideOverlay,
  ProductDesignTemplate,
  ProductSide,
  ProductType,
} from '@/lib/data/catalog';
import { resolveSideOverlayConfig } from '@/lib/products/design-sides';
import { resolveAssetUrl, resolveMasterAssetUrl } from '@/lib/storage/asset-url';
import { sanitizeCssHexColor } from '@/lib/security/sanitize-svg';

export type OverlaySvgColors = {
  primary: string;
  secondary?: string;
};

export type OverlayPlacement = {
  position: { x: number; y: number };
  scale: number;
};

const DEFAULT_OVERLAY_POSITION = { x: 50, y: 54 };
/** Default width % — kept under t-shirt print-area width (~47%). */
const DEFAULT_OVERLAY_SCALE = 40;

export function resolveOverlayPlacement(
  template: Pick<
    ProductDesignTemplate,
    'overlayPosition' | 'overlayScale' | 'overlayByProductType'
  >,
  productOrType: Product | ProductType,
): OverlayPlacement {
  const productType =
    typeof productOrType === 'string' ? productOrType : productOrType.type;

  const base: OverlayPlacement = {
    position: template.overlayPosition ?? DEFAULT_OVERLAY_POSITION,
    scale: template.overlayScale ?? DEFAULT_OVERLAY_SCALE,
  };

  const typeOverride = template.overlayByProductType?.[productType];
  if (!typeOverride) return base;

  return {
    position: typeOverride.position ?? base.position,
    scale: typeOverride.scale ?? base.scale,
  };
}

export function resolveSideOverlayPlacement(
  config: Pick<
    ProductDesignSideOverlay,
    'overlayPosition' | 'overlayScale' | 'overlayByProductType'
  >,
  productOrType: Product | ProductType,
): OverlayPlacement {
  const productType =
    typeof productOrType === 'string' ? productOrType : productOrType.type;

  const base: OverlayPlacement = {
    position: config.overlayPosition ?? DEFAULT_OVERLAY_POSITION,
    scale: config.overlayScale ?? DEFAULT_OVERLAY_SCALE,
  };

  const typeOverride = config.overlayByProductType?.[productType];
  if (!typeOverride) return base;

  return {
    position: typeOverride.position ?? base.position,
    scale: typeOverride.scale ?? base.scale,
  };
}

export function resolveOverlayPlacementForSide(
  template: ProductDesignTemplate,
  side: ProductSide,
  productOrType: Product | ProductType,
): OverlayPlacement {
  const config = resolveSideOverlayConfig(template, side);
  if (config) {
    return resolveSideOverlayPlacement(config, productOrType);
  }
  return resolveOverlayPlacement(template, productOrType);
}

export function normalizeHex(hex: string): string {
  const value = hex.trim().toLowerCase();
  if (!value.startsWith('#')) return `#${value}`;
  return value.length === 4
    ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`
    : value;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = normalizeHex(hex).slice(1);
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6);

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

const LIGHT_INK = '#F4EDE4';
const DARK_INK = '#1C1917';

export function isDarkShirtColor(shirtColor: string): boolean {
  return relativeLuminance(shirtColor) < 0.35;
}

export function suggestInkForShirt(shirtColor: string): string {
  return isDarkShirtColor(shirtColor) ? LIGHT_INK : DARK_INK;
}

export function ensureInkContrast(ink: string, shirtColor: string): string {
  if (contrastRatio(ink, shirtColor) >= 2.8) return ink;
  return suggestInkForShirt(shirtColor);
}

export function inksHaveLowContrast(ink: string, shirtColor: string): boolean {
  return contrastRatio(ink, shirtColor) < 2.8;
}

export function applySvgInkColors(
  svgText: string,
  colors: OverlaySvgColors,
): string {
  const primary = sanitizeCssHexColor(colors.primary);
  const secondary = sanitizeCssHexColor(
    colors.secondary ?? colors.primary,
    primary,
  );
  const styleBlock = `<style>:root,svg{--ink-primary:${primary};--ink-secondary:${secondary}}</style>`;

  if (svgText.includes('--ink-primary')) {
    return svgText
      .replace(/--ink-primary:\s*[^;}"']+/g, `--ink-primary:${primary}`)
      .replace(/--ink-secondary:\s*[^;}"']+/g, `--ink-secondary:${secondary}`);
  }

  if (svgText.includes('<defs>')) {
    return svgText.replace('<defs>', `<defs>${styleBlock}`);
  }

  return svgText.replace(/<svg([^>]*)>/i, `<svg$1>${styleBlock}`);
}

export async function fetchRecoloredSvgBlobUrl(
  svgPath: string,
  colors: OverlaySvgColors,
): Promise<string> {
  const response = await fetch(svgPath);
  const svgText = await response.text();
  const tinted = applySvgInkColors(svgText, colors);
  const blob = new Blob([tinted], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

function pickOverlayColorVariantRaw(
  template: Pick<ProductDesignTemplate, 'overlayColorVariants' | 'overlayImage'>,
  shirtColor: string,
): string | null {
  if (!template.overlayColorVariants) {
    return template.overlayImage ?? null;
  }

  const normalized = normalizeHex(shirtColor);
  const direct = template.overlayColorVariants[normalized];
  if (direct) return direct;

  const shirtLum = relativeLuminance(normalized);
  const darkFallback =
    template.overlayColorVariants['#000000'] ??
    template.overlayColorVariants['#1f2937'];
  const lightFallback = template.overlayColorVariants['#ffffff'];

  if (shirtLum < 0.35 && darkFallback) return darkFallback;
  if (shirtLum >= 0.35 && lightFallback) return lightFallback;

  return template.overlayImage ?? Object.values(template.overlayColorVariants)[0] ?? null;
}

export function resolveOverlayColorVariant(
  template: Pick<ProductDesignTemplate, 'overlayColorVariants' | 'overlayImage'>,
  shirtColor: string,
): string | null {
  return resolveComposableOverlayUrl(
    pickOverlayColorVariantRaw(template, shirtColor),
  );
}

/** Streetwear web previews are full-shirt mockups with a baked-in garment color. */
export function isMarketingShirtMockupOverlay(path: string | undefined): boolean {
  if (!path) return false;
  if (path.includes('/NEW_DESIGNS/streetwear/') && path.endsWith('.webp')) {
    return true;
  }
  if (path.includes('/masters/streetwear/') && path.endsWith('.png')) {
    return true;
  }
  return false;
}

/** Streetwear catalog webp — marketing preview, not the print overlay. */
export function isStreetwearMarketingOverlay(
  path: string | undefined,
): boolean {
  return Boolean(
    path &&
      path.includes('/NEW_DESIGNS/streetwear/') &&
      path.endsWith('.webp'),
  );
}

/**
 * Raw overlay artwork URL. Prefers the original print master PNG.
 */
export function resolveComposableOverlayUrl(
  path: string | null | undefined,
): string | null {
  if (!path) return null;

  const normalized = path.replace(/^\//, '');
  if (normalized.startsWith('masters/')) {
    if (!arePrintMasterAssetsAvailable()) return null;
    return resolveMasterAssetUrl(path);
  }

  if (
    normalized.includes('NEW_DESIGNS/streetwear-art/') ||
    isStreetwearMarketingOverlay(`/${normalized}`)
  ) {
    return null;
  }

  return resolveAssetUrl(path);
}

/**
 * True when transparent print masters can be loaded (local /api/masters in
 * development, or CDN in production). Masters are ~GB and are not shipped in
 * the Vercel bundle.
 */
export function arePrintMasterAssetsAvailable(): boolean {
  if (process.env.NEXT_PUBLIC_ASSETS_CDN_URL?.replace(/\/$/, '')) {
    return true;
  }
  return process.env.NODE_ENV === 'development';
}

/** Full-shirt streetwear webp used when masters are not hosted. */
export function getStreetwearMarketingMockupUrl(
  design: Pick<ProductDesignTemplate, 'overlayImage'>,
): string | null {
  if (!design.overlayImage || !isStreetwearMarketingOverlay(design.overlayImage)) {
    return null;
  }
  return resolveAssetUrl(design.overlayImage);
}

/**
 * Design PNG layered on the selectable shirt mockup — original print master only.
 * Returns null in production without CDN so callers can fall back to marketing mockups.
 */
export function getDesignCompositeOverlayUrl(
  design: Pick<
    ProductDesignTemplate,
    'printMasterImage' | 'overlayImage' | 'overlaySvg'
  >,
): string | null {
  if (design.printMasterImage && arePrintMasterAssetsAvailable()) {
    return resolveMasterAssetUrl(design.printMasterImage);
  }

  if (design.overlayImage && !isStreetwearMarketingOverlay(design.overlayImage)) {
    return resolveAssetUrl(design.overlayImage);
  }

  return null;
}

export function isRecolorableOverlayTemplate(
  template: ProductDesignTemplate,
): boolean {
  return Boolean(template.overlaySvg && template.overlayRecolor);
}

export function hasOverlayColorVariants(
  template: ProductDesignTemplate,
): boolean {
  return Boolean(
    template.overlayColorVariants &&
      Object.keys(template.overlayColorVariants).length > 0,
  );
}

/** Static artwork URL for catalog cards, search thumbs, etc. */
export function getProductDesignThumbnail(
  template: ProductDesignTemplate,
  shirtColor?: string,
): string | undefined {
  if (template.image) return resolveAssetUrl(template.image);

  if (shirtColor) {
    const variant = resolveOverlayColorVariant(template, shirtColor);
    if (variant) return variant;
  }

  if (template.overlayImage) return template.overlayImage;

  if (template.overlayColorVariants) {
    const recommended = template.recommendedColor
      ? template.overlayColorVariants[template.recommendedColor]
      : undefined;
    if (recommended) return recommended;

    const values = Object.values(template.overlayColorVariants);
    if (values.length > 0) return values[0];
  }

  if (template.overlaySvg) return template.overlaySvg;

  return undefined;
}
