import type { DesignTemplate } from '@/lib/data/catalog';

export type TrendingDesignAccent = {
  id: string;
  /** Tailwind gradient stops for card glow */
  gradient: string;
  /** Accent border / badge tone */
  ring: string;
  badge: string;
};

/** Curated trending templates — order is display rank. */
export const TRENDING_DESIGN_ACCENTS: TrendingDesignAccent[] = [
  {
    id: 'svg-wedding-modern-arch',
    gradient: 'from-rose-400/30 via-fuchsia-500/10 to-transparent',
    ring: 'ring-rose-400/40',
    badge: 'bg-rose-500/90',
  },
  {
    id: 'svg-bday-dino',
    gradient: 'from-lime-400/25 via-emerald-500/10 to-transparent',
    ring: 'ring-lime-400/35',
    badge: 'bg-lime-600/90',
  },
  {
    id: 'svg-bcard-luxury-gold',
    gradient: 'from-amber-300/30 via-yellow-500/10 to-transparent',
    ring: 'ring-amber-400/40',
    badge: 'bg-amber-600/90',
  },
  {
    id: 'svg-bday-unicorn',
    gradient: 'from-violet-400/30 via-pink-500/10 to-transparent',
    ring: 'ring-violet-400/35',
    badge: 'bg-violet-600/90',
  },
  {
    id: 'svg-wedding-classic-navy-gold',
    gradient: 'from-sky-400/20 via-indigo-500/10 to-transparent',
    ring: 'ring-sky-400/30',
    badge: 'bg-indigo-600/90',
  },
];

export function pickTrendingDesigns(
  designs: DesignTemplate[],
): Array<DesignTemplate & TrendingDesignAccent> {
  const byId = new Map(designs.map((design) => [design.id, design]));

  return TRENDING_DESIGN_ACCENTS.flatMap((accent) => {
    const design = byId.get(accent.id);
    if (!design) return [];
    return [{ ...design, ...accent }];
  });
}
