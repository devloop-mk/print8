'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
  Cake,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Heart,
  ImageIcon,
  LayoutGrid,
  Share2,
  Sparkles,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { useUploadSession } from '@/hooks/useUploadSession';
import { SecureUpload } from '@/components/upload/SecureUpload';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  CUSTOM_DESIGN_CATEGORIES,
  CUSTOM_DESIGN_ORDER_TYPE,
  CUSTOM_DESIGN_PRODUCT_TARGETS,
  getCustomDesignUnitPrice,
  mapCustomDesignCategory,
  type CustomDesignCategoryId,
  type CustomDesignProductTarget,
} from '@/lib/data/custom-design-order';
import { BusinessCardPrintOptions } from '@/components/designs/BusinessCardPrintOptions';
import {
  businessCardPrintMetadata,
  DEFAULT_BUSINESS_CARD_LAMINATION,
  DEFAULT_BUSINESS_CARD_PAPER,
  type BusinessCardLamination,
  type BusinessCardPaper,
} from '@/lib/designs/business-card-print-options';

const CATEGORY_ICONS: Record<CustomDesignCategoryId, LucideIcon> = {
  'business-cards': CreditCard,
  wedding: Heart,
  birthday: Cake,
  menus: UtensilsCrossed,
  'logo-branding': Sparkles,
  'social-media': Share2,
  other: LayoutGrid,
};

