import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { getStickerById } from '@/lib/products/sticker-library';
import type { OrderStickerRef } from '@/lib/orders/order-assets';

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

async function loadStickerPng(stickerId: string): Promise<Buffer | null> {
  const definition = getStickerById(stickerId);
  if (!definition) return null;

  const filePath = path.join(
    process.cwd(),
    'public',
    definition.src.replace(/^\//, ''),
  );

  try {
    const svg = await readFile(filePath);
    return await sharp(svg).png().toBuffer();
  } catch {
    return null;
  }
}

export async function buildStickerAttachments(
  stickerRefs: OrderStickerRef[],
): Promise<EmailAttachment[]> {
  const attachments: EmailAttachment[] = [];
  const seen = new Set<string>();

  for (const ref of stickerRefs) {
    const key = `${ref.itemIndex}-${ref.side}-${ref.stickerId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const buffer = await loadStickerPng(ref.stickerId);
    if (!buffer) continue;

    const safeName = ref.itemName.replace(/[^\w\s-]/g, '').trim().slice(0, 30);
    attachments.push({
      filename: `item-${ref.itemIndex + 1}-${safeName || 'design'}-${ref.side}-sticker-${ref.stickerId}.png`,
      content: buffer,
      contentType: 'image/png',
    });
  }

  return attachments;
}
