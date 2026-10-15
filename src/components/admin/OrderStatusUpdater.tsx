'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderStatus } from '@/lib/db';
import { ORDER_STATUS_LABELS } from '@/lib/admin/orders';
import { adminStrings } from '@/lib/admin/strings';
import { Button } from '@/components/ui/Button';

const STATUS_FLOW: OrderStatus[] = [
  'pending',
  'confirmed',
  'printing',
  'ready',
  'delivered',
  'cancelled',
];

export function OrderStatusUpdater({
  orderId,
  currentStatus,
  canNotify,
}: {
  orderId: string;
  currentStatus: OrderStatus;
  canNotify: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notifyCustomer, setNotifyCustomer] = useState(canNotify);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const t = adminStrings.orderDetail;

  useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  async function handleUpdate() {
    if (status === currentStatus) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          notifyCustomer: canNotify && notifyCustomer,
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        notified?: boolean;
        notifyError?: string;
      };

      if (!response.ok) {
        setError(data.error ?? t.statusFailed);
        return;
      }

      if (canNotify && notifyCustomer && data.notified) {
        setSuccess(t.statusUpdatedNotified);
      } else if (canNotify && notifyCustomer && data.notifyError === 'missing_email') {
        setSuccess(t.statusUpdatedNoEmail);
      } else if (canNotify && notifyCustomer) {
        setSuccess(t.statusUpdatedNotifyFailed);
      } else {
        setSuccess(t.statusUpdated);
      }
      router.refresh();
    } catch {
      setError(t.statusError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor="order-status" className="block text-sm font-medium text-ink-700">
        {t.statusTitle}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          id="order-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-sm outline-none ring-brand-500 focus:ring-2 sm:flex-1"
        >
          {STATUS_FLOW.map((value) => (
            <option key={value} value={value}>
              {ORDER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <label
          className={`flex items-center gap-2 text-sm sm:shrink-0 ${
            canNotify ? 'text-ink-800' : 'text-ink-400'
          }`}
          title={canNotify ? t.notifyCustomerHint : t.notifyNoEmail}
        >
          <input
            type="checkbox"
            checked={canNotify && notifyCustomer}
            disabled={!canNotify}
            onChange={(event) => setNotifyCustomer(event.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
          />
          <span>{t.notifyCustomer}</span>
        </label>
      </div>
      {!canNotify ? (
        <p className="text-xs text-ink-500">{t.notifyNoEmail}</p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          onClick={handleUpdate}
          loading={saving}
          disabled={saving || status === currentStatus}
        >
          {saving ? t.saving : t.saveStatus}
        </Button>
        {status !== 'delivered' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setStatus('delivered')}
          >
            {t.markDelivered}
          </Button>
        ) : null}
        {status !== 'cancelled' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setStatus('cancelled')}
          >
            {t.cancelOrder}
          </Button>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-600">{success}</p> : null}
    </div>
  );
}
