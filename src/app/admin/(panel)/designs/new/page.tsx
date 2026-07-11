import { requireAdminSession } from '@/lib/admin/require-admin';
import { DesignCreateForm } from '@/components/admin/DesignCreateForm';
import Link from 'next/link';

export default async function AdminDesignCreatePage() {
  await requireAdminSession();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/designs"
          className="text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          ← Назад кон дизајни
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">Нов дизајн</h1>
        <p className="mt-1 text-sm text-ink-500">
          Додајте нов управуван дизајн во каталогот. За ексклузивни дизајни, статусот
          се менува автоматски при нарачка.
        </p>
      </div>

      <DesignCreateForm />
    </div>
  );
}
