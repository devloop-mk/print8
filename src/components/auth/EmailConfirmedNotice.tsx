'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { CheckCircle2 } from 'lucide-react';

export function EmailConfirmedNotice() {
  const t = useTranslations('account');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('email') !== 'confirmed') return;

    setVisible(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete('email');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden />
      <div>
        <p className="font-semibold">{t('emailConfirmedTitle')}</p>
        <p className="mt-1 leading-relaxed text-green-900/90">{t('emailConfirmedBody')}</p>
      </div>
    </div>
  );
}
