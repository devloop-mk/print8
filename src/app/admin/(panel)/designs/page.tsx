import { requireAdminSession } from '@/lib/admin/require-admin';
import { listAdminDesigns } from '@/lib/admin/designs';
import { DesignsAdminTable } from '@/components/admin/DesignsAdminTable';

export default async function AdminDesignsPage() {
  await requireAdminSession();
  const designs = await listAdminDesigns();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Дизајни</h1>
        <p className="mt-1 text-sm text-ink-500">
          Управувајте со готови дизајни, цени, видливост и ексклузивна достапност.
        </p>
      </div>

      <DesignsAdminTable initialDesigns={designs} />
    </div>
  );
}
