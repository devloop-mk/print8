import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin/require-admin';
import { resolveAdminProductDesign } from '@/lib/admin/product-designs';
import { ProductDesignEditorForm } from '@/components/admin/ProductDesignEditorForm';

export default async function AdminProductDesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  const design = await resolveAdminProductDesign(id);
  if (!design) notFound();

  const title =
    design.template.titleMk ??
    design.template.titleEn ??
    design.template.nameKey ??
    design.id;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/product-designs"
          className="text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          ← Назад кон дизајни за производи
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">{title}</h1>
        <p className="mt-1 text-sm text-ink-500">
          Уредување на бои, overlay, тип производ и видливост.
        </p>
      </div>

      <ProductDesignEditorForm design={design} />
    </div>
  );
}
