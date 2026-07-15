import type {
  Product,
  ProductDesignSideOverlay,
  ProductDesignTemplate,
  ProductSide,
} from '@/lib/data/catalog';

export type DesignSideMode = 'front' | 'back' | 'both';

/** Sides that have pre-made artwork. Defaults to [defaultSide]. */
export function getDesignSides(template: ProductDesignTemplate): ProductSide[] {
  if (template.designSides?.length) {
    return template.designSides;
  }
  return [template.defaultSide];
}

export function isDualSidedDesign(template: ProductDesignTemplate): boolean {
  const sides = getDesignSides(template);
  return sides.includes('front') && sides.includes('back');
}

export function getDesignSideMode(template: ProductDesignTemplate): DesignSideMode {
  const sides = getDesignSides(template);
  if (sides.includes('front') && sides.includes('back')) return 'both';
  if (sides.includes('back')) return 'back';
  return 'front';
}

export function designSideModeToConfig(mode: DesignSideMode): {
  defaultSide: ProductSide;
  designSides: ProductSide[];
} {
  switch (mode) {
    case 'back':
      return { defaultSide: 'back', designSides: ['back'] };
    case 'both':
      return { defaultSide: 'front', designSides: ['front', 'back'] };
    default:
      return { defaultSide: 'front', designSides: ['front'] };
  }
}

/** Overlay fields for a specific side (front uses main template fields). */
export function resolveSideOverlayConfig(
  template: ProductDesignTemplate,
  side: ProductSide,
): ProductDesignSideOverlay | null {
  if (side === 'back' && template.backOverlay) {
    return template.backOverlay;
  }

  if (side !== template.defaultSide && !getDesignSides(template).includes(side)) {
    return null;
  }

  if (side === 'back' && getDesignSideMode(template) === 'back') {
    return {
      overlayImage: template.overlayImage,
      overlaySvg: template.overlaySvg,
      overlayRecolor: template.overlayRecolor,
      overlayColorVariants: template.overlayColorVariants,
      overlayScale: template.overlayScale,
      overlayPosition: template.overlayPosition,
      overlayByProductType: template.overlayByProductType,
    };
  }

  if (side === 'front' || (side === template.defaultSide && side !== 'back')) {
    return {
      overlayImage: template.overlayImage,
      overlaySvg: template.overlaySvg,
      overlayRecolor: template.overlayRecolor,
      overlayColorVariants: template.overlayColorVariants,
      overlayScale: template.overlayScale,
      overlayPosition: template.overlayPosition,
      overlayByProductType: template.overlayByProductType,
    };
  }

  return template.backOverlay ?? null;
}

export function sideHasPremadeArt(
  template: ProductDesignTemplate,
  side: ProductSide,
): boolean {
  if (!getDesignSides(template).includes(side)) return false;

  if (template.kind === 'text') return Boolean(template.textStyle);
  if (template.kind === 'image') return Boolean(template.image);

  const config = resolveSideOverlayConfig(template, side);
  if (!config) return false;

  return Boolean(
    config.overlayImage ||
      config.overlaySvg ||
      (config.overlayColorVariants &&
        Object.keys(config.overlayColorVariants).length > 0),
  );
}

export function designMatchesSideFilter(
  template: ProductDesignTemplate,
  side: ProductSide | 'all',
): boolean {
  if (side === 'all') return true;
  return getDesignSides(template).includes(side);
}

export function getInitialCustomizerSide(template: ProductDesignTemplate): ProductSide {
  return template.defaultSide;
}
