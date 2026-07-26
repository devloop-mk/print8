import { getSiteUrl } from '@/lib/seo/site';
import { resolveAssetUrl } from '@/lib/storage/asset-url';
import {
  putEmailPreviewObject,
} from '@/lib/storage/object-storage';
import { signEmailPreviewUrl } from '@/lib/email/email-preview-sign';
import type { OrderPreviewEmbed } from '@/lib/email/order-email-types';

function resolveRemotePreviewSrc(src: string): string | null {
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }

  const resolved = resolveAssetUrl(src);
  if (resolved.startsWith('http://') || resolved.startsWith('https://')) {
    return resolved;
  }

  if (resolved.startsWith('/')) {
    return `${getSiteUrl()}${resolved}`;
  }

  return null;
}

export async function attachHostedPreviewUrls(
  orderNumber: string,
  embeds: OrderPreviewEmbed[],
): Promise<OrderPreviewEmbed[]> {
  const results: OrderPreviewEmbed[] = [];

  for (const embed of embeds) {
    try {
      if (embed.imageUrl) {
        results.push(embed);
        continue;
      }

      const remote = resolveRemotePreviewSrc(embed.sourceSrc ?? '');
      if (remote) {
        results.push({ ...embed, imageUrl: remote });
        continue;
      }

      await putEmailPreviewObject(
        orderNumber,
        embed.filename,
        embed.content,
        embed.contentType,
      );

      const sig = signEmailPreviewUrl(orderNumber, embed.filename);
      const imageUrl = `${getSiteUrl()}/api/email/previews/${encodeURIComponent(orderNumber)}/${encodeURIComponent(embed.filename)}?sig=${sig}`;
      results.push({ ...embed, imageUrl });
    } catch (error) {
      console.error('[email] preview upload failed:', embed.filename, error);
      results.push(embed);
    }
  }

  return results;
}
