'use client';

import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/data/catalog';
import { isHoodieProduct } from '@/lib/products/hoodie-catalog';
import {
  getHoodieCompareAtPrice,
  getHoodieUnitPrice,
} from '@/lib/products/hoodie-pricing';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';
import { cn, formatPrice } from '@/lib/utils';

export function ProductSalePrice({
  product,
  size,
  locale,
  showFromPrefix = false,
  className,
}: {
  product: Product;
  size?: string;
  locale: string;
  showFromPrefix?: boolean;
  className?: string;
}) {
  const t = useTranslations('products');
  const current = isHoodieProduct(product)
    ? getHoodieUnitPrice(product, size)
    : getProductDisplayPrice(product);
  const was = isHoodieProduct(product)
    ? getHoodieCompareAtPrice(product, size)
    : product.compareAtPrice && product.compareAtPrice > current
      ? product.compareAtPrice
      : null;

  return (
    <span
      className={cn(
        'inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5',
        className,
      )}
    >
      {was ? (
        <>
          <span className="text-sm font-medium text-ink-400 line-through">
            {formatPrice(was, locale)}
          </span>
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-700">
            {t('saleBadge')}
          </span>
        </>
      ) : null}
      <span className="text-brand-600">
        {showFromPrefix ? `${t('startingFrom')} ` : null}
        {formatPrice(current, locale)}
      </span>
    </span>
  );
}
