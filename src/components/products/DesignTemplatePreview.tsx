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
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import {
  resolveOverlayPlacement,
  type OverlayPlacement,
  getDesignCompositeOverlayUrl,
} from '@/lib/products/design-overlay';
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
  placement,
}: {
  design: ProductDesignTemplate;
  shirtColor: string;
  placement: OverlayPlacement;
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
    overlayRaster: getDesignCompositeOverlayUrl(design),
    premadeDesignId: design.id,
    uploadedImageScale: placement.scale,
    uploadedImagePosition: placement.position,
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
  const textStyle = design.textStyle;
  const photoGuide = textStyle?.photoPosition;
  const previewColor = resolveDesignPreviewColor(design, product, color);
  const placement = resolveOverlayPlacement(design, product);
  const mockupSide = design.defaultSide ?? 'front';
  const shirtMockup = getProductMockup(product, previewColor, mockupSide);
  const mockupLayout = getProductMockupLayout(product);
  const mockupStyle = getMockupImageDisplayStyle(
    product,
    shirtMockup,
    'catalog-design',
  );

  return (
    <ProductMockupFrame variant="catalog" layout={mockupLayout} innerStyle={mockupStyle}>
      {shirtMockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${previewColor}-${mockupSide}-${shirtMockup}`}
          src={shirtMockup}
          alt={typeLabel}
          draggable={false}
          className={mockupLayout.catalogImageClass}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Shirt className="h-16 w-16 text-brand-300" />
        </div>
      )}

      {isOverlayDesignTemplate(design) &&
      (isRecolorableOverlayTemplate(design) || design.overlayColorVariants) ? (
        <CatalogOverlayPreview
          design={design}
          shirtColor={previewColor}
          placement={placement}
        />
      ) : (() => {
        const overlaySrc = getDesignCompositeOverlayUrl(design);
        if (!overlaySrc) return null;
        return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${previewColor}-${mockupSide}-${overlaySrc}`}
          src={overlaySrc}
          alt=""
          draggable={false}
          className="pointer-events-none absolute max-h-[70%] max-w-[70%] object-contain"
          style={{
            left: `${placement.position.x}%`,
            top: `${placement.position.y}%`,
            width: `${placement.scale}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
        );
      })()}

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
