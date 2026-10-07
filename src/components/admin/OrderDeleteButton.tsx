'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminStrings } from '@/lib/admin/strings';

const CONFIRM_WORD = 'delete';

export function OrderDeleteButton({
  orderId,
  orderNumber,
  variant = 'full',
  redirectTo,
}: {
  orderId: string;
  orderNumber: string;
  variant?: 'full' | 'icon';
  redirectTo?: string;
}) {
  const router = useRouter();
  const t = adminStrings.orderDetail;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTyped('');
      setError('');
    }
  }, [open]);

  const confirmed = typed.trim().toLowerCase() === CONFIRM_WORD;

  async function handleDelete() {
    if (!confirmed || saving) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: typed.trim() }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? t.deleteFailed);
        return;
      }
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setError(t.deleteError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {variant === 'icon' ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setOpen(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-700 transition hover:bg-red-50"
          aria-label={t.deleteOrder}
          title={t.deleteOrder}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full border-red-300 text-red-800 hover:border-red-400 hover:bg-red-50 sm:w-auto"
          onClick={() => setOpen(true)}
        >
          {t.deleteOrder}
        </Button>
      )}

      <dialog
        ref={dialogRef}
        className="z-[80] w-[calc(100vw-2rem)] max-w-md rounded-2xl border-0 bg-transparent p-0 backdrop:bg-ink-900/50"
        onCancel={(event) => {
          event.preventDefault();
          if (!saving) setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === dialogRef.current && !saving) setOpen(false);
        }}
      >
        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-2xl">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
              <Trash2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink-900">{t.deleteTitle}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {t.deleteWarning.replace('{number}', orderNumber)}
              </p>
            </div>
          </div>

          <form
            className="mt-5 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handleDelete();
            }}
          >
            <div>
              <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-ink-700">
                {t.deleteConfirmLabel}
              </label>
              <input
                id={inputId}
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder={t.deleteConfirmPlaceholder}
                className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm outline-none ring-red-500 focus:ring-2"
                disabled={saving}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                {t.deleteCancel}
              </Button>
              <Button
                type="submit"
                className="border-red-800 bg-red-700 from-red-600 to-red-700 hover:from-red-500 hover:to-red-600"
                loading={saving}
                disabled={!confirmed || saving}
              >
                {saving ? t.deleting : t.deleteSubmit}
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
