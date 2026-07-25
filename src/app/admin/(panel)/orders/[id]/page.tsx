import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { OrderItemDesignAssets } from '@/components/admin/OrderItemDesignAssets';
import { OrderItemMetadata } from '@/components/admin/OrderItemMetadata';
import { OrderItemTextLayers } from '@/components/admin/OrderItemTextLayers';
import { Card } from '@/components/ui/Card';
import {
  collectOrderFileIds,
  getAdminOrder,
} from '@/lib/admin/orders';
import { adminStrings, formatAdminDate } from '@/lib/admin/strings';
import { db } from '@/lib/db';
import { listPremadeMasterAssetRefsFromItem } from '@/lib/orders/premade-master-assets';
import { formatPrice } from '@/lib/utils';

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const t = adminStrings.orderDetail;
  const allFileIds = collectOrderFileIds({
    items: order.items,
    fileIds: order.fileIds,
  });
  const files = await Promise.all(
    allFileIds.map(async (fileId) => {
      const file = await db.uploadedFiles.findById(fileId);
      return file ? { fileId, name: file.originalName, mimeType: file.mimeType } : null;
    }),
  );
  const premadeMastersByItem = await Promise.all(
    order.items.map((item) => listPremadeMasterAssetRefsFromItem(item)),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">
            {t.back}
          </Link>
          <h1 className="mt-2 break-all text-xl font-semibold text-ink-900 sm:text-2xl">
            {order.orderNumber}
          </h1>
          <p className="text-sm text-ink-500">
            {t.placed} {formatAdminDate(order.createdAt, 'long')}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-ink-900">{t.items}</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-lg border border-ink-100 p-3 sm:p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900">{item.name}</p>
                      <p className="text-sm text-ink-500">
                        {adminStrings.itemType[item.type]}
                      </p>
                      <p className="mt-1 text-sm text-ink-600">
                        {item.quantity} × {formatPrice(item.price, order.locale)}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-ink-900">
                      {formatPrice(item.price * item.quantity, order.locale)}
                    </p>
                  </div>

                  <OrderItemDesignAssets
                    orderId={order.id}
                    item={item}
                    itemIndex={index}
                    itemCount={order.items.length}
                    premadeMasters={premadeMastersByItem[index] ?? []}
                  />

                  <OrderItemTextLayers item={item} />

                  {item.metadata && Object.keys(item.metadata).length > 0 ? (
                    <OrderItemMetadata metadata={item.metadata} />
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t border-ink-100 pt-4 text-sm">
              <span className="font-medium text-ink-700">{t.total}</span>
              <span className="text-lg font-semibold text-ink-900">
                {formatPrice(order.totalAmount, order.locale)}
              </span>
            </div>
          </Card>

          {files.filter(Boolean).length > 0 ? (
            <Card className="p-4 sm:p-6">
              <h2 className="text-sm font-semibold text-ink-900">{t.uploadedFiles}</h2>
              <ul className="mt-3 space-y-2">
                {files
                  .filter((file): file is NonNullable<typeof file> => Boolean(file))
                  .map((file) => (
                    <li key={file.fileId} className="break-all">
                      <a
                        href={`/api/files/${file.fileId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-700 hover:underline"
                      >
                        {file.name}
                      </a>
                      <span className="ml-2 text-xs text-ink-400">{file.mimeType}</span>
                    </li>
                  ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-ink-900">{t.customer}</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-ink-500">{t.name}</dt>
                <dd className="font-medium text-ink-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">{t.phone}</dt>
                <dd className="font-medium text-ink-900">
                  <a href={`tel:${order.customerPhone}`} className="hover:underline">
                    {order.customerPhone}
                  </a>
                </dd>
              </div>
              {order.customerEmail ? (
                <div>
                  <dt className="text-ink-500">{t.email}</dt>
                  <dd className="break-all font-medium text-ink-900">
                    <a href={`mailto:${order.customerEmail}`} className="hover:underline">
                      {order.customerEmail}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-ink-500">{t.fulfillment}</dt>
                <dd className="font-medium text-ink-900">
                  {order.fulfillmentMethod === 'pickup'
                    ? t.fulfillmentPickup
                    : t.fulfillmentCargo}
                </dd>
              </div>
              <div>
                <dt className="text-ink-500">{t.city}</dt>
                <dd className="font-medium text-ink-900">{order.customerCity}</dd>
              </div>
              <div>
                <dt className="text-ink-500">{t.address}</dt>
                <dd className="font-medium text-ink-900">{order.customerAddress}</dd>
              </div>
              {order.notes ? (
                <div>
                  <dt className="text-ink-500">{t.notes}</dt>
                  <dd className="font-medium text-ink-900">{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card className="p-4 sm:p-6">
            <OrderStatusUpdater
              key={`${order.id}-${order.status}`}
              orderId={order.id}
              currentStatus={order.status}
            />
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="text-sm font-semibold text-ink-900">{t.details}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">{t.payment}</dt>
                <dd className="font-medium uppercase text-ink-900">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">{t.locale}</dt>
                <dd className="font-medium uppercase text-ink-900">{order.locale}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
