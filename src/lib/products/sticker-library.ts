export type StickerCategory =
  | 'reactions'
  | 'love'
  | 'vibes'
  | 'fun'
  | 'cute'
  | 'flags'
  | 'text';

export interface StickerDefinition {
  id: string;
  category: StickerCategory;
  src: string;
}

export interface PlacedSticker {
  instanceId: string;
  stickerId: string;
  position: { x: number; y: number };
  scale: number;
}

export const STICKER_CATEGORIES: StickerCategory[] = [
  'reactions',
  'love',
  'vibes',
  'fun',
  'cute',
  'flags',
  'text',
];

export const MAX_STICKERS_PER_SIDE = 8;

export const STICKER_LIBRARY: StickerDefinition[] = [
  { id: 'fire', category: 'reactions', src: '/stickers/fire.svg' },
  { id: 'hundred', category: 'reactions', src: '/stickers/hundred.svg' },
  { id: 'thumbs-up', category: 'reactions', src: '/stickers/thumbs-up.svg' },
  { id: 'lol', category: 'reactions', src: '/stickers/lol.svg' },
  { id: 'wow', category: 'reactions', src: '/stickers/wow.svg' },
  { id: 'clap', category: 'reactions', src: '/stickers/clap.svg' },
  { id: 'muscle', category: 'reactions', src: '/stickers/muscle.svg' },
  { id: 'thinking', category: 'reactions', src: '/stickers/thinking.svg' },
  { id: 'cry', category: 'reactions', src: '/stickers/cry.svg' },
  { id: 'eyes', category: 'reactions', src: '/stickers/eyes.svg' },
  { id: 'heart', category: 'love', src: '/stickers/heart.svg' },
  { id: 'heart-eyes', category: 'love', src: '/stickers/heart-eyes.svg' },
  { id: 'hearts', category: 'love', src: '/stickers/hearts.svg' },
  { id: 'kiss', category: 'love', src: '/stickers/kiss.svg' },
  { id: 'ring', category: 'love', src: '/stickers/ring.svg' },
  { id: 'sparkles', category: 'vibes', src: '/stickers/sparkles.svg' },
  { id: 'star', category: 'vibes', src: '/stickers/star.svg' },
  { id: 'rainbow', category: 'vibes', src: '/stickers/rainbow.svg' },
  { id: 'butterfly', category: 'vibes', src: '/stickers/butterfly.svg' },
  { id: 'sun', category: 'vibes', src: '/stickers/sun.svg' },
  { id: 'music', category: 'vibes', src: '/stickers/music.svg' },
  { id: 'party', category: 'fun', src: '/stickers/party.svg' },
  { id: 'crown', category: 'fun', src: '/stickers/crown.svg' },
  { id: 'lightning', category: 'fun', src: '/stickers/lightning.svg' },
  { id: 'cool', category: 'fun', src: '/stickers/cool.svg' },
  { id: 'pizza', category: 'fun', src: '/stickers/pizza.svg' },
  { id: 'camera', category: 'fun', src: '/stickers/camera.svg' },
  { id: 'cloud', category: 'cute', src: '/stickers/cloud.svg' },
  { id: 'flower', category: 'cute', src: '/stickers/flower.svg' },
  { id: 'moon', category: 'cute', src: '/stickers/moon.svg' },
  { id: 'bubble-tea', category: 'cute', src: '/stickers/bubble-tea.svg' },
  { id: 'cat', category: 'cute', src: '/stickers/cat.svg' },
  { id: 'paw', category: 'cute', src: '/stickers/paw.svg' },
  { id: 'flag-mk', category: 'flags', src: '/stickers/flag-mk.svg' },
  { id: 'flag-al', category: 'flags', src: '/stickers/flag-al.svg' },
  { id: 'flag-rs', category: 'flags', src: '/stickers/flag-rs.svg' },
  { id: 'flag-bg', category: 'flags', src: '/stickers/flag-bg.svg' },
  { id: 'flag-gr', category: 'flags', src: '/stickers/flag-gr.svg' },
  { id: 'flag-hr', category: 'flags', src: '/stickers/flag-hr.svg' },
  { id: 'flag-xk', category: 'flags', src: '/stickers/flag-xk.svg' },
  { id: 'flag-eu', category: 'flags', src: '/stickers/flag-eu.svg' },
  { id: 'flag-us', category: 'flags', src: '/stickers/flag-us.svg' },
  { id: 'flag-gb', category: 'flags', src: '/stickers/flag-gb.svg' },
  { id: 'flag-de', category: 'flags', src: '/stickers/flag-de.svg' },
  { id: 'flag-tr', category: 'flags', src: '/stickers/flag-tr.svg' },
  { id: 'flag-it', category: 'flags', src: '/stickers/flag-it.svg' },
  { id: 'flag-si', category: 'flags', src: '/stickers/flag-si.svg' },
  { id: 'flag-me', category: 'flags', src: '/stickers/flag-me.svg' },
  { id: 'flag-ba', category: 'flags', src: '/stickers/flag-ba.svg' },
  { id: 'flag-ro', category: 'flags', src: '/stickers/flag-ro.svg' },
  { id: 'flag-fr', category: 'flags', src: '/stickers/flag-fr.svg' },
  { id: 'flag-es', category: 'flags', src: '/stickers/flag-es.svg' },
  { id: 'flag-nl', category: 'flags', src: '/stickers/flag-nl.svg' },
  { id: 'flag-ch', category: 'flags', src: '/stickers/flag-ch.svg' },
  { id: 'flag-at', category: 'flags', src: '/stickers/flag-at.svg' },
  { id: 'flag-pl', category: 'flags', src: '/stickers/flag-pl.svg' },
  { id: 'flag-pt', category: 'flags', src: '/stickers/flag-pt.svg' },
  { id: 'flag-ua', category: 'flags', src: '/stickers/flag-ua.svg' },
  { id: 'flag-ca', category: 'flags', src: '/stickers/flag-ca.svg' },
  { id: 'flag-au', category: 'flags', src: '/stickers/flag-au.svg' },
  { id: 'flag-br', category: 'flags', src: '/stickers/flag-br.svg' },
  { id: 'flag-jp', category: 'flags', src: '/stickers/flag-jp.svg' },
  { id: 'flag-in', category: 'flags', src: '/stickers/flag-in.svg' },
  { id: 'flag-kr', category: 'flags', src: '/stickers/flag-kr.svg' },
  { id: 'flag-cn', category: 'flags', src: '/stickers/flag-cn.svg' },
  { id: 'flag-ae', category: 'flags', src: '/stickers/flag-ae.svg' },
  { id: 'flag-mx', category: 'flags', src: '/stickers/flag-mx.svg' },
  { id: 'text-love', category: 'text', src: '/stickers/text-love.svg' },
  { id: 'text-omg', category: 'text', src: '/stickers/text-omg.svg' },
  { id: 'text-yes', category: 'text', src: '/stickers/text-yes.svg' },
  { id: 'text-vip', category: 'text', src: '/stickers/text-vip.svg' },
  { id: 'text-bff', category: 'text', src: '/stickers/text-bff.svg' },
  { id: 'text-thanks', category: 'text', src: '/stickers/text-thanks.svg' },
  { id: 'text-slay', category: 'text', src: '/stickers/text-slay.svg' },
  { id: 'text-goat', category: 'text', src: '/stickers/text-goat.svg' },
  { id: 'text-da', category: 'text', src: '/stickers/text-da.svg' },
  { id: 'text-ljubov', category: 'text', src: '/stickers/text-ljubov.svg' },
  { id: 'text-bravo', category: 'text', src: '/stickers/text-bravo.svg' },
];

