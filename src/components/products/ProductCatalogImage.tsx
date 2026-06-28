'use client';

import Image from 'next/image';
import { Shirt } from 'lucide-react';
import { getProductGallerySlides, type Product } from '@/lib/data/catalog';
import {
  getCatalogMockupImageStyle,
  getProductMockupLayout,
} from '@/lib/products/product-mockup-layout';

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
  const mockupLayout = getProductMockupLayout(product);

  return (
    <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border border-ink-100 bg-white">
      {primary ? (
        <div className={mockupLayout.catalogInnerClass}>
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
              className={mockupLayout.catalogImageClass}
              style={getCatalogMockupImageStyle(mockupLayout)}
            />
          </div>
          {secondary ? (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Image
                src={secondary}
                alt={`${typeLabel} — alternate`}
                fill
                sizes="(max-width: 768px) 50vw, 320px"
                className={mockupLayout.catalogImageClass}
                style={getCatalogMockupImageStyle(mockupLayout)}
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
