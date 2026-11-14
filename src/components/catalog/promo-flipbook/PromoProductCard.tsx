import { Link } from '@/i18n/navigation';
import type { PromoCatalogProduct } from '@/lib/catalog/promo-catalog';
import { PromoPriceTable } from '@/components/catalog/promo-flipbook/PromoPriceTable';

export function PromoProductCard({
  product,
  name,
  specs,
  qtyLabel,
  priceLabel,
  qty100Label,
}: {
  product: PromoCatalogProduct;
  name: string;
  specs: string[];
  qtyLabel: string;
  priceLabel: string;
  qty100Label: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href={product.href}
        className="relative min-h-0 flex-[1.35] bg-[#f3f5f7]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={name}
          className="absolute inset-0 h-full w-full object-contain object-right p-[2%] pb-[16%] pl-[20%]"
        />
        <div className="absolute bottom-[3%] left-[3%] z-[1]">
          <PromoPriceTable
            prices={product.prices}
            qtyLabel={qtyLabel}
            priceLabel={priceLabel}
            qty100Label={qty100Label}
          />
        </div>
      </Link>
      <div className="mt-[0.55em] shrink-0">
        <Link href={product.href} className="block">
          <h3 className="font-display text-[clamp(0.78rem,1.35cqw,1.05rem)] font-semibold leading-snug text-ink-900 hover:text-brand-700">
            {name}
          </h3>
        </Link>
        <div className="mt-[0.2em] space-y-0 text-[clamp(0.6rem,0.95cqw,0.75rem)] leading-snug text-ink-600">
          {specs.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {product.swatches?.length ? (
          <div className="mt-[0.3em] flex flex-wrap gap-1">
            {product.swatches.map((color) => (
              <span
                key={color}
                className="h-2.5 w-2.5 rounded-full border border-ink-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
