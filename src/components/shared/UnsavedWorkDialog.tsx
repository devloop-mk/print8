'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

export function UnsavedWorkDialog({
  open,
  saving,
  saveNotice,
  onSave,
  onCancel,
  onLeaveWithoutSaving,
}: {
  open: boolean;
  saving?: boolean;
  saveNotice?: string | null;
  onSave: () => void;
  onCancel: () => void;
  onLeaveWithoutSaving: () => void;
}) {
  const t = useTranslations('unsavedWork');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[80] m-0 flex h-full max-h-none w-full max-w-none items-center justify-center border-0 bg-transparent p-4 backdrop:bg-ink-900/50 open:flex"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-ink-200 bg-white p-0 shadow-2xl">
        <div className="p-6">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">{t('title')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{t('message')}</p>
            {saveNotice ? (
              <p className="mt-3 text-sm font-medium text-green-700" role="status">
                {saveNotice}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={onSave} loading={saving}>
            {t('saveDesign')}
          </Button>
        </div>

        <button
          type="button"
          onClick={onLeaveWithoutSaving}
          disabled={saving}
          className="mt-4 w-full text-center text-sm font-medium text-ink-500 transition hover:text-ink-800 disabled:opacity-50"
        >
          {t('leaveWithoutSaving')}
        </button>
        </div>
      </div>
    </dialog>
  );
}
