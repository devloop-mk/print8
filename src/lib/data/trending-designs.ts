/** Tailwind accent presets — cycled by display rank. */
export type TrendingDesignAccent = {
  id: string;
  gradient: string;
  ring: string;
  badge: string;
};

export const TRENDING_DESIGN_ACCENTS: TrendingDesignAccent[] = [
  {
    id: 'accent-0',
    gradient: 'from-orange-400/30 via-amber-500/10 to-transparent',
    ring: 'ring-orange-400/40',
    badge: 'bg-orange-500/90',
  },
  {
    id: 'accent-1',
    gradient: 'from-sky-400/25 via-blue-500/10 to-transparent',
    ring: 'ring-sky-400/35',
    badge: 'bg-sky-600/90',
  },
  {
    id: 'accent-2',
    gradient: 'from-violet-400/30 via-purple-500/10 to-transparent',
    ring: 'ring-violet-400/35',
    badge: 'bg-violet-600/90',
  },
  {
    id: 'accent-3',
    gradient: 'from-emerald-400/25 via-teal-500/10 to-transparent',
    ring: 'ring-emerald-400/35',
    badge: 'bg-emerald-600/90',
  },
  {
    id: 'accent-4',
    gradient: 'from-rose-400/30 via-pink-500/10 to-transparent',
    ring: 'ring-rose-400/40',
    badge: 'bg-rose-600/90',
  },
  {
    id: 'accent-5',
    gradient: 'from-lime-400/25 via-green-500/10 to-transparent',
    ring: 'ring-lime-400/35',
    badge: 'bg-lime-600/90',
  },
  {
    id: 'accent-6',
    gradient: 'from-amber-300/30 via-yellow-500/10 to-transparent',
    ring: 'ring-amber-400/40',
    badge: 'bg-amber-600/90',
  },
];

/** Fallback when CMS has no trending picks configured. */
export const DEFAULT_TRENDING_PRODUCT_DESIGN_IDS = [
  'tee-sw-basketball-001',
  'tee-sw-basketball-003',
  'tee-sw-basketball-012',
  'tee-sw-anime-045',
  'tee-sw-anime-080',
  'tee-sw-typography-209',
  'tee-sw-streetwear-360',
];
