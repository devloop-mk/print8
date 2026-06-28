'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { CatalogSearchField } from '@/components/catalog/CatalogSearchField';

export function GlobalSearchField() {
  const t = useTranslations('search');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  function submit(next: string) {
    const trimmed = next.trim();
    if (!trimmed) {
      router.replace('/search');
      return;
    }
    router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(query);
      }}
    >
      <CatalogSearchField
        value={query}
        onChange={setQuery}
        placeholder={t('placeholder')}
        ariaLabel={t('ariaLabel')}
        clearLabel={t('clear')}
      />
    </form>
  );
}
