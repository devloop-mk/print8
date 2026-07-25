import type {
  ProductDesignTemplate,
  ProductSide,
} from '@/lib/data/catalog';
import { resolveSideOverlayConfig } from '@/lib/products/design-sides';
import type { SideDesign } from '@/lib/products/design-state';
import { getSideMetadataPrefix } from '@/lib/products/product-sides';

/** Catalog / R2 path for the full-resolution premade artwork file. */
export function getPremadeMasterStoragePath(
  template: ProductDesignTemplate,
  side?: ProductSide,
): string | null {
  if (template.printMasterImage?.trim()) {
    return template.printMasterImage.trim();
  }

  if (template.kind === 'image' && template.image?.trim()) {
    return template.image.trim();
  }

  if (side && template.kind === 'overlay') {
    const config = resolveSideOverlayConfig(template, side);
    if (config?.overlayImage?.trim()) {
      return config.overlayImage.trim();
    }
  }

  if (template.overlayImage?.trim()) {
    return template.overlayImage.trim();
  }

  return null;
}

function sideHasUserUploadedPhoto(design: SideDesign): boolean {
  return Boolean(design.uploadedFile?.fileId?.trim());
}

function sideHasExtraText(
  design: SideDesign,
  template: ProductDesignTemplate | null,
): boolean {
  const layers = design.textLayers.filter((layer) => layer.text.trim());
  if (layers.length === 0) return false;

  if (template?.kind === 'text' && template.textStyle?.text?.trim()) {
    const defaultText = template.textStyle.text.trim();
    return layers.some((layer) => layer.text.trim() !== defaultText);
  }

  return layers.length > 0;
}

/** User added stickers, their own photo, or edited text beyond the template defaults. */
export function sideHasExtraUserArtwork(
  design: SideDesign,
  template: ProductDesignTemplate | null,
): boolean {
  if (design.stickers.length > 0) return true;
  if (sideHasUserUploadedPhoto(design)) return true;
  return sideHasExtraText(design, template);
}

/**
 * True when the order still uses the catalog premade artwork (only moved/resized
 * on the mockup). Production can download the original master from storage.
 */
export function premadeSideKeepsOriginalArtworkOnly(
  design: SideDesign,
  template: ProductDesignTemplate | null,
  side: ProductSide,
): boolean {
  if (!design.premadeDesignId || !template) return false;
  if (sideHasExtraUserArtwork(design, template)) return false;
  return Boolean(getPremadeMasterStoragePath(template, side));
}

/**
 * Premade orders use the cloud master + mockup preview for production.
 * Skip multi-megabyte print PNG capture/upload unless the user added their own photo.
 */
export function premadeSideSkipsPrintPngCapture(
  design: SideDesign,
  template: ProductDesignTemplate | null,
  side: ProductSide,
): boolean {
  if (!design.premadeDesignId || !template) return false;
  if (sideHasUserUploadedPhoto(design)) return false;
  return Boolean(getPremadeMasterStoragePath(template, side));
}

export function orderItemSideUsesPremadeMasterForProduction(
  metadata: Record<string, string | number | boolean> | undefined,
  side: ProductSide,
): boolean {
  if (!metadata) return false;

  const prefix = getSideMetadataPrefix(side);
  if (metadata[`${prefix}PremadeProductionUsesMaster`] === true) {
    return true;
  }

  if (
    typeof metadata[`${prefix}UploadedFileId`] === 'string' &&
    metadata[`${prefix}UploadedFileId`]
  ) {
    return false;
  }

  const masterPath = metadata[`${prefix}PremadeMasterImage`];
  if (typeof masterPath !== 'string' || !masterPath.trim()) {
    return false;
  }

  return (
    typeof metadata[`${prefix}PremadeDesignId`] === 'string' ||
    typeof metadata.designTemplateId === 'string'
  );
}

export function writePremadeArtworkSourceMetadata(
  metadata: Record<string, string | number | boolean>,
  prefix: string,
  design: SideDesign,
  template: ProductDesignTemplate | null,
  side: ProductSide,
): void {
  if (!design.premadeDesignId || !template) return;

  const masterPath = getPremadeMasterStoragePath(template, side);
  if (masterPath) {
    metadata[`${prefix}PremadeMasterImage`] = masterPath;
    if (!sideHasUserUploadedPhoto(design)) {
      metadata[`${prefix}PremadeProductionUsesMaster`] = true;
    }
  }

  if (premadeSideKeepsOriginalArtworkOnly(design, template, side)) {
    metadata[`${prefix}PremadeOriginalArtworkOnly`] = true;
  }
}
