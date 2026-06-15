import { AdminPageLoading } from '@/components/admin/AdminPageLoading';
import { adminStrings } from '@/lib/admin/strings';

export default function AdminOrdersLoading() {
  return <AdminPageLoading label={adminStrings.ordersPage.loading} />;
}
