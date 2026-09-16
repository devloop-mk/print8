'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchRecoloredSvgBlobUrl,
  resolveDisplayOverlayRasterUrl,
  type OverlaySvgColors,
} from '@/lib/products/design-overlay';
import type { ProductDesignTemplate } from '@/lib/data/catalog';

type OverlayDesignState = {
  overlaySvg: string | null;
  overlaySvgColors: OverlaySvgColors | null;
  overlayColorVariants: Record<string, string> | null;
  overlayRaster: string | null;
  premadeDesignId: string | null;
};

export function useOverlayAssetUrl({
  design,
  template,
  shirtColor,
}: {
  design: OverlayDesignState;
  template?: ProductDesignTemplate | null;
  shirtColor: string;
}): string | null {
  const [svgBlobUrl, setSvgBlobUrl] = useState<string | null>(null);

  const variantUrl = useMemo(
    () => resolveDisplayOverlayRasterUrl(design, template, shirtColor),
    [design.overlayColorVariants, design.overlayRaster, shirtColor, template],
  );

  useEffect(() => {
    if (!design.overlaySvg || !design.overlaySvgColors) {
      setSvgBlobUrl(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void fetchRecoloredSvgBlobUrl(
      design.overlaySvg,
      design.overlaySvgColors,
    ).then((url) => {
      if (cancelled) {
        URL.revokeObjectURL(url);
        return;
      }
      objectUrl = url;
      setSvgBlobUrl(url);
    });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    design.overlaySvg,
    design.overlaySvgColors?.primary,
    design.overlaySvgColors?.secondary,
  ]);

  if (design.overlaySvg) return svgBlobUrl;
  return variantUrl;
}
