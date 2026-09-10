'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Shirt } from 'lucide-react';
import {
  getProductGallerySlides,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { useProductCatalogDesignTemplates } from '@/components/products/ProductCatalogDesignsProvider';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { isDualSidedDesign } from '@/lib/products/design-sides';
import { pickProductCatalogPreviewDesign } from '@/lib/products/product-catalog-preview-design';
import { useStableImageSrc } from '@/hooks/useStableImageSrc';
import { cn } from '@/lib/utils';

function ProductPlainCatalogImage({
  product,
  color,
  typeLabel,
  showAlternateOnHover = true,
}: {
  product: Product;
  color: string;
  typeLabel: string;
  showAlternateOnHover?: boolean;
}) {
  const slides = getProductGallerySlides(product, color);
  const primary = slides[0]?.image;
  const secondary = slides[1]?.image;
  const { src: stablePrimary, loading: primaryLoading } =
    useStableImageSrc(primary);
  const { src: stableSecondary, loading: secondaryLoading } =
    useStableImageSrc(secondary);
  const imageLoading = primaryLoading || secondaryLoading;
  const mockupLayout = getProductMockupLayout(product);
  const alternateOnHover = showAlternateOnHover && stableSecondary;

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border border-ink-100 bg-white">
      {stablePrimary ? (
        <div className={mockupLayout.catalogInnerClass}>
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              alternateOnHover && '[@media(hover:hover)]:group-hover:opacity-0',
            )}
          >
            <Image
              src={stablePrimary}
              alt={typeLabel}
              fill
              unoptimized
              sizes="(max-width: 768px) 50vw, 320px"
              className={cn(
                mockupLayout.catalogImageClass,
                'transition-opacity duration-200',
                imageLoading ? 'opacity-80' : 'opacity-100',
              )}
              style={getMockupImageDisplayStyle(
                product,
                stablePrimary,
                'catalog-card',
              )}
            />
          </div>
          {alternateOnHover ? (
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
            >
              <Image
                src={stableSecondary}
                alt={`${typeLabel} — alternate`}
                fill
                unoptimized
                sizes="(max-width: 768px) 50vw, 320px"
                className={mockupLayout.catalogImageClass}
                style={getMockupImageDisplayStyle(
                  product,
                  stableSecondary,
                  'catalog-card',
                )}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <Shirt className="h-32 w-32 text-ink-300" />
      )}
      <MockupLoadingOverlay show={imageLoading} />
    </div>
  );
}

function ProductDesignCatalogPreview({
  product,
  color,
  typeLabel,
  previewDesign,
}: {
  product: Product;
  color: string;
  typeLabel: string;
  previewDesign: ProductDesignTemplate;
}) {
  const dualSided = isDualSidedDesign(previewDesign);

  return (
    <div className="relative w-full max-w-sm">
      <div
        className={cn(
          'transition-opacity duration-300',
          dualSided && '[@media(hover:hover)]:group-hover:opacity-0',
        )}
      >
        <DesignTemplatePreview
          product={product}
          color={color}
          design={previewDesign}
          typeLabel={typeLabel}
          side="front"
          allowDrinkware3d={false}
        />
      </div>
      {dualSided ? (
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
        >
          <DesignTemplatePreview
            product={product}
            color={color}
            design={previewDesign}
            typeLabel={typeLabel}
            side="back"
            allowDrinkware3d={false}
          />
        </div>
      ) : null}
    </div>
  );
}

export function ProductCatalogImage({
  product,
  color,
  typeLabel,
  designPreviewOnHover = false,
}: {
  product: Product;
  color: string;
  typeLabel: string;
  /** Plain product photo by default; sample design only on hover (pointer devices). */
  designPreviewOnHover?: boolean;
}) {
  const mergedTemplates = useProductCatalogDesignTemplates(product.id);
  const previewDesign = useMemo(
    () => pickProductCatalogPreviewDesign(product, mergedTemplates),
    [mergedTemplates, product],
  );
  const [hoverPreviewActive, setHoverPreviewActive] = useState(false);

  if (designPreviewOnHover && previewDesign) {
    return (
      <div
        className="relative w-full max-w-sm"
        onMouseEnter={() => setHoverPreviewActive(true)}
        onMouseLeave={() => setHoverPreviewActive(false)}
      >
        <div
          className={cn(
            'transition-opacity duration-300',
            hoverPreviewActive && 'opacity-0',
          )}
        >
          <ProductPlainCatalogImage
            product={product}
            color={color}
            typeLabel={typeLabel}
            showAlternateOnHover={false}
          />
        </div>
        {hoverPreviewActive ? (
          <div className="absolute inset-0 opacity-100 transition-opacity duration-200">
            <DesignTemplatePreview
              product={product}
              color={color}
              design={previewDesign}
              typeLabel={typeLabel}
              side="front"
              allowDrinkware3d={false}
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (previewDesign) {
    return (
      <ProductDesignCatalogPreview
        product={product}
        color={color}
        typeLabel={typeLabel}
        previewDesign={previewDesign}
      />
    );
  }

  return (
    <ProductPlainCatalogImage
      product={product}
      color={color}
      typeLabel={typeLabel}
    />
  );
}
