'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import type { Product, ProductType } from '@/lib/data/catalog';
import {
  getCategoryForProductType,
  productCategoryHref,
} from '@/lib/products/product-nav';
import { PRODUCT_OFFERING_PATHS } from '@/lib/products/paths';
import type { ProductDesignCatalogEntry } from '@/lib/products/design-catalog';
import type { CategoryMockupPreview } from '@/lib/products/product-type-design-categories';
import { ProductCardGrid } from '@/components/products/ProductCardGrid';
import { ProductTypeDesignCategories } from '@/components/products/ProductTypeDesignCategories';
import { ProductTypeReadyDesignsSection } from '@/components/products/ProductTypeReadyDesignsSection';
import { ProductTypeSuggestions } from '@/components/products/ProductTypeSuggestions';
import { Reveal } from '@/components/motion/Reveal';

type ProductTypeCatalogProps = {
  type: ProductType;
  products: Product[];
  readyDesignEntries: ProductDesignCatalogEntry[];
  categoryPreviews?: Record<string, CategoryMockupPreview>;
};

export function ProductTypeCatalog({
  type,
  products,
  readyDesignEntries,
  categoryPreviews,
}: ProductTypeCatalogProps) {
  const t = useTranslations('products');
  const tt = useTranslations('products.typePages');
  const tNav = useTranslations('nav.productsMenu.categories');
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

      <section id="products-grid" className="scroll-mt-24 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink-900 sm:text-2xl">
              {tt('plainProductsTitle')}
            </h2>
            <p className="mt-1 text-sm text-ink-600">{tt('plainProductsSubtitle')}</p>
          </div>
          {readyDesignEntries.length > 0 ? (
            <a
              href="#ready-designs"
              className="text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              {tt('jumpToReadyDesigns', { count: readyDesignEntries.length })}
            </a>
          ) : null}
        </div>

        <Reveal delay={80}>
          <ProductCardGrid items={products} />
        </Reveal>

        <ProductTypeDesignCategories
          type={type}
          categoryPreviews={categoryPreviews}
        />
      </section>

      <ProductTypeReadyDesignsSection
        type={type}
        entries={readyDesignEntries}
      />

      <ProductTypeSuggestions type={type} />
    </div>
  );
}
