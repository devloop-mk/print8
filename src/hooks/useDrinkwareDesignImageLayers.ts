'use client';

import { useMemo } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { DrinkwareImageLayer } from '@/lib/products/build-drinkware-wrap-texture';
import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';

/**
 * Builds the drinkware wrap image layers from a side design + template.
 * Shared by the live 3D preview and the offscreen cart-snapshot capture so
 * both resolve overlay/recolor assets identically.
 */
export function useDrinkwareDesignImageLayers({
  shirtColor,
  sideDesign,
  designTemplate,
}: {
  shirtColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
}): { images: DrinkwareImageLayer[]; ready: boolean } {
  const hasTemplateOverlay = Boolean(
    sideDesign.overlaySvg ||
      sideDesign.overlayColorVariants ||
      sideDesign.overlayRaster,
  );
  const overlayAssetUrl = useOverlayAssetUrl({
    design: sideDesign,
    template: designTemplate,
    shirtColor,
  });

  // The recolorable-SVG path resolves asynchronously (blob fetch); until it
  // settles the overlay layer would be missing from the captured texture.
  const ready = !sideDesign.overlaySvg || overlayAssetUrl !== null;

  const images = useMemo((): DrinkwareImageLayer[] => {
    const layers: DrinkwareImageLayer[] = [];
    if (hasTemplateOverlay && overlayAssetUrl) {
      layers.push({
        src: overlayAssetUrl,
        scale: sideDesign.uploadedImageScale,
        position: sideDesign.uploadedImagePosition,
      });
    } else if (
      sideDesign.uploadedFile?.isImage &&
      sideDesign.uploadedFile.previewUrl
    ) {
      layers.push({
        src: sideDesign.uploadedFile.previewUrl,
        scale: sideDesign.uploadedImageScale,
        position: sideDesign.uploadedImagePosition,
      });
    }
    return layers;
  }, [
    hasTemplateOverlay,
    overlayAssetUrl,
    sideDesign.uploadedFile,
    sideDesign.uploadedImageScale,
    sideDesign.uploadedImagePosition,
  ]);

  return { images, ready };
}
