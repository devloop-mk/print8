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
  { id: 'fire', category: 'reactions', src: '/stickers/fire.png' },
  { id: 'hundred', category: 'reactions', src: '/stickers/hundred.png' },
  { id: 'thumbs-up', category: 'reactions', src: '/stickers/thumbs-up.png' },
  { id: 'lol', category: 'reactions', src: '/stickers/lol.png' },
  { id: 'wow', category: 'reactions', src: '/stickers/wow.png' },
  { id: 'clap', category: 'reactions', src: '/stickers/clap.png' },
  { id: 'muscle', category: 'reactions', src: '/stickers/muscle.png' },
  { id: 'thinking', category: 'reactions', src: '/stickers/thinking.png' },
  { id: 'cry', category: 'reactions', src: '/stickers/cry.png' },
  { id: 'eyes', category: 'reactions', src: '/stickers/eyes.png' },
  { id: 'heart', category: 'love', src: '/stickers/heart.png' },
  { id: 'heart-eyes', category: 'love', src: '/stickers/heart-eyes.png' },
  { id: 'hearts', category: 'love', src: '/stickers/hearts.png' },
  { id: 'kiss', category: 'love', src: '/stickers/kiss.png' },
  { id: 'ring', category: 'love', src: '/stickers/ring.png' },
  { id: 'sparkles', category: 'vibes', src: '/stickers/sparkles.png' },
  { id: 'star', category: 'vibes', src: '/stickers/star.png' },
  { id: 'rainbow', category: 'vibes', src: '/stickers/rainbow.png' },
  { id: 'butterfly', category: 'vibes', src: '/stickers/butterfly.png' },
  { id: 'sun', category: 'vibes', src: '/stickers/sun.png' },
  { id: 'music', category: 'vibes', src: '/stickers/music.png' },
  { id: 'party', category: 'fun', src: '/stickers/party.png' },
  { id: 'crown', category: 'fun', src: '/stickers/crown.png' },
  { id: 'lightning', category: 'fun', src: '/stickers/lightning.png' },
  { id: 'cool', category: 'fun', src: '/stickers/cool.png' },
  { id: 'pizza', category: 'fun', src: '/stickers/pizza.png' },
  { id: 'camera', category: 'fun', src: '/stickers/camera.png' },
  { id: 'cloud', category: 'cute', src: '/stickers/cloud.png' },
  { id: 'flower', category: 'cute', src: '/stickers/flower.png' },
  { id: 'moon', category: 'cute', src: '/stickers/moon.png' },
  { id: 'bubble-tea', category: 'cute', src: '/stickers/bubble-tea.png' },
  { id: 'cat', category: 'cute', src: '/stickers/cat.png' },
  { id: 'paw', category: 'cute', src: '/stickers/paw.png' },
  { id: 'flag-mk', category: 'flags', src: '/stickers/flag-mk.png' },
  { id: 'flag-al', category: 'flags', src: '/stickers/flag-al.png' },
  { id: 'flag-rs', category: 'flags', src: '/stickers/flag-rs.png' },
  { id: 'flag-bg', category: 'flags', src: '/stickers/flag-bg.png' },
  { id: 'flag-gr', category: 'flags', src: '/stickers/flag-gr.png' },
  { id: 'flag-hr', category: 'flags', src: '/stickers/flag-hr.png' },
  { id: 'flag-xk', category: 'flags', src: '/stickers/flag-xk.png' },
  { id: 'flag-eu', category: 'flags', src: '/stickers/flag-eu.png' },
  { id: 'flag-us', category: 'flags', src: '/stickers/flag-us.png' },
  { id: 'flag-gb', category: 'flags', src: '/stickers/flag-gb.png' },
  { id: 'flag-de', category: 'flags', src: '/stickers/flag-de.png' },
  { id: 'flag-tr', category: 'flags', src: '/stickers/flag-tr.png' },
  { id: 'flag-it', category: 'flags', src: '/stickers/flag-it.png' },
  { id: 'flag-si', category: 'flags', src: '/stickers/flag-si.png' },
  { id: 'flag-me', category: 'flags', src: '/stickers/flag-me.png' },
  { id: 'flag-ba', category: 'flags', src: '/stickers/flag-ba.png' },
  { id: 'flag-ro', category: 'flags', src: '/stickers/flag-ro.png' },
  { id: 'flag-fr', category: 'flags', src: '/stickers/flag-fr.png' },
  { id: 'flag-es', category: 'flags', src: '/stickers/flag-es.png' },
  { id: 'flag-nl', category: 'flags', src: '/stickers/flag-nl.png' },
  { id: 'flag-ch', category: 'flags', src: '/stickers/flag-ch.png' },
  { id: 'flag-at', category: 'flags', src: '/stickers/flag-at.png' },
  { id: 'flag-pl', category: 'flags', src: '/stickers/flag-pl.png' },
  { id: 'flag-pt', category: 'flags', src: '/stickers/flag-pt.png' },
  { id: 'flag-ua', category: 'flags', src: '/stickers/flag-ua.png' },
  { id: 'flag-ca', category: 'flags', src: '/stickers/flag-ca.png' },
  { id: 'flag-au', category: 'flags', src: '/stickers/flag-au.png' },
  { id: 'flag-br', category: 'flags', src: '/stickers/flag-br.png' },
  { id: 'flag-jp', category: 'flags', src: '/stickers/flag-jp.png' },
  { id: 'flag-in', category: 'flags', src: '/stickers/flag-in.png' },
  { id: 'flag-kr', category: 'flags', src: '/stickers/flag-kr.png' },
  { id: 'flag-cn', category: 'flags', src: '/stickers/flag-cn.png' },
  { id: 'flag-ae', category: 'flags', src: '/stickers/flag-ae.png' },
  { id: 'flag-mx', category: 'flags', src: '/stickers/flag-mx.png' },
  { id: 'text-love', category: 'text', src: '/stickers/text-love.png' },
  { id: 'text-omg', category: 'text', src: '/stickers/text-omg.png' },
  { id: 'text-yes', category: 'text', src: '/stickers/text-yes.png' },
  { id: 'text-vip', category: 'text', src: '/stickers/text-vip.png' },
  { id: 'text-bff', category: 'text', src: '/stickers/text-bff.png' },
  { id: 'text-thanks', category: 'text', src: '/stickers/text-thanks.png' },
  { id: 'text-slay', category: 'text', src: '/stickers/text-slay.png' },
  { id: 'text-goat', category: 'text', src: '/stickers/text-goat.png' },
  { id: 'text-da', category: 'text', src: '/stickers/text-da.png' },
  { id: 'text-ljubov', category: 'text', src: '/stickers/text-ljubov.png' },
  { id: 'text-bravo', category: 'text', src: '/stickers/text-bravo.png' },
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
