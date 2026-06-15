'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import type { Product } from '@/lib/data/catalog';

export function ProductCardGrid({ items }: { items: Product[] }) {
  const t = useTranslations('products');
  const tp = useTranslations('products.types');
  const locale = useLocale();
  const [previewColors, setPreviewColors] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((product) => {
        const defaultColor = product.colors?.[0] ?? '#ffffff';
        const cardColor = previewColors[product.id] ?? defaultColor;

        return (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="group block transition hover:-translate-y-0.5"
          >
            <Card className="overflow-hidden p-0 transition group-hover:shadow-md">
              <div className="p-4 pb-0">
                <ProductImageCarousel
                  product={product}
                  color={cardColor}
                  typeLabel={tp(product.type)}
                  stopLinkNavigation
                />
              </div>
              <div className="p-4">
                <p className="font-medium text-ink-900 group-hover:text-brand-700">
                  {t(`types.${product.type}`)}
                </p>
                <p className="mt-1 text-sm text-brand-600">
                  {t('startingFrom')} {formatPrice(product.basePrice, locale)}
                </p>
                {product.colors && product.colors.length > 0 && (
                  <div
                    className="mt-3 flex flex-wrap gap-1.5"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {product.colors.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPreviewColors((prev) => ({
                            ...prev,
                            [product.id]: c,
                          }));
                        }}
                        className={`h-5 w-5 rounded-full border-2 transition ${
                          cardColor === c
                            ? 'border-brand-600 ring-2 ring-brand-200'
                            : 'border-ink-200 hover:border-ink-300'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-sm font-medium text-brand-600">
                  {t('viewProduct')} →
                </p>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
