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
          'John Doe',
          'CHIEF EXECUTIVE OFFICER',
          '+1 (555) 123-4567',
          'john.doe@company.com',
          'www.company.com',
          '123 Business Rd, Suite 100',
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
          'ALEXANDER WRIGHT',
          'MANAGING PARTNER',
          '+1 (555) 777-8888',
          'alexander@wright.com',
          'WWW.WRIGHT.COM',
          '789 PRESTIGE BLVD',
        ]),
      },
      back: {
        path: `${BC}/bcard-luxury-gold-back.svg`,
        texts: tx(['WRIGHT & CO.', 'EST. 1985']),
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
          'Jane Smith',
          'MARKETING DIRECTOR',
          '+1 (555) 987-6543',
          'jane.smith@company.com',
          'www.company.com',
          '456 Innovation Ave, NY',
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
          'Sarah Jenkins',
          'ART DIRECTOR',
          '+1 (555) 444-3333',
          'sarah@studio.com',
          'www.studio.com',
          '321 Creative Alley, SF',
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
          'MIA & NOAH',
          'JOIN US FOR THE CELEBRATION',
          '15 . 05 . 2026',
          'CEREMONY AT 3:00 PM',
          'DINNER & DANCING AT 6:00 PM',
          'THE MODERN LOFT',
          '789 INDUSTRIAL WAY',
          'CHICAGO, IL',
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
          'Olivia',
          'AND',
          'Benjamin',
          'SUNDAY, SEPTEMBER 6TH, 2026',
          'HALF PAST FOUR IN THE AFTERNOON',
          'THE ROSE GARDEN',
          '101 ROMANCE BLVD, AUSTIN, TX',
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
          'Eleanor Rose',
          '&',
          'Alexander James',
          'REQUEST THE HONOR OF YOUR PRESENCE',
          'AT THEIR WEDDING CELEBRATION',
          'SATURDAY, THE TWENTY-FOURTH OF AUGUST',
          'TWO THOUSAND TWENTY-SIX',
          "AT FOUR O'CLOCK IN THE AFTERNOON",
          'THE GRAND ESTATE',
          '123 VINTAGE AVENUE, NEW YORK',
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
          'Sophia',
          '&',
          'William',
          'INVITE YOU TO CELEBRATE THEIR MARRIAGE',
          'OCTOBER 12, 2026',
          "AT FIVE O'CLOCK IN THE EVENING",
          'BOTANICAL GARDENS',
          '456 NATURE PATH, SEATTLE, WA',
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
          'Ashley Smith',
          '&',
          'Michael James',
          'Saturday October 24, 2026',
          'AT SIX THIRTY IN THE EVENING',
          'THE BEACH HOUSE RESTAURANT',
          '3802 BEACH HOUSE LANE',
          'BEACHSIDE, FLORIDA',
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
          'Charlotte',
          'and',
          'Matthew',
          'REQUEST THE PLEASURE OF YOUR COMPANY',
          'AT THEIR WEDDING CELEBRATION',
          'SUNDAY, OCTOBER 18TH, 2026',
          'AT FOUR THIRTY IN THE AFTERNOON',
          'THE RUSTIC BARN ESTATE',
          '555 HARVEST LANE',
          'NASHVILLE, TENNESSEE',
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
          'Isabella',
          '&',
          'Jonathan',
          'INVITE YOU TO SHARE IN THEIR JOY',
          'AS THEY EXCHANGE VOWS',
          'NOVEMBER 14, 2026',
          "AT SEVEN O'CLOCK IN THE EVENING",
          'THE OBSERVATORY',
          '888 GALAXY ROAD, MOUNTAIN VIEW',
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
          'Amelia',
          '&',
          'Jackson',
          'SATURDAY, MAY 16TH, 2026',
          "AT FIVE O'CLOCK IN THE AFTERNOON",
          'THE DESERT OASIS RETREAT',
          '789 CANYON ROAD',
          'PALM SPRINGS, CALIFORNIA',
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
          'Kyaraine &',
          'Orhan',
          'YOUR COMPANY IS AWAITED',
          'AT OUR MARRIAGE',
          '20  |  AUGUST  |  2026',
          "At 4 o'clock in the afternoon",
          'Loui Garden',
          '123 Anywhere St., Any City',
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
          'Christopher',
          'DECEMBER 12, 2026',
          "AT FOUR O'CLOCK IN THE AFTERNOON",
          'THE SNOW PINE LODGE',
          '100 MOUNTAIN PEAK DRIVE',
          'ASPEN, COLORADO',
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
          "MICHAEL'S",
          '40TH BIRTHDAY',
          'FRIDAY, OCTOBER 9TH, 2026',
          "AT SEVEN O'CLOCK IN THE EVENING",
          'THE GRAND HOTEL LOUNGE',
          '789 LUXURY AVENUE, DOWNTOWN',
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
          'SARAH JENKINS',
          'SATURDAY, SEPTEMBER 12TH',
          'COCKTAILS AT 6:00 PM | DINNER AT 7:30 PM',
          'THE ROSEWOOD RESTAURANT',
          '321 ELEGANCE BOULEVARD',
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
          'SUNDAY, AUGUST 22ND',
          'FROM 1:00 PM TO 4:00 PM',
          'THE ROYAL CASTLE',
          '456 FAIRYTALE DRIVE, WONDERLAND',
          'PLEASE RSVP TO THE QUEEN',
          '555-987-6543',
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
          'SATURDAY, JULY 18TH',
          '2:00 PM TO 5:00 PM',
          "JURASSIC PARK (LEO'S HOUSE)",
          '123 DINOSAUR LANE, BEDROCK',
          'RSVP TO MOM BY JULY 10TH',
          '555-123-4567',
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
          'FRIDAY, DECEMBER 5TH',
          "EIGHT O'CLOCK IN THE EVENING",
          'THE VELVET LOUNGE',
          '321 CHAMPAGNE TERRACE, NY',
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
          'SUNDAY, APRIL 12TH',
          'FROM 2:00 PM TO 5:00 PM',
          'THE RAINBOW GARDEN',
          '789 CLOUD NINE WAY, FAIRYLAND',
          "RSVP TO LILY'S MOM",
          '555-MAGIC-22',
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
          'SATURDAY, AUGUST 22ND',
          'STARTING AT 4:00 PM',
          "DAVID'S BACKYARD",
          '456 GRILL MASTER WAY',
          'RSVP FOR A BURGER',
          '555-BBQ-TIME',
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
          "MATT'S 13TH",
          'BIRTHDAY',
          'SATURDAY, NOV 14TH',
          '6:00 PM TO 10:00 PM',
          'ARCADE MANIA',
          '123 RETRO BLVD, NEON CITY',
          'INSERT COIN TO RSVP',
          '555-ARCADE-1',
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
          'MASON IS TURNING 3',
          'SUNDAY, SEPTEMBER 20TH',
          '10:00 AM TO 1:00 PM',
          'THE CONSTRUCTION SITE',
          '321 BUILDER BLVD, AUSTIN',
          'REPORT TO FOREMAN (RSVP)',
          '555-777-8888',
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
          "CHLOE'S",
          '4th Birthday',
          'SATURDAY, AUGUST 8TH',
          '2:00 PM TO 5:00 PM',
          'MERMAID COVE POOL',
          '789 OCEAN BREEZE WAY, MIAMI',
          'PLEASE RSVP TO THE MER-MOM',
          '555-444-3333',
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
          'SUNDAY, JUNE 15TH',
          '11:00 AM TO 2:00 PM',
          'THE JUNGLE RESERVE',
          '456 SAFARI TRAIL, SAN DIEGO',
          'RSVP TO THE TOUR GUIDE',
          '555-123-4567',
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
          'SATURDAY, MAY 10TH',
          '1:00 PM TO 4:00 PM',
          'SPACE STATION 9',
          '123 GALAXY WAY, HOUSTON',
          'MISSION CONTROL RSVP',
          '555-987-6543',
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
          '456 OLIVE GROVE LANE, TUSCANY VALLEY',
          'RESERVATIONS: (555) 867-5309',
          'WWW.BELLAVITA.COM',
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
          'ALEXANDER WRIGHT',
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
          'INQUIRE AT EVENTS@LAURA.COM',
          "L'AURA",
          '123 LUXURY AVENUE, NEW YORK, NY 10001',
          'WWW.LAURARESTAURANT.COM',
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
