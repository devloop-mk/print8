import {
  createDefaultSideDesign,
  type SideDesign,
} from '@/lib/products/design-state';
import { createPlacedSticker } from '@/lib/products/sticker-library';
import {
  createPlacedTextLayer,
  sideHasTextContent,
  syncFlatTextFields,
} from '@/lib/products/text-layers';

export function sideHasDesignContent(design: SideDesign | undefined): boolean {
  if (!design) return false;
  return Boolean(
    sideHasTextContent(design) ||
      design.uploadedFile ||
      design.premadeDesignImage ||
      design.bakedMockupUrl ||
      design.overlaySvg ||
      design.overlayRaster ||
      design.overlayColorVariants ||
      design.stickers.length > 0,
  );
}

export function cloneSideDesign(source: SideDesign): SideDesign {
  const cloned: SideDesign = {
    ...source,
    customTextPosition: { ...source.customTextPosition },
    uploadedImagePosition: { ...source.uploadedImagePosition },
    uploadedFile: source.uploadedFile ? { ...source.uploadedFile } : null,
    overlaySvgColors: source.overlaySvgColors
      ? { ...source.overlaySvgColors }
      : null,
    overlayColorVariants: source.overlayColorVariants
      ? { ...source.overlayColorVariants }
      : null,
    textLayers: source.textLayers.map((layer, index) =>
      createPlacedTextLayer(index, {
        ...layer,
        position: { ...layer.position },
      }),
    ),
    stickers: source.stickers.map((sticker, index) => {
      const placed = createPlacedSticker(sticker.stickerId, index);
      return {
        ...placed,
        position: { ...sticker.position },
        scale: sticker.scale,
      };
    }),
  };

  return syncFlatTextFields(cloned);
}

export function copySideDesignToTarget(
  designs: Record<string, SideDesign>,
  from: string,
  to: string,
): Record<string, SideDesign> | null {
  const source = designs[from];
  const target = designs[to] ?? createDefaultSideDesign();
  if (!source || !sideHasDesignContent(source) || sideHasDesignContent(target)) {
    return null;
  }

  return {
    ...designs,
    [to]: cloneSideDesign(source),
  };
}
