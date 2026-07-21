'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildDrinkwareWrapTexture,
  type DrinkwareImageLayer,
} from '@/lib/products/build-drinkware-wrap-texture';
import type { ProductType } from '@/lib/data/catalog';
import type { PlacedTextLayer } from '@/lib/products/text-layers';
import type { PrintAreaInsets } from '@/lib/products/print-area';

export function useDrinkwareWrapTexture({
  productType,
  productColor,
  printBounds,
  images,
  textLayers,
  canvasHeightPx,
}: {
  productType: ProductType;
  productColor: string;
  printBounds: PrintAreaInsets;
  images: DrinkwareImageLayer[];
  textLayers: PlacedTextLayer[];
  /** Measured flat-editor height so text px maps 1:1 into the wrap texture. */
  canvasHeightPx?: number;
}) {
  const [textureCanvas, setTextureCanvas] = useState<HTMLCanvasElement | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const imageKey = useMemo(
    () =>
      images
        .map(
          (image) =>
            `${image.src}|${image.scale}|${image.position.x}|${image.position.y}`,
        )
        .join(';'),
    [images],
  );

  const textKey = useMemo(
    () =>
      textLayers
        .map(
          (layer) =>
            `${layer.instanceId}|${layer.text}|${layer.size}|${layer.color}|${layer.position.x}|${layer.position.y}|${layer.fontFamily}|${layer.fontWeight}`,
        )
        .join(';'),
    [textLayers],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    void buildDrinkwareWrapTexture({
      productType,
      productColor,
      printBounds,
      images,
      textLayers,
      canvasHeightPx,
    })
      .then((canvas) => {
        if (!cancelled) {
          setTextureCanvas(canvas);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTextureCanvas(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    productType,
    productColor,
    printBounds,
    imageKey,
    textKey,
    images,
    textLayers,
    canvasHeightPx,
  ]);

  return { textureCanvas, loading };
}
