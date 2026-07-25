export const DESIGN_COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Japanese Anime', mk: 'Јапонско аниме' },
  typography: { en: 'Streetwear Typography', mk: 'Стритвер типографија' },
  streetwear: { en: 'Streetwear', mk: 'Стритвер' },
  'baby-milestones': { en: 'Baby milestones', mk: 'Беби пресвртници' },
  'couple-packs': { en: 'Couple packs', mk: 'Парски пакети' },
  'trending-mk': { en: 'Trending MK', mk: 'Тренд МК' },
  family: { en: 'Family', mk: 'Семејство' },
  'kids-birthday': { en: 'Kids & birthday', mk: 'Деца и роденден' },
  'local-mk': { en: 'Local designs', mk: 'Локални дизајни' },
  'caps-local': { en: 'Caps', mk: 'Капи' },
  'bags-local': { en: 'Bags', mk: 'Торби' },
  drinkware: { en: 'Drinkware', mk: 'Шолји' },
  'family-gifts': { en: 'Family gifts', mk: 'Семејни подароци' },
};

export function getDesignCollectionLabel(
  collection: string,
  locale: 'mk' | 'en',
): string {
  return DESIGN_COLLECTION_LABELS[collection]?.[locale] ?? collection;
}
