'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type ArchiveBackLinkProps = {
  /** Used when there is no in-site referrer to go back to. */
  fallbackHref: string;
  /** Generic label, e.g. "Назад" — does not claim a specific previous page. */
  label: string;
  className?: string;
};

/**
 * History-aware exit control for themed archives (kids, couples, …).
 * Users may arrive from homepage, type pages, ready-designs, etc., so we avoid
 * "Back to ready designs" copy and prefer real browser back when possible.
 */
export function ArchiveBackLink({
  fallbackHref,
  label,
  className,
}: ArchiveBackLinkProps) {
  const router = useRouter();

  function handleClick() {
    if (typeof window === 'undefined') {
      router.push(fallbackHref);
      return;
    }

    try {
      const referrer = document.referrer;
      if (referrer) {
        const refUrl = new URL(referrer);
        if (refUrl.origin === window.location.origin) {
          router.back();
          return;
        }
      }
    } catch {
      // fall through to fallback
    }

    router.push(fallbackHref);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-700',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
