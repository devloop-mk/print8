'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  isImageDesignTemplate,
  isTextDesignTemplate,
} from '@/lib/data/catalog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';

type ProductDesignCatalogCardProps = {
  entry: ProductDesignCatalogEntry;
  colorFilter: string | 'all';
};

export function ProductDesignCatalogCard({
  entry,
  colorFilter,
}: ProductDesignCatalogCardProps) {
  const t = useTranslations('products');
  const tc = useTranslations('products.catalog');
  const tp = useTranslations('products.types');
  const td = useTranslations('products.detail');

  const { product, color } = resolveDesignProduct(entry, colorFilter);
  const { design } = entry;
  const customizeHref = `/products/customize/${product.type}?id=${product.id}&design=${design.id}`;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      {isTextDesignTemplate(design) ? (
        <DesignTemplatePreview
          product={product}
          color={color}
          design={design}
          typeLabel={tp(product.type)}
        />
      ) : isImageDesignTemplate(design) ? (
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
          <Image
            src={design.image!}
            alt={t(`designs.${design.nameKey}`)}
            fill
            sizes="(max-width: 768px) 50vw, 320px"
            className="object-contain p-4"
          />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {entry.products.map((item) => (
            <span
              key={item.id}
              className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700"
            >
              {tp(item.type)}
            </span>
          ))}
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700">
            {design.defaultSide === 'back'
              ? tc('sideBack')
              : tc('sideFront')}
          </span>
        </div>

        <div>
          <p className="font-medium text-ink-900">
            {t(`designs.${design.nameKey}`)}
          </p>
          {isTextDesignTemplate(design) && design.textStyle ? (
            <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink-500">
              {design.textStyle.text}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Link href={customizeHref}>
            <Button size="sm" className="w-full">
              {isTextDesignTemplate(design)
                ? td('customizeWithPhoto')
                : td('customizeDesign')}
            </Button>
          </Link>
          <Link
            href={`/products/${product.id}`}
            className="text-center text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            {tc('viewProduct')} →
          </Link>
        </div>
      </div>
    </Card>
  );
}
