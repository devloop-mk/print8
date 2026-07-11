import { NextRequest, NextResponse } from 'next/server';
import { catalogDesignsDb } from '@/lib/db/catalog-designs';
import { isExclusiveBusinessCardId } from '@/lib/data/exclusive-business-cards';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    reservedOrderId: design.reservedOrderId,
    soldOrderId: design.soldOrderId,
  });
}
