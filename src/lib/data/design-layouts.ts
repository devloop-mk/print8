import type { DesignOrderFieldId } from '@/lib/data/design-order-fields';

export interface DesignColorTheme {
  background: string;
  accent: string;
  text: string;
  secondary: string;
}

export type DesignLayoutVariant =
  | 'business-minimal'
  | 'business-classic'
  | 'business-executive'
  | 'birthday-fun'
  | 'birthday-modern'
  | 'wedding-floral'
  | 'wedding-minimal'
  | 'menu-elegant'
  | 'menu-modern';

export interface DesignLayout {
  id: string;
  aspectRatio: number;
  defaultColors: DesignColorTheme;
  presets: { id: string; colors: DesignColorTheme }[];
  frontFields: DesignOrderFieldId[];
  backFields: DesignOrderFieldId[];
  variant: DesignLayoutVariant;
}

export const designLayouts: DesignLayout[] = [
  {
    id: 'bc-minimal',
    aspectRatio: 9 / 5,
    defaultColors: {
      background: '#ffffff',
      accent: '#2563eb',
      text: '#0f172a',
      secondary: '#64748b',
    },
    presets: [
      {
        id: 'ocean',
        colors: {
          background: '#ffffff',
          accent: '#2563eb',
          text: '#0f172a',
          secondary: '#64748b',
        },
      },
      {
        id: 'forest',
        colors: {
          background: '#f0fdf4',
          accent: '#15803d',
          text: '#14532d',
          secondary: '#4d7c0f',
        },
      },
      {
        id: 'slate',
        colors: {
          background: '#f8fafc',
          accent: '#334155',
          text: '#0f172a',
          secondary: '#64748b',
        },
      },
    ],
    frontFields: ['fullName', 'companyName', 'jobTitle'],
    backFields: ['backHeadline', 'phone', 'email', 'website', 'address'],
    variant: 'business-minimal',
  },
  {
    id: 'bc-classic',
    aspectRatio: 9 / 5,
    defaultColors: {
      background: '#fffbeb',
      accent: '#b45309',
      text: '#292524',
      secondary: '#78716c',
    },
    presets: [
      {
        id: 'gold',
        colors: {
          background: '#fffbeb',
          accent: '#b45309',
          text: '#292524',
          secondary: '#78716c',
        },
      },
      {
        id: 'wine',
        colors: {
          background: '#fff1f2',
          accent: '#be123c',
          text: '#4c0519',
          secondary: '#9f1239',
        },
      },
      {
        id: 'navy',
        colors: {
          background: '#eff6ff',
          accent: '#1d4ed8',
          text: '#1e3a8a',
          secondary: '#3b82f6',
        },
      },
    ],
    frontFields: ['fullName', 'companyName', 'jobTitle'],
    backFields: ['backHeadline', 'phone', 'email', 'website', 'address'],
    variant: 'business-classic',
  },
  {
    id: 'bc-executive',
    aspectRatio: 9 / 5,
    defaultColors: {
      background: '#0f172a',
      accent: '#c9a227',
      text: '#f8fafc',
      secondary: '#94a3b8',
    },
    presets: [
      {
        id: 'midnight',
        colors: {
          background: '#0f172a',
          accent: '#c9a227',
          text: '#f8fafc',
          secondary: '#94a3b8',
        },
      },
      {
        id: 'platinum',
        colors: {
          background: '#1e293b',
          accent: '#e2e8f0',
          text: '#f8fafc',
          secondary: '#cbd5e1',
        },
      },
      {
        id: 'emerald',
        colors: {
          background: '#052e16',
          accent: '#86efac',
          text: '#ecfdf5',
          secondary: '#6ee7b7',
        },
      },
    ],
    frontFields: ['fullName', 'companyName', 'jobTitle'],
    backFields: ['backHeadline', 'phone', 'email', 'website', 'address'],
    variant: 'business-executive',
  },
  {
    id: 'birthday-fun',
    aspectRatio: 3 / 4,
    defaultColors: {
      background: '#fffbeb',
      accent: '#dc2626',
      text: '#7c2d12',
      secondary: '#ea580c',
    },
    presets: [
      {
        id: 'party',
        colors: {
          background: '#fffbeb',
          accent: '#dc2626',
          text: '#7c2d12',
          secondary: '#ea580c',
        },
      },
      {
        id: 'candy',
        colors: {
          background: '#fdf4ff',
          accent: '#c026d3',
          text: '#701a75',
          secondary: '#a21caf',
        },
      },
      {
        id: 'ocean',
        colors: {
          background: '#ecfeff',
          accent: '#0891b2',
          text: '#164e63',
          secondary: '#0e7490',
        },
      },
    ],
    frontFields: ['frontHeadline', 'celebrantName', 'eventDate', 'venue'],
    backFields: ['backHeadline', 'phone', 'additionalInfo'],
    variant: 'birthday-fun',
  },
  {
    id: 'birthday-modern',
    aspectRatio: 3 / 4,
    defaultColors: {
      background: '#f8fafc',
      accent: '#0f172a',
      text: '#1e293b',
      secondary: '#64748b',
    },
    presets: [
      {
        id: 'slate',
        colors: {
          background: '#f8fafc',
          accent: '#0f172a',
          text: '#1e293b',
          secondary: '#64748b',
        },
      },
      {
        id: 'blush',
        colors: {
          background: '#fff1f2',
          accent: '#9f1239',
          text: '#881337',
          secondary: '#be123c',
        },
      },
      {
        id: 'citrus',
        colors: {
          background: '#fffbeb',
          accent: '#b45309',
          text: '#78350f',
          secondary: '#d97706',
        },
      },
    ],
    frontFields: ['frontHeadline', 'celebrantName', 'eventDate', 'venue'],
    backFields: ['backHeadline', 'phone', 'additionalInfo'],
    variant: 'birthday-modern',
  },
  {
    id: 'wedding-floral',
    aspectRatio: 3 / 4,
    defaultColors: {
      background: '#fff7ed',
      accent: '#c026d3',
      text: '#831843',
      secondary: '#be185d',
    },
    presets: [
      {
        id: 'blush',
        colors: {
          background: '#fff7ed',
          accent: '#c026d3',
          text: '#831843',
          secondary: '#be185d',
        },
      },
      {
        id: 'sage',
        colors: {
          background: '#f0fdf4',
          accent: '#15803d',
          text: '#14532d',
          secondary: '#166534',
        },
      },
      {
        id: 'ivory',
        colors: {
          background: '#fafaf9',
          accent: '#a8a29e',
          text: '#44403c',
          secondary: '#78716c',
        },
      },
    ],
    frontFields: ['frontHeadline', 'coupleNames', 'eventDate', 'venue'],
    backFields: ['backHeadline', 'phone', 'email', 'additionalInfo'],
    variant: 'wedding-floral',
  },
  {
    id: 'wedding-minimal',
    aspectRatio: 3 / 4,
    defaultColors: {
      background: '#fafafa',
      accent: '#171717',
      text: '#262626',
      secondary: '#737373',
    },
    presets: [
      {
        id: 'mono',
        colors: {
          background: '#fafafa',
          accent: '#171717',
          text: '#262626',
          secondary: '#737373',
        },
      },
      {
        id: 'rose',
        colors: {
          background: '#fff1f2',
          accent: '#9f1239',
          text: '#881337',
          secondary: '#be123c',
        },
      },
      {
        id: 'midnight',
        colors: {
          background: '#f8fafc',
          accent: '#0f172a',
          text: '#1e293b',
          secondary: '#475569',
        },
      },
    ],
    frontFields: ['frontHeadline', 'coupleNames', 'eventDate', 'venue'],
    backFields: ['backHeadline', 'phone', 'email', 'additionalInfo'],
    variant: 'wedding-minimal',
  },
  {
    id: 'menu-elegant',
    aspectRatio: 210 / 297,
    defaultColors: {
      background: '#fffbeb',
      accent: '#92400e',
      text: '#292524',
      secondary: '#78716c',
    },
    presets: [
      {
        id: 'brass',
        colors: {
          background: '#fffbeb',
          accent: '#92400e',
          text: '#292524',
          secondary: '#78716c',
        },
      },
      {
        id: 'charcoal',
        colors: {
          background: '#f5f5f4',
          accent: '#292524',
          text: '#1c1917',
          secondary: '#57534e',
        },
      },
      {
        id: 'olive',
        colors: {
          background: '#f7fee7',
          accent: '#4d7c0f',
          text: '#365314',
          secondary: '#65a30d',
        },
      },
    ],
    frontFields: ['restaurantName', 'frontHeadline'],
    backFields: [
      'backHeadline',
      'phone',
      'address',
      'website',
      'email',
      'additionalInfo',
    ],
    variant: 'menu-elegant',
  },
  {
    id: 'menu-modern',
    aspectRatio: 210 / 297,
    defaultColors: {
      background: '#18181b',
      accent: '#fafafa',
      text: '#f4f4f5',
      secondary: '#a1a1aa',
    },
    presets: [
      {
        id: 'noir',
        colors: {
          background: '#18181b',
          accent: '#fafafa',
          text: '#f4f4f5',
          secondary: '#a1a1aa',
        },
      },
      {
        id: 'cream',
        colors: {
          background: '#fafaf9',
          accent: '#292524',
          text: '#1c1917',
          secondary: '#78716c',
        },
      },
      {
        id: 'steel',
        colors: {
          background: '#f1f5f9',
          accent: '#334155',
          text: '#0f172a',
          secondary: '#64748b',
        },
      },
    ],
    frontFields: ['restaurantName', 'frontHeadline'],
    backFields: [
      'backHeadline',
      'phone',
      'address',
      'website',
      'email',
      'additionalInfo',
    ],
    variant: 'menu-modern',
  },
];

