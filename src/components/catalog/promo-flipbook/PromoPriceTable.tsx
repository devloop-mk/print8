import { PROMO_QTY_BREAKS, type PromoCatalogPrices } from '@/lib/catalog/promo-catalog';

export function PromoPriceTable({
  prices,
  qtyLabel,
  priceLabel,
  qty100Label,
}: {
  prices: PromoCatalogPrices;
  qtyLabel: string;
  priceLabel: string;
  qty100Label: string;
}) {
  return (
    <table className="border-collapse bg-white/95 text-left shadow-[0_1px_4px_rgba(18,43,61,0.16)]">
      <thead>
        <tr className="bg-brand-600 text-white">
          <th className="px-[0.38em] py-[0.16em] text-[clamp(0.42rem,0.82cqw,0.55rem)] font-semibold uppercase tracking-[0.03em]">
            {qtyLabel}
          </th>
          <th className="px-[0.38em] py-[0.16em] text-[clamp(0.42rem,0.82cqw,0.55rem)] font-semibold uppercase tracking-[0.03em]">
            {priceLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {PROMO_QTY_BREAKS.map((qty, index) => (
          <tr
            key={qty}
            className={index % 2 === 0 ? 'bg-brand-50' : 'bg-brand-100/90'}
          >
            <td className="px-[0.38em] py-[0.08em] text-[clamp(0.46rem,0.88cqw,0.6rem)] font-medium text-ink-800">
              {qty === 100 ? qty100Label : qty}
            </td>
            <td className="whitespace-nowrap px-[0.38em] py-[0.08em] text-[clamp(0.46rem,0.88cqw,0.6rem)] font-semibold tabular-nums text-ink-900">
              {prices[qty]} ден
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
