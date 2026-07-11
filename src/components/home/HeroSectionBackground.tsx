import { HeroBackdrop } from '@/components/home/HeroBackdrop';

/** Shared dark hero backdrop — deep blue between ink and royal, subtle grid. */
export function HeroSectionBackground() {
  return (
    <>
      <HeroBackdrop />
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-800 via-[#0a1a38] to-ink-950 bg-[length:200%_200%] animate-gradient-shift"
        aria-hidden
      />
      <div className="absolute inset-0 bg-mesh-dark opacity-70" aria-hidden />
      <div
        className="absolute inset-0 bg-grid-light bg-grid opacity-[0.18]"
        aria-hidden
      />
    </>
  );
}
