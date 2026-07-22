import type { ProductDesignTemplate, ProductType } from '@/lib/data/catalog';

/**
 * Couple *pack* metadata (paired SKUs, labels, recommended colors) still lives
 * in code. Partner overlay designs are also emitted into `productDesignTemplates`
 * and seed into `managed_product_designs`. Moving pack metadata to DB is a
 * follow-up once merch designs are fully DB-backed.
 */

export type CouplePartnerRole = 'partner1' | 'partner2';

export interface CouplePartnerDesign {
  role: CouplePartnerRole;
  designId: string;
  labelEn: string;
  labelMk: string;
  overlayImage: string;
  overlayScale: number;
  overlayPosition: { x: number; y: number };
}

export interface CouplePackTemplate {
  id: string;
  nameKey: string;
  titleEn: string;
  titleMk: string;
  productTypes: ProductType[];
  partnerDesigns: [CouplePartnerDesign, CouplePartnerDesign];
  recommendedColor: string;
  applicableColors?: string[];
  collection: 'couple-packs';
}

const OVERLAY_DEFAULTS = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 54 },
} as const;

export const couplePackTemplates: CouplePackTemplate[] = [
  {
    id: 'couple-king-queen',
    nameKey: 'coupleKingQueen',
    titleEn: 'King & Queen',
    titleMk: 'Крал и Кралица',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#c5ccd6', '#1C1A1D', '#0F287C', '#DB0213'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-king-queen-king',
        labelEn: 'King',
        labelMk: 'Крал',
        overlayImage: '/NEW_DESIGNS/couple/king.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-king-queen-queen',
        labelEn: 'Queen',
        labelMk: 'Кралица',
        overlayImage: '/NEW_DESIGNS/couple/queen.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-hes-shes-mine',
    nameKey: 'coupleHesShesMine',
    titleEn: "He's Mine / She's Mine",
    titleMk: 'Мој е / Моја е',
    productTypes: ['t-shirt'],
    recommendedColor: '#000000',
    applicableColors: ['#c5ccd6', '#1C1A1D', '#0F287C', '#DB0213'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-hes-shes-mine-his',
        labelEn: "He's Mine",
        labelMk: 'Мој е',
        overlayImage: '/NEW_DESIGNS/couple/hes-mine.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-hes-shes-mine-hers',
        labelEn: "She's Mine",
        labelMk: 'Моја е',
        overlayImage: '/NEW_DESIGNS/couple/shes-mine.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-puzzle-hearts',
    nameKey: 'couplePuzzleHearts',
    titleEn: 'Puzzle Hearts',
    titleMk: 'Срца-слоговници',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000', '#1e40af'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-puzzle-hearts-left',
        labelEn: 'Puzzle left',
        labelMk: 'Лево срце',
        overlayImage: '/NEW_DESIGNS/couple/puzzle-left.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-puzzle-hearts-right',
        labelEn: 'Puzzle right',
        labelMk: 'Десно срце',
        overlayImage: '/NEW_DESIGNS/couple/puzzle-right.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-magnet',
    nameKey: 'coupleMagnet',
    titleEn: 'Magnet Attraction',
    titleMk: 'Магнетска привлечност',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-magnet-holder',
        labelEn: 'Magnet holder',
        labelMk: 'Со магнет',
        overlayImage: '/NEW_DESIGNS/couple/magnet-holder.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-magnet-attracted',
        labelEn: 'Attracted',
        labelMk: 'Привлечен',
        overlayImage: '/NEW_DESIGNS/couple/magnet-attracted.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-mia-mio',
    nameKey: 'coupleMiaMio',
    titleEn: 'Mía / Mío',
    titleMk: 'Мија / Мио',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#c5ccd6', '#1C1A1D', '#DB0213'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-mia-mio-mio',
        labelEn: 'Mío',
        labelMk: 'Мио',
        overlayImage: '/NEW_DESIGNS/couple/mio.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-mia-mio-mia',
        labelEn: 'Mía',
        labelMk: 'Мија',
        overlayImage: '/NEW_DESIGNS/couple/mia.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-pacman',
    nameKey: 'couplePacman',
    titleEn: 'Pac-Man & Ghost',
    titleMk: 'Pac-Man и дух',
    productTypes: ['t-shirt'],
    recommendedColor: '#000000',
    applicableColors: ['#ffffff', '#000000'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-pacman-pacman',
        labelEn: 'Pac-Man',
        labelMk: 'Pac-Man',
        overlayImage: '/NEW_DESIGNS/couple/pacman.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-pacman-ghost',
        labelEn: 'Ghost',
        labelMk: 'Дух',
        overlayImage: '/NEW_DESIGNS/couple/ghost.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-fox-mouse',
    nameKey: 'coupleFoxMouse',
    titleEn: 'Fox & Mouse',
    titleMk: 'Лисица и глушец',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000', '#c5ccd6'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-fox-mouse-fox',
        labelEn: 'Fox',
        labelMk: 'Лисица',
        overlayImage: '/NEW_DESIGNS/couples-generated/couple-fox-partner.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-fox-mouse-mouse',
        labelEn: 'Mouse',
        labelMk: 'Глушец',
        overlayImage: '/NEW_DESIGNS/couples-generated/couple-mouse-partner.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
  {
    id: 'couple-soulmates',
    nameKey: 'coupleSoulmates',
    titleEn: 'Soulmates',
    titleMk: 'Сродници на душата',
    productTypes: ['t-shirt'],
    recommendedColor: '#ffffff',
    applicableColors: ['#ffffff', '#000000', '#c5ccd6'],
    collection: 'couple-packs',
    partnerDesigns: [
      {
        role: 'partner1',
        designId: 'couple-soulmates-him',
        labelEn: 'Soulmates',
        labelMk: 'Сродници',
        overlayImage: '/NEW_DESIGNS/couples-generated/couple-soulmates.png',
        ...OVERLAY_DEFAULTS,
      },
      {
        role: 'partner2',
        designId: 'couple-soulmates-her',
        labelEn: 'Soulmates',
        labelMk: 'Сродници',
        overlayImage: '/NEW_DESIGNS/couples-generated/couple-soulmates.png',
        ...OVERLAY_DEFAULTS,
      },
    ],
  },
];

export function getCouplePackTemplates(): CouplePackTemplate[] {
  return couplePackTemplates;
}

export function getCouplePackTemplate(id: string): CouplePackTemplate | undefined {
  return couplePackTemplates.find((pack) => pack.id === id);
}

export function partnerDesignToTemplate(
  pack: CouplePackTemplate,
  partner: CouplePartnerDesign,
): ProductDesignTemplate {
  return {
    id: partner.designId,
    kind: 'overlay',
    category: 'image-designs',
    productTypes: pack.productTypes,
    nameKey: partner.designId,
    titleEn: `${pack.titleEn} — ${partner.labelEn}`,
    titleMk: `${pack.titleMk} — ${partner.labelMk}`,
    overlayImage: partner.overlayImage,
    overlayScale: partner.overlayScale,
    overlayPosition: partner.overlayPosition,
    recommendedColor: pack.recommendedColor,
    applicableColors: pack.applicableColors,
    defaultSide: 'front',
    collection: pack.collection,
  };
}

export function getCouplePackPartnerDesign(
  designId: string,
): { pack: CouplePackTemplate; partner: CouplePartnerDesign; design: ProductDesignTemplate } | null {
  for (const pack of couplePackTemplates) {
    const partner = pack.partnerDesigns.find((item) => item.designId === designId);
    if (partner) {
      return {
        pack,
        partner,
        design: partnerDesignToTemplate(pack, partner),
      };
    }
  }
  return null;
}

export function getCouplePackDesignTemplates(): ProductDesignTemplate[] {
  return couplePackTemplates.flatMap((pack) =>
    pack.partnerDesigns.map((partner) => partnerDesignToTemplate(pack, partner)),
  );
}
