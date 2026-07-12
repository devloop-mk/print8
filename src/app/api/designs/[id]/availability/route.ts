import { NextRequest, NextResponse } from 'next/server';
import { catalogDesignsDb } from '@/lib/db/catalog-designs';
import { isExclusiveBusinessCardId } from '@/lib/data/exclusive-business-cards';
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
  const design = await catalogDesignsDb.findById(id);

  if (!design) {
    return NextResponse.json({
      available: true,
      exclusive: isExclusiveBusinessCardId(id),
      availability: 'available',
    });
  }

  return NextResponse.json({
    available: design.availability === 'available',
    exclusive: design.exclusive,
    availability: design.availability,
  });
}
