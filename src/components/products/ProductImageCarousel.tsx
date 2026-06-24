'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Shirt } from 'lucide-react';
import {
  getProductMockup,
  getProductSides,
  productSupportsSides,
  type Product,
  type ProductSide,
} from '@/lib/data/catalog';
import { PRODUCT_MOCKUP_INNER_CLASS } from '@/components/products/ProductMockupFrame';

export function ProductImageCarousel({
  product,
  color,
  typeLabel,
  stopLinkNavigation,
}: {
  product: Product;
  color: string;
  typeLabel: string;
  /** Prevent parent link navigation when using carousel controls */
  stopLinkNavigation?: boolean;
}) {
  const t = useTranslations('products.customizer');
  const sides = getProductSides(product);
  const hasCarousel = productSupportsSides(product) && sides.length > 1;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [color]);

  const side = sides[index] ?? 'front';
  const image = getProductMockup(product, color, side);

  function goTo(delta: number) {
    setIndex((i) => (i + delta + sides.length) % sides.length);
  }

  const stopNav = (e: React.MouseEvent) => {
    if (stopLinkNavigation) e.preventDefault();
    e.stopPropagation();
  };

  const sideLabel = (s: ProductSide) => {
    if (s === 'front') return t('front');
    if (s === 'back') return t('back');
    if (s === 'left') return t('left');
    return t('right');
  };

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner">
      {image ? (
        <div className={PRODUCT_MOCKUP_INNER_CLASS}>
          <Image
            key={`${color}-${side}`}
            src={image}
            alt={`${typeLabel} — ${sideLabel(side)}`}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <Shirt className="h-32 w-32 text-ink-300" />
      )}

      {hasCarousel && (
        <>
          <button
            type="button"
            onClick={(e) => {
              stopNav(e);
              goTo(-1);
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
            aria-label="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-ink-700" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stopNav(e);
              goTo(1);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition hover:bg-white"
            aria-label="Next"
          >
            <ChevronRight className="h-5 w-5 text-ink-700" />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
            {sides.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={(e) => {
                  stopNav(e);
                  setIndex(i);
                }}
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition ${
                  i === index
                    ? 'bg-brand-600 text-white'
                    : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {sideLabel(s)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
