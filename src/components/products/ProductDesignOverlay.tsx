'use client';

import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';
import type { ProductDesignTemplate } from '@/lib/data/catalog';
import type { OverlaySvgColors } from '@/lib/products/design-overlay';

type OverlayDesignState = {
  overlaySvg: string | null;
  overlaySvgColors: OverlaySvgColors | null;
  overlayColorVariants: Record<string, string> | null;
  overlayRaster: string | null;
  premadeDesignId: string | null;
  uploadedImageScale: number;
  uploadedImagePosition: { x: number; y: number };
};

export function ProductDesignOverlayImage({
  design,
  template,
  shirtColor,
  className = '',
}: {
  design: OverlayDesignState;
  template?: ProductDesignTemplate | null;
  shirtColor: string;
  className?: string;
}) {
  const src = useOverlayAssetUrl({ design, template, shirtColor });
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      className={className}
      style={{
        left: `${design.uploadedImagePosition.x}%`,
        top: `${design.uploadedImagePosition.y}%`,
        width: `${design.uploadedImageScale}%`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}
