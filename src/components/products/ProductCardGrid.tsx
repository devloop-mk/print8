'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/utils';
import { getProductOffering } from '@/lib/products/offering';
import { Card } from '@/components/ui/Card';
import { ProductCatalogImage } from '@/components/products/ProductCatalogImage';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/data/catalog';

export function ProductCardGrid({
  items,
  gridClassName,
}: {
  items: Product[];
  gridClassName?: string;
}) {
  const t = useTranslations('products');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const locale = useLocale();
  const [previewColors, setPreviewColors] = useState<Record<string, string>>({});

  const offerings = useMemo(
    () => new Map(items.map((product) => [product.id, getProductOffering(product)])),
    [items],
  );

  return (
    <div
      className={cn(
        'grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3',
        gridClassName,
      )}
    >
      {items.map((product, index) => {
        const defaultColor = product.colors?.[0] ?? '#ffffff';
        const cardColor = previewColors[product.id] ?? defaultColor;
        const offering = offerings.get(product.id)!;
        const productLabel = product.nameKey
          ? ti(product.nameKey)
          : tp(product.type);

        return (
          <Reveal key={product.id} delay={Math.min(index * 40, 120)}>
            <Link
              href={`/products/${product.id}`}
              className="group block transition hover:-translate-y-1"
            >
              <Card className="h-full overflow-hidden p-0 transition group-hover:shadow-lift-brand">
                <div className="p-4 pb-0">
                  <ProductCatalogImage
                    product={product}
                    color={cardColor}
                    typeLabel={productLabel}
                  />
                </div>
                <div className="p-4">
                  <p className="font-medium text-ink-900 group-hover:text-brand-700">
                    {productLabel}
                  </p>
                  <p className="mt-1 text-sm text-brand-600">
                    {t('startingFrom')} {formatPrice(product.basePrice, locale)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="badge-brand">
                      {t('card.customOption')}
                    </span>
                    {offering.hasPremade ? (
                      <span className="badge-sharp">
                        {t('card.readyDesigns', { count: offering.premadeCount })}
                      </span>
                    ) : null}
                  </div>

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
                          className={`h-5 w-5 border-2 transition ${
                            cardColor === c
                              ? 'border-brand-600 ring-2 ring-brand-200'
                              : 'border-ink-300 hover:border-ink-400'
                          }`}
                          style={{ backgroundColor: c }}
                          aria-label={c}
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-3 text-sm font-medium text-brand-600">
                    {t('card.exploreOptions')} →
                  </p>
                </div>
              </Card>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
