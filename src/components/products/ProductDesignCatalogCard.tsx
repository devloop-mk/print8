'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  resolveDesignProduct,
  type ProductDesignCatalogEntry,
} from '@/lib/products/design-catalog';
import {
  isImageDesignTemplate,
  isOverlayDesignTemplate,
  isTextDesignTemplate,
} from '@/lib/data/catalog';
import {
  getDesignApplicableColors,
  resolveDesignPreviewColor,
} from '@/lib/products/design-applicable-colors';
import {
  buildPremadeDesignCartPayload,
} from '@/lib/products/premade-design-order';
import { capturePreviewElement } from '@/lib/products/capture-preview';
import { buildCustomizerUrl } from '@/lib/products/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/navigation';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import { DesignColorPicker } from '@/components/products/DesignColorPicker';

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
  const tCustomizer = useTranslations('products.customizer');
  const { addItem } = useCart();
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [ordering, setOrdering] = useState(false);

  const { product } = resolveDesignProduct(entry, colorFilter);
  const { design } = entry;

  const applicableColors = useMemo(
    () => getDesignApplicableColors(design, product),
    [design, product],
  );

  const [color, setColor] = useState(() => {
    if (
      colorFilter !== 'all' &&
      applicableColors.some(
        (value) => value.toLowerCase() === colorFilter.toLowerCase(),
      )
    ) {
      return colorFilter;
    }
    return resolveDesignPreviewColor(design, product);
  });

  const previewColor = resolveDesignPreviewColor(design, product, color);
  const canQuickOrder =
    isImageDesignTemplate(design) || isOverlayDesignTemplate(design);

  async function handleOrder() {
    setOrdering(true);
    try {
      let capturedPreview: string | undefined;
      if (previewRef.current) {
        capturedPreview = await capturePreviewElement(previewRef.current);
      }

      addItem(
        buildPremadeDesignCartPayload({
          product,
          design,
          color: previewColor,
          name: `${tp(product.type)} — ${t(`designs.${design.nameKey}`)}`,
          price: product.basePrice,
          capturedPreview,
        }),
      );
      router.push('/cart');
    } finally {
      setOrdering(false);
    }
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <div ref={previewRef}>
        {isTextDesignTemplate(design) || isOverlayDesignTemplate(design) ? (
          <DesignTemplatePreview
            product={product}
            color={previewColor}
            design={design}
            typeLabel={tp(product.type)}
          />
        ) : isImageDesignTemplate(design) ? (
          <div className="relative aspect-square overflow-hidden bg-white">
            <Image
              src={design.image!}
              alt={t(`designs.${design.nameKey}`)}
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className="object-contain p-4"
            />
          </div>
        ) : null}
      </div>

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

        <DesignColorPicker
          colors={applicableColors}
          value={previewColor}
          onChange={setColor}
        />

        <div className="mt-auto flex flex-col gap-2">
          {canQuickOrder ? (
            <Button
              size="sm"
              className="w-full"
              onClick={handleOrder}
              loading={ordering}
              disabled={ordering}
            >
              {ordering ? tCustomizer('capturing') : td('orderWithDesign')}
            </Button>
          ) : null}
          <Link
            href={buildCustomizerUrl(product.id, product.type, {
              design: design.id,
              color: previewColor,
            })}
          >
            <Button
              size="sm"
              variant={canQuickOrder ? 'outline' : 'primary'}
              className="w-full"
            >
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
