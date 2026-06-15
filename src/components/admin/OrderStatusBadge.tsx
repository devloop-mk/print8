import type { OrderStatus } from '@/lib/db';
import { ORDER_STATUS_LABELS, ORDER_STATUS_STYLES } from '@/lib/admin/orders';
import { cn } from '@/lib/utils';

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        ORDER_STATUS_STYLES[status],
        className,
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
