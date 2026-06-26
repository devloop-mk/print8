'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Shirt } from 'lucide-react';
import {
  getProductGallerySlides,
  type Product,
  type ProductGallerySlide,
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
  const slides = getProductGallerySlides(product, color);
  const hasCarousel = slides.length > 1;
  const isPhotoGallery = slides.every((slide) => slide.kind === 'photo');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [color]);

  const slide = slides[index];
  const image = slide?.image;

  function goTo(delta: number) {
    setIndex((i) => (i + delta + slides.length) % slides.length);
  }

  const stopNav = (e: React.MouseEvent) => {
    if (stopLinkNavigation) e.preventDefault();
    e.stopPropagation();
  };

  const imageAlt = (s: ProductGallerySlide, i: number) => {
    if (s.kind === 'side' && s.labelKey) {
      return `${typeLabel} — ${t(s.labelKey)}`;
    }
    if (slides.length > 1) {
      return `${typeLabel} (${i + 1}/${slides.length})`;
    }
    return typeLabel;
  };

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner">
      {image ? (
        <div className={PRODUCT_MOCKUP_INNER_CLASS}>
          <Image
            key={`${color}-${index}-${image}`}
            src={image}
            alt={imageAlt(slide, index)}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-contain"
            priority={index === 0}
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

          {isPhotoGallery ? (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-2 shadow-sm">
              {slides.map((s, i) => (
                <button
                  key={`${s.image}-${i}`}
                  type="button"
                  onClick={(e) => {
                    stopNav(e);
                    setIndex(i);
                  }}
                  className={`h-2 w-2 rounded-full transition ${
                    i === index ? 'bg-brand-600' : 'bg-ink-300 hover:bg-ink-400'
                  }`}
                  aria-label={`${i + 1} / ${slides.length}`}
                />
              ))}
            </div>
          ) : (
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 shadow-sm">
              {slides.map((s, i) => (
                <button
                  key={`${s.image}-${i}`}
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
                  {s.labelKey ? t(s.labelKey) : i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
