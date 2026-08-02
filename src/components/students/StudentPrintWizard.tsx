'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  ScrollText,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { CartAddedModal } from '@/components/cart/CartAddedModal';
import { useUploadSession } from '@/hooks/useUploadSession';
import { StudentPrintStepNav } from '@/components/students/StudentPrintStepNav';
import { StudentPrintPdfUpload } from '@/components/students/StudentPrintPdfUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn, formatPrice } from '@/lib/utils';
import {
  STUDENT_PRINT_BACK_COVER_COLORS,
  STUDENT_PRINT_BINDING_TYPES,
  STUDENT_PRINT_COVER_SWATCHES,
  STUDENT_PRINT_FRONT_COVER_COLORS,
  STUDENT_PRINT_ORDER_TYPE,
  STUDENT_PRINT_SERVICES,
  type StudentPrintBackCoverColor,
  type StudentPrintFrontCoverColor,
  type StudentPrintServiceType,
} from '@/lib/students/student-print-config';
import {
  STUDENT_PRINT_WIZARD_STEPS,
  canAdvanceFromStep,
  createDefaultStudentPrintState,
  estimateStudentPrintPrice,
  isStudentPrintStepComplete,
  type StudentPrintState,
  type StudentPrintWizardStep,
} from '@/lib/students/student-print-state';

const SERVICE_ICONS: Record<
  StudentPrintServiceType,
  typeof BookOpen
> = {
  book: BookOpen,
  script: ScrollText,
  seminar: FileText,
  thesis: GraduationCap,
};