const stickerById = new Map(STICKER_LIBRARY.map((s) => [s.id, s]));

export function getStickerById(id: string): StickerDefinition | undefined {
  return stickerById.get(id);
}

export function getStickersByCategory(
  category: StickerCategory,
): StickerDefinition[] {
  return STICKER_LIBRARY.filter((s) => s.category === category);
}

export function createPlacedSticker(
  stickerId: string,
  existingCount: number,
): PlacedSticker {
  const spread = existingCount % 6;
  return {
    instanceId: `${stickerId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    stickerId,
    position: {
      x: 38 + spread * 5,
      y: 32 + spread * 4,
    },
    scale: 24,
  };
}

export function parsePlacedStickers(value: unknown): PlacedSticker[] {
  if (typeof value !== 'string' || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is PlacedSticker =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as PlacedSticker).instanceId === 'string' &&
          typeof (item as PlacedSticker).stickerId === 'string' &&
          typeof (item as PlacedSticker).scale === 'number' &&
          typeof (item as PlacedSticker).position === 'object' &&
          (item as PlacedSticker).position !== null &&
          typeof (item as PlacedSticker).position.x === 'number' &&
          typeof (item as PlacedSticker).position.y === 'number' &&
          Boolean(getStickerById((item as PlacedSticker).stickerId)),
      )
      .slice(0, MAX_STICKERS_PER_SIDE);
  } catch {
    return [];
  }
}

export function serializePlacedStickers(stickers: PlacedSticker[]): string {
  return JSON.stringify(stickers.slice(0, MAX_STICKERS_PER_SIDE));
}
