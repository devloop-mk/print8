import { ImageResponse } from 'next/og';
import { absoluteUrl } from '@/lib/seo/site';
import { OgImageLayout } from '@/lib/seo/og-template';
import { LOGO_HORIZONTAL_LIGHT } from '@/lib/brand/logos';

export const runtime = 'nodejs';

function readParam(value: string | null, max: number, fallback = '') {
  const text = (value ?? fallback).trim();
  if (!text) return fallback;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Preview images may already be absolute (e.g. served from a CDN via
 * resolveAssetUrl) or relative to this site (public/ paths). Satori needs a
 * fully-qualified URL either way to fetch the bitmap.
 */
function resolvePreviewImageUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('data:')) return value;
  if (/^https?:/i.test(value)) return encodeURI(value);
  if (value.startsWith('/')) return encodeURI(absoluteUrl(value));
  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') === 'en' ? 'en' : 'mk';
  const title = readParam(searchParams.get('title'), 80, 'Print 8');
  const description = readParam(
    searchParams.get('description'),
    140,
    locale === 'mk'
      ? 'Визит карти, покани, маици, чашки и персонализирани производи.'
      : 'Business cards, invitations, apparel, mugs and personalized products.',
  );
  const badge = readParam(searchParams.get('badge'), 40);
  const subtitle = readParam(searchParams.get('subtitle'), 60);
  const imagePath = searchParams.get('image');

  const previewImageUrl = resolvePreviewImageUrl(imagePath);
  const logoUrl = absoluteUrl(LOGO_HORIZONTAL_LIGHT);

  return new ImageResponse(
    (
      <OgImageLayout
        locale={locale}
        title={title}
        description={description}
        badge={badge || undefined}
        subtitle={subtitle || undefined}
        previewImageUrl={previewImageUrl}
        logoUrl={logoUrl}
      />
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
