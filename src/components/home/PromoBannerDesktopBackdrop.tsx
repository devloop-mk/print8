/** Decorative layers for the home promo banner — left copy panel depth. */
export function PromoBannerDesktopBackdrop() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1e4d6b] via-brand-900 to-ink-950"
      />
      <div
        className="absolute inset-0 bg-gradient-to-tr from-ink-950/70 via-transparent to-brand-600/25 bg-[length:220%_220%] animate-gradient-shift"
      />

      <div
        className="absolute -left-[10%] -top-[22%] h-[min(58%,460px)] w-[min(58%,460px)] rounded-full bg-brand-400/30 blur-[88px]"
      />
      <div
        className="absolute -bottom-[24%] left-[6%] h-[min(50%,400px)] w-[min(50%,400px)] rounded-full bg-[#e85d04]/22 blur-[96px]"
      />
      <div
        className="absolute left-[32%] top-[38%] h-52 w-52 rounded-full bg-brand-200/12 blur-[72px]"
      />
      <div
        className="absolute -left-16 top-[48%] h-36 w-36 rounded-full bg-white/6 blur-[56px]"
      />

      <div
        className="absolute left-[5%] top-[18%] h-72 w-72 rounded-full border border-white/[0.07]"
      />
      <div
        className="absolute -left-10 bottom-[14%] h-44 w-44 rounded-full border border-brand-200/15"
      />
      <div
        className="absolute left-[22%] top-[8%] h-24 w-24 rounded-full border border-white/[0.04]"
      />

      <div className="absolute inset-0 bg-grid-light bg-grid opacity-[0.09]" />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_18%_42%,rgba(47,124,178,0.28),transparent_58%)]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-brand-950/55 via-brand-900/25 via-[38%] to-transparent to-[58%]"
      />
    </div>
  );
}
