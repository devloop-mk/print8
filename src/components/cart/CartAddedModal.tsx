'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle2, ShoppingCart, X } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

interface CartAddedModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export function CartAddedModal({
  open,
  onClose,
  title,
  description,
}: CartAddedModalProps) {
  const t = useTranslations('cart');
  const router = useRouter();

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

  function handleViewCart() {
    onClose();
    router.push('/cart');
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-ink-950/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-added-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-ink-200 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="rounded-full bg-green-100 p-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2
                id="cart-added-title"
                className="text-lg font-semibold text-ink-900"
              >
                {title ?? t('addedTitle')}
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                {description ?? t('addedBody')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
            aria-label={t('addedClose')}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onClose}
          >
            {t('continueShopping')}
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={handleViewCart}
          >
            <ShoppingCart className="h-4 w-4" aria-hidden />
            {t('viewCart')}
          </Button>
        </div>
      </div>
    </div>
  );
}
