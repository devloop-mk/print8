'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { Product } from '@/lib/data/catalog';
import {
  groupDrinkwareProducts,
  type DrinkwareProductGroup,
} from '@/lib/products/drinkware-product-options';
import { cn } from '@/lib/utils';

export function DrinkwareProductSelector({
  products: drinkwareProducts,
  value,
  onChange,
  className,
}: {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  className?: string;
}) {
  const t = useTranslations('products.customizer');
  const tProducts = useTranslations('products');
  const tTypes = useTranslations('products.types');
  const tItems = useTranslations('products.items');

  if (drinkwareProducts.length <= 1) return null;

  const groups = groupDrinkwareProducts(drinkwareProducts);

  function productLabel(product: Product) {
    if (product.nameKey) {
      return tItems(product.nameKey);
    }
    return tTypes(product.type);
  }

  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-medium text-ink-700">
        {t('selectDrinkware')}
      </label>
      <div className="space-y-4">
        {groups.map((group) => (
          <DrinkwareProductGroupSection
            key={group.type}
            group={group}
            value={value}
            onChange={onChange}
            groupLabel={tProducts(`typesPlural.${group.type}`)}
            productLabel={productLabel}
          />
        ))}
      </div>
    </div>
  );
}

function DrinkwareProductGroupSection({
  group,
  value,
  onChange,
  groupLabel,
  productLabel,
}: {
  group: DrinkwareProductGroup;
  value: string;
  onChange: (productId: string) => void;
  groupLabel: string;
  productLabel: (product: Product) => string;
}) {
  if (group.products.length === 1 && group.products[0].id === value) {
    return null;
  }

  return (
    <div>
      {group.products.length > 1 ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {groupLabel}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        {group.products.map((product) => {
          const selected = product.id === value;
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onChange(product.id)}
              className={cn(
                'flex min-h-[4.5rem] flex-col items-center gap-1.5 rounded-xl border px-2 py-2 text-center transition',
                selected
                  ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500/30'
                  : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50',
              )}
            >
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                <Image
                  src={product.image}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-contain p-0.5"
                />
              </span>
              <span
                className={cn(
                  'line-clamp-2 text-[11px] font-medium leading-tight',
                  selected ? 'text-brand-800' : 'text-ink-700',
                )}
              >
                {productLabel(product)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
