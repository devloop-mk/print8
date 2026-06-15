import { cn } from '@/lib/utils';

export function Spinner({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      role="status"
      aria-hidden={false}
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-r-transparent',
        {
          'h-4 w-4': size === 'sm',
          'h-6 w-6': size === 'md',
          'h-8 w-8': size === 'lg',
        },
        className,
      )}
    />
  );
}
