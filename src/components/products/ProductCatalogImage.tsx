'use client';

import Image from 'next/image';
import { Shirt } from 'lucide-react';
import { getProductGallerySlides, type Product } from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';
import { useStableImageSrc } from '@/hooks/useStableImageSrc';
import { cn } from '@/lib/utils';

export function ProductCatalogImage({
  product,
  color,
  typeLabel,
}: {
  product: Product;
  color: string;
  typeLabel: string;
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

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border border-ink-100 bg-white">
      {stablePrimary ? (
        <div className={mockupLayout.catalogInnerClass}>
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              stableSecondary ? 'group-hover:opacity-0' : ''
            }`}
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
          {stableSecondary ? (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
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
