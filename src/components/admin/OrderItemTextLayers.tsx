'use client';

import { getCustomizerFontFamily } from '@/lib/products/text-layers';
import { getOrderItemTextSides } from '@/lib/orders/product-order-assets';
import type { OrderItem } from '@/lib/orders/order-item-previews';
import { adminStrings } from '@/lib/admin/strings';

export function OrderItemTextLayers({ item }: { item: OrderItem }) {
  const t = adminStrings.orderDetail;
  const sides = getOrderItemTextSides(item);

  if (sides.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-ink-100 bg-white p-3 sm:p-4">
      <p className="text-sm font-semibold text-ink-900">{t.textLayersTitle}</p>
      <div className="mt-3 space-y-4">
        {sides.map((side) => (
          <div key={side.side}>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {side.label}
            </p>
            <ul className="mt-2 space-y-2">
              {side.layers.map((layer, index) => (
                <li
                  key={layer.instanceId}
                  className="rounded-md border border-ink-100 bg-ink-50/60 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-ink-900">
                    {t.textLayerLabel.replace('{index}', String(index + 1))}:{' '}
                    <span className="font-normal">&ldquo;{layer.text}&rdquo;</span>
                  </p>
                  <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-xs text-ink-600 sm:grid-cols-2">
                    <div>
                      <dt className="inline">{t.textLayerFont}: </dt>
                      <dd className="inline">
                        {getCustomizerFontFamily(layer.fontFamily)}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline">{t.textLayerColor}: </dt>
                      <dd className="inline font-mono">{layer.color}</dd>
                    </div>
                    <div>
                      <dt className="inline">{t.textLayerSize}: </dt>
                      <dd className="inline">{layer.size}px</dd>
                    </div>
                    <div>
                      <dt className="inline">{t.textLayerPosition}: </dt>
                      <dd className="inline">
                        {layer.position.x.toFixed(1)}%, {layer.position.y.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
