import type { DesignTemplate } from '@/lib/data/catalog';
import type { ResolvedDesignTemplate } from '@/lib/catalog/design-catalog';

/**
 * Gallery / featured card fields only — strip long descriptions and admin
 * metadata so designs/all and homepage ISR payloads stay small.
 */
export type GalleryDesignTemplate = DesignTemplate & {
  nameEn?: string;
  nameMk?: string;
};

export function toGalleryDesignTemplate(
  design: ResolvedDesignTemplate,
): GalleryDesignTemplate {
  return {
    id: design.id,
    category: design.category,
    image: design.image,
    ...(design.galleryImage ? { galleryImage: design.galleryImage } : {}),
    tags: design.tags,
    kind: design.kind,
    ...(design.layoutId ? { layoutId: design.layoutId } : {}),
    ...(design.svgTemplateId ? { svgTemplateId: design.svgTemplateId } : {}),
    ...(design.thumbAspect != null ? { thumbAspect: design.thumbAspect } : {}),
    ...(design.nameEn ? { nameEn: design.nameEn } : {}),
    ...(design.nameMk ? { nameMk: design.nameMk } : {}),
  };
}

export function toGalleryDesignTemplates(
  designs: ResolvedDesignTemplate[],
): GalleryDesignTemplate[] {
  return designs.map(toGalleryDesignTemplate);
}
