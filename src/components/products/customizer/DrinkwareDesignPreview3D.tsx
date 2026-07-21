'use client';

import type { ProductDesignTemplate, ProductType } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { useDrinkwareDesignImageLayers } from '@/hooks/useDrinkwareDesignImageLayers';
import { Drinkware3DPreviewLazy } from '@/components/products/customizer/Drinkware3DPreviewLazy';

/**
 * Builds the drinkware wrap image layers from the current side design and
 * renders the live 3D preview. Shared by the mobile/tablet flat↔3D toggle
 * and the always-on desktop side-by-side pane so both stay in sync with the
 * same logic used to build the flat overlay.
 */
export function DrinkwareDesignPreview3D({
  productType,
  shirtColor,
  sideDesign,
  designTemplate,
  printBounds,
  textLayers,
  variant = 'floating',
  className,
  canvasHeightPx,
}: {
  productType: ProductType;
  shirtColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  printBounds: PrintAreaInsets;
  textLayers: PlacedTextLayer[];
  variant?: 'floating' | 'pane';
  className?: string;
  canvasHeightPx?: number;
}) {
  const { images } = useDrinkwareDesignImageLayers({
    shirtColor,
    sideDesign,
    designTemplate,
  });

  return (
    <Drinkware3DPreviewLazy
      productType={productType}
      productColor={shirtColor}
      printBounds={printBounds}
      images={images}
      textLayers={textLayers}
      variant={variant}
      className={className}
      canvasHeightPx={canvasHeightPx}
    />
  );
}
