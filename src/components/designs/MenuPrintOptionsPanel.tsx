'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn, formatPrice } from '@/lib/utils';
import { QuantityInput } from '@/components/ui/QuantityInput';
import {
  MENU_LAMINATION_OPTIONS,
  MENU_MAX_PAGES,
  MENU_MAX_QUANTITY,
  MENU_MIN_PAGES,
  MENU_MIN_QUANTITY,
  MENU_PAPER_OPTIONS,
  MENU_PRINT_SIZE_MM,
  calculateMenuPrintPrice,
  clampMenuPages,
  clampMenuQuantity,
  type MenuLamination,
  type MenuPaper,
  type MenuPrintOptions,
} from '@/lib/designs/menu-print-options';

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

  const price = calculateMenuPrintPrice(options, designFee);

  function update(patch: Partial<MenuPrintOptions>) {
    onChange({ ...options, ...patch });
  }

  function selectPaper(paper: MenuPaper) {
    update({ paper });
  }

  return (
    <div className={cn('space-y-5', className)}>
      <div className="rounded-xl border border-ink-200 bg-ink-50/60 px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">
          {t('sku', { size: MENU_PRINT_SIZE_MM })}
        </p>
        <p className="mt-1 text-xs text-ink-600">{t('skuHint')}</p>
      </div>

      <div>
        <label
          htmlFor="menu-pages"
          className="text-sm font-semibold text-ink-800"
        >
          {t('pagesLabel')}
        </label>
        <p className="mt-1 text-xs text-ink-500">{t('pagesHint')}</p>
        <QuantityInput
          id="menu-pages"
          min={MENU_MIN_PAGES}
          max={MENU_MAX_PAGES}
          value={options.pages}
          onChange={(pages) => update({ pages: clampMenuPages(pages) })}
          className="mt-3 w-32"
        />
      </div>

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

      <div>
        <label
          htmlFor="menu-quantity"
          className="text-sm font-semibold text-ink-800"
        >
          {t('quantityLabel')}
        </label>
        <p className="mt-1 text-xs text-ink-500">{t('quantityHint')}</p>
        <QuantityInput
          id="menu-quantity"
          min={MENU_MIN_QUANTITY}
          max={MENU_MAX_QUANTITY}
          value={options.quantity}
          onChange={(quantity) =>
            update({ quantity: clampMenuQuantity(quantity) })
          }
          className="mt-3 w-32"
        />
      </div>

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
