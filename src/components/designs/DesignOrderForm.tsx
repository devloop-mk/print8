'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import type { DesignTemplate } from '@/lib/data/catalog';
import { getDesignThumbAspect } from '@/lib/designs/design-thumb';
import {
  categoryOrderFields,
  designCategoryPrices,
  requiredOrderFields,
  type DesignOrderFieldId,
} from '@/lib/data/design-order-fields';
import {
  cartItemMatchesDesignTemplate,
  parseOrderFieldsFromCartMetadata,
} from '@/lib/cart/design-cart';

const fieldInputType: Partial<
  Record<DesignOrderFieldId, 'text' | 'email' | 'tel' | 'url' | 'date' | 'textarea'>
> = {
  email: 'email',
  phone: 'tel',
  website: 'url',
  eventDate: 'date',
  additionalInfo: 'textarea',
  address: 'textarea',
};

export function DesignOrderForm({
  template,
  displayName,
  orderable = true,
  exclusive = false,
}: {
  template: DesignTemplate;
  displayName: string;
  orderable?: boolean;
  exclusive?: boolean;
}) {
  const t = useTranslations('designs.order');
  const td = useTranslations('designs');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addItem, updateItem, items: cartItems } = useCart();

  const fields = categoryOrderFields[template.category];
  const required = requiredOrderFields[template.category];
  const price =
    'customPrice' in template && typeof template.customPrice === 'number'
      ? template.customPrice
      : designCategoryPrices[template.category];

  const [values, setValues] = useState<Partial<Record<DesignOrderFieldId, string>>>(
    {},
  );
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<Partial<Record<DesignOrderFieldId, string>>>(
    {},
  );
  const [unavailableError, setUnavailableError] = useState<string | null>(null);

  const editingItem = useMemo(
    () =>
      editCartItemId
        ? cartItems.find((item) => item.id === editCartItemId)
        : undefined,
    [editCartItemId, cartItems],
  );

  useEffect(() => {
    if (!cartItemMatchesDesignTemplate(editingItem, template.id)) return;
    setValues(parseOrderFieldsFromCartMetadata(editingItem.metadata ?? {}, fields));
    if (editingItem.quantity > 0) {
      setQuantity(editingItem.quantity);
    }
  }, [editingItem, fields, template.id]);

  function updateField(id: DesignOrderFieldId, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  }

  function validate() {
    const next: Partial<Record<DesignOrderFieldId, string>> = {};
    for (const field of required) {
      if (!values[field]?.trim()) {
        next[field] = t('required');
      }
    }
    if (values.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = t('invalidEmail');
    }
    if (values.phone?.trim() && values.phone.trim().length < 8) {
      next.phone = t('invalidPhone');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderable) return;
    if (!validate()) return;

    if (exclusive) {
      const availabilityResponse = await fetch(
        `/api/designs/${template.id}/availability`,
      );
      if (availabilityResponse.ok) {
        const availability = await availabilityResponse.json();
        if (!availability.available) {
          setUnavailableError(t('unavailableDesign'));
          return;
        }
      }
    }
    setUnavailableError(null);

    const metadata: Record<string, string | number | boolean> = {
      designTemplateId: template.id,
      category: template.category,
      orderType: 'template-info',
    };

    for (const field of fields) {
      const value = values[field]?.trim();
      if (value) metadata[field] = value;
    }

    const cartPayload = {
      type: 'design' as const,
      name: `${td(`categories.${template.category}`)} — ${displayName}`,
      price,
      quantity,
      designPreview: resolveAssetUrl(template.image),
      metadata,
    };

    if (editCartItemId) {
      updateItem(editCartItemId, cartPayload);
    } else {
      addItem(cartPayload);
    }
    router.push('/cart');
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
      <Card className="overflow-hidden p-0">
        <div
          className="relative bg-gradient-to-br from-ink-50 to-ink-100"
          style={{ aspectRatio: getDesignThumbAspect(template) }}
        >
          <Image
            src={resolveAssetUrl(template.image)}
            alt={displayName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6"
            priority
          />
        </div>
        <div className="border-t border-ink-100 p-4">
          <p className="text-sm text-ink-500">{t('previewNote')}</p>
          <p className="mt-2 text-lg font-semibold text-brand-600">
            {t('startingFrom')} {formatPrice(price, locale)}
          </p>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-ink-900">{t('formTitle')}</h2>
        <p className="mt-2 text-ink-600">{t('formSubtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <fieldset className="space-y-4">
            <legend className="sr-only">{t('formTitle')}</legend>
            {fields.map((field) => {
              const inputType = fieldInputType[field] ?? 'text';
              const isRequired = required.includes(field);
              const errorId = `${field}-error`;

              if (inputType === 'textarea') {
                return (
                  <div key={field}>
                    <label
                      htmlFor={field}
                      className="mb-1.5 block text-sm font-medium text-ink-700"
                    >
                      {t(`fields.${field}`)}
                      {isRequired && (
                        <span className="text-brand-600" aria-hidden="true">
                          {' '}
                          *
                        </span>
                      )}
                    </label>
                    <textarea
                      id={field}
                      name={field}
                      rows={3}
                      value={values[field] ?? ''}
                      onChange={(e) => updateField(field, e.target.value)}
                      required={isRequired}
                      aria-required={isRequired}
                      aria-invalid={Boolean(errors[field])}
                      aria-describedby={errors[field] ? errorId : undefined}
                      className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder={t(`placeholders.${field}`)}
                    />
                    {errors[field] && (
                      <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                        {errors[field]}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div key={field}>
                  <label
                    htmlFor={field}
                    className="mb-1.5 block text-sm font-medium text-ink-700"
                  >
                    {t(`fields.${field}`)}
                    {isRequired && (
                      <span className="text-brand-600" aria-hidden="true">
                        {' '}
                        *
                      </span>
                    )}
                  </label>
                  <input
                    id={field}
                    name={field}
                    type={inputType}
                    value={values[field] ?? ''}
                    onChange={(e) => updateField(field, e.target.value)}
                    required={isRequired}
                    aria-required={isRequired}
                    aria-invalid={Boolean(errors[field])}
                    aria-describedby={errors[field] ? errorId : undefined}
                    autoComplete={
                      field === 'email'
                        ? 'email'
                        : field === 'phone'
                          ? 'tel'
                          : field === 'fullName'
                            ? 'name'
                            : undefined
                    }
                    className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                    placeholder={t(`placeholders.${field}`)}
                  />
                  {errors[field] && (
                    <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                      {errors[field]}
                    </p>
                  )}
                </div>
              );
            })}
          </fieldset>

          <div>
            <label
              htmlFor="quantity"
              className="mb-1.5 block text-sm font-medium text-ink-700"
            >
              {t('quantity')}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
              }
              className="w-24 rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <p className="text-xs text-ink-500">{t('requiredNote')}</p>
          {unavailableError ? (
            <p className="text-sm text-amber-800">{unavailableError}</p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={!orderable}
          >
            {editCartItemId ? t('updateCart') : t('addToCart')}
          </Button>
        </form>
      </div>
    </div>
  );
}
