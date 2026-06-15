import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card className={cn('p-4 sm:p-5', className)}>
      <p className="text-xs sm:text-sm text-ink-500 leading-snug">{label}</p>
      <p className="mt-1 text-xl sm:text-2xl font-semibold text-ink-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-400">{hint}</p> : null}
    </Card>
  );
}
