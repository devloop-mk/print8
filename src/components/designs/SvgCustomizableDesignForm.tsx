'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuantityInput } from '@/components/ui/QuantityInput';
import { DesignCustomizerStepNav } from '@/components/designs/DesignCustomizerStepNav';
import { DesignLogoUploadField } from '@/components/designs/DesignLogoUploadField';
import { DesignCustomizerMobileFieldBar, type DesignCustomizerMobileFieldBarHandle } from '@/components/designs/DesignCustomizerMobileFieldBar';
import { SvgDesignPreview } from '@/components/designs/SvgDesignPreview';
import { SvgInteractivePreview } from '@/components/designs/SvgInteractivePreview';
import {
  SvgCanvasInlineFieldEditor,
  type CanvasFieldAnchor,
} from '@/components/designs/SvgCanvasInlineFieldEditor';
import { UnsavedWorkDialog } from '@/components/shared/UnsavedWorkDialog';
import { useDirtySnapshot } from '@/hooks/useDirtySnapshot';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useUndoRedoKeyboard } from '@/hooks/useUndoRedoKeyboard';
import { useUnsavedWorkGuard } from '@/hooks/useUnsavedWorkGuard';
import { formatPrice } from '@/lib/utils';
import type { DesignTemplate } from '@/lib/data/catalog';
import { designCategoryPrices } from '@/lib/data/design-order-fields';
import type { SvgDesignTemplate, SvgTemplateState } from '@/lib/data/svg-design-templates';
import { buildDefaultSvgTemplateState } from '@/lib/designs/svg-template-engine';
import {
  resolveSvgFieldDefault,
  toSvgSiteLocale,
} from '@/lib/designs/svg-locale-defaults';
import {
  getSvgFieldInputProps,
  getSvgFieldLabelId,
  isOrderFieldLabel,
  type SvgFieldLabelId,
} from '@/lib/designs/svg-field-labels';
import {
  buildSvgMetadataFields,
  captureSvgTemplateOrderAssets,
} from '@/lib/designs/svg-order-assets';
import {
  resolveSvgColorLabelKey,
} from '@/lib/designs/svg-color-labels';
import type { DesignCustomizeMode } from '@/lib/designs/customize-modes';
import {
  getSvgContactGroup,
  getSvgContactGroupTransformKey,
  isSvgContactTransformKey,
} from '@/lib/designs/svg-contact-groups';
import {
  getSvgLogoSlotFallbackTextIndices,
  getSvgLogoSlots,
  isSvgLogoFieldKey,
  logoStateKey,
} from '@/lib/designs/svg-logo-slots';
import {
  clampSvgTextScale,
  type SvgTextTransform,
} from '@/lib/designs/svg-text-transform';
import { upsertDesignEditorDraft } from '@/lib/drafts/work-drafts';
import { findDesignEditorDraft } from '@/lib/drafts/ongoing-designs';
import {
  cartItemMatchesDesignTemplate,
  parseSvgStateFromCartMetadata,
} from '@/lib/cart/design-cart';
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
  mode,
}: {
  template: DesignTemplate;
  svgTemplate: SvgDesignTemplate;
  mode: DesignCustomizeMode;
}) {
  const t = useTranslations('designs.customize');
  const td = useTranslations('designs');
  const to = useTranslations('designs.order');
  const locale = useLocale();
  const svgLocale = toSvgSiteLocale(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editCartItemId = searchParams.get('edit');
  const { addItem, updateItem, items: cartItems } = useCart();
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
  const {
    present: state,
    set: setState,
    undo,
    redo,
    reset: resetEditorState,
    canUndo,
    canRedo,
  } = useUndoRedo(() => buildDefaultSvgTemplateState(svgTemplate, svgLocale));
  const [quantity, setQuantity] = useState(1);
  const [capturing, setCapturing] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [canvasFieldAnchor, setCanvasFieldAnchor] = useState<CanvasFieldAnchor | null>(null);
  const canvasOverlayRef = useRef<HTMLDivElement>(null);
  const canvasTextStepRef = useRef<string | null>(null);
  const editOnCanvas = mode === 'canvas';

  const editingItem = useMemo(
    () =>
      editCartItemId
        ? cartItems.find((item) => item.id === editCartItemId)
        : undefined,
    [editCartItemId, cartItems],
  );

  useEffect(() => {
    const defaults = buildDefaultSvgTemplateState(svgTemplate, svgLocale);

    if (cartItemMatchesDesignTemplate(editingItem, template.id)) {
      const loaded = parseSvgStateFromCartMetadata(editingItem.metadata ?? {});
      if (loaded) {
        resetEditorState({
          ...defaults,
          ...loaded,
          logos: {
            ...defaults.logos,
            ...(loaded.logos ?? {}),
          },
          transforms: {
            ...defaults.transforms,
            ...(loaded.transforms ?? {}),
          },
        });
      } else {
        resetEditorState(defaults);
      }
      if (editingItem.quantity > 0) {
        setQuantity(editingItem.quantity);
      }
      setDraftHydrated(true);
      return;
    }

    const draft = findDesignEditorDraft(template.id);
    if (draft?.kind === 'svg') {
      const payload = draft.payload;
      if (payload.state && typeof payload.state === 'object') {
        const loaded = payload.state as SvgTemplateState;
        resetEditorState({
          ...defaults,
          ...loaded,
          logos: {
            ...defaults.logos,
            ...(loaded.logos ?? {}),
          },
          transforms: {
            ...defaults.transforms,
            ...(loaded.transforms ?? {}),
          },
        });
      } else {
        resetEditorState(defaults);
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
    } else {
      resetEditorState(defaults);
    }
    setDraftHydrated(true);
  }, [editingItem, resetEditorState, svgTemplate, svgLocale, template.id]);

  useUndoRedoKeyboard({
    undo,
    redo,
    canUndo,
    canRedo,
    enabled: draftHydrated,
  });

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
          customizeMode: mode,
        },
        updatedAt: new Date().toISOString(),
      });
      markClean();
      return true;
    } catch {
      return false;
    }
  }, [markClean, mode, quantity, state, step, svgTemplate.id, td, template.id]);

  const unsavedWorkGuard = useUnsavedWorkGuard({
    isDirty,
    onSave: saveDraft,
  });

  const stepIndex = steps.indexOf(step);
  const isTextStep = step === 'front' || step === 'back';
  const textSide = step === 'back' ? 'back' : 'front';
  const textFields =
    textSide === 'front' ? svgTemplate.sides.front.texts : svgTemplate.sides.back?.texts ?? [];
  const logoFallbackIndices = useMemo(
    () => getSvgLogoSlotFallbackTextIndices(svgTemplate.id, textSide),
    [svgTemplate.id, textSide],
  );
  const contactGroup = useMemo(
    () => getSvgContactGroup(svgTemplate.id, textSide),
    [svgTemplate.id, textSide],
  );

  const editableTextFields = useMemo(
    () => textFields.filter((field) => !logoFallbackIndices.has(field.index)),
    [logoFallbackIndices, textFields],
  );
  const textSideLabelIds = useMemo(
    () =>
      textFields.map((field, index) =>
        getSvgFieldLabelId(svgTemplate, textSide, field, index, textFields.length),
      ),
    [textFields, textSide, svgTemplate],
  );

  const focusField = useCallback((fieldKey: string) => {
    setActiveFieldKey(fieldKey);
    if (!editOnCanvas) {
      window.requestAnimationFrame(() => {
        fieldInputRefs.current[fieldKey]?.focus();
      });
      return;
    }

    window.requestAnimationFrame(() => {
      fieldInputRefs.current[fieldKey]?.focus();
    });
  }, [editOnCanvas]);

  useEffect(() => {
    if (!editOnCanvas || !isTextStep || editableTextFields.length === 0) {
      canvasTextStepRef.current = null;
      setActiveFieldKey(null);
      setCanvasFieldAnchor(null);
      return;
    }

    setPreviewSide(textSide);

    const textStepKey = `${step}:${textSide}`;
    if (canvasTextStepRef.current !== textStepKey) {
      canvasTextStepRef.current = textStepKey;
      setActiveFieldKey(`${textSide}:${editableTextFields[0].id}`);
      setCanvasFieldAnchor(null);
    }
  }, [editOnCanvas, editableTextFields, isTextStep, step, textSide]);

  function fieldLabelId(
    side: 'front' | 'back',
    field: (typeof svgTemplate.sides.front.texts)[number],
    index: number,
    fieldCount: number,
  ): SvgFieldLabelId {
    return getSvgFieldLabelId(svgTemplate, side, field, index, fieldCount);
  }

  function resolveFieldLabelText(labelId: SvgFieldLabelId, index: number, labelIds: SvgFieldLabelId[]) {
    const base = isOrderFieldLabel(labelId)
      ? to(`fields.${labelId}`)
      : t(`svgFields.${labelId}`);

    const duplicates = labelIds.filter((id) => id === labelId).length;
    if (duplicates <= 1) return base;

    const occurrence = labelIds.slice(0, index + 1).filter((id) => id === labelId).length;
    return occurrence > 1 ? `${base} (${occurrence})` : base;
  }

  function fieldLabel(
    side: 'front' | 'back',
    field: (typeof svgTemplate.sides.front.texts)[number],
    index: number,
    fieldCount: number,
    labelIds: SvgFieldLabelId[],
  ) {
    const labelId = fieldLabelId(side, field, index, fieldCount);
    return resolveFieldLabelText(labelId, index, labelIds);
  }

  function fieldPlaceholder(
    side: 'front' | 'back',
    field: (typeof svgTemplate.sides.front.texts)[number],
    index: number,
    fieldCount: number,
  ) {
    const labelId = fieldLabelId(side, field, index, fieldCount);
    if (isOrderFieldLabel(labelId)) {
      return to(`placeholders.${labelId}`);
    }
    return t(`svgFieldPlaceholders.${labelId}`);
  }

  function updateText(key: string, value: string) {
    setState((prev) => ({
      ...prev,
      texts: { ...prev.texts, [key]: value },
    }));
  }

  const updateTransform = useCallback((key: string, transform: SvgTextTransform) => {
    setState((prev) => ({
      ...prev,
      transforms: {
        ...prev.transforms,
        [key]: {
          dx: transform.dx,
          dy: transform.dy,
          scale: clampSvgTextScale(transform.scale),
        },
      },
    }));
  }, []);

  function updateColor(id: string, value: string) {
    setState((prev) => ({
      ...prev,
      colors: { ...prev.colors, [id]: value },
    }));
  }

  function resetColorsToDefault() {
    setState((prev) => ({
      ...prev,
      colors: Object.fromEntries(
        svgTemplate.colors.map((slot) => [slot.id, slot.default]),
      ),
    }));
  }

  function colorLabel(slot: (typeof svgTemplate.colors)[number], index: number) {
    const labelKey = resolveSvgColorLabelKey(
      slot,
      index,
      svgTemplate.colors.length,
    );
    return t(labelKey);
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
    if (!activeFieldKey || editableTextFields.length === 0) return;
    const currentIndex = editableTextFields.findIndex(
      (field) => `${textSide}:${field.id}` === activeFieldKey,
    );
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= editableTextFields.length) return;
    focusField(`${textSide}:${editableTextFields[nextIndex].id}`);
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
        customizeMode: mode,
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
      for (const [key, value] of Object.entries(state.logos ?? {})) {
        if (value) metadata[`logo_${key}`] = value;
      }

      const cartPayload = {
        type: 'design' as const,
        name: `${td(`categories.${template.category}`)} — ${td(`templates.${template.id}`)}`,
        price,
        quantity,
        designPreview: assets.front.pngDataUrl,
        backDesignPreview: assets.back?.pngDataUrl,
        metadata,
      };

      if (editCartItemId) {
        updateItem(editCartItemId, cartPayload);
      } else {
        addItem(cartPayload);
      }
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
    fieldCount: number,
    labelIds: SvgFieldLabelId[],
  ) {
    const key = `${side}:${field.id}`;
    const isActive = editOnCanvas && activeFieldKey === key;
    const labelId = fieldLabelId(side, field, index, fieldCount);
    const inputProps = getSvgFieldInputProps(labelId);
    const placeholder = fieldPlaceholder(side, field, index, fieldCount);

    return (
      <div
        key={key}
        className="rounded-xl border border-ink-200/80 bg-white p-3.5 shadow-sm sm:p-4"
      >
        <label htmlFor={key} className="mb-1 block text-sm font-semibold text-ink-900">
          {fieldLabel(side, field, index, fieldCount, labelIds)}
        </label>
        {placeholder ? (
          <p className="mb-2 text-xs leading-relaxed text-ink-500">{placeholder}</p>
        ) : null}
        <input
          id={key}
          ref={(node) => {
            fieldInputRefs.current[key] = node;
          }}
          type="text"
          value={
            state.texts[key] ??
            resolveSvgFieldDefault(svgTemplate.id, side, field, svgLocale)
          }
          placeholder={placeholder}
          autoComplete={inputProps.autoComplete}
          inputMode={inputProps.inputMode}
          onChange={(e) => updateText(key, e.target.value)}
          onFocus={() => {
            if (editOnCanvas) setActiveFieldKey(key);
          }}
          className={cn(
            'w-full rounded-lg border px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200',
            isActive ? 'border-brand-400 bg-brand-50/40' : 'border-ink-300 bg-white',
          )}
        />
      </div>
    );
  }

  function renderTextFields(side: 'front' | 'back') {
    const sideConfig = side === 'front' ? svgTemplate.sides.front : svgTemplate.sides.back;
    if (!sideConfig) return null;

    const fieldCount = sideConfig.texts.length;
    const labelIds = sideConfig.texts.map((field, index) =>
      fieldLabelId(side, field, index, fieldCount),
    );
    const logoFallbackIndices = getSvgLogoSlotFallbackTextIndices(svgTemplate.id, side);

    return sideConfig.texts.map((field, index) => {
      if (logoFallbackIndices.has(index)) return null;
      return renderTextField(side, field, index, fieldCount, labelIds);
    });
  }

  function renderLogoFields(side: 'front' | 'back') {
    const slots = getSvgLogoSlots(svgTemplate.id, side);
    if (!slots.length) return null;

    return slots.map((slot) => {
      const key = logoStateKey(side, slot.id);
      const fallbackField =
        slot.fallbackTextIndex !== undefined
          ? (side === 'front'
              ? svgTemplate.sides.front.texts
              : svgTemplate.sides.back?.texts)?.[slot.fallbackTextIndex]
          : undefined;
      const fallbackKey = fallbackField ? `${side}:${fallbackField.id}` : null;

      return (
        <DesignLogoUploadField
          key={key}
          label={t('logoSectionTitle')}
          hint={t('logoSectionHint')}
          showLetter={Boolean(fallbackKey)}
          letterValue={fallbackKey ? (state.texts[fallbackKey] ?? fallbackField?.default ?? '') : ''}
          onLetterChange={(value) => {
            if (fallbackKey) updateText(fallbackKey, value);
          }}
          logoDataUrl={state.logos?.[key]}
          onLogoChange={(dataUrl) => {
            setState((prev) => ({
              ...prev,
              logos: {
                ...prev.logos,
                [key]: dataUrl,
              },
            }));
          }}
        />
      );
    });
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

            <div className="max-w-full min-w-0 rounded-lg border border-ink-200 bg-white p-2 sm:p-3 lg:p-4">
              {editOnCanvas && isTextStep ? (
                <div ref={canvasOverlayRef} className="relative max-w-full min-w-0">
                  <SvgInteractivePreview
                    template={svgTemplate}
                    state={state}
                    side={previewSide}
                    interactive
                    activeFieldKey={activeFieldKey}
                    onFieldSelect={focusField}
                    onTransformChange={updateTransform}
                    overlayRootRef={canvasOverlayRef}
                    onActiveFieldAnchor={setCanvasFieldAnchor}
                  />
                  <SvgCanvasInlineFieldEditor
                    open={
                      Boolean(activeFieldKey) &&
                      !isSvgLogoFieldKey(activeFieldKey ?? '') &&
                      !isSvgContactTransformKey(activeFieldKey ?? '')
                    }
                    anchor={canvasFieldAnchor}
                    inputId={
                      activeFieldKey
                        ? `canvas-inline-${activeFieldKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`
                        : 'canvas-inline-field'
                    }
                    label={
                      activeFieldIndex >= 0
                        ? fieldLabel(
                            textSide,
                            textFields[activeFieldIndex],
                            activeFieldIndex,
                            textFields.length,
                            textSideLabelIds,
                          )
                        : t('svgLine', { n: 1 })
                    }
                    value={
                      activeFieldKey
                        ? (state.texts[activeFieldKey] ??
                          textFields.find((field) => `${textSide}:${field.id}` === activeFieldKey)
                            ?.default ??
                          '')
                        : ''
                    }
                    placeholder={
                      activeFieldIndex >= 0
                        ? fieldPlaceholder(
                            textSide,
                            textFields[activeFieldIndex],
                            activeFieldIndex,
                            textFields.length,
                          )
                        : undefined
                    }
                    onChange={(value) => {
                      if (activeFieldKey) updateText(activeFieldKey, value);
                    }}
                    inputRef={(node) => {
                      if (activeFieldKey) fieldInputRefs.current[activeFieldKey] = node;
                    }}
                    onClose={() => {
                      setActiveFieldKey(null);
                      setCanvasFieldAnchor(null);
                    }}
                    closeLabel={t('closeFieldEditor')}
                  />
                </div>
              ) : (
                <div className="mx-auto w-full max-w-full">
                  <SvgDesignPreview
                    template={svgTemplate}
                    state={state}
                    side={previewSide}
                    className="mx-auto max-w-full"
                  />
                </div>
              )}
            </div>

            {editOnCanvas && isTextStep ? (
              <>
                <p className="mt-3 text-center text-xs text-ink-500 md:text-sm">
                  {t('tapToEdit')}
                </p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {getSvgLogoSlots(svgTemplate.id, textSide).map((slot) => {
                    const key = logoStateKey(textSide, slot.id);
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
                        {t('logoSectionTitle')}
                      </button>
                    );
                  })}
                  {contactGroup ? (
                    <button
                      key={getSvgContactGroupTransformKey(textSide)}
                      type="button"
                      onClick={() => focusField(getSvgContactGroupTransformKey(textSide))}
                      className={cn(
                        'shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition touch-manipulation',
                        activeFieldKey === getSvgContactGroupTransformKey(textSide)
                          ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                          : 'border-ink-200 bg-white text-ink-600',
                      )}
                    >
                      {t('editContactBlock')}
                    </button>
                  ) : null}
                  {editableTextFields.map((field) => {
                    const index = textFields.findIndex((item) => item.id === field.id);
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
                        {fieldLabel(textSide, field, index, textFields.length, textSideLabelIds)}
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

              {isTextStep && !editOnCanvas ? (
                <div className="mt-5 rounded-xl border border-ink-200 bg-ink-50/60 p-4">
                  <p className="text-sm font-semibold text-ink-900">{t('formSectionTitle')}</p>
                  <p className="mt-1 text-xs text-ink-600 sm:text-sm">{t('formSectionHint')}</p>
                </div>
              ) : null}

              {isTextStep && editOnCanvas ? (
                <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/40 p-4">
                  <p className="text-sm font-semibold text-ink-900">{t('canvasModeSidebarTitle')}</p>
                  <p className="mt-1 text-xs text-ink-600 sm:text-sm">{t('canvasModeSidebarHint')}</p>
                </div>
              ) : null}

              <div
                className={cn(
                  'mt-5 grid gap-3',
                  step === 'front' &&
                    svgTemplate.sides.front.texts.length > 4 &&
                    'lg:grid-cols-2 lg:gap-4',
                  step === 'back' &&
                    (svgTemplate.sides.back?.texts.length ?? 0) > 4 &&
                    'lg:grid-cols-2 lg:gap-4',
                )}
              >
                {step === 'front' && renderLogoFields('front')}
                {step === 'back' && renderLogoFields('back')}
                {step === 'front' && !editOnCanvas && renderTextFields('front')}
                {step === 'back' && !editOnCanvas && renderTextFields('back')}
                {step === 'colors' && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetColorsToDefault}
                      >
                        {t('resetColorsToDefault')}
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {svgTemplate.colors.map((slot, index) => (
                      <div key={slot.id}>
                        <label
                          htmlFor={`color-${slot.id}`}
                          className="mb-1.5 block text-sm font-medium text-ink-700"
                        >
                          {colorLabel(slot, index)}
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
                      <QuantityInput
                        id="quantity"
                        min={1}
                        max={999}
                        value={quantity}
                        onChange={setQuantity}
                        className="w-28"
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
                    {capturing
                      ? t('capturing')
                      : editCartItemId
                        ? to('updateCart')
                        : to('addToCart')}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {!editOnCanvas ? (
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
            ? fieldLabel(
                textSide,
                textFields[activeFieldIndex],
                activeFieldIndex,
                textFields.length,
                textSideLabelIds,
              )
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
      ) : null}

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
