'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  getProductMockup,
  isImageDesignTemplate,
  isTextDesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { buildCustomizerUrl } from '@/lib/products/paths';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/routing';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import Image from 'next/image';

type ProductDesignSectionProps = {
  id: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
  product: Product;
  color: string;
  size?: string;
  designs: ProductDesignTemplate[];
  limit?: number;
  seeAllHref?: string;
  seeAllLabel?: string;
};

export function ProductDesignSection({
  id,
  icon,
  title,
  hint,
  product,
  color,
  size,
  designs,
  limit,
  seeAllHref,
  seeAllLabel,
}: ProductDesignSectionProps) {
  const visibleDesigns = limit ? designs.slice(0, limit) : designs;
  const showSeeAll = Boolean(seeAllHref && limit && designs.length > limit);

  return (
    <section id={id} className="scroll-mt-28">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
            <p className="text-ink-500">{hint}</p>
          </div>
        </div>
        {showSeeAll ? (
          <Link
            href={seeAllHref!}
            className="shrink-0 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            {seeAllLabel} →
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleDesigns.map((design) => (
          <DesignCard
            key={design.id}
            product={product}
            design={design}
            color={color}
            size={size}
          />
        ))}
      </div>

      {showSeeAll ? (
        <div className="mt-6 flex justify-center sm:hidden">
          <Link href={seeAllHref!} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              {seeAllLabel}
            </Button>
          </Link>
        </div>
      ) : null}
    </section>
  );
}

function DesignCard({
  product,
  design,
  color,
  size,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
  size?: string;
}) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const productLabel = product.nameKey
    ? ti(product.nameKey)
    : tp(product.type);

  return (
    <Card className="overflow-hidden p-0">
      {isTextDesignTemplate(design) ? (
        <DesignTemplatePreview
          product={product}
          color={color}
          design={design}
          typeLabel={productLabel}
        />
      ) : isImageDesignTemplate(design) ? (
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-50 to-brand-100">
          <Image
            src={design.image!}
            alt={t(`designs.${design.nameKey}`)}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className="object-contain p-4"
          />
        </div>
      ) : null}

      <div className="space-y-3 p-4">
        <p className="font-medium text-ink-900">
          {t(`designs.${design.nameKey}`)}
        </p>
        {isTextDesignTemplate(design) && design.textStyle && (
          <p className="line-clamp-2 whitespace-pre-line text-sm text-ink-500">
            {design.textStyle.text}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href={buildCustomizerUrl(product.id, product.type, {
              design: design.id,
              color,
              size,
            })}
          >
            <Button size="sm" className="w-full">
              {isTextDesignTemplate(design)
                ? td('customizeWithPhoto')
                : td('customizeDesign')}
            </Button>
          </Link>
          {isImageDesignTemplate(design) && (
            <OrderWithDesignButton
              product={product}
              design={design}
              color={color}
            />
          )}
        </div>
      </div>
    </Card>
  );
}

function OrderWithDesignButton({
  product,
  design,
  color,
}: {
  product: Product;
  design: ProductDesignTemplate;
  color: string;
}) {
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const ti = useTranslations('products.items');
  const t = useTranslations('products');
  const { addItem } = useCart();
  const router = useRouter();
  const productLabel = product.nameKey
    ? ti(product.nameKey)
    : tp(product.type);

  function handleOrder() {
    const metadata: Record<string, string | number | boolean> = {
      productId: product.id,
      color,
      designTemplateId: design.id,
      designSide: design.defaultSide,
      designKind: design.kind,
    };

    addItem({
      type: 'product',
      name: `${productLabel} — ${t(`designs.${design.nameKey}`)}`,
      price: product.basePrice,
      quantity: 1,
      designPreview:
        design.image ?? getProductMockup(product, color, design.defaultSide),
      metadata,
    });
    router.push('/cart');
  }

  return (
    <Button size="sm" variant="outline" className="w-full" onClick={handleOrder}>
      {td('orderWithDesign')}
    </Button>
  );
}
