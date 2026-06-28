import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { SearchResults } from '@/components/search/SearchResults';
import { GlobalSearchField } from '@/components/search/GlobalSearchField';

export default async function SearchPage() {
  const t = await getTranslations('search');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-ink-900 sm:text-4xl">{t('pageTitle')}</h1>
        <p className="mt-3 text-lg text-ink-600">{t('pageSubtitle')}</p>
      </div>

      <div className="mt-8 max-w-2xl">
        <Suspense fallback={null}>
          <GlobalSearchField />
        </Suspense>
      </div>

      <div className="mt-10">
        <Suspense
          fallback={
            <p className="text-sm text-ink-500">{t('loading')}</p>
          }
        >
          <SearchResults />
        </Suspense>
      </div>
    </div>
  );
}
