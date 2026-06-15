'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import { products, productTypes } from '@/lib/data/catalog';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Shirt } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import type { ProductType, Product } from '@/lib/data/catalog';

export function ProductsCatalog() {
  const t = useTranslations('products');
  const locale = useLocale();
  const [typeFilter, setTypeFilter] = useState<ProductType | 'all'>('all');

  const filtered =
    typeFilter === 'all'
      ? products
      : products.filter((p) => p.type === typeFilter);

  return (
    <>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            typeFilter === 'all'
              ? 'bg-brand-600 text-white'
              : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
          }`}
        >
          All
        </button>
        {productTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              typeFilter === type
                ? 'bg-brand-600 text-white'
                : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {t(`types.${type}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((product) => (
          <Card
            key={product.id}
            className="overflow-hidden p-0"
          >
            <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={t(`types.${product.type}`)}
                  fill
                  sizes="256px"
                  className="object-contain"
                />
              ) : (
                <Shirt className="h-20 w-20 text-brand-300" />
              )}
            </div>
            <div className="p-4">
              <p className="font-medium text-ink-900">
                {t(`types.${product.type}`)}
              </p>
              <p className="mt-1 text-sm text-brand-600">
                {t('startingFrom')} {formatPrice(product.basePrice, locale)}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/products/${product.id}`}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full"
                  >
                    {t('viewProduct')}
                  </Button>
                </Link>
                <ProductQuickOrder product={product} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function ProductQuickOrder({ product }: { product: Product }) {
  const t = useTranslations('products');
  const { addItem } = useCart();
  const tp = useTranslations('products.types');

  function handleOrder() {
    addItem({
      type: 'product',
      name: tp(product.type),
      price: product.basePrice,
      quantity: 1,
      metadata: { productId: product.id },
    });
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleOrder}
    >
      {t('orderAsIs')}
    </Button>
  );
}
