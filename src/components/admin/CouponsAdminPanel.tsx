'use client';

import { useEffect, useState } from 'react';
import { adminStrings } from '@/lib/admin/strings';
import { Button } from '@/components/ui/Button';

type CouponRow = {
  id: string;
  code: string;
  kind: 'public' | 'reward_issued';
  discountAmount: number;
  minOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  maxRedemptionsPerDay: number | null;
  maxRedemptionsTotal: number | null;
  active: boolean;
  redemptionsTotal: number;
  redemptionsToday: number;
  issuedToEmail: string | null;
  note: string | null;
};

type TierRow = {
  id: string;
  minSpend: number;
  rewardAmount: number;
  rewardMinOrderAmount: number;
  rewardValidDays: number;
  active: boolean;
  sortOrder: number;
};

type SpinRow = {
  id: string;
  emailMasked: string;
  prizeKey: string;
  discountAmount: number;
  couponCode: string | null;
  locale: string | null;
  createdAt: string;
};

export function CouponsAdminPanel() {
  const t = adminStrings.coupons;
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [spins, setSpins] = useState<SpinRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('500');
  const [minOrderAmount, setMinOrderAmount] = useState('3000');
  const [maxPerDay, setMaxPerDay] = useState('50');
  const [maxTotal, setMaxTotal] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const [tierMinSpend, setTierMinSpend] = useState('3000');
  const [tierReward, setTierReward] = useState('500');
  const [tierMinOrder, setTierMinOrder] = useState('0');
  const [tierDays, setTierDays] = useState('60');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [couponsRes, spinsRes] = await Promise.all([
        fetch('/api/admin/coupons'),
        fetch('/api/admin/rewards/spins'),
      ]);
      if (!couponsRes.ok) throw new Error('load failed');
      const data = await couponsRes.json();
      setCoupons(data.coupons ?? []);
      setTiers(data.rewardTiers ?? []);

      if (spinsRes.ok) {
        const spinsData = await spinsRes.json();
        setSpins(spinsData.spins ?? []);
      } else {
        setSpins([]);
      }
    } catch {
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function createCoupon(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_coupon',
          code,
          discountAmount: Number(discountAmount),
          minOrderAmount: Number(minOrderAmount),
          maxRedemptionsPerDay: maxPerDay ? Number(maxPerDay) : null,
          maxRedemptionsTotal: maxTotal ? Number(maxTotal) : null,
          endsAt: endsAt ? new Date(endsAt).toISOString() : null,
          active: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : t.saveError);
        return;
      }
      setMessage(t.created);
      setCode('');
      await load();
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: CouponRow) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !coupon.active }),
      });
      if (!res.ok) throw new Error('toggle failed');
      await load();
    } catch {
      setError(t.saveError);
    }
  }

  async function saveTier(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'upsert_tier',
          minSpend: Number(tierMinSpend),
          rewardAmount: Number(tierReward),
          rewardMinOrderAmount: Number(tierMinOrder),
          rewardValidDays: Number(tierDays),
          active: true,
          sortOrder: Number(tierMinSpend),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : t.saveError);
        return;
      }
      setMessage(t.tierSaved);
      await load();
    } catch {
      setError(t.saveError);
    } finally {
      setSaving(false);
    }
  }

  async function removeTier(id: string) {
    if (!window.confirm(t.confirmDeleteTier)) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_tier', id }),
      });
      if (!res.ok) throw new Error('delete failed');
      await load();
    } catch {
      setError(t.saveError);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-ink-600">{t.subtitle}</p>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <form
        onSubmit={createCoupon}
        className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-ink-900">{t.createTitle}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.code}</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              minLength={3}
              className="w-full rounded-lg border border-ink-300 px-3 py-2 uppercase"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.discount}</span>
            <input
              type="number"
              min={1}
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.minOrder}</span>
            <input
              type="number"
              min={0}
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.maxPerDay}</span>
            <input
              type="number"
              min={1}
              value={maxPerDay}
              onChange={(e) => setMaxPerDay(e.target.value)}
              placeholder={t.unlimited}
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.maxTotal}</span>
            <input
              type="number"
              min={1}
              value={maxTotal}
              onChange={(e) => setMaxTotal(e.target.value)}
              placeholder={t.unlimited}
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.endsAt}</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
        </div>
        <Button type="submit" loading={saving} disabled={saving}>
          {t.create}
        </Button>
      </form>

      <form
        onSubmit={saveTier}
        className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-ink-900">{t.tiersTitle}</h2>
        <p className="text-sm text-ink-600">{t.tiersHelp}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.tierMinSpend}</span>
            <input
              type="number"
              min={1}
              value={tierMinSpend}
              onChange={(e) => setTierMinSpend(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.tierReward}</span>
            <input
              type="number"
              min={1}
              value={tierReward}
              onChange={(e) => setTierReward(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.tierRewardMin}</span>
            <input
              type="number"
              min={0}
              value={tierMinOrder}
              onChange={(e) => setTierMinOrder(e.target.value)}
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t.tierDays}</span>
            <input
              type="number"
              min={1}
              value={tierDays}
              onChange={(e) => setTierDays(e.target.value)}
              required
              className="w-full rounded-lg border border-ink-300 px-3 py-2"
            />
          </label>
        </div>
        <Button type="submit" loading={saving} disabled={saving}>
          {t.saveTier}
        </Button>

        <ul className="mt-4 divide-y divide-ink-100">
          {tiers.map((tier) => (
            <li
              key={tier.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
            >
              <span>
                {t.tierLine
                  .replace('{spend}', String(tier.minSpend))
                  .replace('{reward}', String(tier.rewardAmount))
                  .replace('{days}', String(tier.rewardValidDays))}
                {!tier.active ? ` · ${t.inactive}` : ''}
              </span>
              <button
                type="button"
                onClick={() => void removeTier(tier.id)}
                className="text-rose-700 hover:underline"
              >
                {t.delete}
              </button>
            </li>
          ))}
        </ul>
      </form>

      <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.listTitle}</h2>
        {loading ? (
          <p className="mt-3 text-sm text-ink-500">{t.loading}</p>
        ) : coupons.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t.empty}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100">
            {coupons.map((coupon) => (
              <li
                key={coupon.id}
                className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink-900">
                    {coupon.code}{' '}
                    <span className="font-normal text-ink-500">
                      (−{coupon.discountAmount} MKD)
                    </span>
                  </p>
                  <p className="text-ink-500">
                    {t.minOrder}: {coupon.minOrderAmount} · {t.usedToday}:{' '}
                    {coupon.redemptionsToday}
                    {coupon.maxRedemptionsPerDay != null
                      ? `/${coupon.maxRedemptionsPerDay}`
                      : ''}{' '}
                    · {t.usedTotal}: {coupon.redemptionsTotal}
                    {coupon.maxRedemptionsTotal != null
                      ? `/${coupon.maxRedemptionsTotal}`
                      : ''}
                    {coupon.kind === 'reward_issued' ? ` · ${t.rewardKind}` : ''}
                    {!coupon.active ? ` · ${t.inactive}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void toggleActive(coupon)}
                  className="text-brand-700 hover:underline"
                >
                  {coupon.active ? t.deactivate : t.activate}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-ink-200 bg-white p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-ink-900">{t.spinsTitle}</h2>
        <p className="mt-1 text-sm text-ink-500">{t.spinsHelp}</p>
        {loading ? (
          <p className="mt-3 text-sm text-ink-500">{t.loading}</p>
        ) : spins.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">{t.spinsEmpty}</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-ink-200 text-ink-500">
                <tr>
                  <th className="py-2 pr-3 font-medium">{t.spinsEmail}</th>
                  <th className="py-2 pr-3 font-medium">{t.spinsPrize}</th>
                  <th className="py-2 pr-3 font-medium">{t.spinsCode}</th>
                  <th className="py-2 font-medium">{t.spinsDate}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {spins.map((spin) => (
                  <tr key={spin.id}>
                    <td className="py-2 pr-3 text-ink-800">{spin.emailMasked}</td>
                    <td className="py-2 pr-3 text-ink-700">
                      {spin.discountAmount > 0
                        ? `−${spin.discountAmount} MKD`
                        : t.spinsTryAgain}
                    </td>
                    <td className="py-2 pr-3 font-mono text-ink-700">
                      {spin.couponCode ?? '—'}
                    </td>
                    <td className="py-2 text-ink-500">
                      {new Date(spin.createdAt).toLocaleString('mk-MK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