export function getDesignLayout(id: string) {
  return designLayouts.find((layout) => layout.id === id);
}

export function getLayoutFields(layout: DesignLayout) {
  return [...new Set([...layout.frontFields, ...layout.backFields])];
}

const layoutHeadlineDefaults: Record<
  string,
  { frontHeadline?: string; backHeadline?: string }
> = {
  'bc-minimal': { backHeadline: '' },
  'bc-classic': { backHeadline: 'Contact' },
  'bc-executive': { backHeadline: '' },
  'birthday-fun': {
    frontHeadline: "You're invited!",
    backHeadline: 'RSVP',
  },
  'birthday-modern': {
    frontHeadline: 'Birthday celebration',
    backHeadline: 'RSVP',
  },
  'wedding-floral': {
    frontHeadline: 'Wedding invitation',
    backHeadline: 'Kindly respond',
  },
  'wedding-minimal': {
    frontHeadline: 'Together with their families',
    backHeadline: 'RSVP',
  },
  'menu-elegant': {
    frontHeadline: 'Menu cover',
    backHeadline: 'Visit us',
  },
  'menu-modern': {
    frontHeadline: 'Food & drinks',
    backHeadline: 'Reservations',
  },
};

export function getDefaultFieldValues(
  fields: DesignOrderFieldId[],
  layoutId?: string,
): Partial<Record<DesignOrderFieldId, string>> {
  const headlines = layoutId ? layoutHeadlineDefaults[layoutId] : undefined;
  const defaults: Partial<Record<DesignOrderFieldId, string>> = {
    fullName: 'Ana Petrova',
    companyName: 'Print 8',
    jobTitle: 'Marketing Manager',
    phone: '070 123 456',
    email: 'ana@print8.mk',
    website: 'www.print8.mk',
    address: 'Skopje, Macedonia',
    coupleNames: 'Ana & Marko',
    eventDate: '15.08.2026',
    venue: 'Hotel Continental',
    celebrantName: 'Petar',
    restaurantName: 'Restaurant 8',
    additionalInfo: 'We look forward to celebrating with you.',
    frontHeadline: headlines?.frontHeadline ?? '',
    backHeadline: headlines?.backHeadline ?? '',
  };

  return Object.fromEntries(
    fields.map((field) => [field, defaults[field] ?? '']),
  ) as Partial<Record<DesignOrderFieldId, string>>;
}
