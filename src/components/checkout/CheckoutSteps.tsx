'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type StepId = 'cart' | 'checkout' | 'success';

const STEP_ORDER: StepId[] = ['cart', 'checkout', 'success'];

export function CheckoutSteps({ current }: { current: StepId }) {
  const t = useTranslations('checkoutSteps');
  const currentIndex = STEP_ORDER.indexOf(current);

  const steps: { id: StepId; label: string; href?: string }[] = [
    { id: 'cart', label: t('cart'), href: '/cart' },
    { id: 'checkout', label: t('details'), href: '/checkout' },
    { id: 'success', label: t('done') },
  ];

  return (
    <nav
      aria-label={t('ariaLabel')}
      className="mb-8 flex items-center justify-center gap-2 sm:gap-4"
    >
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.id === current;
        const isClickable = Boolean(step.href) && index < currentIndex;

        const content = (
          <>
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                isComplete && 'bg-brand-600 text-white',
                isCurrent && 'bg-brand-600 text-white ring-4 ring-brand-100',
                !isComplete && !isCurrent && 'bg-ink-100 text-ink-400',
              )}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={cn(
                'hidden text-sm font-medium sm:inline',
                isCurrent ? 'text-ink-900' : 'text-ink-500',
              )}
            >
              {step.label}
            </span>
          </>
        );

        return (
          <div key={step.id} className="flex items-center gap-2 sm:gap-4">
            {isClickable && step.href ? (
              <Link
                href={step.href}
                className="flex items-center gap-2 transition hover:opacity-80"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2">{content}</div>
            )}
            {index < steps.length - 1 ? (
              <div
                className={cn(
                  'h-px w-6 sm:w-12',
                  index < currentIndex ? 'bg-brand-300' : 'bg-ink-200',
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
