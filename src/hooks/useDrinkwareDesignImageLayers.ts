'use client';

import { useMemo } from 'react';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { DrinkwareImageLayer } from '@/lib/products/build-drinkware-wrap-texture';
import { getPlacedPhotos } from '@/lib/products/photo-layers';
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
    const seen = new Set<string>();
    const pushLayer = (
      src: string | null | undefined,
      scale: number,
      position: { x: number; y: number },
    ) => {
      const trimmed = src?.trim();
      if (!trimmed || seen.has(trimmed)) return;
      seen.add(trimmed);
      layers.push({ src: trimmed, scale, position });
    };

    if (hasTemplateOverlay && overlayAssetUrl) {
      pushLayer(
        overlayAssetUrl,
        sideDesign.uploadedImageScale,
        sideDesign.uploadedImagePosition,
      );
    } else if (sideDesign.premadeDesignImage) {
      pushLayer(
        sideDesign.premadeDesignImage,
        sideDesign.uploadedImageScale,
        sideDesign.uploadedImagePosition,
      );
    }

    const placedPhotos = getPlacedPhotos(sideDesign);
    for (const photo of placedPhotos) {
      pushLayer(photo.previewUrl, photo.scale, photo.position);
    }

    // Overlay-template composites (and some restored orders) stash art on
    // uploadedFile with no fileId, so getPlacedPhotos skips them.
    if (placedPhotos.length === 0) {
      pushLayer(
        sideDesign.uploadedFile?.previewUrl,
        sideDesign.uploadedImageScale,
        sideDesign.uploadedImagePosition,
      );
    }

    return layers;
  }, [
    hasTemplateOverlay,
    overlayAssetUrl,
    sideDesign,
    sideDesign.premadeDesignImage,
    sideDesign.uploadedFile,
    sideDesign.uploadedPhotos,
    sideDesign.uploadedImageScale,
    sideDesign.uploadedImagePosition,
  ]);

  return { images, ready };
}
