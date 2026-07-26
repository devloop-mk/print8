'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { OrdersList } from '@/components/account/OrdersList';
import type { AccountOrder } from '@/components/account/types';

export function AccountOrdersPage() {
  const t = useTranslations('account');
  const { customer } = useAuth();
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer) return;
    void (async () => {
      try {
        const res = await fetch('/api/account/orders', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setOrders((data.orders ?? []) as AccountOrder[]);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [customer]);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink-900">{t('ordersTitle')}</h2>
        <p className="mt-1 text-sm text-ink-600">{t('ordersSubtitle')}</p>
      </div>

      {loading ? (
        <p className="text-sm text-ink-600">{t('loading')}</p>
      ) : orders.length === 0 ? (
        <div className="w-full min-w-0 space-y-3 border border-ink-200 bg-white px-4 py-6">
          <p className="text-sm text-ink-600">{t('noOrders')}</p>
          <Link href="/products">
            <Button variant="outline" size="sm">{t('ctaProducts')}</Button>
          </Link>
        </div>
      ) : (
        <OrdersList orders={orders} />
      )}
    </div>
  );
}
