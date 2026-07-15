import { NextResponse } from 'next/server';
import { getManagedSvgTemplatePublicMap } from '@/lib/designs/managed-svg-template-defaults';

export async function GET() {
  const templates = await getManagedSvgTemplatePublicMap();
  return NextResponse.json({ templates }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
