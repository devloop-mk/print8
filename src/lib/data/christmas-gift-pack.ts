import type { ProductDesignTemplate } from '@/lib/data/catalog';

type Placement = {
  overlayScale: number;
  overlayPosition: { x: number; y: number };
};

const HOODIE: Placement = { overlayScale: 32, overlayPosition: { x: 50, y: 42 } };
const MUG: Placement = { overlayScale: 28, overlayPosition: { x: 50, y: 46 } };
const MUG_WIDE: Placement = { overlayScale: 36, overlayPosition: { x: 50, y: 50 } };
const BAG: Placement = { overlayScale: 36, overlayPosition: { x: 50, y: 46 } };

function christmasGift(
  id: string,
  file: string,
  titleMk: string,
  titleEn: string,
  productType: 'hoodie' | 'mug' | 'bag',
  productId: string,
  placement: Placement,
  recommendedColor: string,
): ProductDesignTemplate {
  return {
    id,
    kind: 'overlay',
    category: 'image-designs',
    productTypes: [productType],
    productIds: [productId],
    nameKey: id,
    titleMk,
    titleEn,
    overlayImage: `/designs/christmas/${file}`,
    overlayScale: placement.overlayScale,
    overlayPosition: placement.overlayPosition,
    overlayByProductType: {
      [productType]: {
        scale: placement.overlayScale,
        position: placement.overlayPosition,
      },
    },
    recommendedColor,
    defaultSide: 'front',
    collection: 'christmas',
  };
}

/** Christmas prints locked to one product so a hoodie design never shows on a mug. */
export const christmasGiftPackTemplates: ProductDesignTemplate[] = [
  christmasGift('xmas-hoodie-gingerbread-boy', '02-christmas-gingerbread-boy.png', 'Christmas', 'Christmas', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-gingerbread-girl', '06-gingerbread-girl-heart.png', 'Колаче со срце', 'Gingerbread with a heart', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-gingerbread-boy-heart', '07-gingerbread-boy-heart.png', 'Колаче момче', 'Gingerbread boy', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-love', '08-sleeve-love.png', 'Love', 'Love', 'hoodie', 'hoodie-basic', { overlayScale: 34, overlayPosition: { x: 50, y: 46 } }, '#ffffff'),
  christmasGift('xmas-hoodie-2027', '10-kolede-2027.png', 'Коледе 2027', 'Kolede 2027', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-happy', '11-kolede-e-srekjni-sme.png', 'Коледе е, среќни сме', 'Kolede, we are happy', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-leon', '13-leon-e-koledarche.png', 'Леон е коледарче', 'Leon the caroler', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-hoodie-joy', '14-sreka-e-kolede.png', 'Среќа е Коледе', 'Joy is Kolede', 'hoodie', 'hoodie-basic', HOODIE, '#ffffff'),
  christmasGift('xmas-mug-merry', '01-merry-gingerbread-girl.png', 'Merry', 'Merry', 'mug', 'mug-classic', MUG, '#ffffff'),
  christmasGift('xmas-mug-all-i-need', '03-all-i-need-is.png', 'Сè што ми треба', 'All I need is', 'mug', 'mug-classic', MUG, '#ffffff'),
  christmasGift('xmas-mug-nina', '04-nina-santa-hat.png', 'Нина', 'Nina', 'mug', 'mug-classic', MUG_WIDE, '#ffffff'),
  christmasGift('xmas-mug-vasil', '05-vasil-santa-hat.png', 'Васил', 'Vasil', 'mug', 'mug-classic', MUG_WIDE, '#ffffff'),
  christmasGift('xmas-mug-tkr', '09-tkr-tkr-kolede.png', 'Ткр ткр Коледе', 'Tkr tkr Kolede', 'mug', 'mug-classic', MUG, '#ffffff'),
  christmasGift('xmas-bag-jana', '15-koledarska-torba-jana.png', 'Коледарска торба на Јана', "Jana's caroling bag", 'bag', 'bag-naturella-natural', BAG, '#E8DCC8'),
  christmasGift('xmas-bag-damjan', '16-koledarska-torba-damjan.png', 'Коледарска торба на Дамјан', "Damjan's caroling bag", 'bag', 'bag-naturella-natural', BAG, '#E8DCC8'),
];
