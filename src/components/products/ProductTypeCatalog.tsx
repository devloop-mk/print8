'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { products, type ProductType } from '@/lib/data/catalog';
import {
  getCategoryForProductType,
  productCategoryHref,
} from '@/lib/products/product-nav';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { ProductTypeSuggestions } from '@/components/products/ProductTypeSuggestions';
import { Reveal } from '@/components/motion/Reveal';

export function ProductTypeCatalog({ type }: { type: ProductType }) {
  const t = useTranslations('products');
  const tt = useTranslations('products.typePages');
  const tNav = useTranslations('nav.productsMenu.categories');
  const filtered = products.filter((product) => product.type === type);
  const parentCategory = getCategoryForProductType(type);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <Link
          href={PRODUCT_OFFERING_PATHS.all}
          className="inline-flex items-center gap-2 font-medium text-ink-600 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {tt('backToAll')}
        </Link>
        {parentCategory ? (
          <>
            <span className="text-ink-300" aria-hidden>
              /
            </span>
            <Link
              href={productCategoryHref(parentCategory.id)}
              className="font-medium text-ink-600 transition hover:text-brand-600"
            >
              {tNav(parentCategory.id)}
            </Link>
          </>
        ) : null}
      </div>

      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {parentCategory ? tNav(parentCategory.id) : t('title')}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-ink-900 sm:text-4xl">
          {t(`typesPlural.${type}`)}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-600">
          {tt(`${type}.subtitle`)}
        </p>
      </div>

      <Reveal delay={80}>
        <div id="products-grid" className="scroll-mt-24">
          <ProductCardGrid items={filtered} />
        </div>
      </Reveal>

      <ProductTypeSuggestions type={type} />
    </div>
  );
}
