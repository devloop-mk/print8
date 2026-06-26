'use client';

import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomizableDesignPreview } from '@/components/designs/CustomizableDesignPreview';
import { formatPrice } from '@/lib/utils';
import type { DesignTemplate } from '@/lib/data/catalog';
import {
  designCategoryPrices,
  requiredOrderFields,
  type DesignOrderFieldId,
} from '@/lib/data/design-order-fields';
import {
  getDefaultFieldValues,
  getLayoutFields,
  type DesignColorTheme,
  type DesignLayout,
} from '@/lib/data/design-layouts';
import { ChevronLeft, ChevronRight, Palette, FileText, Layers, ShoppingCart, Info } from 'lucide-react';

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

type EditorStep = 'front' | 'back' | 'colors' | 'review';

const steps: EditorStep[] = ['front', 'back', 'colors', 'review'];

const stepIcons: Record<EditorStep, typeof FileText> = {
  front: FileText,
  back: Layers,
  colors: Palette,
  review: ShoppingCart,
};

export function CustomizableDesignForm({
  template,
  layout,
}: {
  template: DesignTemplate;
  layout: DesignLayout;
}) {
  const t = useTranslations('designs.customize');
  const td = useTranslations('designs');
  const to = useTranslations('designs.order');
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const visiblePreviewRef = useRef<HTMLDivElement>(null);

  const required = requiredOrderFields[template.category];
  const price = designCategoryPrices[template.category];
  const allFields = getLayoutFields(layout);

  const [step, setStep] = useState<EditorStep>('front');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [colors, setColors] = useState<DesignColorTheme>(layout.defaultColors);
  const [values, setValues] = useState<
    Partial<Record<DesignOrderFieldId, string>>
  >(() => getDefaultFieldValues(allFields, layout.id));
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<
    Partial<Record<DesignOrderFieldId, string>>
  >({});
  const [capturing, setCapturing] = useState(false);

  const stepIndex = steps.indexOf(step);

  function updateField(id: DesignOrderFieldId, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  }

  function applyPreset(presetId: string) {
    const preset = layout.presets.find((item) => item.id === presetId);
    if (preset) setColors(preset.colors);
  }

  function updateColor(key: keyof DesignColorTheme, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const next: Partial<Record<DesignOrderFieldId, string>> = {};
    for (const field of required) {
      if (!values[field]?.trim()) {
        next[field] = to('required');
      }
    }
    if (values.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      next.email = to('invalidEmail');
    }
    if (values.phone?.trim() && values.phone.trim().length < 8) {
      next.phone = to('invalidPhone');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function waitForPaint() {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  }

  async function captureSide(ref: React.RefObject<HTMLDivElement | null>) {
    if (!ref.current) return null;
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      backgroundColor: colors.background,
      useCORS: true,
    });
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  function goNext() {
    const next = steps[stepIndex + 1];
    if (next) {
      setStep(next);
      if (next === 'back') setPreviewSide('back');
      if (next === 'front') setPreviewSide('front');
      if (next === 'review') setPreviewSide('front');
    }
  }

  function goBack() {
    const prev = steps[stepIndex - 1];
    if (prev) {
      setStep(prev);
      if (prev === 'front') setPreviewSide('front');
      if (prev === 'back') setPreviewSide('back');
    }
  }

  async function handleSubmit() {
    if (!validate()) {
      setStep(
        required.some((field) => layout.frontFields.includes(field) && !values[field]?.trim())
          ? 'front'
          : 'back',
      );
      return;
    }

    setCapturing(true);
    try {
      setPreviewSide('front');
      await waitForPaint();
      const frontPreview = await captureSide(visiblePreviewRef);
      setPreviewSide('back');
      await waitForPaint();
      const backPreview = await captureSide(visiblePreviewRef);

      const metadata: Record<string, string | number | boolean> = {
        designTemplateId: template.id,
        category: template.category,
        orderType: 'customizable-template',
        layoutId: layout.id,
        accentColor: colors.accent,
        backgroundColor: colors.background,
        textColor: colors.text,
        secondaryColor: colors.secondary,
      };

      for (const field of allFields) {
        const value = values[field]?.trim();
        if (value) metadata[field] = value;
      }

      addItem({
        type: 'design',
        name: `${td(`categories.${template.category}`)} — ${td(`templates.${template.id}`)}`,
        price,
        quantity,
        designPreview: frontPreview ?? template.image,
        backDesignPreview: backPreview ?? undefined,
        metadata,
      });
      router.push('/cart');
    } finally {
      setCapturing(false);
    }
  }

  function renderFields(fields: DesignOrderFieldId[]) {
    return fields.map((field) => {
      const inputType = fieldInputType[field] ?? 'text';
      const isRequired = required.includes(field);
      const errorId = `${field}-error`;

      if (inputType === 'textarea') {
        return (
          <div key={field}>
            <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-ink-700">
              {to(`fields.${field}`)}
              {isRequired && <span className="text-brand-600"> *</span>}
            </label>
            <textarea
              id={field}
              rows={3}
              value={values[field] ?? ''}
              onChange={(e) => updateField(field, e.target.value)}
              aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? errorId : undefined}
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder={to(`placeholders.${field}`)}
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
          <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-ink-700">
            {to(`fields.${field}`)}
            {isRequired && <span className="text-brand-600"> *</span>}
          </label>
          <input
            id={field}
            type={inputType}
            value={values[field] ?? ''}
            onChange={(e) => updateField(field, e.target.value)}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={errors[field] ? errorId : undefined}
            className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder={to(`placeholders.${field}`)}
          />
          {errors[field] && (
            <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
              {errors[field]}
            </p>
          )}
        </div>
      );
    });
  }

  return (
    <div className="space-y-6">
      {template.category === 'menus' && (
        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">{t('menuInsideTitle')}</p>
            <p className="mt-1 text-sm leading-relaxed text-amber-900/90">
              {t('menuInsideNote')}
            </p>
          </div>
        </div>
      )}

      <nav aria-label={t('editorNav')}>
        <ol className="flex flex-col gap-1 md:grid md:grid-cols-4 md:gap-2">
          {steps.map((item, index) => {
            const Icon = stepIcons[item];
            const isActive = step === item;
            const isDone = index < stepIndex;
            return (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => {
                    setStep(item);
                    if (item === 'front' || item === 'review') setPreviewSide('front');
                    if (item === 'back') setPreviewSide('back');
                  }}
                  className={`flex w-full items-center rounded-xl border text-left transition ${
                    isActive
                      ? 'gap-3 border-brand-500 bg-brand-50 px-3 py-3 shadow-sm'
                      : `gap-2 px-2.5 py-2 md:gap-3 md:px-3 md:py-3 ${
                          isDone
                            ? 'border-ink-200 bg-white hover:border-brand-300'
                            : 'border-ink-200 bg-ink-50/60 hover:border-ink-300'
                        }`
                  }`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-full font-bold ${
                      isActive
                        ? 'h-8 w-8 bg-brand-600 text-sm text-white'
                        : isDone
                          ? 'h-6 w-6 bg-brand-100 text-xs text-brand-700 md:h-8 md:w-8 md:text-sm'
                          : 'h-6 w-6 bg-ink-200 text-xs text-ink-600 md:h-8 md:w-8 md:text-sm'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <Icon
                    className={`shrink-0 text-brand-600 ${
                      isActive ? 'h-4 w-4' : 'h-3.5 w-3.5 md:h-4 md:w-4'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-semibold text-ink-900 ${
                        isActive ? 'text-sm' : 'text-xs md:text-sm'
                      }`}
                    >
                      {t(`steps.${item}.title`)}
                    </span>
                    <span
                      className={`mt-0.5 block text-xs text-ink-500 ${
                        isActive ? '' : 'hidden md:block'
                      }`}
                    >
                      {t(`steps.${item}.hint`)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="grid gap-6 md:gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <Card className="order-1 overflow-hidden p-4 xl:sticky xl:top-24 xl:self-start">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-900">{t('livePreview')}</p>
            <div className="flex rounded-lg border border-ink-200 bg-ink-50 p-1">
              {(['front', 'back'] as const).map((side) => (
                <button
                  key={side}
                  type="button"
                  onClick={() => setPreviewSide(side)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    previewSide === side
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  {side === 'front' ? t('frontSide') : t('backSide')}
                </button>
              ))}
            </div>
          </div>

          <div ref={visiblePreviewRef} className="rounded-lg border border-ink-200 bg-ink-50 p-4">
            <CustomizableDesignPreview
              layout={layout}
              colors={colors}
              values={values}
              side={previewSide}
              className="mx-auto w-full max-w-xl"
            />
          </div>

          {step === 'review' && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-ink-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {t('frontSide')}
                </p>
                <CustomizableDesignPreview
                  layout={layout}
                  colors={colors}
                  values={values}
                  side="front"
                  className="w-full"
                />
              </div>
              <div className="rounded-lg border border-ink-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  {t('backSide')}
                </p>
                <CustomizableDesignPreview
                  layout={layout}
                  colors={colors}
                  values={values}
                  side="back"
                  className="w-full"
                />
              </div>
            </div>
          )}

          <p className="mt-4 text-sm text-ink-500">{t('previewNote')}</p>
          <p className="mt-2 text-lg font-semibold text-brand-600">
            {to('startingFrom')} {formatPrice(price, locale)}
          </p>
          {template.category === 'menus' && (
            <p className="mt-2 text-xs leading-relaxed text-amber-800">
              {t('menuPriceNote')}
            </p>
          )}
        </Card>

        <div className="order-2">
          <Card className="p-5 sm:p-6">
            {step === 'front' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">{t('steps.front.title')}</h2>
                  <p className="mt-1 text-sm text-ink-600">{t('steps.front.desc')}</p>
                </div>
                {renderFields(layout.frontFields)}
              </div>
            )}

            {step === 'back' && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">{t('steps.back.title')}</h2>
                  <p className="mt-1 text-sm text-ink-600">{t('steps.back.desc')}</p>
                </div>
                {renderFields(layout.backFields)}
              </div>
            )}

            {step === 'colors' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">{t('steps.colors.title')}</h2>
                  <p className="mt-1 text-sm text-ink-600">{t('steps.colors.desc')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {layout.presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm transition hover:border-brand-400"
                    >
                      <span className="flex gap-1">
                        <span
                          className="h-4 w-4 rounded-full border border-ink-200"
                          style={{ backgroundColor: preset.colors.accent }}
                        />
                        <span
                          className="h-4 w-4 rounded-full border border-ink-200"
                          style={{ backgroundColor: preset.colors.background }}
                        />
                      </span>
                      {t(`presets.${preset.id}`)}
                    </button>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['accent', t('accentColor')],
                      ['background', t('backgroundColor')],
                      ['text', t('textColor')],
                      ['secondary', t('secondaryColor')],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-medium text-ink-600">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="h-10 w-12 cursor-pointer rounded border border-ink-300"
                        />
                        <input
                          type="text"
                          value={colors[key]}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="w-full rounded-lg border border-ink-300 px-3 py-2 text-sm uppercase"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-ink-900">{t('steps.review.title')}</h2>
                  <p className="mt-1 text-sm text-ink-600">{t('steps.review.desc')}</p>
                </div>
                <div>
                  <label htmlFor="quantity" className="mb-1.5 block text-sm font-medium text-ink-700">
                    {to('quantity')}
                  </label>
                  <input
                    id="quantity"
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
                <p className="text-xs text-ink-500">{to('requiredNote')}</p>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('prevStep')}
              </Button>

              {step !== 'review' ? (
                <Button type="button" onClick={goNext} className="gap-1">
                  {t('nextStep')}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} loading={capturing} disabled={capturing} size="lg">
                  {capturing ? t('capturing') : to('addToCart')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
