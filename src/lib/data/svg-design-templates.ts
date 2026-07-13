import type { DesignCategory } from '@/lib/data/catalog';
import type { SvgColorLabelKey } from '@/lib/designs/svg-color-labels';
import type { SvgTextTransform } from '@/lib/designs/svg-text-transform';

export type SvgTextField = {
  id: string;
  index: number;
  default: string;
  /** Optional key under designs.customize.svgFields or designs.order.fields */
  labelKey?: string;
};

export type SvgColorSlot = {
  id: string;
  default: string;
  labelKey: string;
  cssClass?: string;
  inlineReplace?: string;
  selector?: string;
  attribute?: string;
};

export type SvgDesignSide = {
  path: string;
  texts: SvgTextField[];
};

export type SvgDesignTemplate = {
  id: string;
  category: DesignCategory;
  aspectRatio: number;
  sides: {
    front: SvgDesignSide;
    back?: SvgDesignSide;
  };
  colors: SvgColorSlot[];
};

export type SvgTemplateState = {
  texts: Record<string, string>;
  colors: Record<string, string>;
  logos: Record<string, string | null>;
  transforms?: Record<string, SvgTextTransform>;
};

const ROOT = '/NEW_DESIGNS';
const BC = `${ROOT}/business card`;
const MENUS = `${ROOT}/menus`;

function tx(defaults: string[]): SvgTextField[] {
  return defaults.map((defaultValue, index) => ({
    id: `t${index}`,
    index,
    default: defaultValue,
  }));
}

function classColors(
  entries: Record<string, string>,
  labelKeys?: Record<string, SvgColorLabelKey>,
): SvgColorSlot[] {
  const semanticRoles: SvgColorLabelKey[] = [
    'textColor',
    'secondaryColor',
    'accentColor',
    'backgroundColor',
  ];

  return Object.entries(entries).map(([cssClass, defaultColor], index) => {
    const id = cssClass.replace(/^text-/, '');
    return {
      id,
      cssClass,
      default: defaultColor,
      labelKey:
        labelKeys?.[id] ??
        semanticRoles[Math.min(index, semanticRoles.length - 1)] ??
        'textColor',
    };
  });
}

function inlineColors(
  entries: Record<string, string>,
): SvgColorSlot[] {
  return Object.entries(entries).map(([id, defaultColor]) => ({
    id,
    inlineReplace: defaultColor,
    default: defaultColor,
    labelKey:
      id === 'background'
        ? 'backgroundColor'
        : id === 'text'
          ? 'textColor'
          : id === 'accent'
            ? 'accentColor'
            : id === 'secondary'
              ? 'secondaryColor'
              : 'textColor',
  }));
}

