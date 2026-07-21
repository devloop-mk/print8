'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/Button';

/**
 * Printful-style upload confirmation: gates image uploads in the customizer
 * behind an explicit IP/Terms acceptance. Shared by every flow that uses
 * `ProductPhotoUpload` (t-shirt, drinkware, branding pack, magnets).
 */
export function UploadTermsModal({
  open,
  onAccept,
  onCancel,
}: {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations('products.customizer');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setChecked(false);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed left-1/2 top-1/2 z-[80] w-[min(30rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-ink-200 bg-white p-0 shadow-2xl backdrop:bg-ink-900/50 open:flex open:flex-col"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="p-6">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">
              {t('uploadTermsTitle')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              {t('uploadTermsBody')}
            </p>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-brand-600 underline-offset-2 hover:text-brand-700 hover:underline"
            >
              {t('uploadTermsLinkLabel')}
            </Link>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-2.5 rounded-lg border border-ink-200 bg-ink-50 px-3 py-3 text-sm text-ink-800">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>{t('uploadTermsAccept')}</span>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t('uploadTermsCancel')}
          </Button>
          <Button type="button" onClick={onAccept} disabled={!checked}>
            {t('uploadTermsContinue')}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
