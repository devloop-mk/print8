'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  products,
  getProductDesignTemplatesByCategory,
  getProductMockup,
  isImageDesignTemplate,
  isTextDesignTemplate,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/routing';
import { ProductImageCarousel } from '@/components/products/ProductImageCarousel';
import { DesignTemplatePreview } from '@/components/products/DesignTemplatePreview';
import Image from 'next/image';
import { ArrowLeft, Palette, Sparkles, Type, LayoutGrid } from 'lucide-react';

function scrollToPremadeDesigns() {
  document.getElementById('premade-designs')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export function ProductDetail({ productId }: { productId: string }) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');
  const locale = useLocale();

  const product = useMemo(
    () => products.find((p) => p.id === productId),
    [productId],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] ?? '');

  const imageDesigns = useMemo(
    () =>
      product
        ? getProductDesignTemplatesByCategory(product, 'image-designs')
        : [],
    [product],
  );

  const textDesigns = useMemo(
    () =>
      product
        ? getProductDesignTemplatesByCategory(product, 'text-designs')
        : [],
    [product],
  );

  const hasPremadeDesigns = textDesigns.length > 0 || imageDesigns.length > 0;

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  return (
    <div className="space-y-10">
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" />
        {td('backToProducts')}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-6">
          <p className="mb-4 text-sm font-medium text-ink-500">
            {td('blankProduct')}
          </p>
          <ProductImageCarousel
            product={product}
            color={color}
            typeLabel={tp(product.type)}
          />

          {product.colors && (
            <div className="mt-6 w-full max-w-sm">
              <label className="mb-2 block text-center text-sm font-medium text-ink-700">
                {t('customizer.selectColor')}
              </label>
              <div className="flex justify-center gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-11 w-11 rounded-full border-2 transition ${
                      color === c
                        ? 'border-brand-600 ring-2 ring-brand-200'
                        : 'border-ink-200'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes && (
            <div className="mt-4 w-full max-w-sm">
              <label className="mb-2 block text-center text-sm font-medium text-ink-700">
                {t('customizer.selectSize')}
              </label>
              <div className="flex flex-wrap justify-center gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-h-10 min-w-10 rounded-lg px-3 py-1.5 text-sm font-medium ${
                      size === s
                        ? 'bg-brand-600 text-white'
                        : 'bg-ink-100 text-ink-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-ink-900">
              {tp(product.type)}
            </h1>
            <p className="mt-2 text-xl text-brand-600">
              {t('startingFrom')} {formatPrice(product.basePrice, locale)}
            </p>
            <p className="mt-4 text-ink-600">{td('description')}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/products/customize/${product.type}?id=${product.id}`}
              className="flex-1"
            >
              <Button size="lg" className="w-full gap-2">
                <Palette className="h-5 w-5" />
                {td('customizeYourOwn')}
              </Button>
            </Link>
            {hasPremadeDesigns ? (
              <Button
                size="lg"
                variant="outline"
                className="w-full flex-1 gap-2"
                onClick={scrollToPremadeDesigns}
              >
                <LayoutGrid className="h-5 w-5" />
                {td('choosePremadeDesigns')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {hasPremadeDesigns ? (
        <div id="premade-designs" className="scroll-mt-24 space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">{td('premadeDesigns')}</h2>
            <p className="mt-1 text-ink-500">{td('premadeDesignsHint')}</p>
          </div>

          {textDesigns.length > 0 && (
            <DesignSection
              icon={<Type className="h-6 w-6 text-brand-600" />}
              title={td('textDesigns')}
              hint={td('textDesignsHint')}
              product={product}
              color={color}
              designs={textDesigns}
            />
          )}

          {imageDesigns.length > 0 && (
            <DesignSection
              icon={<Sparkles className="h-6 w-6 text-brand-600" />}
              title={td('imageDesigns')}
              hint={td('imageDesignsHint')}
              product={product}
              color={color}
              designs={imageDesigns}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function DesignSection({
  icon,
  title,
  hint,
  product,
  color,
  designs,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  product: Product;
  color: string;
  designs: ProductDesignTemplate[];
}) {
  const t = useTranslations('products');
  const td = useTranslations('products.detail');
  const tp = useTranslations('products.types');

  return (
    <section>
      <div className="mb-6 flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-2xl font-bold text-ink-900">{title}</h2>
          <p className="text-ink-500">{hint}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {designs.map((design) => (
          <Card key={design.id} className="overflow-hidden p-0">
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
                <p className="text-sm text-ink-500 line-clamp-2 whitespace-pre-line">
                  {design.textStyle.text}
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Link
                  href={`/products/customize/${product.type}?id=${product.id}&design=${design.id}`}
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
        ))}
      </div>
    </section>
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
  const t = useTranslations('products');
  const { addItem } = useCart();
  const router = useRouter();

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
      name: `${tp(product.type)} — ${t(`designs.${design.nameKey}`)}`,
      price: product.basePrice,
      quantity: 1,
      designPreview: design.image ?? getProductMockup(product, color, design.defaultSide),
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
