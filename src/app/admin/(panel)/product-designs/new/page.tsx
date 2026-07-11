import Link from 'next/link';
import { requireAdminSession } from '@/lib/admin/require-admin';
import { ProductDesignCreateForm } from '@/components/admin/ProductDesignCreateForm';

export default async function AdminNewProductDesignPage() {
  await requireAdminSession();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/product-designs"
          className="text-sm font-medium text-ink-600 hover:text-brand-700"
        >
          ← Назад кон дизајни за производи
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink-900">Нов дизајн за производ</h1>
        <p className="mt-1 text-sm text-ink-500">
          Создајте нов дизајн што ќе се појави на сајтот без промена на код.
        </p>
      </div>

      <ProductDesignCreateForm />
    </div>
  );
}
