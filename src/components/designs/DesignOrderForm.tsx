'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuantityInput } from '@/components/ui/QuantityInput';
import { formatPrice, cn } from '@/lib/utils';
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
import { BusinessCardPrintOptions } from '@/components/designs/BusinessCardPrintOptions';
import {
  businessCardPrintMetadata,
  DEFAULT_BUSINESS_CARD_LAMINATION,
  DEFAULT_BUSINESS_CARD_PAPER,
  parseBusinessCardPrintOptions,
  type BusinessCardLamination,
  type BusinessCardPaper,
} from '@/lib/designs/business-card-print-options';

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

type BusinessCardOrderStep = 'print' | 'details';

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
  const [paper, setPaper] = useState<BusinessCardPaper>(DEFAULT_BUSINESS_CARD_PAPER);
  const [lamination, setLamination] = useState<BusinessCardLamination>(
    DEFAULT_BUSINESS_CARD_LAMINATION,
  );
  const [errors, setErrors] = useState<Partial<Record<DesignOrderFieldId, string>>>(
    {},
  );
  const [unavailableError, setUnavailableError] = useState<string | null>(null);
  const isBusinessCard = template.category === 'business-cards';
  const [step, setStep] = useState<BusinessCardOrderStep>(
    isBusinessCard ? 'print' : 'details',
  );

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
    if (template.category === 'business-cards') {
      const options = parseBusinessCardPrintOptions(editingItem.metadata);
      setPaper(options.paper);
      setLamination(options.lamination);
    }
  }, [editingItem, fields, template.id, template.category]);

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
    if (isBusinessCard && step === 'print') {
      setStep('details');
      return;
    }
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
      ...(isBusinessCard
        ? businessCardPrintMetadata({ paper, lamination })
        : {}),
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

  const showPrintStep = isBusinessCard && step === 'print';
  const showDetailsStep = !isBusinessCard || step === 'details';

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
        {isBusinessCard ? (
          <nav aria-label={t('stepsNav')} className="mb-6">
            <ol className="flex flex-wrap gap-2">
              {(['print', 'details'] as const).map((item, index) => {
                const isActive = step === item;
                const isDone = step === 'details' && item === 'print';
                return (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item === 'print' || step === 'details') setStep(item);
                      }}
                      aria-current={isActive ? 'step' : undefined}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                        isActive
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : isDone
                            ? 'border-brand-200 bg-brand-50/60 text-brand-600 hover:border-brand-500'
                            : 'border-ink-200 bg-white text-ink-500',
                      )}
                    >
                      <span className="mr-1.5 tabular-nums">{index + 1}.</span>
                      {t(`steps.${item}`)}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        <h2 className="text-xl font-bold text-ink-900">
          {showPrintStep ? t('printStepTitle') : t('formTitle')}
        </h2>
        <p className="mt-2 text-ink-600">
          {showPrintStep ? t('printStepSubtitle') : t('formSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          {showPrintStep ? (
            <>
              <BusinessCardPrintOptions
                paper={paper}
                lamination={lamination}
                onPaperChange={setPaper}
                onLaminationChange={setLamination}
              />
              <Button type="submit" size="lg" className="w-full gap-1 sm:w-auto">
                {t('nextStep')}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          ) : null}

          {showDetailsStep ? (
            <>
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
                <QuantityInput
                  id="quantity"
                  name="quantity"
                  min={1}
                  max={500}
                  value={quantity}
                  onChange={setQuantity}
                  className="w-24"
                />
              </div>

              <p className="text-xs text-ink-500">{t('requiredNote')}</p>
              {unavailableError ? (
                <p className="text-sm text-amber-800">{unavailableError}</p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {isBusinessCard ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full gap-1 sm:w-auto"
                    onClick={() => setStep('print')}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    {t('prevStep')}
                  </Button>
                ) : null}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full sm:w-auto"
                  disabled={!orderable}
                >
                  {editCartItemId ? t('updateCart') : t('addToCart')}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      </div>
    </div>
  );
}
