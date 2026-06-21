import { LOGO_HORIZONTAL, LOGO_HORIZONTAL_LIGHT, LOGO_MARK } from '@/lib/brand/logos';
import { cn } from '@/lib/utils';

type LogoProps = {
  variant?: 'horizontal' | 'mark';
  className?: string;
  onDark?: boolean;
  priority?: boolean;
};

export function Logo({
  variant = 'horizontal',
  className,
  onDark = false,
  priority = false,
}: LogoProps) {
  const src =
    variant === 'mark'
      ? LOGO_MARK
      : onDark
        ? LOGO_HORIZONTAL_LIGHT
        : LOGO_HORIZONTAL;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Print 8"
      className={cn(
        'object-contain',
        variant === 'horizontal' ? 'h-9 w-auto' : 'h-10 w-10',
        className,
      )}
      fetchPriority={priority ? 'high' : undefined}
    />
  );
}
