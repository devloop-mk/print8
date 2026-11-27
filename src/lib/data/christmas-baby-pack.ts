import type { ProductDesignTemplate } from '@/lib/data/catalog';

const BODYSUIT_PLACEMENT = {
  overlayScale: 40,
  overlayPosition: { x: 50, y: 52 },
  overlayByProductType: {
    bodysuit: { scale: 36, position: { x: 50, y: 48 } },
  },
} as const;

function christmasBodysuit(
  id: string,
  file: string,
  titleMk: string,
  titleEn: string,
): ProductDesignTemplate {
  return {
    id,
    kind: 'overlay',
    category: 'image-designs',
    productTypes: ['bodysuit'],
    productIds: ['bodysuit-basic'],
    nameKey: id,
    titleMk,
    titleEn,
    overlayImage: `/designs/christmas-baby/${file}`,
    ...BODYSUIT_PLACEMENT,
    recommendedColor: '#ffffff',
    defaultSide: 'front',
    collection: 'christmas-baby',
  };
}

/** Seasonal baby-bodysuit prints. Kept off tees and mugs so they stay one collection. */
export const christmasBabyPackTemplates: ProductDesignTemplate[] = [
  christmasBodysuit(
    'baby-xmas-lara',
    '01-prviot-bozik-lara.png',
    'Првиот Божик на Лара',
    "Lara's first Christmas",
  ),
  christmasBodysuit(
    'baby-xmas-ask-santa',
    '02-ako-mama-kaze-ne.png',
    'Ако мама каже не',
    'If mom says no',
  ),
  christmasBodysuit(
    'baby-xmas-daddy-santa',
    '03-daddy-is-my-santa.png',
    'Тато ми е Дедо Мраз',
    'Daddy is my Santa',
  ),
  christmasBodysuit(
    'baby-xmas-milk-toys',
    '04-more-milk-and-toys-2027.png',
    'Повеќе млеко и играчки 2027',
    'More milk and toys 2027',
  ),
  christmasBodysuit(
    'baby-xmas-first',
    '05-my-first-christmas.png',
    'Мојот прв Божиќ',
    'My first Christmas',
  ),
  christmasBodysuit(
    'baby-xmas-crawling',
    '06-crawling-baby-christmas.png',
    'Ползам кон Божиќ',
    'Crawling into Christmas',
  ),
  christmasBodysuit(
    'baby-xmas-wonderful',
    '07-most-wonderful-time.png',
    'Најубавото време',
    'The most wonderful time',
  ),
  christmasBodysuit(
    'baby-xmas-new-year-trees',
    '08-happy-new-year-trees.png',
    'Среќна нова година',
    'Happy New Year',
  ),
  christmasBodysuit(
    'baby-xmas-santa-baby',
    '09-santa-baby.png',
    'Santa baby',
    'Santa baby',
  ),
  christmasBodysuit(
    'baby-xmas-santa-snowman',
    '10-merry-christmas-santa-snowman.png',
    'Дедо Мраз и снешко',
    'Santa and snowman',
  ),
  christmasBodysuit(
    'baby-xmas-jingle',
    '11-jingle-bells.png',
    'Jingle bells',
    'Jingle bells',
  ),
  christmasBodysuit(
    'baby-xmas-lollipop',
    '12-merry-christmas-snowman-lollipop.png',
    'Снешко со лижавче',
    'Snowman with a lollipop',
  ),
  christmasBodysuit(
    'baby-xmas-santas-favorite',
    '13-santas-favorite.png',
    'Омилен на Дедо Мраз',
    "Santa's favorite",
  ),
  christmasBodysuit(
    'baby-xmas-2027',
    '14-happy-new-year-merry-christmas-2027.png',
    'Среќен Божиќ и Нова 2027',
    'Merry Christmas and New Year 2027',
  ),
];
