'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DesignCustomizerStepNav } from '@/components/designs/DesignCustomizerStepNav';
import { DesignCustomizerMobileFieldBar, type DesignCustomizerMobileFieldBarHandle } from '@/components/designs/DesignCustomizerMobileFieldBar';
import { SvgInteractivePreview } from '@/components/designs/SvgInteractivePreview';
import { UnsavedWorkDialog } from '@/components/shared/UnsavedWorkDialog';
import { useDirtySnapshot } from '@/hooks/useDirtySnapshot';
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard';
import { formatPrice } from '@/lib/utils';
import type { DesignTemplate } from '@/lib/data/catalog';
import { designCategoryPrices } from '@/lib/data/design-order-fields';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { buildDefaultSvgTemplateState } from '@/lib/designs/svg-template-engine';
import {
  buildSvgMetadataFields,
  captureSvgTemplateOrderAssets,
} from '@/lib/designs/svg-order-assets';
import { upsertDesignEditorDraft } from '@/lib/drafts/work-drafts';
import { findDesignEditorDraft } from '@/lib/drafts/ongoing-designs';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, FileText, Layers, Palette, ShoppingCart, Info } from 'lucide-react';

type EditorStep = 'front' | 'back' | 'colors' | 'review';

const stepIcons: Record<EditorStep, typeof FileText> = {
  front: FileText,
  back: Layers,
  colors: Palette,
  review: ShoppingCart,
};

