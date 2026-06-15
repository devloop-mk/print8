import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusBadge } from '@/components/admin/OrderStatusBadge';
import { OrderStatusUpdater } from '@/components/admin/OrderStatusUpdater';
import { OrderItemMetadata } from '@/components/admin/OrderItemMetadata';
import { Card } from '@/components/ui/Card';
import {
  collectOrderFileIds,
  getAdminOrder,
} from '@/lib/admin/orders';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrder(id);
  if (!order) notFound();

  const allFileIds = collectOrderFileIds(order);
  const files = await Promise.all(
    allFileIds.map(async (fileId) => {
      const file = await db.uploadedFiles.findById(fileId);
      return file ? { fileId, name: file.originalName, mimeType: file.mimeType } : null;
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">
            ← Back to orders
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink-900">{order.orderNumber}</h1>
          <p className="text-sm text-ink-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <h2 className="text-sm font-semibold text-ink-900">Order items</h2>
            <div className="mt-4 space-y-4">
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="rounded-lg border border-ink-100 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink-900">{item.name}</p>
                      <p className="text-sm capitalize text-ink-500">{item.type}</p>
                      <p className="mt-1 text-sm text-ink-600">
                        {item.quantity} × {formatPrice(item.price, order.locale)}
                      </p>
                    </div>
                    <p className="font-semibold text-ink-900">
                      {formatPrice(item.price * item.quantity, order.locale)}
                    </p>
                  </div>

                  {item.metadata && Object.keys(item.metadata).length > 0 ? (
                    <OrderItemMetadata metadata={item.metadata} />
                  ) : null}

                  {(item.designPreview || item.backDesignPreview) ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {item.designPreview ? (
                        <div>
                          <p className="mb-1 text-xs text-ink-500">Front preview</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.designPreview}
                            alt="Front design preview"
                            className="max-h-48 rounded border border-ink-200 bg-white"
                          />
                        </div>
                      ) : null}
                      {item.backDesignPreview ? (
                        <div>
                          <p className="mb-1 text-xs text-ink-500">Back preview</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.backDesignPreview}
                            alt="Back design preview"
                            className="max-h-48 rounded border border-ink-200 bg-white"
                          />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between border-t border-ink-100 pt-4 text-sm">
              <span className="font-medium text-ink-700">Total</span>
              <span className="text-lg font-semibold text-ink-900">
                {formatPrice(order.totalAmount, order.locale)}
              </span>
            </div>
          </Card>

          {files.filter(Boolean).length > 0 ? (
            <Card>
              <h2 className="text-sm font-semibold text-ink-900">Uploaded files</h2>
              <ul className="mt-3 space-y-2">
                {files
                  .filter((file): file is NonNullable<typeof file> => Boolean(file))
                  .map((file) => (
                    <li key={file.fileId}>
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

        <div className="space-y-6">
          <Card>
            <h2 className="text-sm font-semibold text-ink-900">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="text-ink-500">Name</dt>
                <dd className="font-medium text-ink-900">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Phone</dt>
                <dd className="font-medium text-ink-900">{order.customerPhone}</dd>
              </div>
              {order.customerEmail ? (
                <div>
                  <dt className="text-ink-500">Email</dt>
                  <dd className="font-medium text-ink-900">{order.customerEmail}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-ink-500">City</dt>
                <dd className="font-medium text-ink-900">{order.customerCity}</dd>
              </div>
              <div>
                <dt className="text-ink-500">Address</dt>
                <dd className="font-medium text-ink-900">{order.customerAddress}</dd>
              </div>
              {order.notes ? (
                <div>
                  <dt className="text-ink-500">Notes</dt>
                  <dd className="font-medium text-ink-900">{order.notes}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <Card>
            <OrderStatusUpdater
              key={`${order.id}-${order.status}`}
              orderId={order.id}
              currentStatus={order.status}
            />
          </Card>

          <Card>
            <h2 className="text-sm font-semibold text-ink-900">Details</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Payment</dt>
                <dd className="font-medium uppercase text-ink-900">{order.paymentMethod}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Locale</dt>
                <dd className="font-medium uppercase text-ink-900">{order.locale}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
