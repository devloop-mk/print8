import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

export function LoadingIndicator({
  label,
  size = 'md',
  className,
}: {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 text-ink-500', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner size={size} className="text-brand-600" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}
