'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { cn, formatPrice } from '@/lib/utils';
import {
  MENU_LAMINATION_OPTIONS,
  MENU_PAGE_COUNT_OPTIONS,
  MENU_PAPER_OPTIONS,
  MENU_PRINT_SIZE_MM,
  MENU_QUANTITY_OPTIONS,
  MENU_QUOTE_QUANTITY_THRESHOLD,
  calculateMenuPrintPrice,
  supportsMenuLamination,
  type MenuLamination,
  type MenuPageCount,
  type MenuPaper,
  type MenuPrintOptions,
  type MenuQuantity,
} from '@/lib/designs/menu-print-options';

const chipClass =
  'rounded-xl border px-4 py-2.5 text-sm font-semibold transition touch-manipulation';

function chipStyle(selected: boolean) {
  return cn(
    chipClass,
    selected
      ? 'border-brand-600 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
      : 'border-ink-200 bg-white text-ink-700 hover:border-brand-300',
  );
}

export function MenuPrintOptionsPanel({
  options,
  onChange,
  designFee = 0,
  className,
}: {
  options: MenuPrintOptions;
  onChange: (options: MenuPrintOptions) => void;
  designFee?: number;
  className?: string;
}) {
  const t = useTranslations('designs.order.menuPrintOptions');
  const locale = useLocale();

  const laminationAvailable = supportsMenuLamination(options.paper);
  const price = calculateMenuPrintPrice(options, designFee);

  function update(patch: Partial<MenuPrintOptions>) {
    onChange({ ...options, ...patch });
  }

  function selectPaper(paper: MenuPaper) {
    update({
      paper,
      lamination: supportsMenuLamination(paper) ? options.lamination : 'none',
    });
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">
          {t('sku', { size: MENU_PRINT_SIZE_MM })}
        </p>
        <p className="mt-1 text-xs text-ink-600">{t('skuHint')}</p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('pagesLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('pagesHint')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MENU_PAGE_COUNT_OPTIONS.map((option: MenuPageCount) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ pages: option })}
              aria-pressed={options.pages === option}
              className={chipStyle(options.pages === option)}
            >
              {t('pagesValue', { pages: option })}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('paperLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('paperHint')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {MENU_PAPER_OPTIONS.map((option: MenuPaper) => {
            const selected = options.paper === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => selectPaper(option)}
                aria-pressed={selected}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition',
                  selected
                    ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                    : 'border-ink-200 bg-white hover:border-brand-300',
                )}
              >
                <span className="block font-semibold text-ink-900">
                  {t(`paper.${option}.title`)}
                </span>
                <span className="mt-0.5 block text-sm text-ink-500">
                  {t(`paper.${option}.description`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {laminationAvailable ? (
        <fieldset>
          <legend className="text-sm font-semibold text-ink-800">
            {t('laminationLabel')}
          </legend>
          <p className="mt-1 text-xs text-ink-500">{t('laminationHint')}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {MENU_LAMINATION_OPTIONS.map((option: MenuLamination) => {
              const selected = options.lamination === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => update({ lamination: option })}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-xl border px-4 py-3 text-left transition',
                    selected
                      ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                      : 'border-ink-200 bg-white hover:border-brand-300',
                  )}
                >
                  <span className="block font-semibold text-ink-900">
                    {t(`lamination.${option}.title`)}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-600">
          {t('laminationWaterproofNote')}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">
          {t('quantityLabel')}
        </legend>
        <p className="mt-1 text-xs text-ink-500">{t('quantityHint')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MENU_QUANTITY_OPTIONS.map((option: MenuQuantity) => (
            <button
              key={option}
              type="button"
              onClick={() => update({ quantity: option })}
              aria-pressed={options.quantity === option}
              className={chipStyle(options.quantity === option)}
            >
              {t('quantityValue', { quantity: option })}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-600">
          {t('quoteAbove', { max: MENU_QUOTE_QUANTITY_THRESHOLD })}{' '}
          <Link
            href="/contact"
            className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
          >
            {t('quoteCta')}
          </Link>
        </p>
      </fieldset>

      <dl className="rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">{t('unitPrice')}</dt>
          <dd className="font-medium text-ink-800">
            {formatPrice(price.unitTotal, locale)}
          </dd>
        </div>
        <div className="mt-1.5 flex items-baseline justify-between gap-3">
          <dt className="text-ink-500">
            {t('printTotal', { quantity: price.quantity })}
          </dt>
          <dd className="font-medium text-ink-800">
            {formatPrice(price.printTotal, locale)}
          </dd>
        </div>
        {price.designFee > 0 ? (
          <div className="mt-1.5 flex items-baseline justify-between gap-3">
            <dt className="text-ink-500">{t('designFee')}</dt>
            <dd className="font-medium text-ink-800">
              {formatPrice(price.designFee, locale)}
            </dd>
          </div>
        ) : null}
        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-ink-100 pt-3">
          <dt className="font-semibold text-ink-900">{t('total')}</dt>
          <dd className="text-lg font-bold text-ink-900">
            {formatPrice(price.total, locale)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
