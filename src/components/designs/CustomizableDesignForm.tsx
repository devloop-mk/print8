'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CustomizableDesignPreview } from '@/components/designs/CustomizableDesignPreview';
import { DesignCustomizerStepNav } from '@/components/designs/DesignCustomizerStepNav';
import { DesignCustomizerMobileFieldBar } from '@/components/designs/DesignCustomizerMobileFieldBar';
import { UnsavedWorkDialog } from '@/components/shared/UnsavedWorkDialog';
import { useDirtySnapshot } from '@/hooks/useDirtySnapshot';
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard';
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
import { upsertDesignEditorDraft } from '@/lib/drafts/work-drafts';
import { findDesignEditorDraft } from '@/lib/drafts/ongoing-designs';
import { cn } from '@/lib/utils';
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
  const fieldInputRefs = useRef<Partial<Record<DesignOrderFieldId, HTMLElement | null>>>({});

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
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [activeField, setActiveField] = useState<DesignOrderFieldId | null>(null);

  useEffect(() => {
    const draft = findDesignEditorDraft(template.id);
    if (draft?.kind === 'layout') {
      const payload = draft.payload;
      if (payload.values && typeof payload.values === 'object') {
        setValues(payload.values as Partial<Record<DesignOrderFieldId, string>>);
      }
      if (payload.colors && typeof payload.colors === 'object') {
        setColors(payload.colors as DesignColorTheme);
      }
      if (
        payload.step === 'front' ||
        payload.step === 'back' ||
        payload.step === 'colors' ||
        payload.step === 'review'
      ) {
        setStep(payload.step);
      }
      if (typeof payload.quantity === 'number' && payload.quantity > 0) {
        setQuantity(payload.quantity);
      }
    }
    setDraftHydrated(true);
  }, [template.id]);

  const serializedDraft = useMemo(
    () => JSON.stringify({ values, colors, step, quantity }),
    [values, colors, step, quantity],
  );
  const { isDirty, markClean } = useDirtySnapshot(serializedDraft, draftHydrated);

  const saveDraft = useCallback(async () => {
    try {
      upsertDesignEditorDraft({
        id: `design-${template.id}`,
        name: td(`templates.${template.id}`),
        templateId: template.id,
        kind: 'layout',
        payload: { values, colors, step, quantity, layoutId: layout.id },
        updatedAt: new Date().toISOString(),
      });
      markClean();
      return true;
    } catch {
      return false;
    }
  }, [colors, layout.id, markClean, quantity, step, td, template.id, values]);

  const unsavedWorkGuard = useUnsavedWorkGuard({
    isDirty,
    onSave: saveDraft,
  });

  const stepIndex = steps.indexOf(step);
  const isTextStep = step === 'front' || step === 'back';
  const stepFields = step === 'front' ? layout.frontFields : layout.backFields;

  const focusField = useCallback((field: DesignOrderFieldId) => {
    setActiveField(field);
    if (window.matchMedia('(min-width: 768px)').matches) {
      window.requestAnimationFrame(() => {
        fieldInputRefs.current[field]?.focus();
        fieldInputRefs.current[field]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!isTextStep || stepFields.length === 0) {
      setActiveField(null);
      return;
    }

    setActiveField((current) =>
      current && stepFields.includes(current) ? current : stepFields[0],
    );
  }, [isTextStep, step, stepFields]);

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
      unsavedWorkGuard.allowNavigation();
      router.push('/cart');
    } finally {
      setCapturing(false);
    }
  }

  function goAdjacentField(direction: -1 | 1) {
    if (!activeField || stepFields.length === 0) return;
    const currentIndex = stepFields.indexOf(activeField);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= stepFields.length) return;
    focusField(stepFields[nextIndex]);
  }

  function renderFields(fields: DesignOrderFieldId[], compact = false) {
    return fields.map((field) => {
      const inputType = fieldInputType[field] ?? 'text';
      const isRequired = required.includes(field);
      const errorId = `${field}-error`;
      const isActive = activeField === field;

      if (inputType === 'textarea') {
        return (
          <div
            key={field}
            className={cn(compact && 'hidden md:block')}
          >
            <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-ink-700">
              {to(`fields.${field}`)}
              {isRequired && <span className="text-brand-600"> *</span>}
            </label>
            <textarea
              id={field}
              ref={(node) => {
                fieldInputRefs.current[field] = node;
              }}
              rows={3}
              value={values[field] ?? ''}
              onChange={(e) => updateField(field, e.target.value)}
              onFocus={() => setActiveField(field)}
              aria-invalid={Boolean(errors[field])}
              aria-describedby={errors[field] ? errorId : undefined}
              className={cn(
                'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
                isActive ? 'border-brand-400 bg-brand-50/40' : 'border-ink-300',
              )}
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
        <div
          key={field}
          className={cn(compact && 'hidden md:block')}
        >
          <label htmlFor={field} className="mb-1.5 block text-sm font-medium text-ink-700">
            {to(`fields.${field}`)}
            {isRequired && <span className="text-brand-600"> *</span>}
          </label>
          <input
            id={field}
            ref={(node) => {
              fieldInputRefs.current[field] = node;
            }}
            type={inputType}
            value={values[field] ?? ''}
            onChange={(e) => updateField(field, e.target.value)}
            onFocus={() => setActiveField(field)}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={errors[field] ? errorId : undefined}
            className={cn(
              'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
              isActive ? 'border-brand-400 bg-brand-50/40' : 'border-ink-300',
            )}
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
    <>
      <div className="w-full max-w-full min-w-0 space-y-6">
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

      <DesignCustomizerStepNav
        steps={steps}
        step={step}
        stepIndex={stepIndex}
        stepIcons={stepIcons}
        onStepChange={(item) => {
          setStep(item);
          if (item === 'front' || item === 'review') setPreviewSide('front');
          if (item === 'back') setPreviewSide('back');
        }}
        label={(item) => t(`steps.${item}.title`)}
        hint={(item) => t(`steps.${item}.hint`)}
        ariaLabel={t('editorNav')}
      />

      <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-4 lg:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,1fr)] 2xl:grid-cols-[minmax(420px,1.1fr)_minmax(440px,0.95fr)]">
        <Card className="order-1 w-full max-w-full min-w-0 p-4 sm:p-5 lg:sticky lg:top-20 lg:self-start lg:p-6">
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

          <div ref={visiblePreviewRef} className="max-w-full min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-2 sm:p-4 lg:p-5">
            <CustomizableDesignPreview
              layout={layout}
              colors={colors}
              values={values}
              side={previewSide}
              className="mx-auto w-full max-w-full lg:max-h-[min(78vh,760px)]"
            />
          </div>

          {isTextStep ? (
            <>
              <p className="mt-3 text-center text-xs text-ink-500 md:text-sm">
                {t('tapToEdit')}
              </p>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
                {stepFields.map((field) => (
                  <button
                    key={field}
                    type="button"
                    onClick={() => focusField(field)}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      activeField === field
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-ink-200 bg-white text-ink-600',
                    )}
                  >
                    {to(`fields.${field}`)}
                  </button>
                ))}
              </div>
            </>
          ) : null}

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

        <div className="order-2 w-full max-w-full min-w-0">
          <Card className="w-full max-w-full min-w-0 p-5 sm:p-6">
            {step === 'front' && (
              <div className="space-y-4">
                <div>
                  <h2 className="break-words text-xl font-bold text-ink-900">{t('steps.front.title')}</h2>
                  <p className="mt-1 break-words text-sm text-ink-600">{t('steps.front.desc')}</p>
                </div>
                <div
                  className={cn(
                    'space-y-4',
                    layout.frontFields.length > 4 &&
                      'lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:space-y-0',
                  )}
                >
                  {renderFields(layout.frontFields, true)}
                </div>
              </div>
            )}

            {step === 'back' && (
              <div className="space-y-4">
                <div>
                  <h2 className="break-words text-xl font-bold text-ink-900">{t('steps.back.title')}</h2>
                  <p className="mt-1 break-words text-sm text-ink-600">{t('steps.back.desc')}</p>
                </div>
                <div
                  className={cn(
                    'space-y-4',
                    layout.backFields.length > 4 &&
                      'lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:space-y-0',
                  )}
                >
                  {renderFields(layout.backFields, true)}
                </div>
              </div>
            )}

            {step === 'colors' && (
              <div className="space-y-5">
                <div>
                  <h2 className="break-words text-xl font-bold text-ink-900">{t('steps.colors.title')}</h2>
                  <p className="mt-1 break-words text-sm text-ink-600">{t('steps.colors.desc')}</p>
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
                  <h2 className="break-words text-xl font-bold text-ink-900">{t('steps.review.title')}</h2>
                  <p className="mt-1 break-words text-sm text-ink-600">{t('steps.review.desc')}</p>
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

            <div className="mt-8 flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={stepIndex === 0}
                className="w-full gap-1 sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                {t('prevStep')}
              </Button>

              {step !== 'review' ? (
                <Button type="button" onClick={goNext} className="w-full gap-1 sm:ml-auto sm:w-auto">
                  {t('nextStep')}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  loading={capturing}
                  disabled={capturing}
                  size="lg"
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  {capturing ? t('capturing') : to('addToCart')}
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
      </div>

      <DesignCustomizerMobileFieldBar
        open={isTextStep && Boolean(activeField)}
        inputId={activeField ?? 'mobile-field'}
        label={activeField ? to(`fields.${activeField}`) : ''}
        value={activeField ? (values[activeField] ?? '') : ''}
        onChange={(value) => {
          if (activeField) updateField(activeField, value);
        }}
        onPrev={stepFields.length > 1 ? () => goAdjacentField(-1) : undefined}
        onNext={stepFields.length > 1 ? () => goAdjacentField(1) : undefined}
        prevDisabled={!activeField || stepFields.indexOf(activeField) <= 0}
        nextDisabled={
          !activeField ||
          stepFields.indexOf(activeField) < 0 ||
          stepFields.indexOf(activeField) >= stepFields.length - 1
        }
        prevLabel={t('prevField')}
        nextLabel={t('nextField')}
        multiline={activeField ? (fieldInputType[activeField] ?? 'text') === 'textarea' : false}
        placeholder={activeField ? to(`placeholders.${activeField}`) : undefined}
      />

      <UnsavedWorkDialog
        open={unsavedWorkGuard.dialogOpen}
        saving={unsavedWorkGuard.saving}
        saveNotice={unsavedWorkGuard.saveNotice}
        onSave={unsavedWorkGuard.handleSave}
        onCancel={unsavedWorkGuard.cancelNavigation}
        onLeaveWithoutSaving={unsavedWorkGuard.handleLeaveWithoutSaving}
      />
    </>
  );
}
