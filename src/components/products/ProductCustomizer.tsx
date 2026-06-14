'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/routing';
import { products } from '@/lib/data/catalog';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { SecureUpload } from '@/components/upload/SecureUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import type { ProductType } from '@/lib/data/catalog';
import { Shirt } from 'lucide-react';

export function ProductCustomizer({ type }: { type: ProductType }) {
  const t = useTranslations('products.customizer');
  const tp = useTranslations('products.types');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { token } = useUploadSession();

  const productId = searchParams.get('id');
  const product = useMemo(
    () =>
      products.find((p) => p.id === productId) ||
      products.find((p) => p.type === type),
    [productId, type],
  );

  const [color, setColor] = useState(product?.colors?.[0] || '#ffffff');
  const [size, setSize] = useState(product?.sizes?.[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [uploadedFile, setUploadedFile] = useState<{
    fileId: string;
    name: string;
  } | null>(null);

  if (!product) {
    return <p>Product not found</p>;
  }

  function handleAddToCart() {
    addItem({
      type: 'product',
      name: `${tp(type)} (${size})`,
      price: product!.basePrice,
      quantity,
      metadata: {
        productId: product!.id,
        color,
        size,
      },
      fileIds: uploadedFile ? [uploadedFile.fileId] : [],
    });
    router.push('/cart');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="flex aspect-square items-center justify-center">
        <div
          className="flex h-80 w-80 items-center justify-center rounded-2xl shadow-inner transition-colors"
          style={{ backgroundColor: color }}
        >
          {uploadedFile ? (
            <p className="rounded-lg bg-white/80 px-4 py-2 text-sm text-ink-700">
              ✓ {uploadedFile.name}
            </p>
          ) : product.image ? (
            <div className="relative h-64 w-64">
              <Image
                src={product.image}
                alt={tp(type)}
                fill
                sizes="256px"
                className="object-contain"
              />
            </div>
          ) : (
            <Shirt className="h-32 w-32 text-ink-400" />
          )}
        </div>
      </Card>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-ink-900">{tp(type)}</h2>
          <p className="mt-1 text-lg text-brand-600">
            {formatPrice(product.basePrice, locale)}
          </p>
        </div>

        {product.colors && (
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('selectColor')}
            </label>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
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
          <div>
            <label className="mb-2 block text-sm font-medium text-ink-700">
              {t('selectSize')}
            </label>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    size === s
                      ? 'bg-brand-600 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-ink-700">
            {t('quantity')}
          </label>
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-24 rounded-lg border border-ink-300 px-3 py-2"
          />
        </div>

        <Card>
          <h3 className="mb-3 font-semibold text-ink-900">
            {t('uploadDesign')}
          </h3>
          <SecureUpload
            token={token}
            onUpload={(fileId, name) => setUploadedFile({ fileId, name })}
          />
        </Card>

        <Button size="lg" onClick={handleAddToCart} className="w-full">
          Add to cart — {formatPrice(product.basePrice * quantity, locale)}
        </Button>
      </div>
    </div>
  );
}
