import { LOGO_MARK } from '@/lib/brand/logos';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-40 w-40',
  md: 'h-56 w-56',
  lg: 'h-72 w-72',
  xl: 'h-[22rem] w-[22rem]',
} as const;

const positionClasses = {
  center: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  right: 'right-0 top-1/2 -translate-y-1/2 translate-x-1/4',
  left: 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/4',
  'bottom-right': 'bottom-0 right-0 translate-x-1/5 translate-y-1/5',
  'top-right': 'right-0 top-0 -translate-y-1/4 translate-x-1/5',
} as const;

type BrandWatermarkProps = {
  className?: string;
  size?: keyof typeof sizeClasses;
  position?: keyof typeof positionClasses;
  variant?: 'on-light' | 'on-dark';
};

export function BrandWatermark({
  className,
  size = 'lg',
  position = 'right',
  variant = 'on-light',
}: BrandWatermarkProps) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={LOGO_MARK}
        alt=""
        className={cn(
          'absolute select-none object-contain',
          sizeClasses[size],
          positionClasses[position],
          variant === 'on-dark'
            ? 'opacity-[0.08] brightness-0 invert'
            : 'opacity-[0.045]',
        )}
      />
    </div>
  );
}
