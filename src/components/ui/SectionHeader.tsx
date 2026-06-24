import { cn } from '@/lib/utils';

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  onDark?: boolean;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  className,
  onDark = false,
}: SectionHeaderProps) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow ? (
        <p
          className={cn(
            'mb-3 text-[11px] font-bold uppercase tracking-[0.16em]',
            onDark ? 'text-brand-200' : 'text-brand-600',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          'text-2xl font-bold sm:text-3xl',
          onDark ? 'text-white' : 'text-ink-900',
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            'mt-2 text-base leading-relaxed',
            onDark ? 'text-brand-100' : 'text-ink-500',
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
