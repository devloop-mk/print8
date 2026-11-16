import type { PromoPriceBreak } from '@/lib/catalog/promo-catalog';

export function PromoPriceTable({ prices }: { prices: PromoPriceBreak[] }) {
  return (
    <table className="promo-price-table">
      <thead>
        <tr>
          {prices.map((row) => (
            <th key={row.label}>{row.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          {prices.map((row) => (
            <td key={row.label}>{row.price}</td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}
