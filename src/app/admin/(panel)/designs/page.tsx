import { requireAdminSession } from '@/lib/admin/require-admin';
import { listAdminDesignsPage } from '@/lib/admin/designs';
import { DesignsAdminTable } from '@/components/admin/DesignsAdminTable';
import type { AdminDesignStorage } from '@/lib/admin/designs-shared';
import type { DesignCategory } from '@/lib/data/catalog';
import { parseCatalogPage } from '@/lib/catalog/pagination';

export const dynamic = 'force-dynamic';

function parseStorage(value: string | undefined): AdminDesignStorage {
  if (value === 'database' || value === 'code-only') return value;
  return 'all';
}

function parseCategory(value: string | undefined): DesignCategory | 'all' {
  const categories: DesignCategory[] = [
    'business-cards',
    'wedding',
    'birthday',
    'menus',
    'general',
  ];
  if (value && categories.includes(value as DesignCategory)) {
    return value as DesignCategory;
  }
  return 'all';
}

export default async function AdminDesignsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    q?: string;
    storage?: string;
    category?: string;
  }>;
}) {
  await requireAdminSession();
  const params = await searchParams;
  const page = parseCatalogPage(params.page);
  const search = params.q?.trim() || undefined;
  const storage = parseStorage(params.storage);
  const category = parseCategory(params.category);

  const result = await listAdminDesignsPage({
    page,
    search,
    storage,
    category,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Дизајни</h1>
        <p className="mt-1 text-sm text-ink-500">
          Сите дизајни од каталогот — уредувајте стандардни SVG текстови, бои и
          големина, или метаподатоци за дизајни што се во база.
        </p>
      </div>

      <DesignsAdminTable
        key={`${search ?? ''}:${storage}:${category}:${page}`}
        initialResult={result}
        initialSearch={search ?? ''}
        initialStorage={storage}
        initialCategory={category}
      />
    </div>
  );
}
