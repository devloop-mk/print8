import type { Locale } from '@/i18n/navigation';
import MK from 'country-flag-icons/react/3x2/MK';
import GB from 'country-flag-icons/react/3x2/GB';
import { cn } from '@/lib/utils';

const FLAGS: Record<Locale, typeof MK> = {
  mk: MK,
  en: GB,
};

export function LocaleFlag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  const Flag = FLAGS[locale];

  return (
    <Flag
      aria-hidden
      className={cn(
        'h-4 w-6 shrink-0 rounded-sm border border-black/10 object-cover shadow-sm',
        className,
      )}
    />
  );
}
