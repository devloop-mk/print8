'use client';

import { useEffect, type ReactNode } from 'react';
import { Eye, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import type { ProductSide } from '@/lib/data/catalog';
import { cn } from '@/lib/utils';

export function CustomizerSidesPreviewModal({
  open,
  loading,
  sides,
  sideLabel,
  sideHasContent,
  renderSide,
  onClose,
  onAddToCart,
  addToCartDisabled,
  addToCartLabel,
  use3DPreviewLabels = false,
}: {
  open: boolean;
  loading?: boolean;
  sides: ProductSide[];
  sideLabel: (side: ProductSide) => string;
  sideHasContent: (side: ProductSide) => boolean;
  renderSide: (side: ProductSide) => ReactNode;
  onClose: () => void;
  onAddToCart: () => void;
  addToCartDisabled?: boolean;
  addToCartLabel: string;
  /** Drinkware 3D previews are not a garment "front" side — use the 3D pane title. */
  use3DPreviewLabels?: boolean;
}) {
  const t = useTranslations('products.customizer');

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customizer-sides-preview-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-ink-200 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p
              id="customizer-sides-preview-title"
              className="inline-flex items-center gap-2 text-base font-semibold text-ink-900"
            >
              <Eye className="h-4 w-4 text-brand-600" aria-hidden />
              {t('sidesPreviewTitle')}
            </p>
            <p className="mt-1 text-sm text-ink-500">{t('sidesPreviewHint')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-50 hover:text-ink-800"
            aria-label={t('close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#e9edf2] p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-[16rem] items-center justify-center">
              <LoadingIndicator label={t('sidesPreviewLoading')} />
            </div>
          ) : (
            <div
              className={cn(
                'mx-auto grid gap-4',
                sides.length > 1
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : 'max-w-md grid-cols-1',
              )}
            >
              {sides.map((side) => (
                <article
                  key={side}
                  className="overflow-visible rounded-xl border border-ink-200 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
                    <h3 className="text-sm font-semibold text-ink-900">
                      {use3DPreviewLabels
                        ? t('preview3dPaneTitle')
                        : sideLabel(side)}
                    </h3>
                    {sideHasContent(side) ? (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                        {t('sidesPreviewHasDesign')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-400">
                        {t('sidesPreviewBlank')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-center overflow-visible bg-[#eef2f6] p-3 pb-5 sm:p-4 sm:pb-6">
                    {renderSide(side)}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-ink-100 bg-white px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('sidesPreviewContinue')}
          </Button>
          <Button
            type="button"
            onClick={onAddToCart}
            disabled={addToCartDisabled || loading}
          >
            {addToCartLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
