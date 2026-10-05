'use client';

import Image from 'next/image';
import { Shirt } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getProductGallerySlides, type Product } from '@/lib/data/catalog';
import { MockupLoadingOverlay } from '@/components/products/MockupLoadingOverlay';
import {
  getMockupImageDisplayStyle,
  getProductMockupLayout,
  isCylindricalDrinkwareType,
} from '@/lib/products/product-mockup-layout';
import { isMugInsideProduct } from '@/lib/products/drinkware-product-options';
import { isDarkShirtColor } from '@/lib/products/design-overlay';
import { getPrintAreaCenter } from '@/lib/products/print-area';
import { useStableImageSrc } from '@/hooks/useStableImageSrc';
import { cn } from '@/lib/utils';

function getYourDesignPlaceholderCenter(product: Product): {
  x: number;
  y: number;
} {
  if (isMugInsideProduct(product.id)) return { x: 50, y: 50 };
  if (isCylindricalDrinkwareType(product.type)) return { x: 44, y: 48 };
  return getPrintAreaCenter(getProductMockupLayout(product).printArea);
}

function YourDesignPlaceholderOverlay({
  product,
  color,
}: {
  product: Product;
  color: string;
}) {
  const t = useTranslations('products.card');
  const { x, y } = getYourDesignPlaceholderCenter(product);
  const dark = isDarkShirtColor(color);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{ containerType: 'size' }}
      aria-hidden
    >
      <span
        className={cn(
          'absolute max-w-[48%] whitespace-pre-line text-center font-extrabold uppercase leading-[1.08] tracking-[0.08em] [font-size:clamp(9px,4.6cqw,14px)]',
          dark
            ? 'text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.7),0_0_3px_rgba(0,0,0,0.45)]'
            : 'text-ink-900 [text-shadow:0_1px_10px_rgba(255,255,255,0.95),0_0_3px_rgba(255,255,255,0.8)]',
        )}
        style={{
          left: `${x}%`,
          top: `${y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {t('yourDesignHere')}
      </span>
    </div>
  );
}

export function ProductCatalogImage({
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
  const alternateOnHover = showAlternateOnHover && Boolean(stableSecondary);

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border border-ink-100 bg-white">
      {stablePrimary ? (
        <div className={mockupLayout.catalogInnerClass}>
          <div
            className="relative h-full w-full"
            style={getMockupImageDisplayStyle(
              product,
              stablePrimary,
              'catalog-card',
            )}
          >
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                alternateOnHover &&
                  '[@media(hover:hover)]:group-hover:opacity-0',
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
              />
            </div>
            {alternateOnHover ? (
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100">
                <Image
                  src={stableSecondary!}
                  alt={`${typeLabel} — alternate`}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 50vw, 320px"
                  className={mockupLayout.catalogImageClass}
                />
              </div>
            ) : null}
            <YourDesignPlaceholderOverlay product={product} color={color} />
          </div>
        </div>
      ) : (
        <Shirt className="h-32 w-32 text-ink-300" />
      )}
      <MockupLoadingOverlay show={imageLoading} />
    </div>
  );
}
