import { requireAdminSession } from '@/lib/admin/require-admin';
import { cmsDb } from '@/lib/db/cms';
import { ContentAdminPanel } from '@/components/admin/ContentAdminPanel';
import {
  HomeTrendingAdminPanel,
  buildTrendingDesignOptions,
} from '@/components/admin/HomeTrendingAdminPanel';
import { getMergedProductDesignTemplates } from '@/lib/products/merged-product-designs';

export default async function AdminContentPage() {
  await requireAdminSession();
  const [content, services, trendingEntries, productDesigns] = await Promise.all([
    cmsDb.content.list(),
    cmsDb.services.list(),
    cmsDb.homeTrending.list(),
    getMergedProductDesignTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Содржина</h1>
        <p className="mt-1 text-sm text-ink-500">
          Уредете текстови на сајтот, тренд маици и податоци за услуги без менување код.
        </p>
      </div>

      <HomeTrendingAdminPanel
        initialEntries={trendingEntries}
        designOptions={buildTrendingDesignOptions(productDesigns)}
      />

      <ContentAdminPanel
        initialContent={content}
        initialServices={services}
      />
    </div>
  );
}