export function StudentPrintWizard() {
  const t = useTranslations('students.print');
  const locale = useLocale();
  const { addItem } = useCart();
  const {
    token,
    loading: uploadLoading,
    error: uploadError,
    refreshSession,
  } = useUploadSession();

  const [state, setState] = useState<StudentPrintState>(() =>
    createDefaultStudentPrintState(),
  );
  const [step, setStep] = useState<StudentPrintWizardStep>('service');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cartAddedOpen, setCartAddedOpen] = useState(false);

  const stepLabels = useMemo(
    () =>
      Object.fromEntries(
        STUDENT_PRINT_WIZARD_STEPS.map((wizardStep) => [
          wizardStep,
          t(`steps.${wizardStep}`),
        ]),
      ) as Record<StudentPrintWizardStep, string>,
    [t],
  );

  const totalPrice = useMemo(() => estimateStudentPrintPrice(state), [state]);

  function goToStep(next: StudentPrintWizardStep) {
    setStep(next);
    setError(null);
  }

  function handleStepNavClick(target: StudentPrintWizardStep) {
    const targetIndex = STUDENT_PRINT_WIZARD_STEPS.indexOf(target);
    const currentIndex = STUDENT_PRINT_WIZARD_STEPS.indexOf(step);

    if (targetIndex <= currentIndex) {
      goToStep(target);
      return;
    }

    for (let index = 0; index < targetIndex; index += 1) {
      const wizardStep = STUDENT_PRINT_WIZARD_STEPS[index];
      if (!isStudentPrintStepComplete(wizardStep, state)) {
        return;
      }
    }

    goToStep(target);
  }

  function validateCurrentStep(): boolean {
    if (canAdvanceFromStep(step, state)) {
      setError(null);
      return true;
    }

    if (step === 'service') {
      setError(t('errors.serviceRequired'));
    } else if (step === 'upload') {
      setError(t('errors.uploadRequired'));
    } else if (step === 'binding') {
      setError(t('errors.bindingRequired'));
    }

    return false;
  }

  function handlePrimaryNext() {
    if (!validateCurrentStep()) return;

    const currentIndex = STUDENT_PRINT_WIZARD_STEPS.indexOf(step);
    if (currentIndex < STUDENT_PRINT_WIZARD_STEPS.length - 1) {
      goToStep(STUDENT_PRINT_WIZARD_STEPS[currentIndex + 1]);
      return;
    }

    void handleAddToCart();
  }

  function handleBack() {
    const currentIndex = STUDENT_PRINT_WIZARD_STEPS.indexOf(step);
    if (currentIndex <= 0) return;
    goToStep(STUDENT_PRINT_WIZARD_STEPS[currentIndex - 1]);
  }

  async function handleAddToCart() {
    if (!validateCurrentStep()) return;
    if (
      !state.serviceType ||
      !state.uploadedFile ||
      !state.bindingType ||
      !state.frontCoverColor ||
      !state.backCoverColor
    ) {
      return;
    }

    const service = STUDENT_PRINT_SERVICES.find(
      (entry) => entry.id === state.serviceType,
    );
    if (!service) return;

    setProcessing(true);
    setError(null);

    try {
      const serviceTitle = t(`services.${state.serviceType}.title`);

      addItem({
        type: 'service',
        name: t('cartItemName', { service: serviceTitle }),
        price: totalPrice,
        quantity: 1,
        metadata: {
          orderType: STUDENT_PRINT_ORDER_TYPE,
          serviceType: state.serviceType,
          catalogServiceId: service.catalogServiceId,
          pageCount: state.uploadedFile.pageCount,
          fileName: state.uploadedFile.originalName,
          fileSize: state.uploadedFile.fileSize,
          bindingType: state.bindingType,
          frontCoverColor: state.frontCoverColor,
          backCoverColor: state.backCoverColor,
        },
        fileIds: [state.uploadedFile.fileId],
      });

      setCartAddedOpen(true);
    } catch {
      setError(t('errors.addToCartFailed'));
    } finally {
      setProcessing(false);
    }
  }

  function renderColorSwatch(
    colorId: StudentPrintFrontCoverColor | StudentPrintBackCoverColor,
    selected: boolean,
    onSelect: () => void,
    label: string,
  ) {
    const swatch = STUDENT_PRINT_COVER_SWATCHES[colorId];
    const isClear = colorId === 'clear';

    return (
      <button
        key={colorId}
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={label}
        className={cn(
          'flex flex-col items-center gap-1.5 rounded-lg border p-2 transition',
          selected
            ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-300'
            : 'border-ink-200 bg-white hover:border-brand-300',
        )}
      >
        <span
          className={cn(
            'h-10 w-10 rounded-full border border-ink-200 shadow-inner',
            isClear && 'bg-gradient-to-br from-slate-200/80 to-transparent',
          )}
          style={
            isClear
              ? undefined
              : { backgroundColor: swatch.startsWith('#') ? swatch : undefined }
          }
        />
        <span className="text-center text-xs font-medium text-ink-700">
          {label}
        </span>
      </button>
    );
  }

  function renderServiceStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('serviceTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('serviceHint')}</p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {STUDENT_PRINT_SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.id];
            const selected = state.serviceType === service.id;

            return (
              <li key={service.id}>
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({ ...prev, serviceType: service.id }))
                  }
                  className={cn(
                    'flex h-full w-full flex-col items-start gap-3 rounded-xl border p-4 text-left transition',
                    selected
                      ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/40',
                  )}
                >
                  <span
                    className={cn(
                      'rounded-lg p-2',
                      selected
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-ink-100 text-ink-600',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">
                      {t(`services.${service.id}.title`)}
                    </span>
                    <span className="mt-1 block text-sm text-ink-500">
                      {t(`services.${service.id}.description`)}
                    </span>
                  </span>
                  <span className="text-sm font-medium text-brand-600">
                    {t('startingFrom', {
                      price: formatPrice(service.basePrice, locale),
                    })}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    );
  }

  function renderUploadStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('uploadTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('uploadStepHint')}</p>

        <div className="mt-6">
          <StudentPrintPdfUpload
            token={token}
            loading={uploadLoading}
            sessionError={uploadError}
            onRefreshSession={refreshSession}
            value={state.uploadedFile}
            onChange={(uploadedFile) =>
              setState((prev) => ({ ...prev, uploadedFile }))
            }
          />
        </div>
      </Card>
    );
  }

  function renderBindingStep() {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('bindingTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('bindingHint')}</p>

        <div className="mt-6 space-y-8">
          <fieldset>
            <legend className="text-sm font-semibold text-ink-800">
              {t('bindingTypeLabel')}
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {STUDENT_PRINT_BINDING_TYPES.map((bindingType) => {
                const selected = state.bindingType === bindingType;

                return (
                  <button
                    key={bindingType}
                    type="button"
                    onClick={() =>
                      setState((prev) => ({ ...prev, bindingType }))
                    }
                    className={cn(
                      'rounded-xl border px-4 py-3 text-left transition',
                      selected
                        ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                        : 'border-ink-200 bg-white hover:border-brand-300',
                    )}
                  >
                    <span className="block font-semibold text-ink-900">
                      {t(`bindingTypes.${bindingType}.title`)}
                    </span>
                    <span className="mt-1 block text-sm text-ink-500">
                      {t(`bindingTypes.${bindingType}.description`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-ink-800">
              {t('frontCoverLabel')}
            </legend>
            <p className="mt-1 text-xs text-ink-500">{t('frontCoverHint')}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {STUDENT_PRINT_FRONT_COVER_COLORS.map((colorId) =>
                renderColorSwatch(
                  colorId,
                  state.frontCoverColor === colorId,
                  () =>
                    setState((prev) => ({
                      ...prev,
                      frontCoverColor: colorId,
                    })),
                  t(`coverColors.${colorId}`),
                ),
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-ink-800">
              {t('backCoverLabel')}
            </legend>
            <p className="mt-1 text-xs text-ink-500">{t('backCoverHint')}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {STUDENT_PRINT_BACK_COVER_COLORS.map((colorId) =>
                renderColorSwatch(
                  colorId,
                  state.backCoverColor === colorId,
                  () =>
                    setState((prev) => ({
                      ...prev,
                      backCoverColor: colorId,
                    })),
                  t(`coverColors.${colorId}`),
                ),
              )}
            </div>
          </fieldset>
        </div>
      </Card>
    );
  }

  function renderReviewStep() {
    const serviceTitle = state.serviceType
      ? t(`services.${state.serviceType}.title`)
      : '—';

    return (
      <Card>
        <h2 className="text-lg font-semibold text-ink-900">
          {t('reviewTitle')}
        </h2>
        <p className="mt-1 text-sm text-ink-500">{t('reviewHint')}</p>

        <dl className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-200">
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <dt className="text-sm text-ink-500">{t('reviewService')}</dt>
            <dd className="text-sm font-medium text-ink-900">{serviceTitle}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <dt className="text-sm text-ink-500">{t('reviewFile')}</dt>
            <dd className="text-sm font-medium text-ink-900">
              {state.uploadedFile
                ? t('reviewFileSummary', {
                    name: state.uploadedFile.originalName,
                    pages: state.uploadedFile.pageCount,
                  })
                : '—'}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <dt className="text-sm text-ink-500">{t('reviewBinding')}</dt>
            <dd className="text-sm font-medium text-ink-900">
              {state.bindingType
                ? t(`bindingTypes.${state.bindingType}.title`)
                : '—'}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <dt className="text-sm text-ink-500">{t('reviewFrontCover')}</dt>
            <dd className="text-sm font-medium text-ink-900">
              {state.frontCoverColor
                ? t(`coverColors.${state.frontCoverColor}`)
                : '—'}
            </dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 px-4 py-3">
            <dt className="text-sm text-ink-500">{t('reviewBackCover')}</dt>
            <dd className="text-sm font-medium text-ink-900">
              {state.backCoverColor
                ? t(`coverColors.${state.backCoverColor}`)
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-sm text-brand-800">{t('priceNote')}</p>
        </div>

        <div className="mt-6 flex justify-between border-t border-ink-200 pt-4">
          <span className="font-semibold text-ink-900">{t('total')}</span>
          <span className="text-xl font-bold text-brand-600">
            {formatPrice(totalPrice, locale)}
          </span>
        </div>
      </Card>
    );
  }

  const primaryLabel =
    step === 'review' ? t('addToCart') : t('next');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/services"
        className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('back')}
      </Link>

      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
        {t('title')}
      </h1>
      <p className="mt-2 text-ink-600">{t('subtitle')}</p>

      <StudentPrintStepNav
        current={step}
        labels={stepLabels}
        onStepClick={handleStepNavClick}
      />

      {step === 'service' ? renderServiceStep() : null}
      {step === 'upload' ? renderUploadStep() : null}
      {step === 'binding' ? renderBindingStep() : null}
      {step === 'review' ? renderReviewStep() : null}

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 'service' || processing}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('backStep')}
        </Button>

        <Button
          type="button"
          onClick={handlePrimaryNext}
          disabled={processing}
        >
          {step === 'review' ? (
            <ShoppingCart className="h-4 w-4" aria-hidden />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden />
          )}
          {processing ? t('adding') : primaryLabel}
        </Button>
      </div>

      <CartAddedModal
        open={cartAddedOpen}
        onClose={() => setCartAddedOpen(false)}
        title={t('addedToCartTitle')}
        description={t('addedToCartBody')}
      />
    </div>
  );
}
