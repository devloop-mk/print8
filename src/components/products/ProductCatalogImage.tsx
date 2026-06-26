'use client';

import Image from 'next/image';
import { Shirt } from 'lucide-react';
import { getProductGallerySlides, type Product } from '@/lib/data/catalog';
import { PRODUCT_MOCKUP_INNER_CLASS } from '@/components/products/ProductMockupFrame';

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

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner">
      {primary ? (
        <div className={PRODUCT_MOCKUP_INNER_CLASS}>
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              secondary ? 'group-hover:opacity-0' : ''
            }`}
          >
            <Image
              src={primary}
              alt={typeLabel}
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className="object-contain"
            />
          </div>
          {secondary ? (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Image
                src={secondary}
                alt={`${typeLabel} — alternate`}
                fill
                sizes="(max-width: 768px) 50vw, 320px"
                className="object-contain"
              />
            </div>
          ) : null}
        </div>
      ) : (
        <Shirt className="h-32 w-32 text-ink-300" />
      )}
    </div>
  );
}
