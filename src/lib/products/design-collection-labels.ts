export const DESIGN_COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Japanese Anime', mk: 'Јапонско аниме' },
  typography: { en: 'Streetwear Typography', mk: 'Стритвер типографија' },
  streetwear: { en: 'Streetwear', mk: 'Стритвер' },
  'baby-milestones': { en: 'Baby milestones', mk: 'Беби пресвртници' },
  'couple-packs': { en: 'Couple packs', mk: 'Парски пакети' },
  'trending-mk': { en: 'Trending MK', mk: 'Тренд МК' },
  'chemistry-drama': { en: 'Chemistry Drama', mk: 'Кемија драма' },
  'stranger-80s': { en: 'Stranger 80s', mk: 'Странџер 80-ти' },
  'peaky-era': { en: 'Peaky Era', mk: 'Пики ера' },
  'zombie-survival': { en: 'Zombie Survival', mk: 'Зомби преживување' },
  'cartel-crime': { en: 'Cartel Crime', mk: 'Картел криминал' },
  'biker-rebel': { en: 'Biker Rebel', mk: 'Бајкер бунтовник' },
  'neon-retro': { en: 'Neon Retro', mk: 'Неон ретро' },
  'vintage-dapper': { en: 'Vintage Dapper', mk: 'Винтиџ стил' },
  'science-core': { en: 'Science Core', mk: 'Наука' },
  'wild-outdoors': { en: 'Wild Outdoors', mk: 'Авантура надвор' },
  'daily-grind': { en: 'Daily Grind', mk: 'Дневен ритам' },
  'mk-slang': { en: 'MK Slang', mk: 'МК сленг' },
  'mk-retro-plates': { en: 'MK Retro Plates', mk: 'МК ретро таблици' },
  'mk-mugs': { en: 'MK Mugs', mk: 'МК шолји' },
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
