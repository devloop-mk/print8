import { requireAdminSession } from '@/lib/admin/require-admin';
import { listAdminProductDesignsPage } from '@/lib/admin/product-designs';
import { ProductDesignsAdminTable } from '@/components/admin/ProductDesignsAdminTable';
import type { AdminProductDesignStorage } from '@/lib/admin/product-designs-shared';
import { parseCatalogPage } from '@/lib/catalog/pagination';

export const dynamic = 'force-dynamic';

function parseStorage(value: string | undefined): AdminProductDesignStorage {
  if (value === 'database' || value === 'code-only') return value;
  return 'all';
}

export default async function AdminProductDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    storage?: string;
  }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const page = parseCatalogPage(params.page);
  const search = params.q?.trim() || undefined;
  const storage = parseStorage(params.storage);

  const result = await listAdminProductDesignsPage({
    page,
    search,
    storage,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Дизајни за производи</h1>
        <p className="mt-1 text-sm text-ink-500">
          Уредувајте готови дизајни за маица, дуксер и други производи. Дизајните
          се чуваат во база — можете да ги импортирате од кодот со еден клик.
        </p>
      </div>

      <ProductDesignsAdminTable
        key={`${search ?? ''}:${storage}:${page}`}
        initialResult={result}
        initialSearch={search ?? ''}
        initialStorage={storage}
      />
    </div>
  );
}
