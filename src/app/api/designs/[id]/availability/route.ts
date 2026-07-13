import { NextRequest, NextResponse } from 'next/server';
import { isExclusiveBusinessCardId } from '@/lib/data/exclusive-business-cards';
import { getCachedCatalogDesignRecords } from '@/lib/catalog/design-catalog';
import { CATALOG_CACHE_SECONDS } from '@/lib/cache/catalog-cache';
import { enforceRateLimit } from '@/lib/security/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const rateLimited = enforceRateLimit(
    request,
    'design-availability',
    120,
    60 * 1000,
  );
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const records = await getCachedCatalogDesignRecords();
  const design = records.find((record) => record.id === id) ?? null;

  const payload = !design
    ? {
        available: true,
        exclusive: isExclusiveBusinessCardId(id),
        availability: 'available' as const,
      }
    : {
        available: design.availability === 'available',
        exclusive: design.exclusive,
        availability: design.availability,
      };

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${CATALOG_CACHE_SECONDS}, stale-while-revalidate=${CATALOG_CACHE_SECONDS * 2}`,
    },
  });
}
