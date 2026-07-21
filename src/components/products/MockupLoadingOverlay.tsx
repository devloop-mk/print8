import { Spinner } from '@/components/ui/Spinner';

/** Subtle spinner over a fixed-aspect mockup while a color/image swap loads. */
export function MockupLoadingOverlay({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-white/70 backdrop-blur-[1px] transition-opacity duration-200"
      aria-hidden
    >
      <Spinner size="sm" className="text-brand-600" />
    </div>
  );
}