type FormState = {
  category: CustomDesignCategoryId | '';
  targetProduct: CustomDesignProductTarget;
  designBrief: string;
  styleNotes: string;
  fullName: string;
  phone: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormState | 'form', string>>;

export function CustomDesignOrderForm() {
  const t = useTranslations('designs.customOrder');
  const to = useTranslations('designs.order');
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const { token, loading: uploadLoading, error: uploadSessionError, refreshSession } =
    useUploadSession();

  const [form, setForm] = useState<FormState>({
    category: '',
    targetProduct: 'print-only',
    designBrief: '',
    styleNotes: '',
    fullName: '',
    phone: '',
    email: '',
  });
  const [referenceFileIds, setReferenceFileIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [paper, setPaper] = useState<BusinessCardPaper>(DEFAULT_BUSINESS_CARD_PAPER);
  const [lamination, setLamination] = useState<BusinessCardLamination>(
    DEFAULT_BUSINESS_CARD_LAMINATION,
  );
  const [businessCardStep, setBusinessCardStep] = useState<'print' | 'details'>('print');
  const isBusinessCard = form.category === 'business-cards';
  const showPrintStep = isBusinessCard && businessCardStep === 'print';
  const showDetails = !isBusinessCard || businessCardStep === 'details';

  const unitPrice = useMemo(
    () =>
      form.category
        ? getCustomDesignUnitPrice(form.category)
        : getCustomDesignUnitPrice('other'),
    [form.category],
  );

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    if (field === 'category') {
      setBusinessCardStep(value === 'business-cards' ? 'print' : 'details');
    }
  }

  function validate(): boolean {
    const next: FormErrors = {};

    if (!form.category) next.category = t('errors.categoryRequired');
    if (!form.designBrief.trim() || form.designBrief.trim().length < 20) {
      next.designBrief = t('errors.briefTooShort');
    }
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      next.fullName = t('errors.fullNameRequired');
    }
    if (!form.phone.trim() || form.phone.trim().length < 8) {
      next.phone = t('errors.phoneRequired');
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = t('errors.invalidEmail');
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleReferenceUpload(fileId: string) {
    setReferenceFileIds((prev) =>
      prev.includes(fileId) ? prev : [...prev, fileId],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !form.category) return;

    setSubmitting(true);
    try {
      const category = mapCustomDesignCategory(form.category);
      const categoryLabel = t(`categories.${form.category}`);
      const targetLabel = t(`products.${form.targetProduct}`);

      const metadata: Record<string, string | number | boolean> = {
        orderType: CUSTOM_DESIGN_ORDER_TYPE,
        designTemplateId: 'custom',
        category,
        customDesignCategory: form.category,
        targetProduct: form.targetProduct,
        designBrief: form.designBrief.trim(),
        ...(isBusinessCard
          ? businessCardPrintMetadata({ paper, lamination })
          : {}),
      };

      if (form.styleNotes.trim()) {
        metadata.styleNotes = form.styleNotes.trim();
      }
      metadata.targetProductLabel = targetLabel;

      addItem({
        type: 'design',
        name: t('cartItemName', { category: categoryLabel }),
        price: unitPrice,
        quantity: 1,
        metadata,
        fileIds: referenceFileIds.length > 0 ? referenceFileIds : undefined,
      });

      try {
        sessionStorage.setItem(
          'print8-checkout-prefill',
          JSON.stringify({
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
          }),
        );
      } catch {
        // ignore quota / private mode
      }

      router.push('/cart');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('categoryTitle')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('categorySubtitle')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {CUSTOM_DESIGN_CATEGORIES.map((categoryId) => {
              const Icon = CATEGORY_ICONS[categoryId];
              const selected = form.category === categoryId;
              return (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() => updateField('category', categoryId)}
                  className={cn(
                    'flex items-start gap-3 border-2 p-4 text-left transition',
                    selected
                      ? 'border-brand-500 bg-brand-50/60 shadow-lift-brand'
                      : 'border-ink-200 bg-white hover:border-brand-300 hover:bg-brand-50/30',
                  )}
                  aria-pressed={selected}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center border',
                      selected
                        ? 'border-brand-300 bg-brand-100 text-brand-700'
                        : 'border-ink-200 bg-ink-50 text-ink-600',
                    )}
                  >
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">
                      {t(`categories.${categoryId}`)}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">
                      {t(`categoryHints.${categoryId}`)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.category ? (
            <p className="text-sm text-red-600" role="alert">
              {errors.category}
            </p>
          ) : null}
        </section>

        {isBusinessCard ? (
          <nav aria-label={to('stepsNav')} className="-mt-2">
            <ol className="flex flex-wrap gap-2">
              {(['print', 'details'] as const).map((item, index) => {
                const isActive = businessCardStep === item;
                const isDone = businessCardStep === 'details' && item === 'print';
                return (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => {
                        if (item === 'print' || businessCardStep === 'details') {
                          setBusinessCardStep(item);
                        }
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
                      {to(`steps.${item}`)}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        ) : null}

        {showPrintStep ? (
          <section className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-ink-900">{to('printStepTitle')}</h2>
              <p className="mt-1 text-sm text-ink-600">{to('printStepSubtitle')}</p>
            </div>
            <BusinessCardPrintOptions
              paper={paper}
              lamination={lamination}
              onPaperChange={setPaper}
              onLaminationChange={setLamination}
            />
            <Button
              type="button"
              size="lg"
              className="w-full gap-1 sm:w-auto"
              onClick={() => setBusinessCardStep('details')}
            >
              {to('nextStep')}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </section>
        ) : null}

        {showDetails ? (
          <>
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('productTitle')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('productSubtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {CUSTOM_DESIGN_PRODUCT_TARGETS.map((productId) => {
              const selected = form.targetProduct === productId;
              return (
                <button
                  key={productId}
                  type="button"
                  onClick={() => updateField('targetProduct', productId)}
                  className={cn(
                    'border px-3 py-2 text-sm font-medium transition',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-800'
                      : 'border-ink-300 bg-white text-ink-700 hover:border-brand-300',
                  )}
                  aria-pressed={selected}
                >
                  {t(`products.${productId}`)}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('briefTitle')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('briefSubtitle')}</p>
          </div>
          <div>
            <label htmlFor="designBrief" className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('fields.designBrief')} <span className="text-brand-600">*</span>
            </label>
            <textarea
              id="designBrief"
              rows={6}
              value={form.designBrief}
              onChange={(e) => updateField('designBrief', e.target.value)}
              placeholder={t('placeholders.designBrief')}
              aria-invalid={Boolean(errors.designBrief)}
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            {errors.designBrief ? (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.designBrief}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="styleNotes" className="mb-1.5 block text-sm font-medium text-ink-700">
              {t('fields.styleNotes')}
            </label>
            <textarea
              id="styleNotes"
              rows={3}
              value={form.styleNotes}
              onChange={(e) => updateField('styleNotes', e.target.value)}
              placeholder={t('placeholders.styleNotes')}
              className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('referencesTitle')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('referencesSubtitle')}</p>
          </div>
          <div className="flex items-start gap-3 border border-dashed border-ink-300 bg-ink-50/50 p-4">
            <ImageIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <SecureUpload
                token={token}
                loading={uploadLoading}
                sessionError={uploadSessionError}
                onRefreshSession={refreshSession}
                onUpload={handleReferenceUpload}
              />
              {referenceFileIds.length > 0 ? (
                <p className="mt-2 text-xs text-ink-600">
                  {t('referencesAttached', { count: referenceFileIds.length })}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">{t('contactTitle')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('contactSubtitle')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('fields.fullName')} <span className="text-brand-600">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.fullName ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.fullName}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('fields.phone')} <span className="text-brand-600">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.phone ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.phone}
                </p>
              ) : null}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
                {t('fields.email')}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
              {errors.email ? (
                <p className="mt-1 text-sm text-red-600" role="alert">
                  {errors.email}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        {errors.form ? (
          <p className="text-sm text-red-600" role="alert">
            {errors.form}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isBusinessCard ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-1 sm:w-auto"
              onClick={() => setBusinessCardStep('print')}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {to('prevStep')}
            </Button>
          ) : null}
          <Button type="submit" size="lg" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </div>
          </>
        ) : null}
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <Card className="space-y-5 border-2 border-brand-200/80 bg-gradient-to-br from-brand-50/80 to-white p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {t('summaryLabel')}
            </p>
            <p className="mt-2 text-2xl font-bold text-ink-900">
              {t('startingFrom')}{' '}
              <span className="text-brand-700">{formatPrice(unitPrice, locale)}</span>
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('summaryNote')}</p>
          </div>
          <ul className="space-y-3 border-t border-ink-200/80 pt-4 text-sm text-ink-600">
            <li className="flex gap-2">
              <span className="font-bold text-brand-600">1.</span>
              <span>{t('process.submit')}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600">2.</span>
              <span>{t('process.review')}</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-brand-600">3.</span>
              <span>{t('process.deliver')}</span>
            </li>
          </ul>
          <p className="text-xs leading-relaxed text-ink-500">{t('priceDisclaimer')}</p>
        </Card>
      </aside>
    </div>
  );
}
