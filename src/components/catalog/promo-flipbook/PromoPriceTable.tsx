import { PROMO_QTY_BREAKS, type PromoCatalogPrices } from '@/lib/catalog/promo-catalog';

export function PromoPriceTable({
  prices,
  qty100Label,
}: {
  prices: PromoCatalogPrices;
  qty100Label: string;
}) {
  return (
    <table className="promo-price-table">
      <thead>
        <tr>
          {PROMO_QTY_BREAKS.map((qty) => (
            <th key={qty}>{qty === 100 ? qty100Label : qty}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {PROMO_QTY_BREAKS.map((qty) => (
            <td key={qty}>{prices[qty]}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
