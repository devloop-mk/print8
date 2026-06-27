'use client';

import {
  getProductMockup,
  isOverlayDesignTemplate,
  isRecolorableOverlayTemplate,
  type Product,
  type ProductDesignTemplate,
  type ProductDesignTextStyle,
} from '@/lib/data/catalog';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import { getProductMockupLayout } from '@/lib/products/product-mockup-layout';
import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';
import { Shirt } from 'lucide-react';

export function StyledDesignText({
  style,
  className = '',
}: {
  style: ProductDesignTextStyle;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute select-none text-center font-bold leading-tight ${className}`}
      style={{
        color: style.textColor,
        left: `${style.textPosition.x}%`,
        top: `${style.textPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${style.textSize}px`,
        fontWeight: style.fontWeight ?? 700,
        letterSpacing: style.letterSpacing ?? '0.02em',
        lineHeight: style.lineHeight ?? 1.2,
        textShadow:
          style.textShadow ??
          '0 1px 2px rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.15)',
        whiteSpace: 'pre-line',
        maxWidth: '78%',
      }}
    >
      {style.text}
    </div>
  );
}

function CatalogOverlayPreview({
  design,
  shirtColor,
}: {
  design: ProductDesignTemplate;
  shirtColor: string;
}) {
  const overlayDesign = {
    overlaySvg: design.overlaySvg ?? null,
    overlaySvgColors: design.overlayRecolor
      ? {
          primary: design.overlayRecolor.primary,
          secondary: design.overlayRecolor.secondary,
        }
      : null,
    overlayColorVariants: design.overlayColorVariants ?? null,
    overlayRaster: design.overlayImage ?? null,
    premadeDesignId: design.id,
    uploadedImageScale: design.overlayScale ?? 50,
    uploadedImagePosition: design.overlayPosition ?? { x: 50, y: 45 },
  };
  const src = useOverlayAssetUrl({
    design: overlayDesign,
    template: design,
    shirtColor,
  });

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      className="pointer-events-none absolute max-h-[70%] max-w-[70%] object-contain"
      style={{
        left: `${overlayDesign.uploadedImagePosition.x}%`,
        top: `${overlayDesign.uploadedImagePosition.y}%`,
        width: `${overlayDesign.uploadedImageScale}%`,
        transform: 'translate(-50%, -50%)',
      }}
    />
  );
}

export function DesignTemplatePreview({
  product,
  color,
  design,
  typeLabel,
  showPhotoGuide = false,
}: {
  product: Product;
  color: string;
  design: ProductDesignTemplate;
  typeLabel: string;
  showPhotoGuide?: boolean;
}) {
  const mockup = getProductMockup(product, color, design.defaultSide);
  const textStyle = design.textStyle;
  const photoGuide = textStyle?.photoPosition;
  const previewColor =
    design.recommendedColor &&
    product.colors?.some(
      (value) => value.toLowerCase() === design.recommendedColor!.toLowerCase(),
    )
      ? design.recommendedColor
      : color;
  const mockupLayout = getProductMockupLayout(product);

  return (
    <ProductMockupFrame
      className="bg-gradient-to-br from-brand-50 to-brand-100 shadow-none"
      layout={mockupLayout}
    >
      {mockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mockup}
          alt={typeLabel}
          draggable={false}
          className={mockupLayout.imageClass}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Shirt className="h-16 w-16 text-brand-300" />
        </div>
      )}

      {isOverlayDesignTemplate(design) &&
      (isRecolorableOverlayTemplate(design) || design.overlayColorVariants) ? (
        <CatalogOverlayPreview design={design} shirtColor={previewColor} />
      ) : design.overlayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={design.overlayImage}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-h-[70%] max-w-[70%] object-contain"
          style={{
            left: `${design.overlayPosition?.x ?? 50}%`,
            top: `${design.overlayPosition?.y ?? 45}%`,
            width: `${design.overlayScale ?? 50}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ) : null}

      {textStyle && <StyledDesignText style={textStyle} />}

      {showPhotoGuide && photoGuide && (
        <div
          className="pointer-events-none absolute flex items-center justify-center rounded-full border-2 border-dashed border-brand-400/60 bg-brand-100/30"
          style={{
            left: `${photoGuide.x}%`,
            top: `${photoGuide.y}%`,
            width: `${textStyle?.photoScale ?? 36}%`,
            aspectRatio: '1',
            transform: 'translate(-50%, -50%)',
          }}
        />
      )}
    </ProductMockupFrame>
  );
}