export const svgDesignTemplates: SvgDesignTemplate[] = [
  {
    id: 'svg-bcard-tech-wave',
    category: 'business-cards',
    aspectRatio: 1050 / 600,
    sides: {
      front: {
        path: `${BC}/bcard-tech-wave-front.svg`,
        texts: tx([
          'L',
          'COMPANY',
          'Marko Petrov',
          'CHIEF EXECUTIVE OFFICER',
          '+389 70 123 456',
          'marko@company.mk',
          'www.company.mk',
          '12 Macedonia St, Skopje',
        ]),
      },
      back: {
        path: `${BC}/bcard-tech-wave-back.svg`,
        texts: tx(['L', 'COMPANY', 'INNOVATION AT SCALE']),
      },
    },
    colors: inlineColors({
      background: '#0F172A',
      text: '#FFFFFF',
      secondary: '#9CA3AF',
      accent: '#4F46E5',
    }),
  },
  {
    id: 'svg-bcard-luxury-gold',
    category: 'business-cards',
    aspectRatio: 1050 / 600,
    sides: {
      front: {
        path: `${BC}/bcard-luxury-gold-front.svg`,
        texts: tx([
          'ALEXANDER VELKOV',
          'MANAGING PARTNER',
          '+389 75 777 888',
          'alexander@velkov.mk',
          'WWW.VELKOV.MK',
          '45 Macedonia Blvd, Skopje',
        ]),
      },
      back: {
        path: `${BC}/bcard-luxury-gold-back.svg`,
        texts: tx(['VELKOV & CO.', 'EST. 1985']),
      },
    },
    colors: inlineColors({
      background: '#0A0A0A',
      text: '#F5F5DC',
      accent: '#D4AF37',
    }),
  },
  {
    id: 'svg-bcard-corporate-geo',
    category: 'business-cards',
    aspectRatio: 1050 / 600,
    sides: {
      front: {
        path: `${BC}/bcard-corporate-geo-front.svg`,
        texts: tx([
          'C',
          'COMPANY',
          'Ana Stojkovska',
          'MARKETING DIRECTOR',
          '+389 70 987 654',
          'ana.stojkovska@company.mk',
          'www.company.mk',
          '8 Partizanski Odredi Blvd, Skopje',
        ]),
      },
      back: {
        path: `${BC}/bcard-corporate-geo-back.svg`,
        texts: tx(['C', 'COMPANY', 'WWW.COMPANY.COM']),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#1F2937',
      accent: '#2563EB',
      secondary: '#6B7280',
    }),
  },
  {
    id: 'svg-bcard-creative-abstract',
    category: 'business-cards',
    aspectRatio: 1050 / 600,
    sides: {
      front: {
        path: `${BC}/bcard-creative-abstract-front.svg`,
        texts: tx([
          'STUDIO',
          'Sara Nikolova',
          'ART DIRECTOR',
          '+389 70 444 333',
          'sara@studio.mk',
          'www.studio.mk',
          '21 Creative Alley, Skopje',
        ]),
      },
      back: {
        path: `${BC}/bcard-creative-abstract-back.svg`,
        texts: tx(['STUDIO', 'DESIGN & DEVELOPMENT']),
      },
    },
    colors: inlineColors({
      background: '#111827',
      text: '#FFFFFF',
      accent: '#EC4899',
      secondary: '#F59E0B',
    }),
  },
  {
    id: 'svg-wedding-modern-arch',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-modern-arch.svg`,
        texts: tx([
          'WE ARE GETTING MARRIED',
          'MIA & NIKOLA',
          'JOIN US FOR THE CELEBRATION',
          '15 . 05 . 2026',
          'CEREMONY AT 3:00 PM',
          'DINNER & DANCING AT 6:00 PM',
          'ART LOFT HALL',
          '789 Industrial St',
          'SKOPJE',
        ]),
      },
    },
    colors: [
      {
        id: 'text',
        selector: 'g[text-anchor="middle"]',
        attribute: 'fill',
        default: '#111827',
        labelKey: 'textColor',
      },
      {
        id: 'background',
        selector: 'rect',
        attribute: 'fill',
        default: '#FFFFFF',
        labelKey: 'backgroundColor',
      },
      {
        id: 'accent',
        selector: 'path[fill="#F9FAFB"]',
        attribute: 'fill',
        default: '#F9FAFB',
        labelKey: 'accentColor',
      },
    ],
  },
  {
    id: 'svg-wedding-romantic-blush',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-romantic-blush.svg`,
        texts: tx([
          'PLEASE JOIN US FOR THE WEDDING OF',
          'Elena',
          'AND',
          'Boris',
          'SUNDAY, SEPTEMBER 6TH, 2026',
          'HALF PAST FOUR IN THE AFTERNOON',
          'ROSE RESTAURANT',
          '12 Makedonska St, Skopje',
        ]),
      },
    },
    colors: inlineColors({
      text: '#4A4A4A',
      accent: '#E8B4B8',
      background: '#FFF5F5',
    }),
  },
  {
    id: 'svg-wedding-classic-navy-gold',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-classic-navy-gold.svg`,
        texts: tx([
          'TOGETHER WITH THEIR FAMILIES',
          'Marija',
          '&',
          'Stefan',
          'REQUEST THE HONOR OF YOUR PRESENCE',
          'AT THEIR WEDDING CELEBRATION',
          'SATURDAY, AUGUST 24TH, 2026',
          'TWO THOUSAND TWENTY-SIX',
          "AT FOUR O'CLOCK IN THE AFTERNOON",
          'HOTEL ALEXANDRIA',
          '2 Macedonia Square, Skopje',
        ]),
      },
    },
    colors: inlineColors({
      background: '#0F172A',
      text: '#F8FAFC',
      accent: '#D4AF37',
    }),
  },
  {
    id: 'svg-wedding-botanical-boho',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-botanical-boho.svg`,
        texts: tx([
          'WITH JOY IN OUR HEARTS',
          'Sofia',
          '&',
          'Dimitar',
          'INVITE YOU TO CELEBRATE THEIR MARRIAGE',
          'OCTOBER 12, 2026',
          "AT FIVE O'CLOCK IN THE EVENING",
          'BOTANICAL GARDEN',
          '4 Botanical St, Skopje',
          'RECEPTION TO FOLLOW',
        ]),
      },
    },
    colors: classColors(
      { 'text-dark': '#2C3E50', 'text-green': '#4F6354' },
      { dark: 'textColor', green: 'accentColor' },
    ),
  },
  {
    id: 'svg-wedding-print-beach',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-beach.svg`,
        texts: tx([
          'PLEASE JOIN US TO',
          'CELEBRATE THE MARRIAGE OF',
          'Ana',
          '&',
          'Goran',
          'Saturday October 24, 2026',
          'AT SIX THIRTY IN THE EVENING',
          'RESTAURANT KAJ MALEZ',
          '15 Kej Makedonija',
          'OHRID',
          'Reception to follow',
        ]),
      },
    },
    colors: classColors({
      'text-charcoal': '#333333',
      'text-gray': '#555555',
    }),
  },
  {
    id: 'svg-wedding-print-autumn',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-autumn.svg`,
        texts: tx([
          'TOGETHER WITH THEIR FAMILIES',
          'Vera',
          'and',
          'Aleksandar',
          'REQUEST THE PLEASURE OF YOUR COMPANY',
          'AT THEIR WEDDING CELEBRATION',
          'SUNDAY, OCTOBER 18TH, 2026',
          'AT FOUR THIRTY IN THE AFTERNOON',
          'RESTAURANT KRUSHA',
          '12 Dimitar Vlahov St',
          'BITOLA',
          'Dinner and dancing to follow',
        ]),
      },
    },
    colors: classColors(
      {
        'text-burgundy': '#5C1A1B',
        'text-charcoal': '#2D2D2D',
        'text-warm-grey': '#71717A',
      },
      {
        burgundy: 'accentColor',
        charcoal: 'textColor',
        'warm-grey': 'secondaryColor',
      },
    ),
  },
  {
    id: 'svg-wedding-print-celestial',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-celestial.svg`,
        texts: tx([
          'UNDER THE STARS',
          'Ivana',
          '&',
          'Martin',
          'INVITE YOU TO SHARE IN THEIR JOY',
          'AS THEY EXCHANGE VOWS',
          'NOVEMBER 14, 2026',
          "AT SEVEN O'CLOCK IN THE EVENING",
          'PLANETARIUM HALL',
          '88 Ilindenska St, Skopje',
        ]),
      },
    },
    colors: classColors(
      {
        'text-gold': '#D4AF37',
        'text-white': '#FFFFFF',
        'text-light': '#E2E8F0',
      },
      { gold: 'accentColor', white: 'textColor', light: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-wedding-print-terracotta',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-terracotta.svg`,
        texts: tx([
          'WE INVITE YOU TO CELEBRATE',
          'THE MARRIAGE OF',
          'Elena',
          '&',
          'Nikola',
          'SATURDAY, MAY 16TH, 2026',
          "AT FIVE O'CLOCK IN THE AFTERNOON",
          'POPOVA KULA WINERY',
          'Kavadarci',
          'KAVADARCI',
          'DINNER & DANCING TO FOLLOW',
        ]),
      },
    },
    colors: classColors(
      {
        'text-terra': '#B3543E',
        'text-brown': '#4A3B32',
        'text-tan': '#8C7A6B',
      },
      { terra: 'accentColor', brown: 'textColor', tan: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-wedding-print-watercolor',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-watercolor.svg`,
        texts: tx([
          'CELEBRATE WITH US AS WE',
          'TIE THE KNOT',
          'Katarina &',
          'Orhan',
          'YOUR PRESENCE MEANS THE WORLD TO US',
          'AT OUR WEDDING',
          '20  |  AUGUST  |  2026',
          "At 4 o'clock in the afternoon",
          'Aqua Park Garden',
          '12 Skopje North St, Skopje',
        ]),
      },
    },
    colors: classColors({
      'text-dark': '#4A5D4E',
      'text-light': '#6B705C',
    }),
  },
  {
    id: 'svg-wedding-print-winter',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-print-winter.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'WE INVITE YOU TO THE WEDDING OF',
          'Victoria',
          '&',
          'Kristijan',
          'DECEMBER 12, 2026',
          "AT FOUR O'CLOCK IN THE AFTERNOON",
          'BIRSKA KOLIBA HOTEL',
          'Mavrovo Village',
          'MAVROVO',
          'Reception to follow',
        ]),
      },
    },
    colors: classColors({
      'text-navy': '#1E293B',
      'text-slate': '#475569',
      'text-blue': '#3B82F6',
    }),
  },
  {
    id: 'svg-wedding-watercolor-daisy',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-watercolor-daisy.svg`,
        texts: tx([
          'SAVE THE DATE',
          'Ana & Boris',
          '08 | 08 | 26',
          'TOGETHER TO CELEBRATE',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMUR',
          '19:00 - 19:30',
          'Ristovi Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#1E3A5F',
      accent: '#1E4D8C',
    }),
  },
  {
    id: 'svg-wedding-lemon-tiles',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-lemon-tiles.svg`,
        texts: tx([
          'WITH GREAT HONOR WE INVITE YOU TO OUR WEDDING',
          'Natasha & Stefan',
          '30 JULY 2026',
          'HOTEL DREAM - STRUGA',
          'RECEPTION: 19:00 - 19:30',
          'Mitev Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#F8FAFC',
      text: '#1E3A5F',
      accent: '#1D4ED8',
    }),
  },
  {
    id: 'svg-wedding-arch-hands',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-arch-hands.svg`,
        texts: tx([
          'Two hearts, one journey — join us as we begin ours',
          'Mia & Martin',
          'We invite you to celebrate with us',
          '08.09.2026',
          'HOTEL AQUATERM, OHRID',
          'Reception 19:30 - 20:00',
          'Arsov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#3D3229',
      accent: '#E9E0D8',
    }),
  },
{
    id: 'svg-wedding-cdr-floral-garden',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-floral-garden.svg`,
        texts: tx([
          'PLEASE JOIN US',
          'Vera & Aleksandar',
          '30 JULY 2026',
          'As we begin our life together',
          'VINARIJA POPOVA KULA',
          'Kavadarci',
          'At 18:00',
          'Stojkovski Family',
          'Nikolov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#2C4A2E',
    }),
  },
  {
    id: 'svg-wedding-cdr-spring-bloom',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-spring-bloom.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#3D4A2F',
    }),
  },
  {
    id: 'svg-wedding-cdr-golden-band',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-golden-band.svg`,
        texts: tx([
          'TOGETHER WITH OUR FAMILIES',
          'Ana & Goran',
          '08 | 08 | 26',
          'We invite you to celebrate with us',
          'RESTAURANT KAI MALEZ, OHRID',
          '19:00 - 19:30',
          'Reception to follow',
          'Arsov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#5C4A1E',
    }),
  },
  {
    id: 'svg-wedding-cdr-elegant-vine',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-elegant-vine.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#1F4D45',
    }),
  },
  {
    id: 'svg-wedding-cdr-classic-frame',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-classic-frame.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#2D3748',
    }),
  },
  {
    id: 'svg-wedding-cdr-rustic-wreath',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-rustic-wreath.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#4A3728',
    }),
  },
  {
    id: 'svg-wedding-cdr-romantic-rose',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-romantic-rose.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#5C2E3A',
    }),
  },
  {
    id: 'svg-wedding-cdr-vintage-lace',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-vintage-lace.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#3D3229',
    }),
  },
  {
    id: 'svg-wedding-cdr-botanical-frame',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-botanical-frame.svg`,
        texts: tx([
          'WITH GREAT JOY',
          'Elena & Boris',
          '15 AUGUST 2026',
          'We warmly invite you to our wedding celebration',
          'RESTAURANT GLAMOUR, SKOPJE',
          'Reception 19:00 - 19:30',
          'ul. Partizanski odredi 12',
          'Ristov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#4A3B2A',
    }),
  },
  {
    id: 'svg-wedding-cdr-navy-gold',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-navy-gold.svg`,
        texts: tx([
          'SAVE THE DATE',
          'Mila & Stefan',
          '20 SEPTEMBER 2026',
          'Join us for our wedding day',
          'HOTEL DRIM, STRUGA',
          'Ceremony 17:00',
          'Dinner and dancing to follow',
          'Mitev Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#1E293B',
    }),
  },
  {
    id: 'svg-wedding-cdr-olive-grove',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-olive-grove.svg`,
        texts: tx([
          'SAVE THE DATE',
          'Mila & Stefan',
          '20 SEPTEMBER 2026',
          'Join us for our wedding day',
          'HOTEL DRIM, STRUGA',
          'Ceremony 17:00',
          'Dinner and dancing to follow',
          'Mitev Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#2F3D28',
    }),
  },
  {
    id: 'svg-wedding-cdr-teal-floral',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-teal-floral.svg`,
        texts: tx([
          'SAVE THE DATE',
          'Mila & Stefan',
          '20 SEPTEMBER 2026',
          'Join us for our wedding day',
          'HOTEL DRIM, STRUGA',
          'Ceremony 17:00',
          'Dinner and dancing to follow',
          'Mitev Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#0F4C5C',
    }),
  },
  {
    id: 'svg-wedding-cdr-magenta-classic',
    category: 'wedding',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/wedding/wedding-cdr-magenta-classic.svg`,
        texts: tx([
          'TOGETHER WITH OUR FAMILIES',
          'Ana & Goran',
          '08 | 08 | 26',
          'We invite you to celebrate with us',
          'RESTAURANT KAI MALEZ, OHRID',
          '19:00 - 19:30',
          'Reception to follow',
          'Arsov Family',
          'Petrov Family',
        ]),
      },
    },
    colors: inlineColors({
      background: '#FFFFFF',
      text: '#4A1540',
    }),
  },
  {
    id: 'svg-bday-gold',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-gold.svg`,
        texts: tx([
          'CHEERS TO',
          '40 YEARS',
          'PLEASE JOIN US IN CELEBRATING',
          "MIHAJL'S",
          '40TH BIRTHDAY',
          'FRIDAY, OCTOBER 9TH, 2026',
          "AT SEVEN O'CLOCK IN THE EVENING",
          'GRAND PLAZA LOUNGE',
          '15 Partizanski Odredi Blvd, Skopje',
          'DRESS TO IMPRESS  |  RSVP BY OCT 1ST',
        ]),
      },
    },
    colors: classColors(
      {
        'text-gold': '#D4AF37',
        'text-white': '#FFFFFF',
        'text-light': '#D1D5DB',
      },
      { gold: 'accentColor', white: 'textColor', light: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-rosegold',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-rosegold.svg`,
        texts: tx([
          'Fabulous at Fifty',
          'PLEASE JOIN US FOR A DINNER PARTY',
          'CELEBRATING THE 50TH BIRTHDAY OF',
          'MARIA TODOROVA',
          'SATURDAY, SEPTEMBER 12TH, 2026',
          'COCKTAILS AT 6:00 PM | DINNER AT 7:30 PM',
          'ROSEWOOD RESTAURANT',
          '8 Makedonska St, Skopje',
          'Kindly RSVP by September 1st',
        ]),
      },
    },
    colors: classColors(
      {
        'text-rose': '#B76E79',
        'text-dark': '#2D3748',
        'text-gray': '#4A5568',
      },
      { rose: 'accentColor', dark: 'textColor', gray: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-princess',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-princess.svg`,
        texts: tx([
          'Once upon a time...',
          'YOU ARE INVITED TO A MAGICAL CELEBRATION',
          'PRINCESS MIA',
          'is turning 6!',
          'SUNDAY, AUGUST 22ND, 2026',
          'FROM 1:00 PM TO 4:00 PM',
          'PALACE RESTAURANT',
          '6 Partizanska St, Skopje',
          'PLEASE RSVP TO THE QUEEN',
          '+389 70 987 654',
        ]),
      },
    },
    colors: classColors(
      {
        'text-pink': '#DB2777',
        'text-purple': '#7E22CE',
        'text-gold': '#B45309',
      },
      { pink: 'accentColor', purple: 'textColor', gold: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-dino',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-dino.svg`,
        texts: tx([
          'ROAR!',
          'JOIN US FOR A DINO-MITE BIRTHDAY PARTY!',
          'LEO IS TURNING 5',
          'SATURDAY, JULY 18TH, 2026',
          '2:00 PM TO 5:00 PM',
          "JURASSIC PARK (LEO'S HOUSE)",
          '12 Dinosaur Lane, Skopje',
          'RSVP TO MOM BY JULY 10TH',
          '+389 70 123 456',
        ]),
      },
    },
    colors: classColors(
      {
        'text-orange': '#F97316',
        'text-green': '#15803D',
        'text-dark': '#1F2937',
      },
      { orange: 'accentColor', green: 'secondaryColor', dark: 'textColor' },
    ),
  },
  {
    id: 'svg-bday-champagne',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-champagne.svg`,
        texts: tx([
          'Pop the Bubbly!',
          'JOIN US FOR DINNER AND DRINKS',
          'TO CELEBRATE',
          "EMMA'S 25TH",
          'FRIDAY, DECEMBER 5TH, 2026',
          "EIGHT O'CLOCK IN THE EVENING",
          'KAMENICA LOUNGE',
          '21 Makedonska St, Skopje',
          'Kindly RSVP by November 25th',
        ]),
      },
    },
    colors: classColors(
      {
        'text-gold': '#D4AF37',
        'text-white': '#FFFFFF',
        'text-gray': '#9CA3AF',
      },
      { gold: 'accentColor', white: 'textColor', gray: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-unicorn',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-unicorn.svg`,
        texts: tx([
          'Sprinkles & Sparkles!',
          'PLEASE JOIN US FOR A MAGICAL CELEBRATION',
          'LILY IS TURNING 5',
          '★ ★ ★',
          'SUNDAY, APRIL 12TH, 2026',
          'FROM 2:00 PM TO 5:00 PM',
          'RAINBOW GARDEN',
          '7 Cloud St, Skopje',
          "RSVP TO LILY'S MOM",
          '+389 70 222 333',
        ]),
      },
    },
    colors: classColors(
      {
        'text-gold': '#D97706',
        'text-purple': '#7E22CE',
        'text-pink': '#DB2777',
      },
      { gold: 'secondaryColor', purple: 'textColor', pink: 'accentColor' },
    ),
  },
  {
    id: 'svg-bday-bbq',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-bbq.svg`,
        texts: tx([
          'JOIN US FOR',
          'BEERS & BBQ',
          'TO CELEBRATE',
          "DAVID'S 30TH",
          'SATURDAY, AUGUST 22ND, 2026',
          'STARTING AT 4:00 PM',
          "DAVID'S BACKYARD",
          '4 Grill Master Way, Bitola',
          'RSVP FOR A BURGER',
          '+389 70 555 666',
        ]),
      },
    },
    colors: classColors(
      {
        'text-white': '#F8FAFC',
        'text-yellow': '#FBBF24',
        'text-orange': '#F97316',
      },
      { white: 'textColor', yellow: 'accentColor', orange: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-retro',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-retro.svg`,
        texts: tx([
          'LEVEL UP!',
          'YOU ARE INVITED TO CELEBRATE',
          "MATEJ'S 13TH",
          'BIRTHDAY',
          'SATURDAY, NOV 14TH, 2026',
          '6:00 PM TO 10:00 PM',
          'ARCADE MANIA',
          '5 Retro Blvd, Skopje',
          'INSERT COIN TO RSVP',
          '+389 70 777 111',
        ]),
      },
    },
    colors: classColors(
      {
        'text-cyan': '#06B6D4',
        'text-pink': '#EC4899',
        'text-white': '#FFFFFF',
      },
      { cyan: 'accentColor', pink: 'secondaryColor', white: 'textColor' },
    ),
  },
  {
    id: 'svg-bday-construction',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-construction.svg`,
        texts: tx([
          'CAUTION!',
          'PARTY ZONE AHEAD',
          'MARKO IS TURNING 3',
          'SUNDAY, SEPTEMBER 20TH, 2026',
          '10:00 AM TO 1:00 PM',
          'THE CONSTRUCTION SITE',
          '8 Builder Blvd, Skopje',
          'REPORT TO FOREMAN (RSVP)',
          '+389 70 777 888',
        ]),
      },
    },
    colors: classColors(
      {
        'text-yellow': '#EAB308',
        'text-black': '#1C1917',
        'text-orange': '#EA580C',
      },
      { yellow: 'accentColor', black: 'textColor', orange: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-bday-mermaid',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-mermaid.svg`,
        texts: tx([
          "Let's Shell-ebrate!",
          'JOIN US UNDER THE SEA FOR',
          "HANA'S",
          '4th Birthday',
          'SATURDAY, AUGUST 8TH, 2026',
          '2:00 PM TO 5:00 PM',
          'HOTEL SILEKS POOL',
          '3 Kej Makedonija, Ohrid',
          'PLEASE RSVP TO MOM',
          '+389 70 444 333',
        ]),
      },
    },
    colors: classColors(
      {
        'text-teal': '#0D9488',
        'text-purple': '#7E22CE',
        'text-white': '#FFFFFF',
      },
      { teal: 'accentColor', purple: 'secondaryColor', white: 'textColor' },
    ),
  },
  {
    id: 'svg-bday-safari',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-safari.svg`,
        texts: tx([
          'WILD ONE!',
          'SWING ON BY FOR A SAFARI ADVENTURE',
          'NOAH IS TURNING 1',
          'SUNDAY, JUNE 15TH, 2026',
          '11:00 AM TO 2:00 PM',
          'SKOPJE ZOO PARK',
          '2 Safari Trail, Skopje',
          'RSVP TO THE TOUR GUIDE',
          '+389 70 123 456',
        ]),
      },
    },
    colors: classColors(
      {
        'text-green': '#15803D',
        'text-orange': '#EA580C',
        'text-brown': '#451A03',
      },
      { green: 'accentColor', orange: 'secondaryColor', brown: 'textColor' },
    ),
  },
  {
    id: 'svg-bday-space',
    category: 'birthday',
    aspectRatio: 1500 / 2100,
    sides: {
      front: {
        path: `${ROOT}/birthday/bday-print-space.svg`,
        texts: tx([
          'BLAST OFF!',
          'JOIN US FOR AN OUT OF THIS WORLD PARTY',
          'ALEX IS TURNING 7',
          'SATURDAY, MAY 10TH, 2026',
          '1:00 PM TO 4:00 PM',
          'SPACE STATION 9',
          '9 Galaxy Way, Skopje',
          'MISSION CONTROL RSVP',
          '+389 70 987 654',
        ]),
      },
    },
    colors: classColors(
      {
        'text-yellow': '#FBBF24',
        'text-white': '#FFFFFF',
        'text-blue': '#60A5FA',
      },
      { yellow: 'accentColor', white: 'textColor', blue: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-menu-rustic',
    category: 'menus',
    aspectRatio: 1600 / 2400,
    sides: {
      front: {
        path: `${ROOT}/menu-print-rustic-front.svg`,
        texts: tx([
          'TRATTORIA',
          'Bella Vita',
          'AUTHENTIC ITALIAN CUISINE',
          'MENU',
          'Buon Appetito!',
          'FRESH PASTA MADE DAILY',
        ]),
      },
      back: {
        path: `${ROOT}/menu-print-rustic-back.svg`,
        texts: tx([
          'DOLCI & CAFFÈ',
          'ASK ABOUT OUR DAILY DESSERT SPECIALS',
          'Grazie',
          'THANK YOU FOR DINING WITH US',
          'TRATTORIA BELLA VITA',
          '12 Olive Grove Lane, Skopje',
          'RESERVATIONS: +389 70 867 530',
          'WWW.BELLAVITA.MK',
        ]),
      },
    },
    colors: classColors(
      {
        'text-dark': '#2C3E50',
        'text-green': '#4F6354',
        'text-red': '#8B0000',
      },
      { dark: 'textColor', green: 'accentColor', red: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-menu-finedining',
    category: 'menus',
    aspectRatio: 1600 / 2400,
    sides: {
      front: {
        path: `${ROOT}/menu-print-finedining-front.svg`,
        texts: tx([
          "L'AURA",
          'STEAKHOUSE & LOUNGE',
          'MENU',
          'EXECUTIVE CHEF',
          'ALEXANDER VELKOV',
          'EST. 2026',
        ]),
      },
      back: {
        path: `${ROOT}/menu-print-finedining-back.svg`,
        texts: tx([
          'WINE & SPIRITS',
          'PLEASE ASK YOUR SERVER FOR OUR',
          'EXTENSIVE RESERVE WINE LIST',
          'PRIVATE DINING AVAILABLE',
          'INQUIRE AT EVENTS@LAURA.MK',
          "L'AURA",
          '22 Partizanski Odredi Blvd, Skopje',
          'WWW.LAURARESTAURANT.MK',
        ]),
      },
    },
    colors: classColors(
      {
        'text-gold': '#D4AF37',
        'text-white': '#FFFFFF',
        'text-light': '#9CA3AF',
      },
      { gold: 'accentColor', white: 'textColor', light: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-menu-sushi',
    category: 'menus',
    aspectRatio: 1600 / 2400,
    sides: {
      front: {
        path: `${MENUS}/menu-print-sushi-front.svg`,
        texts: tx([
          '桜',
          'SAKURA',
          'SUSHI & SAKE',
          'MENU',
          'TRADITIONAL OMAKASE EXPERIENCE',
        ]),
      },
      back: {
        path: `${MENUS}/menu-print-sushi-back.svg`,
        texts: tx([
          'SAKE & TEA',
          'FEATURING PREMIUM IMPORTED SAKE',
          'SAKURA',
          '18 Makedonska St, Skopje',
          'RESERVATIONS REQUIRED',
          'WWW.SAKURASUSHI.MK',
        ]),
      },
    },
    colors: classColors(
      {
        'text-white': '#FFFFFF',
        'text-pink': '#FBCFE8',
        'text-red': '#EF4444',
      },
      { white: 'textColor', pink: 'accentColor', red: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-menu-seafood',
    category: 'menus',
    aspectRatio: 1600 / 2400,
    sides: {
      front: {
        path: `${MENUS}/menu-print-seafood-front.svg`,
        texts: tx([
          'OCEANIS',
          'SEAFOOD & OYSTER BAR',
          'MENU',
          'FRESH CATCH DAILY',
        ]),
      },
      back: {
        path: `${MENUS}/menu-print-seafood-back.svg`,
        texts: tx([
          'RAW BAR & COCKTAILS',
          'JOIN US FOR HAPPY HOUR 4PM - 6PM',
          'OCEANIS',
          '7 Kej Makedonija, Ohrid',
          'RESERVATIONS: +389 70 123 456',
          'WWW.OCEANISSEAFOOD.MK',
        ]),
      },
    },
    colors: classColors(
      {
        'text-white': '#FFFFFF',
        'text-gold': '#D4AF37',
        'text-blue': '#E0F2FE',
      },
      { white: 'textColor', gold: 'accentColor', blue: 'secondaryColor' },
    ),
  },
  {
    id: 'svg-menu-cafe',
    category: 'menus',
    aspectRatio: 1600 / 2400,
    sides: {
      front: {
        path: `${MENUS}/menu-print-cafe-front.svg`,
        texts: tx([
          'ARTISAN ROASTERS',
          'The Daily',
          'Grind',
          'MENU',
          'LOCALLY SOURCED & CRAFTED',
        ]),
      },
      back: {
        path: `${MENUS}/menu-print-cafe-back.svg`,
        texts: tx([
          'SEASONAL BREWS',
          'ASK YOUR BARISTA ABOUT OUR SINGLE ORIGIN POUR-OVERS',
          'THE DAILY GRIND',
          '5 Debartsa St, Skopje',
          'OPEN DAILY 6AM - 6PM',
          'WWW.DNEVENMEL.MK',
        ]),
      },
    },
    colors: classColors(
      {
        'text-dark': '#3E2723',
        'text-accent': '#8D6E63',
      },
      { dark: 'textColor', accent: 'accentColor' },
    ),
  },
];

export function getSvgDesignTemplate(id: string): SvgDesignTemplate | undefined {
  return svgDesignTemplates.find((template) => template.id === id);
}

export function getSvgTemplateTextFields(template: SvgDesignTemplate) {
  const fields: Array<SvgTextField & { side: 'front' | 'back' }> = [];
  for (const field of template.sides.front.texts) {
    fields.push({ ...field, side: 'front' });
  }
  if (template.sides.back) {
    for (const field of template.sides.back.texts) {
      fields.push({ ...field, side: 'back' });
    }
  }
  return fields;
}
