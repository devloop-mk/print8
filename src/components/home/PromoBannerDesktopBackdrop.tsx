/** Decorative layers for the home promo banner — left copy panel depth. */
export function PromoBannerDesktopBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Match services / shared HeroSectionBackground palette */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-800 via-[#0a1a38] to-ink-950 bg-[length:200%_200%] animate-gradient-shift" />
      <div className="absolute inset-0 bg-mesh-dark opacity-70" />
      <div className="absolute inset-0 bg-grid-light bg-grid opacity-[0.18]" />

      <div className="absolute -left-[10%] -top-[22%] h-[min(58%,460px)] w-[min(58%,460px)] rounded-full bg-brand-400/25 blur-[88px]" />
      <div className="absolute -bottom-[24%] left-[6%] h-[min(50%,400px)] w-[min(50%,400px)] rounded-full bg-brand-600/20 blur-[96px]" />
      <div className="absolute left-[32%] top-[38%] h-52 w-52 rounded-full bg-brand-200/10 blur-[72px]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_18%_42%,rgba(47,124,178,0.22),transparent_58%)]" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/45 via-brand-900/20 via-[38%] to-transparent to-[58%]" />
    </div>
  );
}
