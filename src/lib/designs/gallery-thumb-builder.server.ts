import 'server-only';

export {
  findDesignIdsForSvgTemplateId,
  isGalleryThumbFreshForTemplate,
  type GalleryThumbMeta,
} from '@/lib/designs/gallery-thumb-meta.server';

export {
  closeGalleryThumbBrowser,
  prepareDesignGallerySvg,
  regenerateAllDesignGalleryThumbs,
  regenerateDesignGalleryThumb,
  regenerateGalleryThumbsForTemplate,
  type GalleryThumbBuildResult,
} from '@/lib/designs/gallery-thumb-builder.core';
