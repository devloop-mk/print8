import type { DesignTemplate } from '@/lib/data/catalog';
import { getDesignLayout } from '@/lib/data/design-layouts';
import { getSvgDesignTemplate } from '@/lib/data/svg-design-templates';
import type { ManagedSvgTemplateDefaultsPayload } from '@/lib/db/managed-svg-templates';
import { hasManagedSvgDefaults } from '@/lib/designs/merge-svg-template-defaults';

export const DESIGN_GALLERY_THUMB_DIR = '/NEW_DESIGNS/gallery-thumbs';

/** Bump when gallery mockup WebPs change so CDN/browser refetch (production uses R2). */
export const GALLERY_THUMB_CACHE_VERSION =
  process.env.NEXT_PUBLIC_GALLERY_THUMB_VERSION ?? '20260806-mockups-v2';

export function getDesignGalleryThumbPath(designId: string): string {
  return `${DESIGN_GALLERY_THUMB_DIR}/${designId}.webp`;
}

export function getDesignThumbAspect(design: DesignTemplate): number {
  if (design.thumbAspect) return design.thumbAspect;
  if (design.svgTemplateId) {
    return getSvgDesignTemplate(design.svgTemplateId)?.aspectRatio ?? 4 / 3;
  }
  if (design.layoutId) {
    return getDesignLayout(design.layoutId)?.aspectRatio ?? 4 / 3;
  }
  return 4 / 3;
}

export function fitDesignThumbSize(
  containerWidth: number,
  containerHeight: number,
  aspectRatio: number,
  padding = 0,
) {
  const availW = Math.max(containerWidth - padding, 1);
  const availH = Math.max(containerHeight - padding, 1);

  let width = availW;
  let height = width / aspectRatio;

  if (height > availH) {
    height = availH;
    width = height * aspectRatio;
  }

  return { width, height };
}

/** Pre-rendered WebP gallery thumb for catalog listings (avoids live SVG). */
export function getDesignGalleryImage(
  design: DesignTemplate,
  options?: { thumbVersion?: string },
): string | undefined {
  const version = options?.thumbVersion ?? GALLERY_THUMB_CACHE_VERSION;
  const withVersion = (base: string) =>
    version ? `${base}?v=${encodeURIComponent(version)}` : base;

  if (design.svgTemplateId) {
    return withVersion(getDesignGalleryThumbPath(design.id));
  }
  if (design.galleryImage) return design.galleryImage;
  if (design.image && !design.image.toLowerCase().endsWith('.svg')) {
    return design.image;
  }
  if (design.layoutId) {
    return withVersion(getDesignGalleryThumbPath(design.id));
  }
  return undefined;
}

export function shouldUseGalleryRasterPreview(
  design: DesignTemplate,
  previewMode: 'static' | 'live' | 'lazy' = 'lazy',
  svgDefaultsMap?: Record<string, ManagedSvgTemplateDefaultsPayload>,
  thumbVersions?: Record<string, string>,
): boolean {
  if (previewMode === 'live') return false;
  if (!getDesignGalleryImage(design)) return false;

  if (
    design.svgTemplateId &&
    hasManagedSvgDefaults(svgDefaultsMap?.[design.svgTemplateId])
  ) {
    return Boolean(thumbVersions?.[design.svgTemplateId]);
  }

  return true;
}
