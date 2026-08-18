'use client';

import {
  getProductMockup,
  isOverlayDesignTemplate,
  isRecolorableOverlayTemplate,
  type Product,
  type ProductDesignTemplate,
  type ProductDesignTextStyle,
  type ProductSide,
} from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import { ProductMockupFrame } from '@/components/products/ProductMockupFrame';
import {
  getMockupImageDisplayStyle,
  getOverlayPrintBounds,
  getProductMockupLayout,
  shouldUseDrinkwareWrapDesignPreview,
} from '@/lib/products/product-mockup-layout';
import { sideDesignFromOverlayTemplate } from '@/lib/products/design-state';
import { DrinkwareDesignPreview3D } from '@/components/products/customizer/DrinkwareDesignPreview3D';
import { resolveDesignPreviewColor } from '@/lib/products/design-applicable-colors';
import {
  DESIGN_OVERLAY_LAYER_CLASS,
  getDesignCompositeOverlayUrl,
  getDesignOverlayLayerStyle,
  resolveOverlayPlacementForSide,
  type OverlayPlacement,
} from '@/lib/products/design-overlay';
import { resolveSideOverlayConfig } from '@/lib/products/design-sides';
import { useOverlayAssetUrl } from '@/hooks/useOverlayAssetUrl';
import { useStableImageSrc } from '@/hooks/useStableImageSrc';
import { Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  side,
}: {
  design: ProductDesignTemplate;
  shirtColor: string;
  placement: OverlayPlacement;
  side: ProductSide;
}) {
  const sideConfig = resolveSideOverlayConfig(design, side);
  const overlaySvg = sideConfig?.overlaySvg ?? null;
  const overlayRecolor = sideConfig?.overlayRecolor;
  const overlayDesign = {
    overlaySvg,
    overlaySvgColors: overlayRecolor
      ? {
          primary: overlayRecolor.primary,
          secondary: overlayRecolor.secondary,
        }
      : null,
    overlayColorVariants: sideConfig?.overlayColorVariants ?? null,
    overlayRaster: getDesignCompositeOverlayUrl({
      printMasterImage:
        side === (design.defaultSide ?? 'front')
          ? design.printMasterImage
          : undefined,
      overlayImage: sideConfig?.overlayImage,
      overlaySvg: sideConfig?.overlaySvg,
    }),
    premadeDesignId: design.id,
    uploadedImageScale: placement.scale,
    uploadedImagePosition: placement.position,
  };
  const src = useOverlayAssetUrl({
    design: overlayDesign,
    // Avoid falling back to front-side template art when previewing another side.
    template: side === (design.defaultSide ?? 'front') ? design : null,
    shirtColor,
  });

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      className={DESIGN_OVERLAY_LAYER_CLASS}
      style={getDesignOverlayLayerStyle(placement)}
    />
  );
}

export function DesignTemplatePreview({
  product,
  color,
  design,
  typeLabel,
  showPhotoGuide = false,
  className,
  side,
}: {
  product: Product;
  color: string;
  design: ProductDesignTemplate;
  typeLabel: string;
  showPhotoGuide?: boolean;
  /** Merged onto ProductMockupFrame (e.g. borderless couple-pack halves). */
  className?: string;
  /** Which garment side to show. Defaults to design.defaultSide. */
  side?: ProductSide;
}) {
  const textStyle = design.textStyle;
  const photoGuide = textStyle?.photoPosition;
  const previewColor = resolveDesignPreviewColor(design, product, color);
  const mockupSide = side ?? design.defaultSide ?? 'front';
  const sideConfig = resolveSideOverlayConfig(design, mockupSide);
  const placement = resolveOverlayPlacementForSide(design, mockupSide, product);
  const shirtMockup = getProductMockup(product, previewColor, mockupSide);
  const compositeOverlay = getDesignCompositeOverlayUrl({
    printMasterImage:
      mockupSide === (design.defaultSide ?? 'front')
        ? design.printMasterImage
        : undefined,
    overlayImage: sideConfig?.overlayImage ?? design.overlayImage,
    overlaySvg: sideConfig?.overlaySvg ?? design.overlaySvg,
  });
  const mockupLayout = getProductMockupLayout(product);
  const overlayPrintBounds = getOverlayPrintBounds(mockupLayout);
  const useDrinkwareWrap3D =
    isOverlayDesignTemplate(design) &&
    shouldUseDrinkwareWrapDesignPreview(product, placement);
  const drinkwareSideDesign = useDrinkwareWrap3D
    ? sideDesignFromOverlayTemplate(design, product, previewColor, mockupSide)
    : null;

  if (useDrinkwareWrap3D && drinkwareSideDesign) {
    return (
      <ProductMockupFrame
        variant="catalog"
        layout={mockupLayout}
        className={className}
      >
        <DrinkwareDesignPreview3D
          productType={product.type}
          productId={product.id}
          shirtColor={previewColor}
          sideDesign={drinkwareSideDesign}
          designTemplate={design}
          printBounds={overlayPrintBounds}
          textLayers={drinkwareSideDesign.textLayers}
          variant="pane"
          className="absolute inset-0 h-full w-full"
        />
      </ProductMockupFrame>
    );
  }

  const sideHasRecolorableOverlay = Boolean(
    sideConfig?.overlaySvg && sideConfig.overlayRecolor,
  );
  const sideHasColorVariants = Boolean(
    sideConfig?.overlayColorVariants &&
      Object.keys(sideConfig.overlayColorVariants).length > 0,
  );
  // Fall back to template-level recolor/variants only for the default side.
  const useDynamicOverlay =
    isOverlayDesignTemplate(design) &&
    (sideHasRecolorableOverlay ||
      sideHasColorVariants ||
      (mockupSide === (design.defaultSide ?? 'front') &&
        (isRecolorableOverlayTemplate(design) ||
          Boolean(design.overlayColorVariants))));

  const { src: stableMockup, loading: mockupLoading } =
    useStableImageSrc(shirtMockup);
  const { src: stableOverlay, loading: overlayLoading } = useStableImageSrc(
    useDynamicOverlay ? null : compositeOverlay,
  );
  const imageLoading = mockupLoading || overlayLoading;
  // Keep zoom/crop aligned to the image currently on screen (not the pending one).
  const mockupStyle = getMockupImageDisplayStyle(
    product,
    stableMockup ?? shirtMockup,
    'catalog-design',
  );

  return (
    <ProductMockupFrame
      variant="catalog"
      layout={mockupLayout}
      innerStyle={mockupStyle}
      className={className}
    >
      {stableMockup ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stableMockup}
          alt={typeLabel}
          draggable={false}
          className={cn(
            mockupLayout.catalogImageClass,
            'transition-opacity duration-200',
            imageLoading ? 'opacity-80' : 'opacity-100',
          )}
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Shirt className="h-16 w-16 text-brand-300" />
        </div>
      )}

      {useDynamicOverlay ? (
        <CatalogOverlayPreview
          design={design}
          shirtColor={previewColor}
          placement={placement}
          side={mockupSide}
        />
      ) : stableOverlay ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stableOverlay}
          alt=""
          draggable={false}
          className={cn(
            DESIGN_OVERLAY_LAYER_CLASS,
            'transition-opacity duration-200',
            imageLoading ? 'opacity-80' : 'opacity-100',
          )}
          style={getDesignOverlayLayerStyle(placement)}
        />
      ) : null}

      {textStyle && mockupSide === (design.defaultSide ?? 'front') ? (
        <StyledDesignText style={textStyle} />
      ) : null}

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

      <MockupLoadingOverlay show={imageLoading} />
    </ProductMockupFrame>
  );
}
