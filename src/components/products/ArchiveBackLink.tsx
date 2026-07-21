'use client';

import { ArrowLeft } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type ArchiveBackLinkProps = {
  /** Used when there is no in-site history to go back to (direct entry, new tab). */
  fallbackHref: string;
  /** e.g. "Назад" or "Назад кон готови дизајни". */
  label: string;
  className?: string;
};

/**
 * Prefer real browser back when the user arrived from another page on this site
 * (preserves filters like ?type=cap). Otherwise navigate to fallbackHref.
 * Renders a Link so middle-click / SEO / no-JS still work via the fallback.
 */
function canUseHistoryBack(): boolean {
  if (typeof window === 'undefined') return false;
  // New tabs / direct entry typically have length 1 — don't call back().
  if (window.history.length <= 1) return false;

  try {
    const referrer = document.referrer;
    if (!referrer) return false;
    const refUrl = new URL(referrer);
    return refUrl.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function ArchiveBackLink({
  fallbackHref,
  label,
  className,
}: ArchiveBackLinkProps) {
  const router = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Let modified clicks (middle, ctrl/cmd) open the fallback in a new tab.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    if (event.button !== 0) return;

    if (!canUseHistoryBack()) return;

    event.preventDefault();
    router.back();
  }

  return (
    <Link
      href={fallbackHref}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition hover:text-brand-700',
        className,
      )}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
