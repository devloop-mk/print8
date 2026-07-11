import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin/require-admin';
import { getAdminDesign } from '@/lib/admin/designs';
import { DesignEditorForm } from '@/components/admin/DesignEditorForm';

export default async function AdminDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const design = await getAdminDesign(id);
  if (!design) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/designs"
          className="text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          ← Назад кон дизајни
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">{design.nameMk}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Уредување на дизајн, цена, видливост и ексклузивност.
        </p>
      </div>

      <DesignEditorForm design={design} />
    </div>
  );
}
