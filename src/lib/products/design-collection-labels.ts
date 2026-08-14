export const DESIGN_COLLECTION_LABELS: Record<string, { en: string; mk: string }> = {
  car: { en: 'Cars', mk: 'Коли' },
  basketball: { en: 'Basketball', mk: 'Кошарка' },
  anime: { en: 'Anime', mk: 'Anime' },
  typography: { en: 'Typography', mk: 'Типографија' },
  streetwear: { en: 'Streetwear', mk: 'Streetwear' },
  streetwear3: { en: 'Streetwear', mk: 'Streetwear' },
  'baby-milestones': { en: 'Baby milestones', mk: 'Беби пресвртници' },
  kids: { en: 'Kids', mk: 'Детски' },
  'kids-birthday': { en: 'Birthday', mk: 'Роденденски' },
  'couple-packs': { en: 'Couple packs', mk: 'Парски пакети' },
  'trending-mk': { en: 'MK Trending', mk: 'МК Trending' },
  'chemistry-drama': { en: 'Breaking Bad', mk: 'Breaking Bad' },
  'stranger-80s': { en: "Stranger 80's", mk: "Stranger 80's" },
  'peaky-era': { en: 'Peaky era', mk: 'Пики ера' },
  'zombie-survival': { en: 'Zombie', mk: 'Zombie' },
  'cartel-crime': { en: 'Crime', mk: 'Crime' },
  'biker-rebel': { en: 'Bikers', mk: 'Бајкери' },
  'neon-retro': { en: 'Neon retro', mk: 'Неон ретро' },
  'vintage-dapper': { en: 'Vintage', mk: 'Vintage' },
  'science-core': { en: 'Science', mk: 'Наука' },
  'wild-outdoors': { en: 'Adventure', mk: 'Авантура' },
  'daily-grind': { en: 'Daily rhythm', mk: 'Дневен ритам' },
  'mk-slang': { en: 'MK Slang', mk: 'МК Сленг' },
  'mk-retro-plates': { en: 'MK Retro', mk: 'МК Ретро' },
  'mk-mugs': { en: 'MK Mugs', mk: 'МК шолји' },
  family: { en: 'Family', mk: 'Семејство' },
  'local-mk': { en: 'Local designs', mk: 'Локални дизајни' },
  'mk-folk': { en: 'MK Folk', mk: 'МК Фолклор' },
  'caps-local': { en: 'Caps', mk: 'Капи' },
  'bags-local': { en: 'Bags', mk: 'Торби' },
  drinkware: { en: 'Drinkware', mk: 'Шолји' },
  'family-gifts': { en: 'Family gifts', mk: 'Семејни подароци' },
  polo: { en: 'Polo', mk: 'Поло' },
};

/** Collapse legacy / duplicate collection ids for filters and labels. */
export function normalizeDesignCollectionId(collection: string): string {
  if (collection === 'streetwear3') return 'streetwear';
  return collection;
}

export function matchesDesignCollection(
  designCollection: string | undefined,
  filter: string | 'all',
): boolean {
  if (filter === 'all') return true;
  if (!designCollection) return false;
  return (
    normalizeDesignCollectionId(designCollection) ===
    normalizeDesignCollectionId(filter)
  );
}

export function getDesignCollectionLabel(
  collection: string,
  locale: 'mk' | 'en',
): string {
  const normalized = normalizeDesignCollectionId(collection);
  return (
    DESIGN_COLLECTION_LABELS[normalized]?.[locale] ??
    DESIGN_COLLECTION_LABELS[collection]?.[locale] ??
    collection
  );
}
