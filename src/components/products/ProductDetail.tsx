'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import {
  products,
  getProductMockup,
  getProductDesignTemplates,
  type Product,
  type ProductDesignTemplate,
} from '@/lib/data/catalog';
import { formatPrice } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/components/cart/CartProvider';
import { useRouter } from '@/i18n/routing';
import { Shirt, ArrowLeft, Palette, Sparkles } from 'lucide-react';

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
  const designs = useMemo(
    () => (product ? getProductDesignTemplates(product) : []),
    [product],
  );

  if (!product) {
    return <p>{td('notFound')}</p>;
  }

  const mockupImage = getProductMockup(product, color, 'front');

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
          <div className="relative flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl bg-gradient-to-br from-ink-50 to-ink-100 shadow-inner">
            {mockupImage ? (
              <div className="relative h-4/5 w-4/5">
                <Image
                  src={mockupImage}
                  alt={tp(product.type)}
                  fill
                  sizes="(max-width: 768px) 100vw, 400px"
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <Shirt className="h-32 w-32 text-ink-300" />
            )}
          </div>

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
            <ProductQuickOrderLink product={product} color={color} />
          </div>
        </div>
      </div>

      {designs.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-brand-600" />
            <div>
              <h2 className="text-2xl font-bold text-ink-900">
                {td('premadeDesigns')}
              </h2>
              <p className="text-ink-500">{td('premadeDesignsHint')}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {designs.map((design) => (
              <Card
                key={design.id}
                className="overflow-hidden p-0"
              >
                <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 p-6">
                  <div className="relative h-full w-full">
                    <Image
                      src={getProductMockup(product, color, design.defaultSide)}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-contain opacity-90"
                    />
                    <div
                      className="pointer-events-none absolute"
                      style={{
                        left: `${design.position?.x ?? 50}%`,
                        top: `${design.position?.y ?? 40}%`,
                        width: `${design.scale ?? 45}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <img
                        src={design.image}
                        alt=""
                        className="w-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <p className="font-medium text-ink-900">
                    {t(`designs.${design.nameKey}`)}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/products/customize/${product.type}?id=${product.id}&design=${design.id}`}
                    >
                      <Button size="sm" className="w-full">
                        {td('customizeDesign')}
                      </Button>
                    </Link>
                    <OrderWithDesignButton
                      product={product}
                      design={design}
                      color={color}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductQuickOrderLink({
  product,
  color,
}: {
  product: Product;
  color: string;
}) {
  const t = useTranslations('products');
  const tp = useTranslations('products.types');
  const { addItem } = useCart();
  const router = useRouter();

  function handleOrder() {
    addItem({
      type: 'product',
      name: tp(product.type),
      price: product.basePrice,
      quantity: 1,
      metadata: { productId: product.id, color },
    });
    router.push('/cart');
  }

  return (
    <Button
      size="lg"
      variant="outline"
      className="w-full flex-1"
      onClick={handleOrder}
    >
      {t('orderAsIs')}
    </Button>
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
    addItem({
      type: 'product',
      name: `${tp(product.type)} — ${t(`designs.${design.nameKey}`)}`,
      price: product.basePrice,
      quantity: 1,
      metadata: {
        productId: product.id,
        color,
        designTemplateId: design.id,
        designSide: design.defaultSide,
      },
    });
    router.push('/cart');
  }

  return (
    <Button size="sm" variant="outline" className="w-full" onClick={handleOrder}>
      {td('orderWithDesign')}
    </Button>
  );
}