export function SvgCustomizableDesignForm({
  template,
  svgTemplate,
}: {
  template: DesignTemplate;
  svgTemplate: SvgDesignTemplate;
}) {
  const t = useTranslations('designs.customize');
  const td = useTranslations('designs');
  const to = useTranslations('designs.order');
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const fieldInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const mobileFieldBarRef = useRef<DesignCustomizerMobileFieldBarHandle>(null);

  const hasBack = Boolean(svgTemplate.sides.back);
  const steps = useMemo<EditorStep[]>(
    () => (hasBack ? ['front', 'back', 'colors', 'review'] : ['front', 'colors', 'review']),
    [hasBack],
  );

  const price = designCategoryPrices[template.category];
  const [step, setStep] = useState<EditorStep>('front');
  const [previewSide, setPreviewSide] = useState<'front' | 'back'>('front');
  const [state, setState] = useState(() => buildDefaultSvgTemplateState(svgTemplate));
  const [quantity, setQuantity] = useState(1);
  const [capturing, setCapturing] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);

  useEffect(() => {
    const draft = findDesignEditorDraft(template.id);
    if (draft?.kind === 'svg') {
      const payload = draft.payload;
      if (payload.state && typeof payload.state === 'object') {
        setState(payload.state as SvgTemplateState);
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
    () => JSON.stringify({ state, step, quantity }),
    [state, step, quantity],
  );
  const { isDirty, markClean } = useDirtySnapshot(serializedDraft, draftHydrated);

  const saveDraft = useCallback(async () => {
    try {
      upsertDesignEditorDraft({
        id: `design-${template.id}`,
        name: td(`templates.${template.id}`),
        templateId: template.id,
        kind: 'svg',
        payload: {
          state,
          step,
          quantity,
          svgTemplateId: svgTemplate.id,
        },
        updatedAt: new Date().toISOString(),
      });
      markClean();
      return true;
    } catch {
      return false;
    }
  }, [markClean, quantity, state, step, svgTemplate.id, td, template.id]);

  const unsavedWorkGuard = useUnsavedWorkGuard({
    isDirty,
    onSave: saveDraft,
  });

  const stepIndex = steps.indexOf(step);
  const isTextStep = step === 'front' || step === 'back';
  const textSide = step === 'back' ? 'back' : 'front';
  const textFields =
    textSide === 'front' ? svgTemplate.sides.front.texts : svgTemplate.sides.back?.texts ?? [];

  const focusField = useCallback((fieldKey: string) => {
    setActiveFieldKey(fieldKey);
    window.requestAnimationFrame(() => {
      if (window.matchMedia('(min-width: 768px)').matches) {
        fieldInputRefs.current[fieldKey]?.focus();
        fieldInputRefs.current[fieldKey]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
        return;
      }

      window.setTimeout(() => mobileFieldBarRef.current?.focus(), 80);
    });
  }, []);

  useEffect(() => {
    if (!isTextStep || textFields.length === 0) {
      setActiveFieldKey(null);
      return;
    }

    const firstKey = `${textSide}:${textFields[0].id}`;
    setActiveFieldKey((current) => {
      if (current?.startsWith(`${textSide}:`)) return current;
      return firstKey;
    });
    setPreviewSide(textSide);
  }, [isTextStep, textFields, textSide]);

  function updateText(key: string, value: string) {
    setState((prev) => ({
      ...prev,
      texts: { ...prev.texts, [key]: value },
    }));
  }

  function updateColor(id: string, value: string) {
    setState((prev) => ({
      ...prev,
      colors: { ...prev.colors, [id]: value },
    }));
  }

  function colorLabel(slot: (typeof svgTemplate.colors)[number]) {
    const customizeKeys = [
      'accentColor',
      'backgroundColor',
      'textColor',
      'secondaryColor',
    ] as const;
    if (customizeKeys.includes(slot.labelKey as (typeof customizeKeys)[number])) {
      return t(slot.labelKey as (typeof customizeKeys)[number]);
    }
    return t(`svgColors.${slot.id}`, { default: slot.id });
  }

  function goToStep(next: EditorStep) {
    setStep(next);
    if (next === 'back') {
      setPreviewSide('back');
      return;
    }
    setPreviewSide('front');
  }

  function goNext() {
    const next = steps[stepIndex + 1];
    if (next) goToStep(next);
  }

  function goBack() {
    const prev = steps[stepIndex - 1];
    if (prev) goToStep(prev);
  }

  function goAdjacentField(direction: -1 | 1) {
    if (!activeFieldKey || textFields.length === 0) return;
    const currentIndex = textFields.findIndex(
      (field) => `${textSide}:${field.id}` === activeFieldKey,
    );
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= textFields.length) return;
    focusField(`${textSide}:${textFields[nextIndex].id}`);
  }

  async function handleSubmit() {
    setCapturing(true);
    try {
      const assets = await captureSvgTemplateOrderAssets(svgTemplate, state);
      const svgFields = buildSvgMetadataFields(assets, svgTemplate);

      const metadata: Record<string, string | number | boolean> = {
        designTemplateId: template.id,
        category: template.category,
        orderType: 'svg-template',
        svgTemplateId: svgTemplate.id,
        svgState: JSON.stringify(state),
        ...svgFields,
      };

      for (const [key, value] of Object.entries(state.texts)) {
        metadata[`text_${key}`] = value;
      }
      for (const [key, value] of Object.entries(state.colors)) {
        metadata[`color_${key}`] = value;
      }

      addItem({
        type: 'design',
        name: `${td(`categories.${template.category}`)} — ${td(`templates.${template.id}`)}`,
        price,
        quantity,
        designPreview: assets.front.pngDataUrl,
        backDesignPreview: assets.back?.pngDataUrl,
        metadata,
      });
      unsavedWorkGuard.allowNavigation();
      router.push('/cart');
    } finally {
      setCapturing(false);
    }
  }

  function renderTextField(
    side: 'front' | 'back',
    field: (typeof svgTemplate.sides.front.texts)[number],
    index: number,
    options?: { compact?: boolean },
  ) {
    const key = `${side}:${field.id}`;
    const isActive = activeFieldKey === key;

    return (
      <div
        key={key}
        className={cn(options?.compact && 'hidden md:block')}
      >
        <label htmlFor={key} className="mb-1.5 block text-sm font-medium text-ink-700">
          {t('svgLine', { n: index + 1 })}
        </label>
        <input
          id={key}
          ref={(node) => {
            fieldInputRefs.current[key] = node;
          }}
          type="text"
          value={state.texts[key] ?? field.default}
          onChange={(e) => updateText(key, e.target.value)}
          onFocus={() => setActiveFieldKey(key)}
          className={cn(
            'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
            isActive ? 'border-brand-400 bg-brand-50/40' : 'border-ink-300',
          )}
        />
      </div>
    );
  }

  function renderTextFields(side: 'front' | 'back', compact = false) {
    const sideConfig = side === 'front' ? svgTemplate.sides.front : svgTemplate.sides.back;
    if (!sideConfig) return null;

    return sideConfig.texts.map((field, index) =>
      renderTextField(side, field, index, { compact }),
    );
  }

  const activeFieldIndex = textFields.findIndex(
    (field) => `${textSide}:${field.id}` === activeFieldKey,
  );

  return (
    <>
      <div className="w-full max-w-full min-w-0 space-y-4 md:space-y-6">
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
          onStepChange={goToStep}
          label={(item) => t(`steps.${item}.title`)}
          hint={(item) => t(`steps.${item}.hint`)}
          ariaLabel={t('editorNav')}
        />

        <div className="grid w-full min-w-0 max-w-full grid-cols-[minmax(0,1fr)] gap-4 lg:gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,1fr)] 2xl:grid-cols-[minmax(420px,1.1fr)_minmax(440px,0.95fr)]">
          <Card className="order-1 w-full max-w-full min-w-0 p-4 sm:p-5 lg:sticky lg:top-20 lg:self-start lg:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink-900">{t('livePreview')}</p>
              {hasBack ? (
                <div className="flex rounded-lg border border-ink-200 bg-ink-50 p-1">
                  {(['front', 'back'] as const).map((side) => (
                    <button
                      key={side}
                      type="button"
                      onClick={() => {
                        setPreviewSide(side);
                        if (side === 'front' && step === 'back') setStep('front');
                        if (side === 'back' && step === 'front') setStep('back');
                      }}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-semibold transition',
                        previewSide === side
                          ? 'bg-white text-brand-700 shadow-sm'
                          : 'text-ink-600 hover:text-ink-900',
                      )}
                    >
                      {side === 'front' ? t('frontSide') : t('backSide')}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="max-w-full min-w-0 rounded-lg border border-ink-200 bg-ink-50 p-2 sm:p-4 lg:p-5">
              <SvgInteractivePreview
                template={svgTemplate}
                state={state}
                side={previewSide}
                interactive={isTextStep}
                activeFieldKey={activeFieldKey}
                onFieldSelect={focusField}
              />
            </div>

            {isTextStep ? (
              <>
                <p className="mt-3 text-center text-xs text-ink-500 md:text-sm">
                  {t('tapToEdit')}
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden">
                  {textFields.map((field, index) => {
                    const key = `${textSide}:${field.id}`;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => focusField(key)}
                        className={cn(
                          'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition touch-manipulation',
                          activeFieldKey === key
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                            : 'border-ink-200 bg-white text-ink-600',
                        )}
                      >
                        {t('svgLine', { n: index + 1 })}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {step === 'review' ? (
              <p className="mt-4 text-sm text-ink-500">{t('previewNote')}</p>
            ) : null}
          </Card>

          <div className="order-2 w-full max-w-full min-w-0">
            <Card className="w-full max-w-full min-w-0 p-5 sm:p-6">
              <h2 className="break-words text-lg font-semibold text-ink-900 sm:text-xl">
                {t(`steps.${step}.title`)}
              </h2>
              <p className="mt-1 break-words text-sm text-ink-600">{t(`steps.${step}.desc`)}</p>

              <div
                className={cn(
                  'mt-5 space-y-4',
                  step === 'front' &&
                    svgTemplate.sides.front.texts.length > 4 &&
                    'lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:space-y-0',
                  step === 'back' &&
                    (svgTemplate.sides.back?.texts.length ?? 0) > 4 &&
                    'lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:space-y-0',
                )}
              >
                {step === 'front' && renderTextFields('front', true)}
                {step === 'back' && renderTextFields('back', true)}
                {step === 'colors' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {svgTemplate.colors.map((slot) => (
                      <div key={slot.id}>
                        <label
                          htmlFor={`color-${slot.id}`}
                          className="mb-1.5 block text-sm font-medium text-ink-700"
                        >
                          {colorLabel(slot)}
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            id={`color-${slot.id}`}
                            type="color"
                            value={state.colors[slot.id] ?? slot.default}
                            onChange={(e) => updateColor(slot.id, e.target.value)}
                            className="h-10 w-14 cursor-pointer rounded border border-ink-300"
                          />
                          <input
                            type="text"
                            value={state.colors[slot.id] ?? slot.default}
                            onChange={(e) => updateColor(slot.id, e.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-ink-300 px-3 py-2 font-mono text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {step === 'review' && (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="quantity"
                        className="mb-1.5 block text-sm font-medium text-ink-700"
                      >
                        {to('quantity')}
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        min={1}
                        max={999}
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.max(1, Number(e.target.value) || 1))
                        }
                        className="w-28 rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      />
                    </div>
                    <p className="text-lg font-semibold text-ink-900">
                      {formatPrice(price * quantity, locale)}
                    </p>
                  </div>
                )}
              </div>

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
                    disabled={capturing}
                    size="lg"
                    className="w-full sm:ml-auto sm:w-auto"
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                    {capturing ? t('capturing') : to('addToCart')}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <DesignCustomizerMobileFieldBar
        ref={mobileFieldBarRef}
        open={isTextStep && Boolean(activeFieldKey)}
        inputId={
          activeFieldKey
            ? `mobile-field-${activeFieldKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`
            : 'mobile-field'
        }
        doneLabel={t('mobileDone')}
        label={
          activeFieldIndex >= 0
            ? t('editingLine', { n: activeFieldIndex + 1 })
            : t('svgLine', { n: 1 })
        }
        value={
          activeFieldKey
            ? (state.texts[activeFieldKey] ??
              textFields.find((field) => `${textSide}:${field.id}` === activeFieldKey)?.default ??
              '')
            : ''
        }
        onChange={(value) => {
          if (activeFieldKey) updateText(activeFieldKey, value);
        }}
        onPrev={textFields.length > 1 ? () => goAdjacentField(-1) : undefined}
        onNext={textFields.length > 1 ? () => goAdjacentField(1) : undefined}
        prevDisabled={activeFieldIndex <= 0}
        nextDisabled={activeFieldIndex < 0 || activeFieldIndex >= textFields.length - 1}
        prevLabel={t('prevField')}
        nextLabel={t('nextField')}
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
