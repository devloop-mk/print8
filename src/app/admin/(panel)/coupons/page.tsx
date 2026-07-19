import { CouponsAdminPanel } from '@/components/admin/CouponsAdminPanel';
import { adminStrings } from '@/lib/admin/strings';

export default function AdminCouponsPage() {
  const t = adminStrings.coupons;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{t.title}</h1>
      </div>
      <CouponsAdminPanel />
    </div>
  );
}
