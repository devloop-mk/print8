'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  products,
  getProductDesignTemplates,
  getProductDesignTemplatesByCategory,
  type ProductDesignCategory,
} from '@/lib/data/catalog';
import { getProductPaths } from '@/lib/products/paths';
import { getProductDisplayPrice } from '@/lib/products/tshirt-print-pricing';
import { formatPrice } from '@/lib/utils';
import { ProductDesignSection } from '@/components/products/ProductDesignSection';
import { CatalogPagination } from '@/components/catalog/CatalogPagination';
import { useCatalogPagination } from '@/hooks/useCatalogPagination';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowLeft, Sparkles, Type } from 'lucide-react';

type ProductDesignsPageProps = {
  productId: string;
  category?: ProductDesignCategory | 'all';
};

export function ProductDesignsPage({
  productId,
  category = 'all',
}: ProductDesignsPageProps) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const locale = useLocale();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [productId],
  );

  const designs = useMemo(
    () =>
      product
        ? category === 'all'
          ? getProductDesignTemplates(product)
          : getProductDesignTemplatesByCategory(product, category)
        : [],
    [product, category],
  );

  const { page, setPage, paginate } = useCatalogPagination({
    totalItems: designs.length,
  });

  const visibleDesigns = useMemo(() => paginate(designs), [designs, paginate]);
  const tc = useTranslations('products.catalog');

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  const paths = getProductPaths(product.id, product.type);
  const isPhoto = category === 'image-designs';
  const isText = category === 'text-designs';
  const sectionTitle = isPhoto
    ? td('imageDesigns')
    : isText
      ? td('textDesigns')
      : td('premadeDesigns');
  const sectionHint = isPhoto
    ? td('imageDesignsPageHint')
    : isText
      ? td('textDesignsPageHint')
      : td('premadeDesignsPageHint');
  const sectionId =
    category === 'all' ? 'premade-designs' : isPhoto ? 'photo-designs' : 'text-designs';

  return (
    <div className="space-y-8">
      <Link
        href={paths.detail}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProduct')}
      </Link>

      <Reveal>
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-brand-600">{tp(product.type)}</p>
          <h1 className="mt-1 text-3xl font-bold text-ink-900">{sectionTitle}</h1>
          <p className="mt-2 text-ink-600">{sectionHint}</p>
          <p className="mt-2 text-brand-600">
            {t('startingFrom')} {formatPrice(getProductDisplayPrice(product), locale)}
          </p>
        </div>
      </Reveal>

      <Reveal delay={100}>
        <ProductDesignSection
          id={sectionId}
          icon={
            isText ? (
              <Type className="h-6 w-6 text-brand-600" />
            ) : (
              <Sparkles className="h-6 w-6 text-brand-600" />
            )
          }
          title={sectionTitle}
          hint={sectionHint}
          product={product}
          designs={visibleDesigns}
        />
        <CatalogPagination
          page={page}
          totalItems={designs.length}
          onPageChange={setPage}
          previousLabel={tc('paginationPrevious')}
          nextLabel={tc('paginationNext')}
          pageLabel={(current, total) => tc('paginationPage', { current, total })}
        />
      </Reveal>
    </div>
  );
}
