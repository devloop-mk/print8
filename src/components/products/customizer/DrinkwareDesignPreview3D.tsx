'use client';

import type { ProductDesignTemplate, ProductType } from '@/lib/data/catalog';
import type { SideDesign } from '@/lib/products/design-state';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';
import { useDrinkwareDesignImageLayers } from '@/hooks/useDrinkwareDesignImageLayers';
import { Drinkware3DPreviewLazy } from '@/components/products/customizer/Drinkware3DPreviewLazy';
import type { DrinkwarePreviewVariant } from '@/components/products/customizer/Drinkware3DPreview';

/**
 * Builds the drinkware wrap image layers from the current side design and
 * renders the live 3D preview. Shared by the mobile/tablet flat↔3D toggle
 * and the always-on desktop side-by-side pane so both stay in sync with the
 * same logic used to build the flat overlay.
 */
export function DrinkwareDesignPreview3D({
  productType,
  productId,
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
  productId?: string;
  shirtColor: string;
  sideDesign: SideDesign;
  designTemplate: ProductDesignTemplate | null | undefined;
  printBounds: PrintAreaInsets;
  textLayers: PlacedTextLayer[];
  variant?: DrinkwarePreviewVariant;
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
      productId={productId}
      productColor={shirtColor}
      printBounds={printBounds}
      images={images}
      textLayers={textLayers}
      stickers={sideDesign.stickers}
      variant={variant}
      className={className}
      canvasHeightPx={canvasHeightPx}
    />
  );
}
